// O palco do canto: as peças que o gráfico da voz (exercícios de segurar a nota) e a pista das músicas desenham do mesmo jeito.
// Fundo escuro com uma luz quente de cima; notas como cápsulas; a voz como uma fita azul luminosa que fica verde na nota; a cabeça
// da voz com uma seta para onde ir; e a comemoração (anel e faíscas) quando uma nota é acertada. Puro canvas.

export type Cores = { fundo: string; alvo: string; ok: string; ruim: string; tinta: string; suave: string; linha: string; sobre: string; acento: string };
export const lerCores = (el: Element): Cores => {
  const s = getComputedStyle(el);
  const c = (v: string, f: string) => s.getPropertyValue(v).trim() || f;
  return { fundo: c("--bg", "#120e0b"), alvo: c("--target", "#f0a634"), ok: c("--ok", "#4cc58c"), ruim: c("--bad", "#e5675c"), tinta: c("--ink", "#f1e8da"), suave: c("--soft", "#2a231d"), linha: c("--line", "#3a322b"), sobre: c("--on-bright", "#1a1410"), acento: c("--accent", "#7db6f0") };
};

export const comAlfa = (cor: string, a: number) => {
  // As cores do site são hex (#rrggbb); qualquer outra forma volta como está.
  if (!/^#[0-9a-f]{6}$/i.test(cor)) return cor;
  const n = parseInt(cor.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** O fundo: escuro, com uma luz quente vinda de cima. */
export function palco(ctx: CanvasRenderingContext2D, w: number, h: number, cores: Cores) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = cores.fundo; ctx.fillRect(0, 0, w, h);
  const luz = ctx.createRadialGradient(w * 0.45, -h * 0.25, 0, w * 0.45, -h * 0.25, Math.max(w, h) * 0.95);
  luz.addColorStop(0, comAlfa(cores.alvo, 0.14)); luz.addColorStop(0.55, comAlfa(cores.alvo, 0.03)); luz.addColorStop(1, comAlfa(cores.alvo, 0));
  ctx.fillStyle = luz; ctx.fillRect(0, 0, w, h);
}
/** As bordas escurecem: o que entra e o que sai some no escuro, a luz fica no meio. */
export function bordas(ctx: CanvasRenderingContext2D, w: number, h: number, cores: Cores) {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, comAlfa(cores.fundo, 0.85)); g.addColorStop(0.1, comAlfa(cores.fundo, 0)); g.addColorStop(0.92, comAlfa(cores.fundo, 0)); g.addColorStop(1, comAlfa(cores.fundo, 0.7));
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
}
/** A linha do agora: vertical, mais forte no meio. */
export function linhaDoAgora(ctx: CanvasRenderingContext2D, x: number, h: number, cores: Cores, forca = 0.35) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, comAlfa(cores.tinta, 0)); g.addColorStop(0.22, comAlfa(cores.tinta, forca)); g.addColorStop(0.78, comAlfa(cores.tinta, forca)); g.addColorStop(1, comAlfa(cores.tinta, 0));
  ctx.fillStyle = g; ctx.fillRect(x - 1, 0, 2, h);
}
/** Uma cápsula horizontal centrada em `yc` (a forma de toda nota). */
export function capsula(ctx: CanvasRenderingContext2D, x0: number, x1: number, yc: number, esp: number) {
  ctx.beginPath(); ctx.roundRect(x0, yc - esp / 2, Math.max(x1 - x0, esp), esp, esp / 2);
}
export const brilho = (ctx: CanvasRenderingContext2D, cor: string, raio: number, calmo: boolean) => { if (!calmo) { ctx.shadowColor = cor; ctx.shadowBlur = raio; } };
export const semBrilho = (ctx: CanvasRenderingContext2D) => { ctx.shadowBlur = 0; ctx.shadowColor = "transparent"; };

// ---------------------------------------------------------------- a voz
export type PontoVoz = { x: number; y: number; t: number; ok: boolean };
/**
 * A fita da voz: cada trecho contínuo vira uma curva suavizada (média móvel de 5 pontos: a voz real treme, a fita não precisa
 * tremer junto), com um brilho aditivo por baixo; azul fora da nota, verde dentro, mais apagada quanto mais velha.
 */
export function fita(ctx: CanvasRenderingContext2D, trechos: readonly PontoVoz[][], agora: number, vidaS: number, cores: Cores, calmo: boolean) {
  const suave = (pts: readonly PontoVoz[]) => pts.map((p, i) => {
    let sy = 0, n = 0;
    for (let k = Math.max(0, i - 2); k <= Math.min(pts.length - 1, i + 2); k++) { sy += pts[k]!.y; n++; }
    return { ...p, y: sy / n };
  });
  const lisos = trechos.map(suave);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (const camada of ["brilho", "fio"] as const) {
    if (camada === "brilho" && calmo) continue;
    ctx.globalCompositeOperation = camada === "brilho" ? "lighter" : "source-over";
    for (const tr of lisos) {
      for (let i = 1; i < tr.length; i++) {
        const a = tr[i - 1]!, b = tr[i]!;
        const idade = Math.max(0, Math.min(1, (agora - b.t) / vidaS));
        ctx.strokeStyle = comAlfa(b.ok ? cores.ok : cores.acento, (camada === "brilho" ? 0.16 : 1) * (1 - idade * 0.85));
        ctx.lineWidth = camada === "brilho" ? 12 : 3.5;
        ctx.beginPath();
        const ant = tr[i - 2];
        if (ant) ctx.moveTo((ant.x + a.x) / 2, (ant.y + a.y) / 2); else ctx.moveTo(a.x, a.y);
        ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
        ctx.stroke();
      }
    }
  }
  ctx.globalCompositeOperation = "source-over";
}
/** Junta as amostras em trechos contínuos (um buraco de mais de 0,25 s ou uma altura fora da tela corta a fita). */
export function trechosDaVoz<T extends { t: number }>(amostras: readonly T[], ponto: (s: T) => PontoVoz | null): PontoVoz[][] {
  const out: PontoVoz[][] = [];
  let tr: PontoVoz[] = [];
  for (const s of amostras) {
    const p = ponto(s);
    if (!p || (tr.length && p.t - tr[tr.length - 1]!.t > 0.25)) { if (tr.length > 1) out.push(tr); tr = []; if (!p) continue; }
    tr.push(p);
  }
  if (tr.length > 1) out.push(tr);
  return out;
}
/** A cabeça da voz, na linha do agora: verde e maior dentro da nota; fora, uma seta desenhada diz se é para subir (-1) ou descer (1). */
export function cabecaDaVoz(ctx: CanvasRenderingContext2D, x: number, y: number, dentro: boolean, seta: -1 | 0 | 1, cores: Cores) {
  const cor = dentro ? cores.ok : cores.acento, raio = dentro ? 30 : 22;
  const halo = ctx.createRadialGradient(x, y, 0, x, y, raio);
  halo.addColorStop(0, comAlfa(cor, 0.55)); halo.addColorStop(1, comAlfa(cor, 0));
  ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, raio, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(x, y, dentro ? 9 : 7.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = cores.tinta; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  if (seta === 0) return;
  const yy = y + seta * 34;
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  for (const [c, lw] of [[cores.fundo, 7], [cores.acento, 3.5]] as const) {
    ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.beginPath();
    ctx.moveTo(x - 8, yy - seta * 5); ctx.lineTo(x, yy + seta * 3); ctx.lineTo(x + 8, yy - seta * 5); ctx.stroke();
  }
}

// ---------------------------------------------------------------- comemoração
type Faisca = { x: number; y: number; vx: number; vy: number; nasce: number; vida: number; r: number };
type Anel = { x: number; y: number; nasce: number; larg: number; alt: number };
/** O que sobrevive entre um quadro e outro: as faíscas, os anéis, o que já foi comemorado e a mensagem do fim. */
export type Efeitos = { faiscas: Faisca[]; aneis: Anel[]; comemorados: Set<number>; fimSuave: number | null; mensagemDesde: number | null; ultimaMensagem: string | null };
export const novosEfeitos = (): Efeitos => ({ faiscas: [], aneis: [], comemorados: new Set(), fimSuave: null, mensagemDesde: null, ultimaMensagem: null });
/** Se ainda há efeito a animar (para o laço continuar depois que a tentativa para). */
export const temEfeito = (fx: Efeitos, relogio: number) => fx.aneis.length > 0 || fx.faiscas.length > 0 || (fx.mensagemDesde !== null && relogio - fx.mensagemDesde < 0.7);

/** Uma nota acertada: um anel e faíscas saem dela, uma vez só por `chave`. */
export function comemorar(fx: Efeitos, chave: number, x: number, y: number, esp: number, relogio: number, calmo: boolean) {
  if (fx.comemorados.has(chave)) return;
  fx.comemorados.add(chave);
  if (calmo) return;
  fx.aneis.push({ x, y, nasce: relogio, larg: esp, alt: esp });
  for (let k = 0; k < 18; k++) {
    const ang = Math.PI * (0.55 + Math.random() * 0.9), vel = 60 + Math.random() * 150;
    fx.faiscas.push({ x, y, vx: Math.cos(ang) * vel - 40, vy: -Math.sin(ang) * vel * (Math.random() < 0.5 ? 1 : -0.6), nasce: relogio, vida: 0.6 + Math.random() * 0.5, r: 1.5 + Math.random() * 2 });
  }
}
export function desenharEfeitos(ctx: CanvasRenderingContext2D, fx: Efeitos, relogio: number, cores: Cores) {
  ctx.globalCompositeOperation = "lighter";
  fx.aneis = fx.aneis.filter((a) => relogio - a.nasce < 0.55);
  for (const a of fx.aneis) {
    const k = (relogio - a.nasce) / 0.55, s = 1 + k * 1.4;
    ctx.strokeStyle = comAlfa(cores.ok, 0.7 * (1 - k)); ctx.lineWidth = 2.5 * (1 - k) + 0.5;
    ctx.beginPath(); ctx.ellipse(a.x, a.y, a.larg * s, a.alt * s * 0.8, 0, 0, Math.PI * 2); ctx.stroke();
  }
  fx.faiscas = fx.faiscas.filter((f) => relogio - f.nasce < f.vida);
  for (const f of fx.faiscas) {
    const t = relogio - f.nasce, k = t / f.vida;
    ctx.fillStyle = comAlfa(cores.ok, 0.9 * (1 - k));
    ctx.beginPath(); ctx.arc(f.x + f.vx * t, f.y + f.vy * t + 90 * t * t, f.r * (1 - k * 0.5), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}
/** A palavra do fim, grande, que entra devagar no meio do palco. */
export function mensagemDoFim(ctx: CanvasRenderingContext2D, fx: Efeitos, msg: string | null, w: number, h: number, relogio: number, cores: Cores, fonte: string, calmo: boolean) {
  if (msg !== fx.ultimaMensagem) { fx.ultimaMensagem = msg; fx.mensagemDesde = msg ? relogio : null; }
  if (!msg || fx.mensagemDesde === null) return;
  const k = calmo ? 1 : Math.min(1, (relogio - fx.mensagemDesde) / 0.6);
  const ease = 1 - Math.pow(1 - k, 4);
  ctx.save(); ctx.translate(w / 2, h / 2); ctx.scale(0.88 + 0.12 * ease, 0.88 + 0.12 * ease);
  ctx.globalAlpha = ease; ctx.font = `750 ${Math.min(56, w / 9)}px ${fonte}`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  brilho(ctx, cores.ok, 24, calmo); ctx.fillStyle = cores.ok; ctx.fillText(msg, 0, 0); semBrilho(ctx);
  ctx.restore();
}
