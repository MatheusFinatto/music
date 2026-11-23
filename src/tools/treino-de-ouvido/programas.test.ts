import { describe, expect, it } from "vitest";
import { EXERCICIOS } from "./engine";
import {
  AMOSTRAS_MAX, estimarSegundos, MEDIANAS_INICIAIS, mediana, medianaDe, MINUTOS, minutosParaMostrar, PISO_S, planejar, PROGRAMAS, registrarDuracao, TETO_S, type Duracoes, type Ex,
} from "./programas";

const VOZ = ["igualar", "longa", "sequencia", "tonica", "intervalo", "alcance"];

describe("programas por tempo", () => {
  it("cada programa soma exatamente o seu tempo", () => {
    for (const secao of ["ouvido", "voz"] as const) for (const m of MINUTOS) {
      expect(PROGRAMAS[secao][m].reduce((s, x) => s + x.segundos, 0), `${secao} ${m}`).toBe(m * 60);
    }
  });
  it("usa só exercícios da própria seção, sem repetir dentro do programa", () => {
    for (const m of MINUTOS) {
      for (const x of PROGRAMAS.ouvido[m]) expect(EXERCICIOS).toContain(x.exercicio);
      for (const x of PROGRAMAS.voz[m]) expect(VOZ).toContain(x.exercicio);
      for (const secao of ["ouvido", "voz"] as const) { const ids = PROGRAMAS[secao][m].map((x) => x.exercicio); expect(new Set(ids).size).toBe(ids.length); }
    }
  });
  it("todo exercício tem uma duração inicial", () => {
    for (const secao of ["ouvido", "voz"] as const) for (const m of MINUTOS) for (const x of PROGRAMAS[secao][m]) expect(MEDIANAS_INICIAIS[x.exercicio]).toBeGreaterThan(0);
  });
});

describe("planejar", () => {
  it("os programas crescem de 5 a 30 min e a estimativa fica perto do tempo pedido", () => {
    for (const secao of ["ouvido", "voz"] as const) {
      let anterior = 0;
      for (const m of MINUTOS) {
        const est = estimarSegundos(planejar(secao, m, {}), {});
        expect(est, `${secao} ${m}`).toBeGreaterThan(anterior);
        expect(Math.abs(est - m * 60) / (m * 60), `${secao} ${m}`).toBeLessThan(0.2);
        anterior = est;
      }
    }
  });
  it("tem ao menos duas perguntas por bloco, e o alcance é uma medição só", () => {
    for (const secao of ["ouvido", "voz"] as const) for (const m of MINUTOS) for (const x of planejar(secao, m, {})) expect(x.perguntas).toBe(x.exercicio === "alcance" ? 1 : Math.max(2, x.perguntas));
  });
  it("quem é lento recebe menos perguntas, e quem é rápido, mais", () => {
    const lento: Duracoes = { intervalos: [30, 30, 30, 30, 30], acordes: [30, 30, 30, 30, 30] };
    const rapido: Duracoes = { intervalos: [4, 4, 4, 4, 4], acordes: [4, 4, 4, 4, 4] };
    const n = (d: Duracoes) => planejar("ouvido", 5, d).map((x) => x.perguntas);
    expect(n(lento)[0]).toBeLessThan(n({})[0]!);
    expect(n(rapido)[0]).toBeGreaterThan(n({})[0]!);
  });
  it("a estimativa acompanha o ritmo da pessoa (programa de 10 min fica perto de 10 mesmo para quem é lento)", () => {
    const lento: Duracoes = Object.fromEntries((Object.keys(MEDIANAS_INICIAIS) as Ex[]).map((e) => [e, [40, 40, 40, 40, 40]]));
    const est = estimarSegundos(planejar("ouvido", 10, lento), lento);
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
  it("registrar guarda em segundos, limita ao teto e às últimas 30, e ignora o alcance e valores inválidos", () => {
    let d: Duracoes = {};
    d = registrarDuracao(d, "acordes", 7400); expect(d.acordes).toEqual([7.4]);
    d = registrarDuracao(d, "acordes", 5 * 60_000); expect(d.acordes!.at(-1)).toBe(TETO_S);
    for (let i = 0; i < 40; i++) d = registrarDuracao(d, "acordes", 5000 + i);
    expect(d.acordes!.length).toBe(AMOSTRAS_MAX);
    expect(registrarDuracao(d, "alcance", 9000)).toBe(d);
    expect(registrarDuracao(d, "acordes", NaN)).toBe(d);
    expect(registrarDuracao(d, "acordes", -5)).toBe(d);
  });
  it("minutos para mostrar nunca é zero e arredonda para o mais perto", () => {
    expect(minutosParaMostrar(10)).toBe(1); expect(minutosParaMostrar(600)).toBe(10); expect(minutosParaMostrar(640)).toBe(11); expect(minutosParaMostrar(615)).toBe(10); expect(minutosParaMostrar(0)).toBe(1);
  });
});
