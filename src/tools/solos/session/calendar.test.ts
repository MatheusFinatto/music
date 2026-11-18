import { describe, expect, it } from "vitest";
import { curriculum as real } from "../curriculum/pt-BR";
import { monthGrid, pastOf, planAhead, weekdayOf } from "./calendar";
import { EMPTY, cleanProgress, rate } from "./schedule";

const D = "2026-11-18"; // quarta

describe("calendário", () => {
  it("dia da semana: segunda é 0", () => {
    expect(weekdayOf("2026-11-16")).toBe(0);
    expect(weekdayOf("2026-11-22")).toBe(6);
  });
  it("a grade do mês começa na segunda e tem semanas inteiras", () => {
    const g = monthGrid(2026, 10);
    expect(g.every((w) => w.length === 7)).toBe(true);
    expect(g[0]![6]).toBe("2026-11-01"); // novembro de 2026 começa num domingo
    expect(g.flat().filter(Boolean)).toHaveLength(30);
  });
  it("o plano só cai nos dias escolhidos e avança nas lições", () => {
    const plan = planAhead(real, EMPTY, D, [0, 2, 4]);
    const days = Object.keys(plan);
    expect(days.length).toBeGreaterThan(10);
    expect(days.every((d) => [0, 2, 4].includes(weekdayOf(d)))).toBe(true);
    const lessons = days.map((d) => plan[d]!.find((x) => x.part === "new")?.title).filter(Boolean);
    expect(new Set(lessons).size).toBe(lessons.length);
  });
  it("hoje fica fora do plano se já praticou", () => {
    const plan = planAhead(real, rate(EMPTY, "x", "ok", D), D, [0, 1, 2, 3, 4, 5, 6]);
    expect(plan[D]).toBeUndefined();
  });
  it("sem dia escolhido, não há plano", () => expect(planAhead(real, EMPTY, D, [])).toEqual({}));
  it("o passado vem do registro diário e do último dia de cada exercício", () => {
    const first = real.units[0]!.lessons[0]!.exercises[0]!;
    const p = rate(EMPTY, first.id, "ok", D);
    expect(pastOf(real, p, D).exercises).toContain(first.title);
    expect(pastOf(real, p, "2026-11-17")).toEqual({ lessons: [], exercises: [] });
  });
  it("o registro diário sobrevive à leitura do navegador", () => {
    const p = rate(EMPTY, "x", "ok", D);
    expect(cleanProgress(JSON.parse(JSON.stringify(p)))?.log).toEqual({ [D]: ["x"] });
  });
});
