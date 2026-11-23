import { describe, expect, it } from "vitest";
import { ALCANCE_ZERO, atualizar, centsDe, extensao, medirAlcance, SEGURANDO_ZERO, SEGURAR_MS } from "./voz";

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
