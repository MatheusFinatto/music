// Voz solista sintetizada: toca frases de exemplo, com bend, vibrato e slide.
// Não imita o timbre da guitarra; serve para mostrar altura e ritmo com exatidão.
import { hz } from "@/core/theory";
import { track, type AudioGraph } from "./context";

export type LeadNote = {
  /** Altura de chegada, em MIDI (60 = C4). */
  midi: number;
  /** Início e duração em tempos (semínimas) a partir do começo da frase. */
  beat: number;
  dur: number;
  /** Bend ou slide: a nota começa nesta altura e sobe/desce até `midi`. */
  from?: number;
  /** Quanto do início da nota (em tempos) leva para chegar. Padrão: 0.5. */
  glide?: number;
  /** Vibrato: `rate` em Hz, `cents` de largura, `delay` em tempos antes de começar. */
  vibrato?: { rate: number; cents: number; delay?: number };
  /** Intensidade 0..1. Padrão: 1. */
  amp?: number;
};

/** Agenda uma nota. `t` é o instante (relógio do AudioContext) do começo; `beatDur` em segundos. */
export function playLead({ ctx, bus }: AudioGraph, n: LeadNote, t0: number, beatDur: number) {
  const t = t0 + n.beat * beatDur;
  const end = t + Math.max(0.06, n.dur * beatDur);
  const amp = 0.3 * (n.amp ?? 1);

  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
  const f = ctx.createBiquadFilter(), g = ctx.createGain();
  o1.type = "sawtooth"; o2.type = "triangle"; g2.gain.value = 0.5;
  f.type = "lowpass"; f.Q.value = 1.2;
  f.frequency.setValueAtTime(3600, t); f.frequency.exponentialRampToValueAtTime(1500, t + 0.5);

  const target = hz(n.midi);
  for (const [osc, mult] of [[o1, 1], [o2, 2]] as const) {
    if (n.from !== undefined) {
      const glide = Math.min(n.dur * 0.9, n.glide ?? 0.5) * beatDur;
      osc.frequency.setValueAtTime(hz(n.from) * mult, t);
      osc.frequency.exponentialRampToValueAtTime(target * mult, t + glide);
    } else osc.frequency.setValueAtTime(target * mult, t);
  }

  if (n.vibrato) {
    const lfo = ctx.createOscillator(), depth = ctx.createGain();
    const start = t + (n.vibrato.delay ?? 0) * beatDur;
    lfo.frequency.value = n.vibrato.rate;
    depth.gain.setValueAtTime(0, t);
    depth.gain.setValueAtTime(0, start);
    depth.gain.linearRampToValueAtTime(n.vibrato.cents, start + 0.25);
    lfo.connect(depth); depth.connect(o1.detune); depth.connect(o2.detune);
    track(lfo).start(t); lfo.stop(end + 0.5);
  }

  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(amp, t + 0.012);
  g.gain.setTargetAtTime(amp * 0.7, t + 0.012, 0.25);
  g.gain.setTargetAtTime(0, end, 0.05);
  o1.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(bus.lead);
  track(o1).start(t); track(o2).start(t); o1.stop(end + 0.5); o2.stop(end + 0.5);
}

export function playPhrase(graph: AudioGraph, notes: readonly LeadNote[], t0: number, beatDur: number) {
  for (const n of notes) playLead(graph, n, t0, beatDur);
}
