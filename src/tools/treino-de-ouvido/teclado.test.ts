import { describe, expect, it } from "vitest";
import { faixaDoTeclado } from "./Teclado";

describe("faixa do teclado", () => {
  it("janela padrão C3–B4 mostra duas oitavas, sem uma a mais embaixo", () => {
    expect(faixaDoTeclado([48, 71])).toEqual([48, 71]);
  });

  it("pergunta que começa em Dó começa no próprio Dó", () => {
    expect(faixaDoTeclado([60, 67])).toEqual([60, 83]);
  });

  it("sempre cobre as notas da pergunta, com duas oitavas no mínimo", () => {
    for (let a = 36; a <= 84; a++) {
      for (const d of [0, 1, 7, 12, 19, 24, 30]) {
        const [lo, hi] = faixaDoTeclado([a, a + d]);
        expect(lo).toBeLessThanOrEqual(a);
        expect(hi).toBeGreaterThanOrEqual(a + d);
        expect(lo % 12).toBe(0);
        expect(hi - lo + 1).toBeGreaterThanOrEqual(24);
        expect((hi - lo + 1) % 12).toBe(0);
      }
    }
  });
});
