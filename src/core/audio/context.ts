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
  // No Android, o buffer curto do modo "interactive" (o padrão) falha quando o celular aperta a CPU e o som estala. O
  // "playback" usa um buffer maior: mais atraso na saída, que heardTime desconta para a tela acender junto com o som.
  const android = /Android/i.test(navigator.userAgent);
  const ctx = new AC({ latencyHint: android ? "playback" : "interactive" });
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

let aquecido = false;

/**
 * Espera o áudio estar soando de verdade. `resume()` volta antes da saída abrir, e o relógio (`currentTime`) anda antes de
 * o alto-falante tocar alguma coisa: no celular, o que foi agendado nesse meio começa pela metade. O sinal certo é o
 * relógio da saída (`getOutputTimestamp`): na primeira vez, espera ele andar 250 ms (de silêncio já tocado). Desiste em 3 s
 * (o navegador pode não deixar o áudio rodar) e segue assim mesmo.
 */
export async function readyAudio(g: AudioGraph): Promise<void> {
  if (aquecido && g.ctx.state === "running" && saidaViva(g.ctx)) return;
  const limite = performance.now() + 3000;
  const espera = () => new Promise((r) => setTimeout(r, 20));
  await Promise.race([g.ctx.resume().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]);
  const saida = () => g.ctx.getOutputTimestamp?.().contextTime ?? g.ctx.currentTime;
  while (saida() <= 0 && performance.now() < limite) await espera();
  const t0 = saida();
  while (saida() - t0 < 0.25 && performance.now() < limite) await espera();
  aquecido = g.ctx.state === "running" && performance.now() < limite;
}

/** A saída está tocando agora? Sem `getOutputTimestamp` (Safari antigo), não dá para saber: confia no aquecimento. */
function saidaViva(ctx: AudioContext): boolean {
  const ts = ctx.getOutputTimestamp?.();
  if (!ts) return true;
  return (ts.contextTime ?? 0) > 0 && performance.now() - (ts.performanceTime ?? 0) < 250;
}

/** Quanto o som que sai agora no alto-falante está atrás de `currentTime`, em segundos. */
export const outputDelay = (ctx: AudioContext): number => Math.max(0, ctx.currentTime - heardTime(ctx));

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
