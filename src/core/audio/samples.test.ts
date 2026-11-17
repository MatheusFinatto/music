import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BANKS, fileMidi, fileName, nearest } from "./samples";

describe("amostras do violão", () => {
  it("nome do arquivo e nota vão e voltam", () => {
    for (let m = 38; m <= 74; m++) expect(fileMidi(fileName(m))).toBe(m);
    expect(BANKS.violao).toHaveLength(37);
  });
  it("lê o nome do arquivo como nota", () => {
    expect(fileMidi("E2")).toBe(40);
    expect(fileMidi("Cs4")).toBe(61);
    expect(fileMidi("A4")).toBe(69);
    expect(() => fileMidi("H2")).toThrow();
  });
  it("escolhe a amostra que precisa ser menos esticada", () => {
    expect(nearest([40, 43, 46], 44)).toBe(43);
    expect(nearest([40, 43, 46], 45)).toBe(46);
  });
  it.each(Object.entries(BANKS))("%s cobre do D2 ao E5 sem esticar mais de 2 semitons", (_, names) => {
    const midis = names.map(fileMidi);
    for (let m = 38; m <= 76; m++) expect(Math.abs(nearest(midis, m) - m), `nota ${m}`).toBeLessThanOrEqual(2);
  });
  it.each(Object.entries(BANKS))("todo arquivo de %s existe em public/sons", (inst, names) => {
    for (const n of names) expect(existsSync(`public/sons/${inst}/${n}.mp3`), n).toBe(true);
  });
});
