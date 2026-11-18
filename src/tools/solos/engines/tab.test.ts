import { describe, expect, it } from "vitest";
import { curriculum } from "../curriculum/pt-BR";
import { tabLayout, tabSystems, tabText, tabToken } from "./tab";

const D = { string: 2, fret: 7 }; // 3ª corda, casa 7 (D4)

describe("tablatura em texto", () => {
  it("escreve cada gesto na notação das tabs", () => {
    expect(tabToken({ midi: 62, beat: 0, dur: 1 }, D)).toBe("7");
    expect(tabToken({ midi: 64, from: 62, beat: 0, dur: 1 }, D)).toBe("7b9");
    expect(tabToken({ midi: 62, from: 64, hold: 0.4, beat: 0, dur: 1 }, D)).toBe("9r7");
    expect(tabToken({ midi: 62, from: 60, beat: 0, dur: 1 }, D)).toBe("5/7");
    expect(tabToken({ midi: 62, beat: 0, dur: 1, vibrato: { rate: 5, cents: 40 } }, D)).toBe("7~");
    expect(tabToken({ midi: 62, beat: 1, dur: 1, legato: true }, D, { midi: 60, beat: 0, dur: 1 })).toBe("h7");
    expect(tabToken({ midi: 62, beat: 1, dur: 1, legato: true }, D, { midi: 64, beat: 0, dur: 1 })).toBe("p7");
  });
  it("o espaço segue o tempo, com o acorde em cima e a contagem embaixo", () => {
    const notes = [{ midi: 69, beat: 0, dur: 1 }, { midi: 67, beat: 2, dur: 1 }];
    const frets = [{ string: 0, fret: 5 }, { string: 1, fret: 8 }];
    const text = tabText(tabSystems(notes, frets, 1, ["Am"], { cw: 2, bpl: 1 }));
    expect(text).toBe(
      [
        "  Am                              ",
        "e|5-------------------------------|",
        "B|----------------8---------------|",
        "G|--------------------------------|",
        "D|--------------------------------|",
        "A|--------------------------------|",
        "E|--------------------------------|",
        "  1       2       3       4       ",
      ].join("\n"),
    );
  });
  it("nota rápida no fim do compasso fica nele, na ordem", () => {
    // Fusas no fim do 1º compasso: arredondadas para semicolcheia, a última cairia no 2º compasso.
    const notes = [{ midi: 64, beat: 3.625, dur: 0.125 }, { midi: 62, beat: 3.75, dur: 0.125 }, { midi: 64, beat: 3.875, dur: 0.125 }, { midi: 62, beat: 4, dur: 1 }];
    const frets = [{ string: 2, fret: 9 }, { string: 3, fret: 12 }, { string: 2, fret: 9 }, { string: 2, fret: 7 }];
    const sys = tabSystems(notes, frets, 2, ["Bm"], { cw: 3, bpl: 2 })[0]!;
    const g = sys.rows[2]!.bars.map((b) => b.map((c) => c.ch).join(""));
    expect(g[0]!.match(/9/g)?.length).toBe(2);
    expect(g[1]!.replace(/-/g, "")).toBe("7");
  });
  it("o ligado sai da nota anterior na mesma corda, não da nota anterior de outra corda", () => {
    // Sol solto, Mi na 2ª corda, e o Lá ligado na 3ª: sobe do Sol (hammer-on), mesmo vindo depois de um Mi mais agudo.
    const notes = [{ midi: 55, beat: 0, dur: 1 }, { midi: 64, beat: 1, dur: 1 }, { midi: 57, beat: 2, dur: 1, legato: true }];
    const frets = [{ string: 2, fret: 0 }, { string: 1, fret: 5 }, { string: 2, fret: 2 }];
    const text = tabText(tabSystems(notes, frets, 1, ["Am"], { cw: 2, bpl: 1 }));
    expect(text).toContain("h2");
  });
  it("em tela estreita, um compasso por linha", () => {
    expect(tabLayout(110, 2)).toEqual({ cw: 3, bpl: 2 });
    expect(tabLayout(70, 2)).toEqual({ cw: 2, bpl: 2 });
    expect(tabLayout(40, 2)).toEqual({ cw: 2, bpl: 1 });
  });
  it("nenhuma nota do conteúdo encobre outra na tab, mesmo na mais apertada", () => {
    const echoes = [...curriculum.units.flatMap((u) => u.lessons.flatMap((l) => l.exercises)), ...curriculum.phrases].flatMap((e) => (e.kind === "echo" ? e.phrases : []));
    for (const p of echoes) {
      if (!p.frets) continue;
      const sys = tabSystems(p.notes, p.frets, p.bars, ["X"], { cw: 2, bpl: 1 });
      const seen = new Set(sys.flatMap((s) => s.rows.flatMap((r) => r.bars.flat().map((c) => c.note))));
      p.notes.forEach((_, i) => expect(seen.has(i), `${p.id}: nota ${i + 1} encoberta`).toBe(true));
      // Duas notas coladas na mesma corda viram outro número ("7" e "9" lidos como "79").
      for (const sy of sys) for (const r of sy.rows) for (const bar of r.bars)
        bar.forEach((c, k) => { if (k > 0 && c.note >= 0 && bar[k - 1]!.note >= 0 && bar[k - 1]!.note !== c.note) throw new Error(`${p.id}: notas ${bar[k - 1]!.note + 1} e ${c.note + 1} grudadas`); });
    }
  });
});
