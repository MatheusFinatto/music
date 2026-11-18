import { describe, expect, it } from "vitest";
import { cleanEq } from "./eq";

describe("equalizador da base guardado", () => {
  it("o salvo antes do volume existir vale com a base cheia", () => {
    expect(cleanEq({ version: 1, low: -3, mid: 0, high: 2 })).toEqual({ version: 1, low: -3, mid: 0, high: 2, volume: 1 });
  });
  it("volume e faixas fora do limite voltam para dentro", () => {
    expect(cleanEq({ low: -40, mid: 9, high: "x", volume: 3 })).toEqual({ version: 1, low: -12, mid: 6, high: 0, volume: 1 });
    expect(cleanEq({ low: 0, mid: 0, high: 0, volume: -1 })?.volume).toBe(0);
    expect(cleanEq({ low: 0, mid: 0, high: 0, volume: 0.333 })?.volume).toBe(0.33);
  });
  it("lixo não vira equalizador", () => {
    expect(cleanEq(null)).toBeNull();
    expect(cleanEq("alto")).toBeNull();
  });
});
