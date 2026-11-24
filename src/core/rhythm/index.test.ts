import { describe, expect, it } from "vitest";
import { ACCENT, BEAT, MAX_BPM, MUTE, Metronome, SUB, SUBDIVISIONS, TapTempo, clampBpm, renderChime, renderClick, subdivisionById } from "./index";

// A lógica é do Kotlin (testada lá); aqui só se confere que o JS compilado chega inteiro ao site.
describe("metrônomo compilado do Kotlin", () => {
  it("cliques no tempo, com acento e subdivisão", () => {
    const m = new Metronome(120, 2, 2);
    m.reset(0);
    const ticks = Array.from({ length: 4 }, () => m.next());
    expect(ticks.map((t) => t.time)).toEqual([0, 0.25, 0.5, 0.75]);
    expect(ticks.map((t) => t.kind)).toEqual([ACCENT, SUB, BEAT, SUB]);
  });
  it("andamento limitado e toque no ritmo", () => {
    expect(clampBpm(999)).toBe(MAX_BPM);
    const tap = new TapTempo();
    tap.tap(0);
    expect(tap.tap(0.5)).toBe(120);
  });
  it("divisões com figura e tempo mudo", () => {
    expect(SUBDIVISIONS.map((d) => d.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect([...subdivisionById(8).offsets]).toEqual([0, 0.75]);
    const m = new Metronome(60, 2, 8);
    expect(m.cycleAccent(1)).toBe(ACCENT);
    expect(m.cycleAccent(1)).toBe(MUTE);
    m.reset(0);
    expect(Array.from({ length: 4 }, () => m.next().kind)).toEqual([ACCENT, SUB, MUTE, MUTE]);
  });
  it("o clique vira amostras", () => {
    expect(renderClick(ACCENT, 48000).length).toBe(Math.floor(0.04 * 48000));
    expect(renderChime(48000).length).toBeGreaterThan(0);
  });
});
