import { describe, expect, it } from "vitest";
import { gestureOf, spell } from "./tech";

describe("escrita das técnicas", () => {
  const G = { string: 2, fret: 7 }; // 3ª corda, casa 7: D4
  it("nota simples", () => expect(spell({ midi: 62, beat: 0, dur: 1 }, G)).toBe("D4"));
  it("bend sai da casa e sobe", () => expect(spell({ midi: 64, from: 62, beat: 0, dur: 1 }, G)).toBe("D4↑E4"));
  it("soltar começa dobrada e desce até a casa", () => expect(spell({ midi: 62, from: 64, hold: 0.4, beat: 0, dur: 1 }, G)).toBe("E4↓D4"));
  it("slide vem de outra casa", () => expect(spell({ midi: 62, from: 60, beat: 0, dur: 1 }, G)).toBe("C4/D4"));
  it("vibrato", () => expect(spell({ midi: 64, from: 62, beat: 0, dur: 1, vibrato: { rate: 5, cents: 40 } }, G)).toBe("D4↑E4~"));
  it("o gesto traz quanto sobe e de onde vem o slide", () => {
    expect(gestureOf({ midi: 64, from: 62, beat: 0, dur: 1 }, G)).toEqual({ kind: "bend", amount: 2 });
    expect(gestureOf({ midi: 62, from: 63, hold: 0.4, beat: 0, dur: 1 }, G)).toEqual({ kind: "release", amount: 1 });
    expect(gestureOf({ midi: 62, from: 60, beat: 0, dur: 1 }, G)).toEqual({ kind: "slide", fromFret: 5 });
    expect(gestureOf({ midi: 62, beat: 0, dur: 1 }, G)).toBeNull();
  });
});
