// A pista das músicas, no mesmo palco do gráfico da voz (palco.ts): as notas são cápsulas que correm até a linha do agora, a sílaba
// em cima de cada uma; a nota que passa pela linha brilha em laranja, a acertada acende em verde (com anel e faíscas) e a perdida
// apaga. A voz é a mesma fita luminosa. Parada, a pista mostra o trecho inteiro (antes de cantar e no resultado). Puro canvas.
import { acertoDaNota, dobrar, ehCurta, LATENCIA_S, LIMIAR, type Amostra, type Janela } from "./cantar";
import {
  bordas, brilho, cabecaDaVoz, capsula, comAlfa, comemorar, desenharEfeitos, fita, linhaDoAgora, palco, semBrilho, trechosDaVoz,
  type Cores, type Efeitos,
} from "./palco";
import { centsDe } from "./voz";

export { lerCores, type Cores } from "./palco";

export type EstadoPista = {
  w: number; h: number; js: readonly Janela[];
  /** `rolando`: as notas correm até a linha do agora (t em segundos, negativo na contagem). `inteiro`: o trecho todo parado, para ver antes e depois. */
  modo: "rolando" | "inteiro";
  t: number;
  amostras: readonly Amostra[];
  tolerancia: number; qualquerOitava: boolean;
  /** Mostra o que foi cantado nas notas (verde onde acertou). */
  avaliar: boolean;
  voz: number | null;
  nome: (midi: number) => string;
  cores: Cores; fonte: string; calmo: boolean;
};

const FUTURO_S = 4.2; // quanto da música aparece à frente da linha do agora

export function desenharPista(ctx: CanvasRenderingContext2D, e: EstadoPista, fx: Efeitos, relogio: number) {
  const { w, h, js, cores, calmo } = e;
  palco(ctx, w, h, cores);
  const notas = js.filter((j): j is Janela & { midi: number } => j.midi !== null);
  if (notas.length === 0) return;
  const rolando = e.modo === "rolando";
  const lo = Math.min(...notas.map((j) => j.midi)), hi = Math.max(...notas.map((j) => j.midi));
  const centro = (lo + hi) / 2;
  const meia = Math.max(4, (hi - lo) / 2 + 1.6);
  const topo = 44, base = h - 20;
  const y = (m: number) => topo + ((centro + meia - m) / (2 * meia)) * (base - topo);
  const total = Math.max(...js.map((j) => j.fim));
  const xLinha = rolando ? Math.max(84, Math.round(w * 0.27)) : 46;
  const pps = rolando ? (w - xLinha) / FUTURO_S : (w - xLinha - 14) / Math.max(total, 0.1);
  // Parada com muitas notas (a música inteira), cada nota fica estreita: a cápsula afina e as sílabas só aparecem se couberem.
  const larguras = notas.map((j) => (j.fim - j.ini) * pps).sort((a, b) => a - b);
  const larguraTipica = larguras[larguras.length >> 1]!;
  const esp = Math.max(rolando ? 14 : 6, Math.min(24, ((base - topo) / (2 * meia)) * 0.9, rolando ? 24 : larguraTipica * 0.85));
  const comSilabas = rolando || larguraTipica >= 30;
  const x = (s: number) => (rolando ? xLinha + (s - e.t) * pps : xLinha + s * pps);
  const fonte = (peso: number, px: number) => `${peso} ${px}px ${e.fonte}`;
  const nota = (x0: number, x1: number, m: number) => capsula(ctx, x0, x1, y(m), esp);
  const daVez = rolando ? notas.find((j) => e.t >= j.ini && e.t < j.fim) ?? null : null;
  const dentro = (midi: number, alvo: number) => Math.abs(centsDe(midi, alvo, e.qualquerOitava)) <= e.tolerancia;

  // Parada, os nomes das alturas da melodia ficam à esquerda (sem pauta); rolando, só a faixa tênue da nota da vez.
  if (!rolando) {
    ctx.font = fonte(600, 11); ctx.textBaseline = "middle"; ctx.textAlign = "left"; ctx.fillStyle = comAlfa(cores.tinta, 0.55);
    // Com alturas muito juntas, só os nomes que não se encostam.
    let ultimoY = -Infinity;
    for (const m of [...new Set(notas.map((j) => j.midi))].sort((a, b) => b - a)) {
      if (y(m) - ultimoY < 13) continue;
      ctx.fillText(e.nome(m), 8, y(m)); ultimoY = y(m);
    }
  } else if (daVez) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, comAlfa(cores.alvo, 0)); g.addColorStop(0.2, comAlfa(cores.alvo, 0.07)); g.addColorStop(1, comAlfa(cores.alvo, 0.03));
    ctx.fillStyle = g; ctx.fillRect(0, y(daVez.midi) - esp * 0.9, w, esp * 1.8);
  }

  /** Pinta de verde os trechos da nota em que a voz esteve nela (até `ate`). */
  const acertos = (j: Janela & { midi: number }, x0: number, x1: number, ate: number) => {
    ctx.save(); nota(x0, x1, j.midi); ctx.clip(); ctx.fillStyle = cores.ok;
    for (let i = 0; i < e.amostras.length; i++) {
      const s = e.amostras[i]!;
      const ts = s.t - LATENCIA_S, dt = Math.min(0.15, i + 1 < e.amostras.length ? e.amostras[i + 1]!.t - s.t : 0.15);
      if (s.midi === null || ts + dt < j.ini || ts > Math.min(j.fim, ate) || !dentro(s.midi, j.midi)) continue;
      const xa = x(Math.max(ts, j.ini)), xb = x(Math.min(ts + dt, j.fim));
      ctx.fillRect(xa, y(j.midi) - esp / 2, xb - xa + 0.8, esp);
    }
    ctx.restore();
  };

  // ---------------------------------------------------------------- notas e sílabas
  const rotulos: { x1: number; x2: number; y: number }[] = [];
  for (const j of notas) {
    const x0 = x(j.ini), x1 = x(j.fim) - 3;
    if (x1 < -20 || x0 > w) continue;
    const passou = rolando ? e.t >= j.fim : e.avaliar;
    const agora = j === daVez;
    const curta = ehCurta(j);
    const acerto = e.avaliar && passou && !curta ? acertoDaNota(e.amostras, j, e.tolerancia, e.qualquerOitava, j.fim).fracao >= LIMIAR : false;

    if (agora && e.avaliar) {
      // A da vez: o que já passou da linha mostra o acerto; o que falta fica em laranja.
      const xm = Math.max(x0, Math.min(xLinha, x1));
      ctx.fillStyle = comAlfa(cores.alvo, 0.28); nota(x0, x1, j.midi); ctx.fill();
      acertos(j, x0, x1, e.t);
      ctx.fillStyle = cores.alvo; capsula(ctx, xm - esp / 2, x1, y(j.midi), esp); ctx.fill(); semBrilho(ctx);
    } else if (agora) {
      brilho(ctx, cores.alvo, 18, calmo); ctx.fillStyle = cores.alvo; nota(x0, x1, j.midi); ctx.fill(); semBrilho(ctx);
    } else if (passou && e.avaliar && !curta) {
      if (acerto) {
        brilho(ctx, cores.ok, 14, calmo); ctx.fillStyle = cores.ok; nota(x0, x1, j.midi); ctx.fill(); semBrilho(ctx);
        if (rolando) comemorar(fx, j.ini, x1 - esp / 2, y(j.midi), esp, relogio, calmo);
      } else {
        ctx.fillStyle = comAlfa(cores.tinta, 0.1); nota(x0, x1, j.midi); ctx.fill();
        acertos(j, x0, x1, j.fim);
        ctx.strokeStyle = comAlfa(cores.tinta, 0.28); ctx.lineWidth = 1.2; nota(x0, x1, j.midi); ctx.stroke();
      }
    } else if (passou) {
      // Ouvindo, ou uma nota de passagem (não avaliada): apaga devagar.
      ctx.fillStyle = comAlfa(cores.tinta, rolando ? 0.14 : 0.22); nota(x0, x1, j.midi); ctx.fill();
    } else if (rolando) {
      // As que vêm: laranja translúcido com contorno, como no gráfico da voz.
      ctx.fillStyle = comAlfa(cores.alvo, 0.3); nota(x0, x1, j.midi); ctx.fill();
      ctx.strokeStyle = comAlfa(cores.alvo, 0.9); ctx.lineWidth = 1.5; nota(x0, x1, j.midi); ctx.stroke();
    } else {
      // Parada, antes de cantar: o trecho inteiro em laranja.
      ctx.fillStyle = comAlfa(cores.alvo, 0.85); nota(x0, x1, j.midi); ctx.fill();
    }

    // A sílaba em cima da nota (as que bateriam umas nas outras ficam de fora: a letra corrida está embaixo da pista).
    if (j.sil && comSilabas) {
      const grande = agora && rolando;
      ctx.font = fonte(grande ? 750 : 650, grande ? 17 : 13); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const xs = Math.max(x0 + 2, rolando ? 8 : xLinha), ys = y(j.midi) - esp / 2 - 7;
      const larg = Math.min(ctx.measureText(j.sil).width, Math.max(x1 - x0, 40));
      const bate = rotulos.some((r) => Math.abs(r.y - ys) < 16 && xs < r.x2 + 4 && xs + larg > r.x1);
      if (!bate || grande) {
        rotulos.push({ x1: xs, x2: xs + larg, y: ys });
        ctx.fillStyle = grande ? cores.tinta : comAlfa(cores.tinta, passou && rolando ? 0.35 : 0.75);
        ctx.fillText(j.sil, xs, ys, Math.max(x1 - x0, 40));
      }
    }
  }

  if (!rolando) return;
  linhaDoAgora(ctx, xLinha, h, cores, 0.45);

  // ---------------------------------------------------------------- a voz
  if (e.avaliar) {
    const naHora = (t: number) => notas.find((j) => t - LATENCIA_S >= j.ini && t - LATENCIA_S < j.fim);
    const altura = (midi: number) => (e.qualquerOitava ? dobrar(midi, naHora(e.t)?.midi ?? centro) : midi);
    const vidaS = xLinha / pps;
    const trechos = trechosDaVoz(e.amostras.filter((s) => s.t >= e.t - vidaS - 0.3), (s) => {
      if (s.midi === null) return null;
      const j = naHora(s.t);
      const m = e.qualquerOitava ? dobrar(s.midi, j?.midi ?? centro) : s.midi;
      if (y(m) < 4 || y(m) > h - 4) return null;
      return { x: xLinha - (e.t - s.t) * pps, y: y(m), t: s.t, ok: !!j && dentro(s.midi, j.midi) };
    });
    fita(ctx, trechos, e.t, vidaS, cores, calmo);
    if (e.voz !== null) {
      const j = naHora(e.t);
      const ok = !!j && dentro(e.voz, j.midi);
      const seta = !j || ok ? 0 : centsDe(e.voz, j.midi, e.qualquerOitava) < 0 ? -1 : 1;
      cabecaDaVoz(ctx, xLinha, Math.max(10, Math.min(h - 10, y(altura(e.voz)))), ok, seta, cores);
    }
  }

  desenharEfeitos(ctx, fx, relogio, cores);
  bordas(ctx, w, h, cores);
}
