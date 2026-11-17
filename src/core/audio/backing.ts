// Instrumentos sintetizados da base: pad de acordes, baixo, bateria e clique.
import { hz, type Chord, type Midi } from "@/core/theory";
import type { AudioGraph } from "./context";

/** Padrões de um compasso em 16 semicolcheias; o número é a intensidade (0 = não toca). */
export type Style = { label: string; kick?: number[]; snare?: number[]; hat?: number[]; bass: number[] };

export const STYLES = {
  balada: {
    label: "Balada",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    hat: [0.5, 0, 0, 0, 0.35, 0, 0, 0, 0.5, 0, 0, 0, 0.35, 0, 0, 0],
    bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  },
  rock: {
    label: "Rock",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [0.55, 0, 0.35, 0, 0.55, 0, 0.35, 0, 0.55, 0, 0.35, 0, 0.55, 0, 0.35, 0],
    bass: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  pop: {
    label: "Pop",
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [0.5, 0, 0.3, 0, 0.5, 0, 0.3, 0, 0.5, 0, 0.3, 0, 0.5, 0, 0.3, 0],
    bass: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
  },
  acordes: { label: "Só acordes", bass: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0] },
} satisfies Record<string, Style>;

export type StyleName = keyof typeof STYLES;

/** Vozes do acorde para o pad (região média) e nota do baixo. */
export function voicing(chord: Chord): { pad: Midi[]; bass: Midi } {
  const pad = chord.tones.map((pc) => { let m = pc + 48; while (m < 52) m += 12; return m; }).sort((a, b) => a - b);
  let bass = chord.tones[0] + 36;
  if (bass > 45) bass -= 12;
  return { pad, bass };
}

export function pad({ ctx, bus }: AudioGraph, notes: Midi[], t: number, dur: number) {
  for (const m of notes)
    for (const det of [-6, 6]) {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = det;
      f.type = "lowpass"; f.frequency.value = 900; f.Q.value = 0.4;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.04, t + 0.2);
      g.gain.setValueAtTime(0.04, t + dur - 0.25); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(f).connect(g).connect(bus.chords); o.start(t); o.stop(t + dur + 0.05);
    }
}

export function bassNote({ ctx, bus }: AudioGraph, m: Midi, t: number, dur: number) {
  const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  o.type = "sawtooth"; o.frequency.value = hz(m);
  f.type = "lowpass"; f.frequency.value = 520;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.42, t + 0.01);
  g.gain.setTargetAtTime(0.22, t + 0.01, 0.12); g.gain.setTargetAtTime(0, t + Math.max(0.05, dur - 0.04), 0.03);
  o.connect(f).connect(g).connect(bus.bass); o.start(t); o.stop(t + dur + 0.2);
}

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>();
function noise(ctx: AudioContext): AudioBuffer {
  let buf = noiseBuffers.get(ctx);
  if (!buf) {
    buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buf);
  }
  return buf;
}

export function kick({ ctx, bus }: AudioGraph, t: number, v: number) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  g.gain.setValueAtTime(0.9 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  o.connect(g).connect(bus.drums); o.start(t); o.stop(t + 0.35);
}

export function snare({ ctx, bus }: AudioGraph, t: number, v: number) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(ctx); f.type = "highpass"; f.frequency.value = 1200;
  g.gain.setValueAtTime(0.5 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  n.connect(f).connect(g).connect(bus.drums); n.start(t); n.stop(t + 0.2);
  const o = ctx.createOscillator(), og = ctx.createGain();
  o.type = "triangle"; o.frequency.value = 190;
  og.gain.setValueAtTime(0.3 * v, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
  o.connect(og).connect(bus.drums); o.start(t); o.stop(t + 0.1);
}

export function hat({ ctx, bus }: AudioGraph, t: number, v: number) {
  const n = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
  n.buffer = noise(ctx); f.type = "highpass"; f.frequency.value = 7000;
  g.gain.setValueAtTime(0.22 * v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  n.connect(f).connect(g).connect(bus.drums); n.start(t); n.stop(t + 0.06);
}

export function click({ ctx, bus }: AudioGraph, t: number, strong: boolean) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.value = strong ? 1600 : 1100;
  g.gain.setValueAtTime(strong ? 0.25 : 0.14, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(bus.click); o.start(t); o.stop(t + 0.06);
}
