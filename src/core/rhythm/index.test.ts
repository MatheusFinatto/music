import { describe, expect, it } from "vitest";
import { ACCENT, BEAT, MAX_BPM, Metronome, SUB, TapTempo, clampBpm, renderClick } from "./index";

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
  it("o clique vira amostras", () => {
    expect(renderClick(ACCENT, 48000).length).toBe(Math.floor(0.04 * 48000));
  });
});
