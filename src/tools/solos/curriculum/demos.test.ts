import { describe, expect, it } from "vitest";
import { curriculum as real } from "./pt-BR";
import { hasExample } from "./demos";
import { PRACTICE_KEYS, transposeExercise } from "./transpose";

describe("exemplo em toda lição", () => {
  it("toda lição tem pelo menos um exercício com exemplo tocado (eco, exemplo de tomada ou demo)", () => {
    const sem = real.units.flatMap((u) => u.lessons).filter((l) => !l.exercises.some(hasExample)).map((l) => l.id);
    expect(sem).toEqual([]);
  });
  it("o exemplo tem notas, casas, compassos e cabe no braço em todos os tons de prática", () => {
    const withDemo = real.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises)).filter((e) => e.demo);
    expect(withDemo.length).toBeGreaterThan(20);
    for (const e of withDemo) {
      const d = e.demo!;
      expect(d.notes.length, e.id).toBeGreaterThan(0);
      expect(d.frets?.length, e.id).toBe(d.notes.length);
      d.notes.forEach((n) => expect(n.beat + n.dur, e.id).toBeLessThanOrEqual(d.bars * 4 + 1e-9));
      for (const k of PRACTICE_KEYS) expect(() => transposeExercise(e, k), `${e.id} em ${k}`).not.toThrow();
    }
  });
  it("o exemplo de tocar e calar cobre a base inteira, não só uma volta do padrão curto", () => {
    const ex = real.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises)).filter((e) => e.kind === "play-rest" && e.demo);
    expect(ex.length).toBeGreaterThan(3);
    for (const e of ex) expect(e.demo!.bars, e.id).toBeGreaterThanOrEqual(e.base!.prog.length);
  });
});
