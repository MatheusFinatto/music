// O gráfico da voz: o palco dos exercícios de segurar a nota, no jeito dos apps de canto. A linha do "agora" fica à esquerda e as
// notas vêm da direita. A nota da vez é uma cápsula laranja que vai sendo consumida enquanto a voz a segura; quando acaba, ela acende
// em verde e solta um anel e faíscas. A voz é a fita do palco (palco.ts), igual à da pista das músicas.
import { dobrar } from "./cantar";
import {
  bordas, brilho, cabecaDaVoz, capsula, comAlfa, comemorar, desenharEfeitos, fita, linhaDoAgora, mensagemDoFim, palco, semBrilho, trechosDaVoz,
  type Cores, type Efeitos,
} from "./palco";
import { centsDe } from "./voz";

export { novosEfeitos, temEfeito, type Efeitos } from "./palco";

export type AmostraVoz = { t: number; midi: number | null };
/** Uma nota pedida: desde quando ela é a da vez, até quando (null = ainda é) e se foi segurada até o fim. */
export type PassoVoz = { alvo: number; ini: number; fim: number | null; ok?: boolean };
export type EstadoGrafico = {
  w: number; h: number;
  /** Segundos desde o começo da tentativa; parado, é o instante em que ela acabou. */
  agora: number;
  amostras: readonly AmostraVoz[];
  passos: readonly PassoVoz[];
  /** As notas que ainda vêm, em ordem. */
  proximos: readonly number[];
  /** Quanto tempo segurar cada nota (s) e quanto da nota da vez já foi segurado (0 a 1). */
  segurarS: number; progresso: number;
  /** A nota do bordão, desenhada como uma linha tracejada. */
  tonica: number | null;
  /** No Alcance: a nota mais grave e a mais aguda até agora (sem alvo). */
  alcance: { min: number | null; max: number | null } | null;
  tolerancia: number; qualquerOitava: boolean;
  /** Uma palavra de comemoração no fim (ou null). */
  mensagem: string | null;
  nome: (midi: number) => string;
  cores: Cores; fonte: string; calmo: boolean;
};

const FUTURO_S = 4.5; // quanto do futuro cabe à direita da linha do agora
const MIN_NOTA = 30; // px: a menor cápsula
const VAO = 14;

export function desenharGrafico(ctx: CanvasRenderingContext2D, e: EstadoGrafico, fx: Efeitos, relogio: number) {
  const { w, h, cores, calmo } = e;
  const cabeca = Math.max(84, Math.round(w * 0.27));
  const pps = (w - cabeca) / FUTURO_S;
  const x = (t: number) => cabeca - (e.agora - t) * pps;
  const passadoS = cabeca / pps;
  const desde = e.agora - passadoS - 0.3;
  palco(ctx, w, h, cores);

  // ---------------------------------------------------------------- a altura que se vê
  const atual = e.passos.find((p) => p.fim === null) ?? null;
  const referencia = (t: number) => e.passos.find((p) => t >= p.ini && (p.fim === null || t < p.fim))?.alvo ?? atual?.alvo ?? e.proximos[0] ?? null;
  const dobrada = (s: AmostraVoz): number | null => {
    if (s.midi === null) return null;
    const r = e.alcance ? null : referencia(s.t);
    return r !== null && e.qualquerOitava ? dobrar(s.midi, r) : s.midi;
  };
  const visiveis = e.amostras.filter((s) => s.t >= desde && s.midi !== null);
  const interesse = [...e.passos.filter((p) => p.fim === null || x(p.fim) > 0).map((p) => p.alvo), ...e.proximos, ...(e.tonica !== null ? [e.tonica] : [])];
  if (e.alcance) { if (e.alcance.min !== null) interesse.push(e.alcance.min); if (e.alcance.max !== null) interesse.push(e.alcance.max); }
  if (interesse.length === 0 || e.alcance) interesse.push(...visiveis.map((s) => s.midi!));
  if (interesse.length === 0) interesse.push(57, 64);
  const lo = Math.min(...interesse), hi = Math.max(...interesse);
  const meia = Math.max(4, (hi - lo) / 2 + 2);
  const centro = (lo + hi) / 2;
  const topo = 46, base = h - 22;
  const linhaH = (base - topo) / (2 * meia);
  const y = (m: number) => topo + ((centro + meia - m) / (2 * meia)) * (base - topo);
  const esp = Math.max(16, Math.min(linhaH * 1.1, (2 * e.tolerancia / 100) * linhaH));
  const fonte = (peso: number, px: number) => `${peso} ${px}px ${e.fonte}`;
  const nota = (x0: number, x1: number, m: number) => capsula(ctx, x0, x1, y(m), esp);

  // Faixas tênues nas alturas pedidas (no lugar da pauta inteira): é onde o olho tem que ir.
  for (const m of new Set([...(atual ? [atual.alvo] : []), ...e.proximos])) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, comAlfa(cores.alvo, 0)); g.addColorStop(0.2, comAlfa(cores.alvo, 0.07)); g.addColorStop(1, comAlfa(cores.alvo, 0.04));
    ctx.fillStyle = g; ctx.fillRect(0, y(m) - esp * 0.9, w, esp * 1.8);
  }

  // O bordão: tracejado tênue na tônica, com o nome dela.
  if (e.tonica !== null) {
    ctx.save(); ctx.setLineDash([2, 7]); ctx.lineCap = "round"; ctx.strokeStyle = comAlfa(cores.tinta, 0.4); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(14, y(e.tonica)); ctx.lineTo(w - 14, y(e.tonica)); ctx.stroke(); ctx.restore();
    ctx.font = fonte(600, 12); ctx.fillStyle = comAlfa(cores.tinta, 0.6); ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    ctx.fillText(e.nome(e.tonica), 14, y(e.tonica) - 6);
  }

  // No Alcance: a mais grave e a mais aguda viram réguas laranja com o nome grande.
  if (e.alcance) {
    for (const [m, emCima] of [[e.alcance.max, true], [e.alcance.min, false]] as const) {
      if (m === null) continue;
      ctx.strokeStyle = comAlfa(cores.alvo, 0.75); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(14, y(m)); ctx.lineTo(w - 14, y(m)); ctx.stroke();
      ctx.font = fonte(700, 20); ctx.fillStyle = cores.alvo; ctx.textAlign = "right"; ctx.textBaseline = emCima ? "bottom" : "top";
      ctx.fillText(e.nome(m), w - 16, y(m) + (emCima ? -6 : 6));
    }
  }

  // ---------------------------------------------------------------- notas
  const dentroDe = (s: AmostraVoz, alvo: number) => s.midi !== null && Math.abs(centsDe(s.midi, alvo, e.qualquerOitava)) <= e.tolerancia;
  /** Pinta de verde os trechos de [x0, x1] em que a voz esteve na nota. */
  const acertos = (p: PassoVoz, x0: number, x1: number) => {
    ctx.save(); nota(x0, x1, p.alvo); ctx.clip();
    ctx.fillStyle = cores.ok;
    for (let i = 0; i < e.amostras.length; i++) {
      const s = e.amostras[i]!;
      if (s.t < p.ini || (p.fim !== null && s.t > p.fim) || s.t < desde || !dentroDe(s, p.alvo)) continue;
      const prox = Math.min(e.amostras[i + 1]?.t ?? e.agora, s.t + 0.15);
      ctx.fillRect(x(s.t), y(p.alvo) - esp / 2, x(prox) - x(s.t) + 0.8, esp);
    }
    ctx.restore();
  };

  // As que já passaram: verdes e acesas se foram seguradas (com anel e faíscas na primeira vez), quase apagadas se não.
  for (const p of e.passos) {
    if (p.fim === null) continue;
    const x0 = x(p.ini), x1 = x(p.fim);
    if (x1 < -20) continue;
    if (p.ok) {
      brilho(ctx, cores.ok, 16, calmo); ctx.fillStyle = cores.ok; nota(x0, x1, p.alvo); ctx.fill(); semBrilho(ctx);
      comemorar(fx, p.ini, x1 - esp / 2, y(p.alvo), esp, relogio, calmo);
    } else {
      ctx.fillStyle = comAlfa(cores.tinta, 0.1); nota(x0, x1, p.alvo); ctx.fill();
      acertos(p, x0, x1);
    }
  }

  // A da vez: o trecho que passou mostra onde a voz acertou; o que falta segurar fica à frente da linha e encolhe enquanto ela segura.
  let xFim = cabeca;
  if (atual) {
    const alvoFim = cabeca + Math.max(esp * 0.6, (1 - e.progresso) * e.segurarS * pps);
    fx.fimSuave = fx.fimSuave === null || calmo ? alvoFim : fx.fimSuave + (alvoFim - fx.fimSuave) * 0.25;
    xFim = fx.fimSuave;
    const x0 = Math.min(x(atual.ini), cabeca - esp);
    ctx.fillStyle = comAlfa(cores.alvo, 0.28); nota(x0, cabeca, atual.alvo); ctx.fill();
    acertos(atual, x0, cabeca);
    // O que falta: laranja cheio, respirando enquanto espera a voz.
    const respira = calmo ? 0.5 : 0.5 + 0.5 * Math.sin(relogio * 5.2);
    brilho(ctx, cores.alvo, 10 + respira * 10, calmo);
    ctx.fillStyle = cores.alvo; nota(cabeca - esp / 2, xFim, atual.alvo); ctx.fill(); semBrilho(ctx);
  } else fx.fimSuave = null;

  // As que vêm: em escala de tempo, depois da da vez.
  let xf = (atual ? xFim : cabeca) + VAO;
  for (const m of e.proximos) {
    if (xf > w) break;
    const larg = Math.max(MIN_NOTA, e.segurarS * pps);
    ctx.fillStyle = comAlfa(cores.alvo, 0.22); nota(xf, xf + larg, m); ctx.fill();
    ctx.strokeStyle = comAlfa(cores.alvo, 0.85); ctx.lineWidth = 1.5; nota(xf, xf + larg, m); ctx.stroke();
    xf += larg + VAO;
  }

  // O nome da nota da vez, grande, sobre ela (é o que se lê a um metro).
  const nomeAlvo = atual?.alvo ?? e.proximos[0] ?? null;
  if (nomeAlvo !== null && !e.alcance) {
    ctx.font = fonte(700, 26); ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillStyle = cores.alvo;
    ctx.fillText(e.nome(nomeAlvo), Math.min(w - 60, cabeca + 14), Math.max(30, y(nomeAlvo) - esp / 2 - 8));
  }

  linhaDoAgora(ctx, cabeca, h, cores);

  // ---------------------------------------------------------------- a voz
  const trechos = trechosDaVoz(e.amostras.filter((s) => s.t >= desde), (s) => {
    const m = dobrada(s);
    if (m === null || y(m) < 4 || y(m) > h - 4) return null;
    const r = e.alcance ? null : referencia(s.t);
    return { x: x(s.t), y: y(m), t: s.t, ok: r !== null && dentroDe(s, r) };
  });
  fita(ctx, trechos, e.agora, passadoS, cores, calmo);
  const ultima = e.amostras[e.amostras.length - 1];
  const mu = ultima && e.agora - ultima.t < 0.3 ? dobrada(ultima) : null;
  if (ultima && mu !== null && ultima.midi !== null) {
    const r = e.alcance ? null : referencia(ultima.t);
    const dentro = r !== null && dentroDe(ultima, r);
    const seta = r === null || dentro ? 0 : centsDe(ultima.midi, r, e.qualquerOitava) < 0 ? -1 : 1;
    cabecaDaVoz(ctx, cabeca, Math.max(10, Math.min(h - 10, y(mu))), dentro, seta, cores);
  }

  desenharEfeitos(ctx, fx, relogio, cores);
  bordas(ctx, w, h, cores);
  mensagemDoFim(ctx, fx, e.mensagem, w, h, relogio, cores, e.fonte, calmo);
}
