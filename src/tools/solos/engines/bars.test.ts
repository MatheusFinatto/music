import { describe, expect, it } from "vitest";
import { curriculum as real } from "../curriculum/pt-BR";
import type { TakeExercise } from "../curriculum/types";
import { barOptions, chosenBars } from "./bars";

const takes = [...real.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises)), real.take].flatMap((e) => (e.kind === "take" ? [e] : []));

describe("compassos da tomada", () => {
  it("o recomendado está entre as opções, e toda opção divide o arco e fecha o ciclo de toda base", () => {
    for (const e of takes) {
      const options = barOptions(e);
      expect(options, e.id).toContain(e.bars);
      expect(options.length, e.id).toBeGreaterThan(1);
      for (const n of options) {
        if (e.arc) expect(n % e.arc.length, `${e.id}: ${n}`).toBe(0);
        for (const b of [e.base!, ...(e.bases ?? [])]) expect(n % b.prog.length, `${e.id}: ${n}`).toBe(0);
      }
    }
  });
  it("escolha salva que não é mais opção volta para o recomendado", () => {
    const e = takes[0]! as TakeExercise;
    expect(chosenBars(e, undefined)).toBe(e.bars);
    expect(chosenBars(e, 7)).toBe(e.bars);
    expect(chosenBars(e, barOptions(e).at(-1))).toBe(barOptions(e).at(-1));
  });
});
