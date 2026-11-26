// Piano de amostras: uma amostra a cada terça menor (A2 a C6); as notas entre elas mudam só a velocidade de leitura.
// Salamander Grand Piano V3, de Alexander Holm (CC BY 3.0): ver public/sons/piano/LICENCA.txt. Os arquivos têm o número
// MIDI no nome (60.mp3 = C4). Só pode ser usado no navegador.
// A escolha da amostra, a velocidade e o envelope são os mesmos do app Android (Kotlin em marmota-tuner/core, Piano.kt).
import * as K from "../pitch/generated/tuner-core.mjs";
import type { AudioGraph } from "./context";

/** Notas MIDI com amostra: A2 (45) a C6 (84), de 3 em 3. */
export const PIANO_SAMPLES: readonly number[] = K.PIANO_SAMPLES.get();

/** A amostra mais próxima de uma nota (a mais grave, se estiver no meio). */
export const nearestSample = (midi: number): number => K.nearestSample(midi);

/** Velocidade de leitura para tocar `midi` (mais `cents`) a partir da amostra `sample`. */
export const rateFor = (midi: number, sample: number, cents = 0): number => K.rateFor(midi, sample, cents);

const PICO = K.PIANO_PEAK.get(), ATAQUE = K.PIANO_ATTACK_S.get(), SOLTURA = K.PIANO_RELEASE_S.get();

/** Uma nota a tocar: `at` e `dur` em segundos a partir do início; `cents` desloca a altura (100 cents = um semitom). */
export type PianoNote = { midi: number; at: number; dur: number; cents?: number };

const buffers = new Map<number, AudioBuffer>();
let loading: Promise<void> | null = null;
/** O que ainda soa, com o ganho de cada nota: parar é baixar o ganho, não cortar a onda no meio (o corte estala). */
const playing = new Map<AudioBufferSourceNode, GainNode>();
/** Folga entre pedir e soar: dá tempo de agendar tudo antes da primeira nota. */
export const PIANO_LEAD_S = 0.06;
const FADE_S = 0.03;

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

/** Cala o que ainda soa, com um fade de 30 ms. */
export function stopPiano(g: AudioGraph) {
  const now = g.ctx.currentTime;
  for (const [s, env] of playing) {
    const gain = env.gain;
    // Segura o ganho onde ele está agora e desce a zero; só então para a fonte.
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { const v = gain.value; gain.cancelScheduledValues(now); gain.setValueAtTime(v, now); }
    gain.linearRampToValueAtTime(0, now + FADE_S);
    try { s.stop(now + FADE_S + 0.01); } catch { /* já tinha parado */ }
  }
  playing.clear();
}

/**
 * Toca as notas a partir de agora (com uma folga curta, PIANO_LEAD_S) ou de `inicio` (no relógio do áudio). Devolve a
 * duração total em segundos, ou null se as amostras ainda não carregaram. Com `manter`, não corta o que já soa.
 */
export function playPiano(g: AudioGraph, notes: readonly PianoNote[], opcoes: { manter?: boolean; inicio?: number } = {}): number | null {
  if (buffers.size < PIANO_SAMPLES.length) return null;
  // `manter`: soma ao que já soa em vez de cortar (o bordão repete a nota por cima de si mesmo).
  if (!opcoes.manter) stopPiano(g);
  const t0 = opcoes.inicio ?? g.ctx.currentTime + PIANO_LEAD_S;
  let end = 0;
  for (const n of notes) {
    const sample = nearestSample(n.midi);
    const src = g.ctx.createBufferSource();
    src.buffer = buffers.get(sample)!;
    src.playbackRate.value = rateFor(n.midi, sample, n.cents);
    const env = g.ctx.createGain();
    const on = t0 + n.at, off = on + n.dur;
    env.gain.setValueAtTime(0, on);
    env.gain.linearRampToValueAtTime(PICO, on + ATAQUE);
    env.gain.setValueAtTime(PICO, off);
    env.gain.exponentialRampToValueAtTime(0.001, off + SOLTURA);
    src.connect(env).connect(g.bus.note);
    src.start(on);
    src.stop(off + 0.4);
    playing.set(src, env);
    src.onended = () => playing.delete(src);
    end = Math.max(end, n.at + n.dur + 0.4);
  }
  return end;
}
