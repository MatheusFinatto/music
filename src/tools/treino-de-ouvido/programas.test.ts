import { describe, expect, it } from "vitest";
import { EXERCICIOS } from "./engine";
import {
  AMOSTRAS_MAX, estimarSegundos, FOCOS, type Foco, MEDIANAS_INICIAIS, mediana, medianaDe, MINUTOS, minutosParaMostrar, PISO_S, planejar, programaDe, registrarDuracao, TETO_S, type Duracoes, type Ex,
} from "./programas";

const VOZ = ["igualar", "longa", "sequencia", "tonica", "intervalo"];
const COMBOS = (["ouvido", "voz"] as const).flatMap((secao) => FOCOS[secao].map((foco) => ({ secao, foco })));

describe("programas por tempo", () => {
  it("todo foco de cada seção tem programa para os cinco tempos, e cada um soma exatamente o seu tempo", () => {
    for (const { secao, foco } of COMBOS) for (const m of MINUTOS) {
      const blocos = programaDe(secao, foco, m);
      expect(blocos.length, `${secao}/${foco} ${m}`).toBeGreaterThan(0);
      expect(blocos.reduce((s, x) => s + x.segundos, 0), `${secao}/${foco} ${m}`).toBe(m * 60);
    }
  });
  it("usa só exercícios da própria seção, sem repetir dentro do programa, e nunca o alcance", () => {
    for (const { secao, foco } of COMBOS) for (const m of MINUTOS) {
      const ids = programaDe(secao, foco, m).map((x) => x.exercicio);
      for (const id of ids) { expect(secao === "ouvido" ? EXERCICIOS : VOZ).toContain(id); expect(id).not.toBe("alcance"); }
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it("cada foco só tem os exercícios dele", () => {
    const so = (secao: "ouvido" | "voz", foco: Foco) => new Set(MINUTOS.flatMap((m) => programaDe(secao, foco, m).map((x) => x.exercicio)));
    expect(so("ouvido", "harmonia")).toEqual(new Set(["campo", "cadencias", "progressoes"]));
    expect(so("ouvido", "notas")).toEqual(new Set(["intervalos", "acordes", "achar"]));
    expect(so("ouvido", "afinacao")).toEqual(new Set(["intervalos", "afinacao"]));
    expect(so("voz", "segundaVoz")).toEqual(new Set(["igualar", "tonica", "intervalo"]));
    expect(so("voz", "afinacao")).toEqual(new Set(["igualar", "longa", "intervalo"]));
  });
  it("todo exercício tem uma duração inicial", () => {
    for (const { secao, foco } of COMBOS) for (const m of MINUTOS) for (const x of programaDe(secao, foco, m)) expect(MEDIANAS_INICIAIS[x.exercicio]).toBeGreaterThan(0);
  });
});

describe("planejar", () => {
  it("os programas crescem de 5 a 30 min e a estimativa fica perto do tempo pedido", () => {
    for (const { secao, foco } of COMBOS) {
      let anterior = 0;
      for (const m of MINUTOS) {
        const est = estimarSegundos(planejar(secao, foco, m, {}), {});
        expect(est, `${secao}/${foco} ${m}`).toBeGreaterThan(anterior);
        expect(Math.abs(est - m * 60) / (m * 60), `${secao}/${foco} ${m}`).toBeLessThan(0.2);
        anterior = est;
      }
    }
  });
  it("tem ao menos duas perguntas por bloco", () => {
    for (const { secao, foco } of COMBOS) for (const m of MINUTOS) for (const x of planejar(secao, foco, m, {})) expect(x.perguntas).toBeGreaterThanOrEqual(2);
  });
  it("quem é lento recebe menos perguntas, e quem é rápido, mais", () => {
    const lento: Duracoes = { intervalos: [30, 30, 30, 30, 30], acordes: [30, 30, 30, 30, 30] };
    const rapido: Duracoes = { intervalos: [4, 4, 4, 4, 4], acordes: [4, 4, 4, 4, 4] };
    const n = (d: Duracoes) => planejar("ouvido", "geral", 5, d).map((x) => x.perguntas);
    expect(n(lento)[0]).toBeLessThan(n({})[0]!);
    expect(n(rapido)[0]).toBeGreaterThan(n({})[0]!);
  });
  it("a estimativa acompanha o ritmo da pessoa (programa de 10 min fica perto de 10 mesmo para quem é lento)", () => {
    const lento: Duracoes = Object.fromEntries((Object.keys(MEDIANAS_INICIAIS) as Ex[]).map((e) => [e, [40, 40, 40, 40, 40]]));
    const est = estimarSegundos(planejar("ouvido", "geral", 10, lento), lento);
    expect(Math.abs(est - 600) / 600).toBeLessThan(0.45); // mínimo de 2 perguntas por bloco limita o quanto dá para encolher
  });
});

describe("mediana e ritmo", () => {
  it("mediana de ímpar, par e vazio", () => { expect(mediana([3, 1, 2])).toBe(2); expect(mediana([4, 1, 2, 3])).toBe(2.5); expect(mediana([])).toBe(0); });
  it("com menos de 5 respostas vale o palpite; com 5 ou mais, a mediana, que ignora um valor absurdo", () => {
    expect(medianaDe("intervalos", { intervalos: [1, 1, 1, 1] })).toBe(MEDIANAS_INICIAIS.intervalos);
    expect(medianaDe("intervalos", { intervalos: [8, 9, 10, 11, 60] })).toBe(10);
    expect(medianaDe("intervalos", { intervalos: [0.3, 0.4, 0.4, 0.5, 0.4] })).toBe(PISO_S); // cliques sem ouvir não encolhem o tempo
  });
  it("registrar guarda em segundos, limita ao teto e às últimas 30, e ignora valores inválidos", () => {
    let d: Duracoes = {};
    d = registrarDuracao(d, "acordes", 7400); expect(d.acordes).toEqual([7.4]);
    d = registrarDuracao(d, "acordes", 5 * 60_000); expect(d.acordes!.at(-1)).toBe(TETO_S);
    for (let i = 0; i < 40; i++) d = registrarDuracao(d, "acordes", 5000 + i);
    expect(d.acordes!.length).toBe(AMOSTRAS_MAX);
    expect(registrarDuracao(d, "acordes", NaN)).toBe(d);
    expect(registrarDuracao(d, "acordes", -5)).toBe(d);
  });
  it("minutos para mostrar nunca é zero e arredonda para o mais perto", () => {
    expect(minutosParaMostrar(10)).toBe(1); expect(minutosParaMostrar(600)).toBe(10); expect(minutosParaMostrar(640)).toBe(11); expect(minutosParaMostrar(615)).toBe(10); expect(minutosParaMostrar(0)).toBe(1);
  });
});
