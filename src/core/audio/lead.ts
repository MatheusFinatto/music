// Voz solista: toca frases de exemplo, com bend, vibrato e slide.
// Por padrão é o violão gravado (samples.ts, com o tom e o volume de sound.ts). Enquanto as amostras
// baixam, ou se a pessoa escolher "sintetizador", toca a voz sintetizada, que só mostra altura e ritmo.
import { hz } from "@/core/theory";
import { track, type AudioGraph } from "./context";
import { bankOf, loadBank, sampleVoice } from "./samples";
import { buildChain, soundStore } from "./sound";

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
  /** Tempos parados em `from` antes de começar a ir (soltar um bend já dobrado). Padrão: 0. */
  hold?: number;
  /** Vibrato: `rate` em Hz, `cents` de largura, `delay` em tempos antes de começar. */
  vibrato?: { rate: number; cents: number; delay?: number };
  /** Intensidade 0..1. Padrão: 1. */
  amp?: number;
  /**
   * Ligado (hammer-on ou pull-off): a nota não é palhetada. Continua a voz da nota anterior, que tem que
   * terminar onde esta começa, e só muda de altura. Sem nota anterior colada, soa palhetada.
   */
  legato?: boolean;
};

/** Notas ligadas seguidas viram uma voz só: cada grupo começa numa nota palhetada. */
export function legatoChains(notes: readonly LeadNote[]): LeadNote[][] {
  const out: LeadNote[][] = [];
  for (const n of notes) {
    const chain = out.at(-1), prev = chain?.at(-1);
    if (n.legato && chain && prev && Math.abs(prev.beat + prev.dur - n.beat) < 0.02) chain.push(n);
    else out.push([n]);
  }
  return out;
}

/** A cadeia de timbre de cada contexto, criada na primeira nota e atualizada quando a pessoa muda o som. */
const chains = new WeakMap<BaseAudioContext, ReturnType<typeof buildChain>>();
function chainOf({ ctx, bus }: AudioGraph) {
  let c = chains.get(ctx);
  if (!c) {
    const chain = buildChain(ctx, bus.lead);
    const update = () => {
      const s = soundStore.get();
      chain.apply(s);
      if (s.instrument !== "sintetizador") void loadBank(ctx, s.instrument);
    };
    update();
    soundStore.subscribe(update);
    chains.set(ctx, chain);
    c = chain;
  }
  return c;
}

/**
 * A altura de uma voz ao longo das notas dela (uma, ou várias ligadas). Em cada nota: bend ou slide sai de
 * `from`, fica parado `hold` e vai até `midi` em `glide`; sem gesto, a altura pula para `midi` na hora.
 * `value` converte a altura MIDI no valor do parâmetro; `exp` usa rampa exponencial (frequência em Hz).
 */
function pitchCurve(p: AudioParam, chain: readonly LeadNote[], t0: number, beatDur: number, value: (midi: number) => number, exp: boolean) {
  for (const n of chain) {
    const t = t0 + n.beat * beatDur;
    if (n.from === undefined) { p.setValueAtTime(value(n.midi), t); continue; }
    const hold = Math.min(n.dur * 0.6, n.hold ?? 0) * beatDur;
    const glide = Math.min(n.dur * 0.9 - hold / beatDur, n.glide ?? 0.5) * beatDur;
    p.setValueAtTime(value(n.from), t);
    if (hold > 0) p.setValueAtTime(value(n.from), t + hold);
    if (exp) p.exponentialRampToValueAtTime(value(n.midi), t + hold + glide);
    else p.linearRampToValueAtTime(value(n.midi), t + hold + glide);
  }
}

/** Prepara o som escolhido (cadeia e amostras) antes da primeira nota: chame junto com o play. */
export function prepareLead(graph: AudioGraph) {
  chainOf(graph);
}

/** Vibrato: oscila a desafinação (`detune`, em cents) de cada parâmetro dado. */
function vibrato(ctx: BaseAudioContext, n: LeadNote, params: AudioParam[], t: number, end: number, beatDur: number) {
  if (!n.vibrato) return;
  const lfo = ctx.createOscillator(), depth = ctx.createGain();
  const start = t + (n.vibrato.delay ?? 0) * beatDur;
  lfo.frequency.value = n.vibrato.rate;
  depth.gain.setValueAtTime(0, t);
  depth.gain.setValueAtTime(0, start);
  depth.gain.linearRampToValueAtTime(n.vibrato.cents, start + 0.25);
  lfo.connect(depth);
  params.forEach((p) => depth.connect(p));
  track(lfo).start(t); lfo.stop(end + 0.5);
}

/** Agenda uma nota. `t0` é o instante (relógio do AudioContext) do tempo 0; `beatDur` em segundos. */
export function playLead(graph: AudioGraph, n: LeadNote, t0: number, beatDur: number) {
  playVoice(graph, [n], t0, beatDur);
}

/** Uma voz: a primeira nota é palhetada e as seguintes, ligadas, só mudam a altura. */
function playVoice(graph: AudioGraph, chain: readonly LeadNote[], t0: number, beatDur: number) {
  const { ctx, bus } = graph;
  const n = chain[0]!, last = chain.at(-1)!;
  const t = t0 + n.beat * beatDur;
  const end = t0 + last.beat * beatDur + Math.max(0.06, last.dur * beatDur);
  // O vibrato é da última nota: nas do meio de um ligado, ele não teria tempo de começar.
  const vib = last;
  const vibAt = t0 + last.beat * beatDur;
  const sound = soundStore.get();

  if (sound.instrument !== "sintetizador") {
    const chain0 = chainOf(graph);
    const bank = bankOf(ctx, sound.instrument);
    if (bank) {
      const ref = n.from ?? n.midi;
      const v = sampleVoice(ctx, bank, chain0.input, ref, t, end, 1.4 * (n.amp ?? 1));
      track(v.src);
      // Rampa linear em cents = rampa exponencial em Hz: a mesma curva da voz sintetizada.
      pitchCurve(v.detune, chain, t0, beatDur, (m) => (m - ref) * 100, false);
      vibrato(ctx, vib, [v.detune], vibAt, end, beatDur);
      return;
    }
    // Ainda baixando: esta nota sai na voz sintetizada, as próximas já gravadas.
    void loadBank(ctx, sound.instrument);
  }

  const amp = 0.3 * (n.amp ?? 1);

  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g2 = ctx.createGain();
  const f = ctx.createBiquadFilter(), g = ctx.createGain();
  o1.type = "sawtooth"; o2.type = "triangle"; g2.gain.value = 0.5;
  f.type = "lowpass"; f.Q.value = 1.2;
  f.frequency.setValueAtTime(3600, t); f.frequency.exponentialRampToValueAtTime(1500, t + 0.5);

  for (const [osc, mult] of [[o1, 1], [o2, 2]] as const) pitchCurve(osc.frequency, chain, t0, beatDur, (m) => hz(m) * mult, true);
  vibrato(ctx, vib, [o1.detune, o2.detune], vibAt, end, beatDur);

  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(amp, t + 0.012);
  g.gain.setTargetAtTime(amp * 0.7, t + 0.012, 0.25);
  g.gain.setTargetAtTime(0, end, 0.05);
  o1.connect(f); o2.connect(g2).connect(f); f.connect(g).connect(bus.lead);
  track(o1).start(t); track(o2).start(t); o1.stop(end + 0.5); o2.stop(end + 0.5);
}

export function playPhrase(graph: AudioGraph, notes: readonly LeadNote[], t0: number, beatDur: number) {
  for (const chain of legatoChains(notes)) playVoice(graph, chain, t0, beatDur);
}
