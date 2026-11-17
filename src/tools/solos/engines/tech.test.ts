import { describe, expect, it } from "vitest";
import { gestureOf } from "./tech";

describe("gesto da nota", () => {
  const G = { string: 2, fret: 7 }; // 3ª corda, casa 7: D4
  it("nota simples não tem gesto", () => expect(gestureOf({ midi: 62, beat: 0, dur: 1 }, G)).toBeNull());
  it("bend sai da casa e sobe", () => expect(gestureOf({ midi: 64, from: 62, beat: 0, dur: 1 }, G)).toEqual({ kind: "bend", amount: 2 }));
  it("soltar começa dobrada e desce até a casa", () => expect(gestureOf({ midi: 62, from: 63, hold: 0.4, beat: 0, dur: 1 }, G)).toEqual({ kind: "release", amount: 1 }));
  it("slide vem de outra casa", () => expect(gestureOf({ midi: 62, from: 60, beat: 0, dur: 1 }, G)).toEqual({ kind: "slide", fromFret: 5 }));
});
