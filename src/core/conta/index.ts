// A conta opcional: entrar com o Google para levar o progresso entre o site e os apps (ver .specs/001-conta-e-sincronizacao.md).
// Os dados continuam no navegador (src/core/storage) e são a fonte; a nuvem (Firestore) guarda uma cópia por chave. Quem nunca
// entrou não baixa nada do Firebase: o código dele só carrega quando a pessoa abre o modal da conta, ou, se já entrou antes,
// com a página ociosa. As decisões (quem vence, registro por aparelho, favoritos juntados) são do Kotlin (core/conta), as
// mesmas dos apps.
import * as K from "../pitch/generated/tuner-core.mjs";
import { EVENTO_MUDOU, carimbos, gravarDeFora, lerCru } from "../storage";
import { somarDiarios, type Dia } from "../treino";
import { FIREBASE } from "./config";

export type Fase = "fora" | "dentro";
export type EstadoConta = { fase: Fase; email: string | null; ocupado: boolean; erro: "entrar" | "apagar" | null };

const CONTA = "musica:_conta"; // { email }: a pessoa entrou neste navegador
const DISPOSITIVO = "musica:_dispositivo";
const SINCRONIZADO = "musica:_sincronizado"; // este aparelho já sincronizou uma vez (os favoritos já foram juntados)
const OUTROS = "musica:_diarios-outros"; // os registros diários dos outros aparelhos, para o "Hoje"
const CHAVES: readonly string[] = K.CHAVES_SINCRONIZADAS.get();
const EMPURRAR = K.EMPURRAR.get(), PUXAR = K.PUXAR.get();
/** Mudou algo aqui: espera este tanto sem mudança antes de mandar (o treino grava a cada resposta). */
const ESPERA_MS = 15_000;
/** Ao voltar para a página, puxa de novo só se a última vez foi há mais que isto. */
const INTERVALO_LEITURA_MS = 60_000;

type Doc = { json: string; em: number; dispositivo: string };

// ---------------------------------------------------------------- armazenamento local (tudo protegido: pode não haver)
const ler = (k: string): string | null => { try { return window.localStorage.getItem(k); } catch { return null; } };
const gravar = (k: string, v: string | null) => {
  try { if (v === null) window.localStorage.removeItem(k); else window.localStorage.setItem(k, v); } catch { /* sem armazenamento */ }
};

function dispositivo(): string {
  let d = ler(DISPOSITIVO);
  if (!d) { d = crypto.randomUUID().slice(0, 18); gravar(DISPOSITIVO, d); }
  return d;
}

// ---------------------------------------------------------------- estado (assinável, para useSyncExternalStore)
const INICIAL: EstadoConta = { fase: "fora", email: null, ocupado: false, erro: null };
let estado: EstadoConta = INICIAL;
let lido = false;
const subs = new Set<() => void>();
function mudar(p: Partial<EstadoConta>) { estado = { ...estado, ...p }; subs.forEach((f) => f()); }

export const conta = {
  get(): EstadoConta {
    if (!lido && typeof window !== "undefined") {
      lido = true;
      try {
        const c = JSON.parse(ler(CONTA) ?? "null") as { email?: string } | null;
        if (c) estado = { ...estado, fase: "dentro", email: c.email ?? null };
      } catch { /* conta corrompida: fica fora */ }
    }
    return estado;
  },
  getInitial: (): EstadoConta => INICIAL,
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
};

// ---------------------------------------------------------------- registros dos outros aparelhos
const outrosSubs = new Set<() => void>();
let outrosCache: Dia[][] | null = null;
export const diariosOutros = {
  get(): Dia[][] {
    if (outrosCache) return outrosCache;
    try { outrosCache = JSON.parse(ler(OUTROS) ?? "[]") as Dia[][]; } catch { outrosCache = []; }
    return outrosCache;
  },
  getInitial: (): Dia[][] => SEM_OUTROS,
  subscribe(f: () => void) { outrosSubs.add(f); return () => { outrosSubs.delete(f); }; },
};
const SEM_OUTROS: Dia[][] = [];
function guardarOutros(listas: Dia[][]) {
  gravar(OUTROS, listas.length ? JSON.stringify(listas) : null);
  outrosCache = null;
  outrosSubs.forEach((f) => f());
}
/** O registro deste aparelho somado ao dos outros (com a conta); sem conta, é o próprio. */
export const comOutros = (meus: readonly Dia[], outros: readonly Dia[][]): Dia[] => (outros.length ? somarDiarios([meus, ...outros]) : [...meus]);

// ---------------------------------------------------------------- Firebase, só quando precisa
type Firebase = {
  A: typeof import("firebase/auth");
  F: typeof import("firebase/firestore/lite");
  auth: import("firebase/auth").Auth;
  db: import("firebase/firestore/lite").Firestore;
};
let carregando: Promise<Firebase> | null = null;
let pronto: Firebase | null = null;

/** Carrega o Firebase (uma vez). O modal da conta chama ao abrir, para o "Entrar" abrir o popup ainda dentro do toque. */
export function prepararConta(): Promise<Firebase> {
  carregando ??= (async () => {
    const [{ initializeApp }, A, F] = await Promise.all([import("firebase/app"), import("firebase/auth"), import("firebase/firestore/lite")]);
    const app = initializeApp(FIREBASE);
    const fb: Firebase = { A, F, auth: A.getAuth(app), db: F.getFirestore(app) };
    await fb.auth.authStateReady();
    pronto = fb;
    return fb;
  })();
  carregando.catch(() => { carregando = null; });
  return carregando;
}
/** O Firebase já carregou? (o botão "Entrar" espera isso para abrir o popup no mesmo toque) */
export const contaPronta = (): boolean => pronto !== null;

// ---------------------------------------------------------------- sincronização
let ultimaLeitura = 0;
let rodando: Promise<void> | null = null;
const sujas = new Set<string>();
let espera: ReturnType<typeof setTimeout> | null = null;

/** Lê a nuvem, decide chave a chave (Kotlin) e puxa ou empurra. Uma de cada vez. */
function sincronizar(): Promise<void> {
  rodando ??= (async () => {
    try {
      const fb = await prepararConta();
      const u = fb.auth.currentUser;
      if (!u) return;
      const { F } = fb;
      const col = F.collection(fb.db, "usuarios", u.uid, "chaves");
      const snap = await F.getDocs(col);
      ultimaLeitura = Date.now();
      const remoto = new Map(snap.docs.map((d) => [d.id, d.data() as Doc]));
      const disp = dispositivo();
      const primeira = ler(SINCRONIZADO) === null;
      const em = carimbos();
      for (const chave of CHAVES) {
        const id = K.chaveRemota(chave, disp);
        const r = remoto.get(id);
        let local = lerCru(chave);
        let localEm: number | null = em[chave] ?? null;
        // Primeira vez deste aparelho: os favoritos daqui se juntam aos da nuvem, em vez de uma lista apagar a outra.
        if (primeira && chave === "metronomo-favoritos" && local && r) {
          local = juntarFavoritosJson(r.json, local);
          localEm = Date.now();
          gravarDeFora(chave, local, localEm);
        }
        const acao = K.decidir(local !== null, localEm, r?.em ?? null);
        if (acao === EMPURRAR && local !== null) {
          // Dado de antes da conta (sem hora) ganha a hora de agora, aqui e lá.
          if (localEm === null) { localEm = Date.now(); gravarDeFora(chave, local, localEm); }
          await F.setDoc(F.doc(col, id), { json: local, em: localEm, dispositivo: disp } satisfies Doc);
        } else if (acao === PUXAR && r) {
          gravarDeFora(chave, r.json, r.em);
        }
        sujas.delete(chave);
      }
      guardarOutros(snap.docs.filter((d) => K.ehDiarioDeOutro(d.id, disp)).map((d) => diasDe((d.data() as Doc).json)));
      gravar(SINCRONIZADO, "1");
    } catch {
      // Sem rede, cota do dia acabou, etc.: tenta na próxima vez. Os dados daqui seguem valendo.
    } finally {
      rodando = null;
    }
  })();
  return rodando;
}

/** Só manda o que mudou aqui (sem ler a nuvem): é o caminho das mudanças do dia a dia, e custa só gravações. */
async function empurrarSujas() {
  if (estado.fase !== "dentro" || sujas.size === 0) return;
  try {
    const fb = await prepararConta();
    const u = fb.auth.currentUser;
    if (!u) return;
    const disp = dispositivo();
    const em = carimbos();
    const col = fb.F.collection(fb.db, "usuarios", u.uid, "chaves");
    for (const chave of [...sujas]) {
      sujas.delete(chave);
      const local = lerCru(chave);
      if (local === null) continue;
      await fb.F.setDoc(fb.F.doc(col, K.chaveRemota(chave, disp)), { json: local, em: em[chave] ?? Date.now(), dispositivo: disp } satisfies Doc);
    }
  } catch { /* tenta de novo na próxima mudança ou ao voltar para a página */ }
}

function aoMudar(e: Event) {
  const chave = (e as CustomEvent<string>).detail;
  if (estado.fase !== "dentro" || !CHAVES.includes(chave)) return;
  sujas.add(chave);
  if (espera) clearTimeout(espera);
  espera = setTimeout(() => { espera = null; void empurrarSujas(); }, ESPERA_MS);
}

function aoVisibilidade() {
  if (estado.fase !== "dentro") return;
  if (document.visibilityState === "hidden") { if (espera) { clearTimeout(espera); espera = null; } void empurrarSujas(); }
  else if (Date.now() - ultimaLeitura > INTERVALO_LEITURA_MS) void sincronizar();
}

let iniciada = false;
/** Liga a conta na página (uma vez). Sem conta, só escuta; com conta, sincroniza com a página ociosa. */
export function iniciarConta() {
  if (iniciada || typeof window === "undefined") return;
  iniciada = true;
  window.addEventListener(EVENTO_MUDOU, aoMudar);
  document.addEventListener("visibilitychange", aoVisibilidade);
  if (conta.get().fase !== "dentro") return;
  const comecar = () => {
    void prepararConta().then((fb) => {
      // Saiu por outro caminho (sessão expirou, apagou em outro aparelho): volta para fora, sem mexer nos dados.
      if (!fb.auth.currentUser) { limparConta(); return; }
      void sincronizar();
    }).catch(() => { /* sem rede: fica como está */ });
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(comecar, { timeout: 4000 });
  else setTimeout(comecar, 2000);
}

/** Entra com o Google. Chame direto do toque no botão, com o Firebase já carregado (prepararConta), senão o popup é barrado. */
export async function entrar(): Promise<void> {
  const fb = pronto;
  if (!fb) return;
  mudar({ ocupado: true, erro: null });
  try {
    const r = await fb.A.signInWithPopup(fb.auth, new fb.A.GoogleAuthProvider());
    gravar(CONTA, JSON.stringify({ email: r.user.email }));
    gravar(SINCRONIZADO, null);
    mudar({ fase: "dentro", email: r.user.email, ocupado: false });
    await sincronizar();
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    // Fechar o popup não é erro.
    mudar({ ocupado: false, erro: code.includes("popup-closed") || code.includes("cancelled-popup") ? null : "entrar" });
  }
}

function limparConta() {
  gravar(CONTA, null);
  gravar(SINCRONIZADO, null);
  guardarOutros([]);
  sujas.clear();
  mudar({ fase: "fora", email: null, ocupado: false, erro: null });
}

/** Sai: manda o que falta, para de sincronizar. O que está neste aparelho fica. */
export async function sair(): Promise<void> {
  mudar({ ocupado: true });
  await empurrarSujas();
  try { const fb = await prepararConta(); await fb.A.signOut(fb.auth); } catch { /* sai daqui de qualquer jeito */ }
  limparConta();
}

/** Apaga tudo da nuvem e a conta. O que está neste aparelho fica. */
export async function apagarConta(): Promise<void> {
  mudar({ ocupado: true, erro: null });
  try {
    const fb = await prepararConta();
    const u = fb.auth.currentUser;
    if (u) {
      const col = fb.F.collection(fb.db, "usuarios", u.uid, "chaves");
      const snap = await fb.F.getDocs(col);
      await Promise.all(snap.docs.map((d) => fb.F.deleteDoc(d.ref)));
      try {
        await fb.A.deleteUser(u);
      } catch (e) {
        // O Google pede um login recente para apagar a conta: confirma e tenta de novo.
        if ((e as { code?: string }).code !== "auth/requires-recent-login") throw e;
        await fb.A.reauthenticateWithPopup(u, new fb.A.GoogleAuthProvider());
        await fb.A.deleteUser(u);
      }
    }
    limparConta();
  } catch {
    mudar({ ocupado: false, erro: "apagar" });
  }
}

// ---------------------------------------------------------------- JSON (o formato do site; os apps gravam igual)
type FavJson = { bpm: number; beatsPerBar: number; subdivision: number; accents: number[]; name: string };
function favoritosDe(json: string): { items: FavJson[]; active: number } {
  try {
    const v = JSON.parse(json) as { items?: unknown; active?: unknown };
    return { items: Array.isArray(v.items) ? (v.items as FavJson[]) : [], active: typeof v.active === "number" ? v.active : -1 };
  } catch { return { items: [], active: -1 }; }
}
const favK = (f: FavJson) => new K.Favorito(f.bpm, f.beatsPerBar, f.subdivision, Int32Array.from(f.accents ?? []), f.name ?? "");
/** Junta os favoritos daqui aos da nuvem (Kotlin, juntarFavoritos); fica fora de qualquer favorito ativo. */
function juntarFavoritosJson(nuvem: string, local: string): string {
  const n = favoritosDe(nuvem).items, l = favoritosDe(local).items;
  const items = Array.from(K.juntarFavoritos(n.map(favK), l.map(favK))).map((f) => ({
    bpm: f.bpm, beatsPerBar: f.tempos, subdivision: f.divisao, accents: Array.from(f.acentos), name: f.nome,
  }));
  return JSON.stringify({ version: 1, items, active: -1 });
}
function diasDe(json: string): Dia[] {
  try { const v = JSON.parse(json) as { dias?: unknown }; return Array.isArray(v.dias) ? (v.dias as Dia[]) : []; } catch { return []; }
}
