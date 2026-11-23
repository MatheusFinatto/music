"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { getAudio, loadPiano, PIANO_SAMPLES, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";
import { createStore } from "@/core/storage";
import {
  CLASSICA_INICIAL, compararAfinacao, DIRECOES, EXERCICIOS, FUNCIONAL_INICIAL, HARMONIA, IDS, INTERVALOS, MARGENS, nomeAcorde, nomeNota, nomeTom, PLACAR_ZERO, RESPOSTAS_AFINACAO, perguntaClassica, perguntaFuncional, registrar, somar,
  type ConfigClassica, type ConfigFuncional, type Direcao, type Exercicio, type Historico, type PerguntaClassica, type PerguntaFuncional,
} from "./engine";
import { Regua } from "./Regua";
import { Teclado, type Marca } from "./Teclado";
import "./treino.css";

type Modo = "classico" | "funcional";
const MODOS: readonly Modo[] = ["classico", "funcional"];
/** Os estilos à mostra. O funcional segue no código, escondido: o dono ficou com o clássico e o traz de volta se sentir falta. */
const VISIVEIS: readonly Modo[] = ["classico"];
type Saved = { version: 1; modo: Modo; classica: ConfigClassica; funcional: ConfigFuncional; historico: Historico; reforco: boolean };
const DEFAULTS: Saved = { version: 1, modo: "classico", classica: CLASSICA_INICIAL, funcional: FUNCIONAL_INICIAL, historico: {}, reforco: true };

/** Só ids que existem; lista vazia volta ao padrão. */
const ids = (v: unknown, validos: readonly string[], padrao: string[]): string[] => {
  const ok = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && validos.includes(x)) : [];
  return ok.length ? ok : padrao;
};
const store = createStore<Saved>("treino-de-ouvido", DEFAULTS, (saved) => {
  const s = saved as Partial<Saved> | null;
  if (!s || typeof s !== "object") return null;
  const c = (s.classica ?? {}) as Partial<ConfigClassica>, f = (s.funcional ?? {}) as Partial<ConfigFuncional>;
  const h = s.historico && typeof s.historico === "object" ? s.historico : {};
  return {
    version: 1,
    modo: MODOS.includes(s.modo as Modo) ? (s.modo as Modo) : "classico",
    classica: {
      exercicio: EXERCICIOS.includes(c.exercicio as Exercicio) ? (c.exercicio as Exercicio) : "intervalos",
      itens: {
        intervalos: ids(c.itens?.intervalos, IDS.intervalos, CLASSICA_INICIAL.itens.intervalos),
        acordes: ids(c.itens?.acordes, IDS.acordes, CLASSICA_INICIAL.itens.acordes),
        afinacao: ids(c.itens?.afinacao, IDS.afinacao, CLASSICA_INICIAL.itens.afinacao),
        achar: ids(c.itens?.achar, IDS.achar, CLASSICA_INICIAL.itens.achar),
        campo: ids(c.itens?.campo, IDS.campo, CLASSICA_INICIAL.itens.campo),
        cadencias: ids(c.itens?.cadencias, IDS.cadencias, CLASSICA_INICIAL.itens.cadencias),
        progressoes: ids(c.itens?.progressoes, IDS.progressoes, CLASSICA_INICIAL.itens.progressoes),
      },
      direcao: DIRECOES.includes(c.direcao as Direcao) ? (c.direcao as Direcao) : "asc",
      margem: (MARGENS as readonly unknown[]).includes(c.margem) ? (c.margem as number) : CLASSICA_INICIAL.margem,
      tonica: c.tonica === "sorteada" ? "sorteada" : "do",
    },
    funcional: { tonica: f.tonica === "sorteada" ? "sorteada" : "do", graus: ids(f.graus, IDS.graus, FUNCIONAL_INICIAL.graus) },
    historico: h as Historico,
    reforco: typeof s.reforco === "boolean" ? s.reforco : true,
  };
});

type Pergunta = { modo: "classico"; p: PerguntaClassica } | { modo: "funcional"; p: PerguntaFuncional };

/** Treino de ouvido no navegador: ouvir, escolher a resposta e ver no teclado o que foi tocado. Clássico (intervalos e acordes); o funcional (graus numa tonalidade) está escondido. */
export function TreinoDeOuvido() {
  const t = useTranslations("treino-de-ouvido");
  const s = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  const [q, setQ] = useState<Pergunta | null>(null);
  const [escolha, setEscolha] = useState<string | null>(null);
  const [placar, setPlacar] = useState(PLACAR_ZERO);
  const [carregando, setCarregando] = useState(false);
  const [tocando, setTocando] = useState(false);
  /** Achar: a tecla escolhida; e a tecla que está soando agora (azul). */
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [teclaTocando, setTeclaTocando] = useState<number | null>(null);
  const [erro, setErro] = useState<"audio" | "piano" | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);
  const proxima = useRef<HTMLButtonElement>(null);
  const fim = useRef(0);

  // Aquece o cache das amostras sem criar o áudio (que só nasce no primeiro toque).
  useEffect(() => { PIANO_SAMPLES.forEach((m) => { void fetch(`/sons/piano/${m}.mp3`).catch(() => {}); }); }, []);
  useEffect(() => () => { const g = getAudio(); if (g) stopPiano(g); }, []);

  const tocar = async (notas: readonly PianoNote[], botao = true) => {
    const g = resumeAudio();
    if (!g) { setErro("audio"); return; }
    try { setCarregando(true); await loadPiano(g); setErro(null); } catch { setErro("piano"); return; } finally { setCarregando(false); }
    const duracao = playPiano(g, notas);
    if (duracao === null) return;
    // Azul = soando agora: o botão de ouvir fica azul até a última nota acabar.
    if (!botao) return;
    const id = ++fim.current;
    setTocando(true);
    setTimeout(() => { if (id === fim.current) setTocando(false); }, duracao * 1000);
  };
  const calar = () => { const g = getAudio(); if (g) stopPiano(g); fim.current++; setTocando(false); };
  const nova = (modo: Modo = s.modo, cfg: Saved = s) => {
    // Com o reforço ligado, o sorteio favorece o que a pessoa mais erra.
    const h = cfg.reforco ? cfg.historico : undefined;
    const p: Pergunta = modo === "classico" ? { modo, p: perguntaClassica(cfg.classica, Math.random, h) } : { modo, p: perguntaFuncional(cfg.funcional, Math.random, h) };
    setQ(p);
    setEscolha(null);
    setSelecionada(null);
    void tocar(p.modo === "classico" ? p.p.notas : p.p.tudo);
    // O foco vai para a pergunta: quem usa o teclado continua dali.
    requestAnimationFrame(() => titulo.current?.focus({ preventScroll: true }));
  };
  /** Mudar modo ou ajuste descarta a pergunta em andamento e cala o piano. */
  const mudar = (next: Saved, zerar = true) => {
    store.set(next);
    calar();
    setQ(null);
    setEscolha(null);
    setSelecionada(null);
    if (zerar) setPlacar(PLACAR_ZERO);
  };
  const finalizar = (id: string, certo: boolean) => {
    if (!q) return;
    setEscolha(id);
    setPlacar((p) => somar(p, certo));
    store.set((x) => ({ ...x, historico: registrar(x.historico, q.p.chave, certo) }));
  };
  const responder = (id: string) => {
    if (!q || escolha !== null) return;
    finalizar(id, id === q.p.resposta);
  };
  /** Achar: confere a tecla escolhida com a segunda nota. */
  const confirmar = () => {
    if (!q || q.modo !== "classico" || escolha !== null || selecionada === null) return;
    const certo = selecionada === q.p.alvo;
    setTeclaTocando(null);
    finalizar(certo ? q.p.resposta : "errado", certo);
  };
  /** Cada tecla toca a nota; no achar, tocar também escolhe. */
  const tocarTecla = (midi: number) => {
    void tocar([{ midi, at: 0, dur: 1.2 }], false);
    setTeclaTocando(midi);
    setTimeout(() => setTeclaTocando((m) => (m === midi ? null : m)), 1300);
    if (achar && q && escolha === null) setSelecionada(midi);
  };

  const modo = VISIVEIS.includes(s.modo) ? s.modo : VISIVEIS[0]!;
  const exercicio = s.classica.exercicio;
  const grupoDeIds: readonly string[] = modo === "funcional" ? s.funcional.graus : s.classica.itens[exercicio];
  const nomeGrupo = modo === "funcional" ? "graus" : exercicio;
  // Afinação: os itens (chips) são intervalos, mas as respostas são baixo, afinado e alto.
  const afinacao = modo === "classico" && exercicio === "afinacao";
  const harmonia = modo === "classico" && HARMONIA.includes(exercicio);
  const achar = modo === "classico" && exercicio === "achar";
  const respostas: readonly string[] = achar ? [] : afinacao ? RESPOSTAS_AFINACAO : grupoDeIds;
  const nomeChips = afinacao || achar ? "intervalos" : nomeGrupo;
  const nome = (grupo: string, id: string) => t(`nomes.${grupo}.${id}` as "nomes.graus.1");
  const todos = modo === "funcional" ? IDS.graus : IDS[exercicio];
  const marcar = (id: string) => {
    const atual = grupoDeIds, tem = atual.includes(id);
    if (tem && atual.length === 1) return; // sempre sobra pelo menos um
    const nextIds = tem ? atual.filter((x) => x !== id) : todos.filter((x) => x === id || atual.includes(x));
    mudar(modo === "funcional" ? { ...s, funcional: { ...s.funcional, graus: nextIds } } : { ...s, classica: { ...s.classica, itens: { ...s.classica.itens, [exercicio]: nextIds } } }, false);
  };
  // Pontos fracos: os itens com menor taxa de acerto (com ao menos duas respostas), do pior para o melhor.
  const fracos = Object.entries(s.historico)
    .filter(([, v]) => v && v.total >= 2)
    .map(([chave, v]) => {
      const [grupo = "", id = ""] = chave.split(":");
      const rotulo = grupo === "afinacao" ? t("margemCents", { n: Number(id) }) : nome(grupo, id);
      return { chave, certo: v.certo, total: v.total, nome: `${t(`grupos.${grupo}` as "grupos.graus")} · ${rotulo}` };
    })
    .sort((a, b) => a.certo / a.total - b.certo / b.total || b.total - a.total)
    .slice(0, 6);
  const respondida = q !== null && escolha !== null;
  // Depois de responder o foco vai para "Próxima pergunta", sem rolar a página (o navegador rolaria até o botão).
  useEffect(() => { if (respondida) proxima.current?.focus({ preventScroll: true }); }, [respondida]);
  const acertou = respondida && escolha === q.p.resposta;
  const notasTocadas = q ? (q.modo === "classico" ? q.p.notas : q.p.nota).map((n) => n.midi) : [];
  const harmonico = q?.modo === "classico" && q.p.notas.length === 2 && q.p.notas[0]!.at === q.p.notas[1]!.at;
  const cents = q?.modo === "classico" ? q.p.cents : undefined;
  const intervaloTocado = INTERVALOS.find((i) => i.semitons === Math.abs((notasTocadas[0] ?? 0) - (notasTocadas[1] ?? 0)));
  const tonicaQ = q?.modo === "classico" ? q.p.tonica : undefined;
  const acordesQ = q?.modo === "classico" ? q.p.acordes : undefined;
  // O teclado está sempre à mostra: antes da resposta marca só o que é dado; depois, acende as notas tocadas (alvo).
  const marcas = new Map<number, Marca>();
  if (q?.modo === "classico" && !respondida && achar && q.p.dada !== undefined) marcas.set(q.p.dada, "dada");
  if (achar && !respondida && selecionada !== null) marcas.set(selecionada, "sel");
  if (respondida && q) {
    const revela = q.modo === "classico" ? (q.p.reveal ?? (harmonia ? [] : q.p.notas.map((n) => n.midi))) : q.p.nota.map((n) => n.midi);
    revela.forEach((m) => marcas.set(m, "alvo"));
    if (achar && selecionada !== null && !acertou) marcas.set(selecionada, "errada");
  }
  if (teclaTocando !== null) marcas.set(teclaTocando, "toca");
  const janela = q ? (q.modo === "classico" ? q.p.notas : q.p.tudo).map((n) => n.midi) : [48, 71];
  const detalhe = !q || !respondida ? "" : tonicaQ !== undefined && acordesQ
    ? `${t("tomMaior", { nota: nomeTom(tonicaQ) })}: ${acordesQ.map((g) => nome("campo", g)).join(" – ")} (${acordesQ.map((g) => nomeAcorde(tonicaQ, g)).join(" – ")})`
    : cents !== undefined
    ? `${cents === 0 ? t("exatamenteAfinado") : t(cents > 0 ? "centsAcima" : "centsAbaixo", { n: Math.abs(cents) })} · ${intervaloTocado ? nome("intervalos", intervaloTocado.id) : ""} · ${notasTocadas.map(nomeNota).join(harmonico ? " + " : " → ")}`
    : q.modo === "classico" && (q.p.chave.startsWith("intervalos") || q.p.chave.startsWith("achar"))
    ? `${t("semitons", { n: Math.abs(notasTocadas[0]! - notasTocadas[1]!) })} · ${notasTocadas.map(nomeNota).join(harmonico ? " + " : " → ")}`
    : notasTocadas.map(nomeNota).join(" · ");
  const pergunta = !q ? t("perguntaInicial") : t(modo === "funcional" ? "perguntaFuncional" : harmonia || achar ? (`pergunta_${exercicio}` as "pergunta_campo") : exercicio === "acordes" ? "perguntaAcordes" : afinacao ? "perguntaAfinacao" : "perguntaIntervalos");
  const dica = afinacao ? t("dicaAfinacao", { margem: s.classica.margem }) : harmonia || achar ? t(`dica_${exercicio}` as "dica_campo") : t(modo === "funcional" ? "dicaFuncional" : exercicio === "acordes" ? "dicaAcordes" : "dicaIntervalos");

  // Teclado: 1 a 9 respondem; Espaço ouve de novo e, depois da resposta, avança.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, select, textarea")) return;
      if (/^[1-9]$/.test(e.key) && q && escolha === null) {
        const id = respostas[Number(e.key) - 1];
        if (id) { e.preventDefault(); responder(id); }
        return;
      }
      if (e.code === "Space" || e.key === "Enter") {
        if (e.target instanceof Element && e.target.closest("button, summary, a, [role=button]")) return; // o controle em foco já faz a sua ação
        e.preventDefault();
        if (e.repeat || carregando) return;
        if (achar && q && escolha === null && selecionada !== null) { confirmar(); return; }
        if (!q || escolha !== null) nova(); else void tocar(q.modo === "classico" ? q.p.notas : q.p.tudo);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="treino">
      <div className="treino-topo">
        <div className="treino-escolhas">
          {VISIVEIS.length > 1 && (
            <div className="treino-seg" role="radiogroup" aria-label={t("modo")} onKeyDown={onRadioKeyDown}>
              {VISIVEIS.map((m) => (
                <button key={m} type="button" role="radio" aria-checked={modo === m} tabIndex={modo === m ? 0 : -1} onClick={() => mudar({ ...s, modo: m })}>{t(`modos.${m}`)}</button>
              ))}
            </div>
          )}
          {modo === "classico" && (
            <div className="treino-seg amplo" role="radiogroup" aria-label={t("exercicio")} onKeyDown={onRadioKeyDown}>
              {EXERCICIOS.map((e) => (
                <button key={e} type="button" role="radio" aria-checked={exercicio === e} tabIndex={exercicio === e ? 0 : -1} onClick={() => mudar({ ...s, classica: { ...s.classica, exercicio: e } }, false)}>{t(`exercicios.${e}`)}</button>
              ))}
            </div>
          )}
        </div>
        <dl className="treino-placar" aria-label={t("placarTitulo")}>
          <div><dd>{t("placar", { acertos: placar.acertos, total: placar.total })}</dd><dt>{t("acertos")}</dt></div>
          <div><dd>{placar.sequencia}</dd><dt>{t("sequenciaRotulo")}</dt></div>
        </dl>
      </div>

      <section className="treino-palco" aria-label={t("perguntaTitulo")}>
        <div className="treino-linha">
          <button type="button" className={`treino-ouvir${tocando ? " tocando" : ""}`} aria-label={t("ouvir")} aria-keyshortcuts="Space" disabled={carregando}
            onClick={() => (q ? void tocar(q.modo === "classico" ? q.p.notas : q.p.tudo) : nova())}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.55.83l10-6.5a1 1 0 0 0 0-1.66l-10-6.5A1 1 0 0 0 8 5.5Z" /></svg>
          </button>
          <div className="treino-pergunta">
            <h2 ref={titulo} tabIndex={-1}>{pergunta}</h2>
            <p>{dica}</p>
          </div>
        </div>
        {q?.modo === "funcional" && (
          <div className="treino-ouvir-mais">
            <button type="button" className="treino-btn" onClick={() => void tocar(q.p.cadencia)} disabled={carregando}>{t("soCadencia")}</button>
            <button type="button" className="treino-btn" onClick={() => void tocar(q.p.nota)} disabled={carregando}>{t("soNota")}</button>
          </div>
        )}

        <div className="treino-respostas" role="group" aria-label={t("respostas")}>
          {respostas.map((id, n) => {
            const estado = escolha === null || !q ? "" : id === q.p.resposta ? "certa" : id === escolha ? "errada" : "";
            return (
              <button key={id} type="button" className={`treino-resp ${estado}`} onClick={() => responder(id)} disabled={!q || (escolha !== null)}>
                {n < 9 && <kbd aria-hidden="true">{n + 1}</kbd>}
                {nome(nomeGrupo, id)}
              </button>
            );
          })}
        </div>

        <Teclado janela={janela} marcas={marcas} onTocar={tocarTecla} label={t("teclado")} />
        {achar && q && !respondida && (
          <button type="button" className="go treino-proxima" onClick={confirmar} disabled={selecionada === null || carregando}>{t("responder")}<kbd aria-hidden="true">Enter</kbd></button>
        )}

        {respondida && (
          <div className="treino-revela">
            <p className={`treino-resultado ${acertou ? "certa" : "errada"}`} role="status">{acertou ? t("certo") : achar && q.modo === "classico" ? t("errado", { resposta: nomeNota(q.p.alvo!) }) : t("errado", { resposta: nome(nomeGrupo, q.p.resposta) })}</p>
            {cents !== undefined && <Regua cents={cents} margem={s.classica.margem} label={t("regua")} baixo={t("nomes.afinacao.baixo")} alto={t("nomes.afinacao.alto")} />}
            {cents !== undefined && cents !== 0 && q?.modo === "classico" && (
              <div className="treino-ouvir-mais">
                <button type="button" className="treino-btn" onClick={() => void tocar(q.p.notas)} disabled={carregando}>{t("ouvirComoEstava")}</button>
                <button type="button" className="treino-btn" onClick={() => void tocar(q.p.notas.map((n) => ({ ...n, cents: 0 })))} disabled={carregando}>{t("ouvirAfinado")}</button>
                <button type="button" className="treino-btn" onClick={() => void tocar(compararAfinacao(q.p.notas))} disabled={carregando}>{t("compararDois")}</button>
              </div>
            )}
            <p className="treino-detalhe">{detalhe}</p>
            <button ref={proxima} type="button" className="go treino-proxima" onClick={() => nova()} disabled={carregando}>{t("proxima")}<kbd aria-hidden="true">{t("espaco")}</kbd></button>
          </div>
        )}
        <p className="treino-estado" role="status">
          {carregando ? t("carregando") : erro === "audio" ? t("erroAudio") : erro === "piano" ? t("erroPiano") : ""}
        </p>
      </section>

      <details className="treino-ajustes">
        <summary>{t("ajustes")}</summary>
        <div className="treino-ajustes-corpo">
          {modo === "classico" && harmonia && (
            <label className="treino-field">
              <span>{t("tonalidade")}</span>
              <select value={s.classica.tonica} onChange={(e) => mudar({ ...s, classica: { ...s.classica, tonica: e.target.value === "sorteada" ? "sorteada" : "do" } }, false)}>
                <option value="do">{t("tonicas.do")}</option>
                <option value="sorteada">{t("tonicas.sorteada")}</option>
              </select>
            </label>
          )}
          {modo === "classico" && (exercicio === "intervalos" || exercicio === "afinacao") && (
            <label className="treino-field">
              <span>{t("direcao")}</span>
              <select value={s.classica.direcao} onChange={(e) => mudar({ ...s, classica: { ...s.classica, direcao: e.target.value as Direcao } }, false)}>
                {DIRECOES.map((d) => <option key={d} value={d}>{t(`direcoes.${d}`)}</option>)}
              </select>
            </label>
          )}
          {modo === "funcional" && (
            <label className="treino-field">
              <span>{t("tonalidade")}</span>
              <select value={s.funcional.tonica} onChange={(e) => mudar({ ...s, funcional: { ...s.funcional, tonica: e.target.value === "sorteada" ? "sorteada" : "do" } }, false)}>
                <option value="do">{t("tonicas.do")}</option>
                <option value="sorteada">{t("tonicas.sorteada")}</option>
              </select>
            </label>
          )}
          {afinacao && (
            <div className="treino-field" role="group" aria-label={t("margem")}>
              <span>{t("margem")}</span>
              <div className="treino-chips">
                {MARGENS.map((m) => (
                  <button key={m} type="button" className="treino-chip" aria-pressed={s.classica.margem === m} onClick={() => mudar({ ...s, classica: { ...s.classica, margem: m } }, false)}>{t("margemCents", { n: m })}</button>
                ))}
              </div>
            </div>
          )}
          <div className="treino-field" role="group" aria-label={t("reforco")}>
            <span>{t("reforco")}</span>
            <div className="treino-chips">
              <button type="button" className="treino-chip" aria-pressed={s.reforco} onClick={() => store.set((x) => ({ ...x, reforco: !x.reforco }))}>{t(s.reforco ? "ligado" : "desligado")}</button>
            </div>
          </div>
          <div className="treino-field treino-itens" role="group" aria-label={t(modo === "funcional" ? "graus" : "itens")}>
            <span>{t(modo === "funcional" ? "graus" : "itens")}</span>
            <div className="treino-chips">
              {todos.map((id) => (
                <button key={id} type="button" className="treino-chip" aria-pressed={grupoDeIds.includes(id)} onClick={() => marcar(id)}>{nome(nomeChips, id)}</button>
              ))}
            </div>
          </div>
        </div>
      </details>

      <details className="treino-ajustes">
        <summary>{t("fracos")}</summary>
        <div className="treino-ajustes-corpo">
          {fracos.length === 0 ? <p className="treino-vazio">{t("fracosVazio")}</p> : (
            <ol className="treino-fracos">
              {fracos.map((f) => (
                <li key={f.chave}><span>{f.nome}</span><span className="treino-fraco-n">{t("acertoDe", { certo: f.certo, total: f.total })}</span><span className="treino-barra" aria-hidden="true"><i style={{ width: `${Math.round((f.certo / f.total) * 100)}%` }} /></span></li>
              ))}
            </ol>
          )}
          {fracos.length > 0 && <button type="button" className="treino-btn" onClick={() => store.set((x) => ({ ...x, historico: {} }))}>{t("apagar")}</button>}
        </div>
      </details>

      <p className="treino-creditos">{t("creditos")} {t("atalhos")}</p>
    </div>
  );
}
