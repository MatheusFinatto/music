// Piano de amostras: uma amostra a cada terça menor (A2 a C6); as notas entre elas mudam só a velocidade de leitura.
// Salamander Grand Piano V3, de Alexander Holm (CC BY 3.0): ver public/sons/piano/LICENCA.txt. Os arquivos têm o número
// MIDI no nome (60.mp3 = C4). Só pode ser usado no navegador.
import type { AudioGraph } from "./context";

/** Notas MIDI com amostra: A2 (45) a C6 (84), de 3 em 3. */
export const PIANO_SAMPLES = Array.from({ length: 14 }, (_, i) => 45 + i * 3);

/** A amostra mais próxima de uma nota (a mais grave, se estiver no meio). */
export const nearestSample = (midi: number): number =>
  PIANO_SAMPLES.reduce((best, s) => (Math.abs(s - midi) < Math.abs(best - midi) ? s : best), PIANO_SAMPLES[0]!);

/** Velocidade de leitura para tocar `midi` a partir da amostra `sample`. */
export const rateFor = (midi: number, sample: number): number => 2 ** ((midi - sample) / 12);

/** Uma nota a tocar: `at` e `dur` em segundos a partir do início. */
export type PianoNote = { midi: number; at: number; dur: number };

const buffers = new Map<number, AudioBuffer>();
let loading: Promise<void> | null = null;
const playing = new Set<AudioBufferSourceNode>();

/** Baixa e decodifica as amostras (uma vez). Pode ser chamado antes do primeiro gesto. */
export function loadPiano(g: AudioGraph): Promise<void> {
  loading ??= Promise.all(
    PIANO_SAMPLES.map(async (m) => {
      const res = await fetch(`/sons/piano/${m}.mp3`);
      if (!res.ok) throw new Error(`piano ${m}: ${res.status}`);
      buffers.set(m, await g.ctx.decodeAudioData(await res.arrayBuffer()));
    }),
  ).then(() => undefined);
  // Se falhar (rede), a próxima tentativa recomeça.
  loading.catch(() => { loading = null; });
  return loading;
}

/** Cala o que ainda soa. */
export function stopPiano(g: AudioGraph) {
  const now = g.ctx.currentTime;
  for (const s of playing) { try { s.stop(now + 0.05); } catch { /* já tinha parado */ } }
  playing.clear();
}

/**
 * Toca as notas a partir de agora (com uma folga curta). Devolve a duração total em segundos, ou null se as amostras
 * ainda não carregaram.
 */
export function playPiano(g: AudioGraph, notes: readonly PianoNote[]): number | null {
  if (buffers.size < PIANO_SAMPLES.length) return null;
  stopPiano(g);
  const t0 = g.ctx.currentTime + 0.06;
  let end = 0;
  for (const n of notes) {
    const sample = nearestSample(n.midi);
    const src = g.ctx.createBufferSource();
    src.buffer = buffers.get(sample)!;
    src.playbackRate.value = rateFor(n.midi, sample);
    const env = g.ctx.createGain();
    const on = t0 + n.at, off = on + n.dur;
    env.gain.setValueAtTime(0, on);
    env.gain.linearRampToValueAtTime(0.9, on + 0.008);
    env.gain.setValueAtTime(0.9, off);
    env.gain.exponentialRampToValueAtTime(0.001, off + 0.35);
    src.connect(env).connect(g.bus.note);
    src.start(on);
    src.stop(off + 0.4);
    playing.add(src);
    src.onended = () => playing.delete(src);
    end = Math.max(end, n.at + n.dur + 0.4);
  }
  return end;
}
