import { describe, expect, it } from "vitest";
import {
  Box, CHUNK_SAMPLES, IN_TUNE_CENTS, NOTE_NAMES, NeedleAnimator, PitchPipeline, PitchSmoother,
  computeGeometry, midiFromFrequency, readingFromMidi,
} from ".";

// Os mesmos sinais de marmota-tuner/core/src/jvmTest/.../TestSignals.kt: o JS tem que dar o que o app dá.
const RATE = 44100;
const sine = (hz: number, n: number) => Float32Array.from({ length: n }, (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / RATE));
const guitarLike = (hz: number, n: number) => {
  const weights = [0.25, 0.45, 0.35, 0.15, 0.08];
  return Float32Array.from({ length: n }, (_, i) =>
    weights.reduce((sum, w, k) => sum + w * Math.sin((2 * Math.PI * hz * (k + 1) * i) / RATE), 0) * 0.5);
};

/** Passa o sinal em blocos do tamanho do microfone e devolve a última leitura. */
function feed(signal: Float32Array) {
  const pipeline = new PitchPipeline(RATE);
  let last = pipeline.process(new Float32Array(0), 0);
  for (let start = 0; start < signal.length; start += CHUNK_SAMPLES) {
    const chunk = signal.slice(start, start + CHUNK_SAMPLES);
    last = pipeline.process(chunk, chunk.length);
  }
  return last;
}

const noteOf = (midi: number) => {
  const r = readingFromMidi(midi);
  return `${r.name}${r.octave}`;
};

describe("afinador: lógica do app compilada para JS", () => {
  it("acha as seis cordas soltas, com a oitava certa", () => {
    const strings: [number, string][] = [[82.41, "E2"], [110, "A2"], [146.83, "D3"], [196, "G3"], [246.94, "B3"], [329.63, "E4"]];
    for (const [hz, note] of strings) {
      const { midi } = feed(sine(hz, RATE / 2));
      expect(midi, `${hz} Hz`).not.toBeNull();
      expect(noteOf(midi!)).toBe(note);
      expect(Math.abs((midi! - midiFromFrequency(hz)) * 100)).toBeLessThan(1);
    }
  });

  it("não sobe uma oitava quando os harmônicos são mais fortes que a fundamental (E grave)", () => {
    const { midi } = feed(guitarLike(82.41, RATE / 2));
    expect(noteOf(midi!)).toBe("E2");
  });

  it("silêncio não vira nota", () => {
    expect(feed(new Float32Array(RATE / 2)).midi).toBeNull();
  });

  it("dá nome, oitava e cents como o app", () => {
    const r = readingFromMidi(58.8);
    expect(`${r.name}${r.octave}`).toBe("B3");
    expect(r.cents).toBeCloseTo(-20, 3);
    expect(r.isInTune).toBe(false);
    expect(NOTE_NAMES).toEqual(["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]);
    expect(IN_TUNE_CENTS).toBe(5);
  });

  it("a suavização segura a última nota num silêncio curto e solta depois de 15 leituras vazias", () => {
    const smoother = new PitchSmoother();
    expect(smoother.push(60)).toBe(60);
    for (let i = 0; i < 14; i++) expect(smoother.push(null)).toBe(60);
    smoother.push(null);
    expect(smoother.push(null)).toBeNull();
  });

  it("a agulha anda e assenta, com o relógio do navegador (ms em número)", () => {
    const needle = new NeedleAnimator(50);
    needle.target = 20;
    let t = 0;
    while (needle.step(t)) t += 16;
    expect(needle.position).toBe(20);
  });

  it("calcula a geometria da tela", () => {
    const g = computeGeometry(new Box(0, 0, 400, 520), 1);
    expect(g.centerX).toBe(200);
    expect(g.radius).toBeGreaterThan(0);
    expect(g.angleForCents(50)).toBeCloseTo(g.maxAngleDegrees, 3);
  });
});
