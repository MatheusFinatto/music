// Um único AudioContext para o site inteiro, criado no primeiro gesto do usuário.
// Só pode ser chamado no navegador (dentro de handler de evento ou efeito).
import { buildEq, eqStore } from "./eq";

export type BusName = "drums" | "bass" | "chords" | "lead" | "click";

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
  // A base (bateria, baixo e acordes) passa pelo equalizador da pessoa; a voz solista e o clique, não.
  const eq = buildEq(ctx, master);
  eq.apply(eqStore.get());
  eqStore.subscribe(() => eq.apply(eqStore.get()));
  const mk = (gain: number, out: AudioNode = master) => { const g = ctx.createGain(); g.gain.value = gain; g.connect(out); return g; };
  graph = { ctx, master, bus: { drums: mk(0.7, eq.input), bass: mk(0.75, eq.input), chords: mk(0.6, eq.input), lead: mk(1), click: mk(1) } };
  return graph;
}

/** Chame em resposta a um gesto (clique, toque): navegadores só liberam áudio assim. */
export function resumeAudio(): AudioGraph | null {
  const g = getAudio();
  if (g && g.ctx.state !== "running") void g.ctx.resume();
  return g;
}

const live = new Set<AudioScheduledSourceNode>();

/** Registra uma fonte agendada, para poder calar tudo ao parar. */
export function track<T extends AudioScheduledSourceNode>(node: T): T {
  live.add(node);
  node.addEventListener("ended", () => live.delete(node));
  return node;
}

/** Cala o que está soando e o que já estava agendado, com uma descida curta para não estalar. */
export function silence(g: AudioGraph) {
  const now = g.ctx.currentTime;
  const doomed = [...live];
  live.clear();
  g.master.gain.cancelScheduledValues(now);
  g.master.gain.setTargetAtTime(0, now, 0.012);
  setTimeout(() => {
    for (const n of doomed) { try { n.stop(); } catch { /* já tinha parado */ } }
    g.master.gain.cancelScheduledValues(g.ctx.currentTime);
    g.master.gain.setValueAtTime(MASTER, g.ctx.currentTime);
  }, 70);
}

export const audioNow = (): number => graph?.ctx.currentTime ?? 0;
