import { describe, expect, it } from "vitest";
import type { ChordDegree } from "@/core/theory";
import { chordsOf, minorPentatonic } from "@/core/theory";
import { pentaDegrees, targetDegree } from "./target";

describe("alvo na troca", () => {
  const seq = (degrees: ChordDegree[], bars = 36) => Array.from({ length: bars }, (_, b) => targetDegree(b, degrees));
  it.each([[["T", "3", "5"]], [["3", "5"]], [["T", "3"]]] as ChordDegree[][][])("nunca repete o grau do compasso anterior (%j)", (degrees) => {
    const s = seq(degrees);
    s.slice(1).forEach((d, i) => expect(d, `compasso ${i + 1}`).not.toBe(s[i]));
  });
  it("todos os graus aparecem na mesma proporção", () => {
    const s = seq(["T", "3", "5"]);
    for (const d of ["T", "3", "5"]) expect(s.filter((x) => x === d)).toHaveLength(12);
  });
  it("sobre quatro acordes, cada acorde recebe graus diferentes ao longo das voltas", () => {
    const s = seq(["T", "3", "5"], 48);
    for (let chord = 0; chord < 4; chord++) expect(new Set(s.filter((_, b) => b % 4 === chord)).size, `acorde ${chord}`).toBe(3);
  });
  it("um grau só é aceito", () => expect(seq(["3"], 4)).toEqual(["3", "3", "3", "3"]));
});

describe("alvo só na pentatônica", () => {
  const all: ChordDegree[] = ["T", "3", "5"];
  const penta = minorPentatonic(0);
  it("tira do sorteio as notas do acorde que não estão na pentatônica", () => {
    const [am, f, c, g] = chordsOf([5, 3, 0, 4]);
    expect(pentaDegrees(am!, all, penta)).toEqual(["T", "3", "5"]);
    expect(pentaDegrees(f!, all, penta)).toEqual(["3", "5"]); // sem o Fá
    expect(pentaDegrees(c!, all, penta)).toEqual(["T", "3", "5"]);
    expect(pentaDegrees(g!, all, penta)).toEqual(["T", "5"]); // sem o Si
  });
});
