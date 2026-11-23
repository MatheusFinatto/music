// Um único AudioContext para o site inteiro, criado no primeiro gesto do usuário.
// Só pode ser chamado no navegador (dentro de handler de evento ou efeito).
export type BusName = "click";

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
  const click = ctx.createGain();
  click.connect(master);
  graph = { ctx, master, bus: { click } };
  return graph;
}

/** Chame em resposta a um gesto (clique, toque): navegadores só liberam áudio assim. */
export function resumeAudio(): AudioGraph | null {
  const g = getAudio();
  settleFade?.();
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

let settleFade: (() => void) | null = null;

/** Termina de vez uma descida que ainda está em curso (para o próximo som começar com o volume inteiro). */
export function settleSilence() { settleFade?.(); }

/**
 * Cala o que está soando e o que já estava agendado, com uma descida de `fade` segundos
 * (curta por padrão, só para não estalar; mais longa deixa a base morrer com naturalidade).
 */
export function silence(g: AudioGraph, fade = 0.07) {
  settleFade?.();
  const now = g.ctx.currentTime;
  const doomed = [...live];
  live.clear();
  g.master.gain.cancelScheduledValues(now);
  g.master.gain.setTargetAtTime(0, now, fade / 6);
  const finish = () => {
    clearTimeout(timer);
    settleFade = null;
    for (const n of doomed) { try { n.stop(); } catch { /* já tinha parado */ } }
    g.master.gain.cancelScheduledValues(g.ctx.currentTime);
    g.master.gain.setValueAtTime(MASTER, g.ctx.currentTime);
  };
  const timer = setTimeout(finish, fade * 1000);
  settleFade = finish;
}

export const audioNow = (): number => graph?.ctx.currentTime ?? 0;
