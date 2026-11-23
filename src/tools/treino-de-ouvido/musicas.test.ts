import { describe, expect, it } from "vitest";
import { duracaoDe, janelas, tonicaParaCaber } from "./cantar";
import { MUSICAS } from "./musicas";

describe("as músicas do cantar", () => {
  it("têm ids únicos, nome, andamento razoável e ao menos um trecho", () => {
    expect(new Set(MUSICAS.map((m) => m.id)).size).toBe(MUSICAS.length);
    for (const m of MUSICAS) {
      expect(m.nome.length, m.id).toBeGreaterThan(2);
      expect(m.bpm, m.id).toBeGreaterThanOrEqual(50);
      expect(m.bpm, m.id).toBeLessThanOrEqual(140);
      expect(m.trechos.length, m.id).toBeGreaterThan(0);
    }
  });
  it("cada trecho tem de 4 a 16 notas, durações positivas, só semitons inteiros e uma faixa que uma voz comum alcança", () => {
    for (const m of MUSICAS) for (const t of m.trechos) {
      const cantadas = t.notas.filter((n) => n.st !== null);
      expect(cantadas.length, `${m.id} ${t.nome}`).toBeGreaterThanOrEqual(4);
      expect(t.notas.length, `${m.id} ${t.nome}`).toBeLessThanOrEqual(16);
      for (const n of t.notas) {
        expect(n.dur, `${m.id} ${t.nome}`).toBeGreaterThan(0);
        if (n.st !== null) expect(Number.isInteger(n.st), `${m.id} ${t.nome}`).toBe(true);
      }
      const sts = cantadas.map((n) => n.st as number);
      expect(Math.max(...sts) - Math.min(...sts), `${m.id} ${t.nome}: faixa`).toBeLessThanOrEqual(14);
    }
  });
  it("cabem no piano e numa pista, em qualquer tom, e duram o que um trecho dura (de 3 a 40 s no andamento lento)", () => {
    for (const m of MUSICAS) for (const t of m.trechos) {
      for (let classe = 0; classe < 12; classe++) {
        const tom = tonicaParaCaber(classe, t.notas);
        const js = janelas(t.notas, m.bpm * 0.7, tom);
        for (const j of js) if (j.midi !== null) { expect(j.midi, `${m.id} ${classe}`).toBeGreaterThanOrEqual(45); expect(j.midi, `${m.id} ${classe}`).toBeLessThanOrEqual(84); }
        const d = duracaoDe(js);
        expect(d, `${m.id} ${t.nome}`).toBeGreaterThan(3);
        expect(d, `${m.id} ${t.nome}`).toBeLessThan(40);
      }
    }
  });
});
