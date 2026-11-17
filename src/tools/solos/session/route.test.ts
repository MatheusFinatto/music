import { describe, expect, it } from "vitest";
import { curriculum } from "../curriculum/pt-BR";
import type { Rating } from "./schedule";
import { decodeView, encodeView, findLesson, hrefOf, lessonSteps, parseRoute, routeOf, type View } from "./route";

describe("endereço", () => {
  it("lê e escreve cada tela", () => {
    for (const href of ["", "?sessao", "?licao=u5.l1", "?exercicio=f.07"]) expect(hrefOf(parseRoute(href))).toBe(href);
  });
  it("parâmetro desconhecido cai na trilha", () => expect(parseRoute("?x=1")).toEqual({ kind: "home" }));
  it("lição aberta pela trilha tem o endereço da lição, inclusive no fim", () => {
    const steps = lessonSteps(findLesson(curriculum, "u1.l2")!, false);
    expect(routeOf({ name: "session", lesson: "u1.l2", steps, at: 1, ratings: [] })).toEqual({ kind: "lesson", id: "u1.l2" });
    expect(routeOf({ name: "done", lesson: "u1.l2", steps, ratings: [], outcome: {} })).toEqual({ kind: "lesson", id: "u1.l2" });
    expect(routeOf({ name: "session", steps, at: 0, ratings: [] })).toEqual({ kind: "session" });
  });
});

describe("guardar a posição na sessão", () => {
  const lesson = findLesson(curriculum, "u5.l2")!;
  const steps = lessonSteps(lesson, true);
  it("volta igual depois de recarregar", () => {
    const v: View = { name: "session", lesson: lesson.id, steps, at: 1, ratings: ["ok", undefined] };
    const back = decodeView(curriculum, encodeView(v));
    expect(back).toMatchObject({ name: "session", lesson: "u5.l2", at: 1, ratings: ["ok", undefined] });
    expect(back?.name === "session" && back.steps.map((s) => [s.part, s.ex.id, s.lesson?.id])).toEqual(steps.map((s) => ["again", s.ex.id, "u5.l2"]));
  });
  it("buracos na lista de respostas não quebram", () => {
    const ratings: (Rating | undefined)[] = [];
    ratings[2] = "ok";
    const back = decodeView(curriculum, encodeView({ name: "session", steps, at: 1, ratings }));
    expect(back?.name === "session" && back.ratings).toEqual([undefined, undefined, "ok"]);
  });
  it("descarta o que não serve mais", () => {
    expect(decodeView(curriculum, null)).toBeNull();
    expect(decodeView(curriculum, "{nada")).toBeNull();
    expect(decodeView(curriculum, JSON.stringify({ name: "session", steps: [{ part: "new", ex: "nao.existe" }], at: 0, ratings: [] }))).toBeNull();
  });
  it("trilha e exercício avulso não precisam guardar nada", () => {
    expect(encodeView({ name: "home" })).toBeNull();
  });
});
