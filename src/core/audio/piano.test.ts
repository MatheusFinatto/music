import { describe, expect, it } from "vitest";
import { nearestSample, PIANO_SAMPLES, rateFor } from "./piano";

describe("piano de amostras", () => {
  it("14 amostras, de A2 a C6, de 3 em 3", () => {
    expect(PIANO_SAMPLES).toHaveLength(14);
    expect(PIANO_SAMPLES[0]).toBe(45);
    expect(PIANO_SAMPLES.at(-1)).toBe(84);
  });
  it("a amostra mais próxima: nota com amostra usa a própria, as vizinhas usam a de perto", () => {
    expect(nearestSample(60)).toBe(60);
    expect(nearestSample(61)).toBe(60);
    expect(nearestSample(62)).toBe(63);
    expect(nearestSample(30)).toBe(45);
    expect(nearestSample(99)).toBe(84);
  });
  it("a velocidade de leitura sobe um semitom por vez e uma oitava dobra", () => {
    expect(rateFor(60, 60)).toBe(1);
    expect(rateFor(72, 60)).toBeCloseTo(2, 10);
    expect(rateFor(61, 60)).toBeCloseTo(2 ** (1 / 12), 10);
    expect(rateFor(59, 60)).toBeLessThan(1);
  });
});
