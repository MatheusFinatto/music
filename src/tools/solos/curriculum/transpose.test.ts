import { describe, expect, it } from "vitest";
import { chordsOf, degreeIn, minorPentatonic, mod12, pentatonicShape } from "@/core/theory";
import { curriculum } from "./pt-BR";
import { keyName, keyOffset, PRACTICE_KEYS, rootFret, transposeExercise } from "./transpose";

const all = [...curriculum.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises)), ...curriculum.phrases, curriculum.take];

describe("tom de prática", () => {
  it("os 12 tons, sem repetir, começando em Lá menor", () => {
    expect(new Set(PRACTICE_KEYS).size).toBe(12);
    expect(keyName(PRACTICE_KEYS[0]!)).toBe("Am");
  });
  it("a casa da tônica bate com o desenho 1 de cada tom", () => {
    expect(rootFret(0)).toBe(5); // Am
    expect(rootFret(7)).toBe(12); // Em
    expect(rootFret(5)).toBe(10); // Dm
    for (const k of PRACTICE_KEYS) expect(Math.min(...pentatonicShape(k, 1).filter((p) => p.string === 5).map((p) => p.fret)), keyName(k)).toBe(rootFret(k));
  });
  it("o deslocamento fica entre -4 e +7 casas", () => {
    for (const k of PRACTICE_KEYS) { expect(keyOffset(k)).toBeGreaterThanOrEqual(-4); expect(keyOffset(k)).toBeLessThanOrEqual(7); }
  });

  describe.each(PRACTICE_KEYS.map((k) => [keyName(k), k] as const))("em %s", (_, key) => {
    const moved = all.map((e) => ({ orig: e, e: transposeExercise(e, key) }));
    it("toda frase cabe no braço, da casa 0 à 20", () => {
      for (const { e } of moved) {
        const phrases = e.kind === "echo" ? e.phrases : e.kind === "take" ? e.examples ?? [] : [];
        for (const p of phrases) for (const f of p.frets ?? []) { expect(f.fret, `${e.id}/${p.id}`).toBeGreaterThanOrEqual(0); expect(f.fret, `${e.id}/${p.id}`).toBeLessThanOrEqual(20); }
      }
    });
    it("continua só com notas da pentatônica, e nota longa continua nota do acorde", () => {
      for (const { e } of moved) {
        if (!e.base) continue;
        const penta = new Set(minorPentatonic(e.base.key));
        const chords = chordsOf(e.base.prog, e.base.key);
        const phrases = e.kind === "echo" ? e.phrases.filter((p) => p.frets) : e.kind === "take" ? e.examples ?? [] : [];
        for (const p of phrases)
          for (const n of p.notes) {
            expect(penta.has(mod12(n.midi)), `${e.id}/${p.id}@${n.beat}`).toBe(true);
            if (n.dur >= 1.5) expect(degreeIn(n.midi, chords[Math.floor(n.beat / 4) % chords.length]!), `${e.id}/${p.id}@${n.beat}`).not.toBeNull();
          }
      }
    });
    it("a casa de cada nota bate com a altura dela (no bend, com a altura de partida)", () => {
      const open = [64, 59, 55, 50, 45, 40];
      for (const { e } of moved) {
        const phrases = e.kind === "echo" ? e.phrases : e.kind === "take" ? e.examples ?? [] : [];
        for (const p of phrases)
          p.notes.forEach((n, i) => {
            const f = p.frets?.[i];
            if (!f) return;
            const at = open[f.string]! + f.fret;
            expect(at === n.midi || (at === n.from && n.hold === undefined), `${e.id}/${p.id}@${n.beat}`).toBe(true);
          });
      }
    });
    it("as outras bases da tomada acompanham o tom", () => {
      for (const { orig, e } of moved) {
        if (orig.kind !== "take" || e.kind !== "take" || !orig.bases || orig.base?.key !== 0) continue;
        expect(e.bases!.map((b) => b.key), e.id).toEqual(orig.bases.map((b) => (b.key === 0 ? key : b.key)));
        expect(e.bases!.map((b) => b.prog), e.id).toEqual(orig.bases.map((b) => b.prog));
      }
    });
    it("exercício escrito em outro tom não muda", () => {
      for (const { orig, e } of moved) if (orig.base && orig.base.key !== 0) expect(e).toBe(orig);
    });
  });
});
