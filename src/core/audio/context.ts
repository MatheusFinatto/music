// Um único AudioContext para o site inteiro, criado no primeiro gesto do usuário.
// Só pode ser chamado no navegador (dentro de handler de evento ou efeito).
export type BusName = "click" | "note";

export type AudioGraph = { ctx: AudioContext; master: GainNode; bus: Record<BusName, GainNode> };

let graph: AudioGraph | null = null;
const MASTER = 0.8;

export function getAudio(): AudioGraph | null {
  if (graph) return graph;
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14;
  comp.ratio.value = 4;
  const master = ctx.createGain();
  master.gain.value = MASTER;
  master.connect(comp).connect(ctx.destination);
  const mk = () => { const g = ctx.createGain(); g.connect(master); return g; };
  graph = { ctx, master, bus: { click: mk(), note: mk() } };
  return graph;
}

/** Chame em resposta a um gesto (clique, toque): navegadores só liberam áudio assim. */
export function resumeAudio(): AudioGraph | null {
  const g = getAudio();
  if (g && g.ctx.state !== "running") void g.ctx.resume();
  return g;
}

export const audioNow = (): number => graph?.ctx.currentTime ?? 0;

/**
 * O instante do relógio do áudio que está saindo no alto-falante agora. `currentTime` é o que está sendo calculado, e
 * o som ainda leva o atraso da saída (no celular e no Bluetooth, 100 ms ou mais) para ser ouvido. Para acender algo
 * junto com o som, compare com isto, não com `currentTime`.
 */
export function heardTime(ctx: AudioContext): number {
  const ts = ctx.getOutputTimestamp?.();
  if (ts?.contextTime && ts.performanceTime) return ts.contextTime + (performance.now() - ts.performanceTime) / 1000;
  return ctx.currentTime - (ctx.outputLatency || ctx.baseLatency || 0);
}
