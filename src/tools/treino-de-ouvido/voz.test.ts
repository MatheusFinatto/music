import { describe, expect, it } from "vitest";
import { PADROES } from "./engine";
import { ALCANCE_ZERO, atualizar, centsDe, extensao, inicioDaRodada, medirAlcance, notasDoPadrao, sortearClasseDeVoz, SEGURANDO_ZERO, SEGURAR_LONGA_MS, SEGURAR_MS, SEGURAR_PASSO_MS } from "./voz";

describe("cents até o alvo", () => {
  it("acima é positivo e abaixo é negativo", () => {
    expect(centsDe(60.2, 60, false)).toBeCloseTo(20, 8);
    expect(centsDe(59.7, 60, false)).toBeCloseTo(-30, 8);
  });
  it("em qualquer oitava, uma oitava acima ou abaixo conta como a mesma nota", () => {
    expect(centsDe(72, 60, true)).toBeCloseTo(0, 8);
    expect(centsDe(48.1, 60, true)).toBeCloseTo(10, 8);
    expect(centsDe(67, 60, true)).toBeCloseTo(-500, 8); // a 5ª acima é a 4ª abaixo, não a mesma nota
    expect(centsDe(72, 60, false)).toBeCloseTo(1200, 8);
  });
});

describe("segurar a nota", () => {
  const rodar = (amostras: [number, number | null][], alvo = 60, tol = 20, oitava = true) => {
    let s = SEGURANDO_ZERO, ultimo = atualizar(s, null, 0, alvo, tol, oitava);
    for (const [t, m] of amostras) { ultimo = atualizar(s, m, t, alvo, tol, oitava); s = ultimo.estado; }
    return ultimo;
  };
  it("acerta depois de ficar dentro da margem pelo tempo pedido", () => {
    const a: [number, number | null][] = [];
    for (let t = 0; t <= SEGURAR_MS + 100; t += 50) a.push([t, 60.05]);
    expect(rodar(a).ok).toBe(true);
  });
  it("não acerta se saiu da margem no meio", () => {
    const a: [number, number | null][] = [];
    for (let t = 0; t <= 600; t += 50) a.push([t, 60]);
    a.push([650, 60.6]); // 60 cents acima
    for (let t = 700; t <= 1300; t += 50) a.push([t, 60]);
    expect(rodar(a).ok).toBe(false);
  });
  it("perdoa uma falha curta de detecção, mas não um silêncio longo", () => {
    const curta: [number, number | null][] = [];
    for (let t = 0; t <= 400; t += 50) curta.push([t, 60]);
    curta.push([450, null], [500, null]);
    for (let t = 550; t <= 1100; t += 50) curta.push([t, 60]);
    expect(rodar(curta).ok).toBe(true);
    const longa: [number, number | null][] = [];
    for (let t = 0; t <= 400; t += 50) longa.push([t, 60]);
    for (let t = 450; t <= 800; t += 50) longa.push([t, null]);
    for (let t = 850; t <= 1500; t += 50) longa.push([t, 60]);
    expect(rodar(longa).ok).toBe(false);
  });
  it("um tom errado nunca acerta, e a média mostra o desvio de quem acertou", () => {
    const errado: [number, number | null][] = [];
    for (let t = 0; t <= 2000; t += 50) errado.push([t, 62]);
    expect(rodar(errado).ok).toBe(false);
    const sharp: [number, number | null][] = [];
    for (let t = 0; t <= 1200; t += 50) sharp.push([t, 60.1]);
    const r = rodar(sharp);
    expect(r.ok).toBe(true);
    expect(r.media).toBeCloseTo(10, 5);
  });
});

describe("alcance", () => {
  it("só conta a nota em que a voz parou; um glissando que passa direto não conta", () => {
    let s = ALCANCE_ZERO;
    for (let t = 0; t <= 600; t += 50) s = medirAlcance(s, 45, t); // parou em A2
    for (let i = 0; i < 24; i++) s = medirAlcance(s, 45 + i * 0.5, 650 + i * 40); // desliza para cima, sem parar
    for (let t = 2000; t <= 2700; t += 50) s = medirAlcance(s, 64.1, t); // parou perto de E4
    expect(s.min).toBe(45);
    expect(s.max).toBe(64);
  });
  it("extensão em oitavas e semitons", () => {
    expect(extensao(19)).toEqual({ oitavas: 1, semitons: 7 });
    expect(extensao(12)).toEqual({ oitavas: 1, semitons: 0 });
    expect(extensao(5)).toEqual({ oitavas: 0, semitons: 5 });
  });
});

describe("nota longa e passos", () => {
  const seg = (alvo: number, ms: number, nota: (t: number) => number | null, qualquer = true) => {
    let s = SEGURANDO_ZERO, ultimo = atualizar(s, null, 0, alvo, 30, qualquer, ms);
    for (let t = 0; t <= ms + 200; t += 50) { ultimo = atualizar(s, nota(t), t, alvo, 30, qualquer, ms); s = ultimo.estado; }
    return ultimo;
  };
  it("a nota longa só acerta depois de 5 s, e a oscilação mede o balanço em cents", () => {
    expect(seg(60, SEGURAR_LONGA_MS, () => 60).ok).toBe(true);
    const curta = atualizar(SEGURANDO_ZERO, 60, 0, 60, 30, true, SEGURAR_LONGA_MS);
    expect(curta.ok).toBe(false);
    const firme = seg(60, 1000, () => 60.1);
    expect(firme.oscilacao).toBeCloseTo(0, 5);
    expect(firme.media).toBeCloseTo(10, 5);
    const balanca = seg(60, 1000, (t) => 60 + (Math.floor(t / 50) % 2 === 0 ? 0.2 : -0.2)); // alterna ±20 cents
    expect(balanca.oscilacao).toBeGreaterThan(15);
    expect(balanca.oscilacao).toBeLessThan(25);
  });
  it("cada passo de arpejo pede menos tempo que a nota longa", () => {
    expect(SEGURAR_PASSO_MS).toBeLessThan(SEGURAR_MS);
    expect(SEGURAR_MS).toBeLessThan(SEGURAR_LONGA_MS);
    expect(seg(64, SEGURAR_PASSO_MS, () => 64).ok).toBe(true);
  });
});

describe("arpejos e escalas", () => {
  it("os padrões começam e, nos que voltam, terminam na nota inicial; arpejo maior é 1-3-5-3-1", () => {
    for (const p of PADROES) expect(p.semitons[0]).toBe(0);
    expect(PADROES.find((p) => p.id === "arpejoMaior")!.semitons).toEqual([0, 4, 7, 4, 0]);
    expect(PADROES.find((p) => p.id === "arpejoMenor")!.semitons).toEqual([0, 3, 7, 3, 0]);
    expect(notasDoPadrao(60, [0, 4, 7])).toEqual([60, 64, 67]);
  });
  it("a nota inicial fica entre G3 e F#4 em qualquer classe, e sobe meio tom por rodada até 6", () => {
    for (let c = 0; c < 12; c++) { const m = inicioDaRodada(c, 0, false); expect(m).toBeGreaterThanOrEqual(55); expect(m).toBeLessThanOrEqual(66); expect(((m % 12) + 12) % 12).toBe(c); }
    expect([0, 1, 2, 6, 7].map((r) => inicioDaRodada(0, r, true) - inicioDaRodada(0, 0, true))).toEqual([0, 1, 2, 6, 0]);
    expect(inicioDaRodada(0, 3, false)).toBe(inicioDaRodada(0, 0, false));
  });
  it("o padrão mais agudo (arpejo com oitava + 6 semitons de subida) cabe no piano", () => {
    for (const p of PADROES) for (let c = 0; c < 12; c++) { const topo = Math.max(...notasDoPadrao(inicioDaRodada(c, 6, true), p.semitons)); expect(topo).toBeLessThanOrEqual(84); }
  });
});

describe("nota inicial aleatória", () => {
  it("sorteia uma classe de altura de 0 a 11, todas possíveis", () => {
    const vistas = new Set<number>();
    for (let k = 0; k < 1200; k++) { const c = sortearClasseDeVoz(); expect(c).toBeGreaterThanOrEqual(0); expect(c).toBeLessThan(12); vistas.add(c); }
    expect(vistas.size).toBe(12);
    expect(sortearClasseDeVoz(() => 0.999)).toBe(11);
    expect(sortearClasseDeVoz(() => 0)).toBe(0);
  });
  it("qualquer classe sorteada dá uma nota inicial entre G3 e F#4", () => {
    for (let c = 0; c < 12; c++) { const m = inicioDaRodada(c, 0, false); expect(m).toBeGreaterThanOrEqual(55); expect(m).toBeLessThanOrEqual(66); }
  });
});
