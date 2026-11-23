// A pista do cantar: desenha as notas como barras numa pista de altura, a linha de leitura e a voz ao vivo. Puro de React (só canvas);
// as cores vêm das variáveis do site, para o tema claro e o escuro valerem sem mudar nada aqui.
import { acertoDaNota, dobrar, LATENCIA_S, LIMIAR, type Amostra, type Janela } from "./cantar";
import { centsDe } from "./voz";

export type Cores = { alvo: string; ok: string; ruim: string; tinta: string; suave: string; linha: string; sobre: string; acento: string };
export const lerCores = (el: Element): Cores => {
  const s = getComputedStyle(el);
  const c = (v: string, f: string) => s.getPropertyValue(v).trim() || f;
  return { alvo: c("--target", "#f0a634"), ok: c("--ok", "#4cc58c"), ruim: c("--bad", "#e5675c"), tinta: c("--ink", "#f1e8da"), suave: c("--soft", "#2a231d"), linha: c("--line", "#3a322b"), sobre: c("--on-bright", "#1a1410"), acento: c("--accent", "#7db6f0") };
};

export type EstadoPista = {
  w: number; h: number; js: readonly Janela[];
  /** `rolando`: as notas correm até a linha de leitura (t em segundos, negativo na contagem). `inteiro`: o trecho todo parado, para ver antes e depois. */
  modo: "rolando" | "inteiro";
  t: number;
  amostras: readonly Amostra[];
  tolerancia: number; qualquerOitava: boolean;
  /** Mostra o que foi cantado nas barras (verde onde acertou). */
  avaliar: boolean;
  voz: number | null;
  nome: (midi: number) => string;
  cores: Cores;
};

const FUTURO_S = 4.2; // quanto da música aparece à frente da linha de leitura
const pad = 14;

export function desenharPista(ctx: CanvasRenderingContext2D, e: EstadoPista) {
  const { w, h, js, cores } = e;
  ctx.clearRect(0, 0, w, h);
  const notas = js.filter((j): j is Janela & { midi: number } => j.midi !== null);
  if (notas.length === 0) return;
  const lo = Math.min(...notas.map((j) => j.midi)), hi = Math.max(...notas.map((j) => j.midi));
  const centro = (lo + hi) / 2;
  const meia = Math.max(4, (hi - lo) / 2 + 1.6);
  const topo = pad + 18, base = h - pad;
  const y = (m: number) => topo + ((centro + meia - m) / (2 * meia)) * (base - topo);
  const alturaBarra = Math.max(18, Math.min(30, ((base - topo) / (2 * meia)) * 0.9));
  const total = Math.max(...js.map((j) => j.fim));
  const xLinha = e.modo === "rolando" ? w * 0.26 : 44;
  const pps = e.modo === "rolando" ? (w - xLinha - 10) / FUTURO_S : (w - xLinha - 12) / Math.max(total, 0.1);
  const x = (s: number) => (e.modo === "rolando" ? xLinha + (s - e.t) * pps : xLinha + s * pps);

  // pautas: uma linha tênue em cada altura da melodia, com o nome da nota
  ctx.font = "600 11px Inter, system-ui, sans-serif"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
  const alturas = [...new Set(notas.map((j) => j.midi))];
  for (const m of alturas) {
    ctx.strokeStyle = cores.linha; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(34, y(m)); ctx.lineTo(w - 4, y(m)); ctx.stroke();
    ctx.fillStyle = cores.tinta; ctx.globalAlpha = 0.55; ctx.fillText(e.nome(m), 6, y(m)); ctx.globalAlpha = 1;
  }

  const volta = (x0: number, y0: number, w0: number, h0: number, r: number) => { ctx.beginPath(); ctx.roundRect(x0, y0, Math.max(w0, 2), h0, r); };

  // barras (as sílabas que bateriam umas nas outras ficam de fora: a letra completa está logo abaixo da pista)
  const rotulos: { x1: number; x2: number; y: number }[] = [];
  for (const j of notas) {
    const x0 = x(j.ini), x1 = x(j.fim);
    if (x1 < 30 || x0 > w) continue;
    const y0 = y(j.midi) - alturaBarra / 2, r = alturaBarra / 2;
    const largura = x1 - x0 - 3;
    const jaPassou = e.modo === "inteiro" ? e.avaliar : e.t >= j.fim + 0.0;
    const fracao = e.avaliar ? acertoDaNota(e.amostras, j, e.tolerancia, e.qualquerOitava, e.modo === "inteiro" ? j.fim : e.t).fracao : 0;
    const ok = fracao >= LIMIAR;
    // fundo: laranja (alvo); depois que a nota passou sem acerto, esmaece
    ctx.globalAlpha = jaPassou && !ok ? 0.35 : 1;
    ctx.fillStyle = cores.alvo; volta(x0, y0, largura, alturaBarra, r); ctx.fill();
    ctx.globalAlpha = 1;
    // verde onde a voz esteve na altura
    if (e.avaliar) {
      ctx.save(); volta(x0, y0, largura, alturaBarra, r); ctx.clip(); ctx.fillStyle = cores.ok;
      for (let i = 0; i < e.amostras.length; i++) {
        const s = e.amostras[i]!;
        const ts = s.t - LATENCIA_S, dt = Math.min(0.15, i + 1 < e.amostras.length ? e.amostras[i + 1]!.t - s.t : 0.15);
        if (s.midi === null || ts + dt < j.ini || ts > j.fim) continue;
        if (Math.abs(centsDe(s.midi, j.midi, e.qualquerOitava)) > e.tolerancia) continue;
        const xa = x(Math.max(ts, j.ini)), xb = x(Math.min(ts + dt, j.fim));
        ctx.fillRect(xa, y0, xb - xa + 0.6, alturaBarra);
        // Um miolo escuro no trecho acertado: o verde sozinho quase não se distingue do laranja (contraste de 1,14:1).
        ctx.fillStyle = cores.sobre; ctx.globalAlpha = 0.55;
        ctx.fillRect(xa, y0 + alturaBarra * 0.36, xb - xa + 0.6, alturaBarra * 0.28);
        ctx.globalAlpha = 1; ctx.fillStyle = cores.ok;
      }
      ctx.restore();
    }
    // sílaba, sempre legível sobre a barra
    if (j.sil) {
      ctx.font = "650 13px Inter, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const xs = Math.max(x0 + 2, 36), ys = y0 - 6, larg = Math.min(ctx.measureText(j.sil).width, Math.max(largura, 40));
      const bate = rotulos.some((r) => Math.abs(r.y - ys) < 15 && xs < r.x2 + 4 && xs + larg > r.x1);
      if (!bate) { rotulos.push({ x1: xs, x2: xs + larg, y: ys }); ctx.fillStyle = cores.tinta; ctx.fillText(j.sil, xs, ys, Math.max(largura, 40)); }
    }
  }

  // linha de leitura
  if (e.modo === "rolando") {
    ctx.strokeStyle = cores.tinta; ctx.globalAlpha = 0.85; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(xLinha, topo - 10); ctx.lineTo(xLinha, base); ctx.stroke(); ctx.globalAlpha = 1;
  }

  // a voz: rastro e ponto na linha
  if (e.modo === "rolando" && e.avaliar) {
    ctx.strokeStyle = cores.tinta; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.beginPath();
    let aberto = false;
    for (const s of e.amostras) {
      const ts = s.t;
      if (ts < e.t - xLinha / pps) continue;
      if (s.midi === null) { aberto = false; continue; }
      const px = xLinha - (e.t - ts) * pps, py = Math.max(topo - 4, Math.min(base + 4, y(e.qualquerOitava ? dobrar(s.midi, centro) : s.midi)));
      if (!aberto) { ctx.moveTo(px, py); aberto = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
    if (e.voz !== null) {
      const py = Math.max(topo - 4, Math.min(base + 4, y(e.qualquerOitava ? dobrar(e.voz, centro) : e.voz)));
      const atual = js.find((j) => j.midi !== null && e.t >= j.ini && e.t < j.fim);
      const dentro = atual && atual.midi !== null && Math.abs(centsDe(e.voz, atual.midi, e.qualquerOitava)) <= e.tolerancia;
      ctx.fillStyle = dentro ? cores.ok : cores.tinta; ctx.beginPath(); ctx.arc(xLinha, py, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = cores.sobre; ctx.lineWidth = 2; ctx.stroke();
    }
  }
}
