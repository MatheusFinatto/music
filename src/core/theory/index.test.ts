import { describe, expect, it } from "vitest";
import { chordsOf, degreeIn, hz, makeChord, midiAt, minorPentatonic, noteName, pentatonicShape, positionsOf } from "./index";

const frets = (key: number, shape: number) => {
  const byString: number[][] = [[], [], [], [], [], []];
  pentatonicShape(key, shape).forEach((p) => byString[p.string]!.push(p.fret));
  return byString;
};

describe("nomes e frequências", () => {
  it("usa o formato C4 e bemol nos tons com bemol", () => {
    expect(noteName(60)).toBe("C4");
    expect(noteName(70)).toBe("A#4");
    expect(noteName(70, 5)).toBe("Bb4");
  });
  it("A4 = 440 Hz e a oitava dobra", () => {
    expect(hz(69)).toBeCloseTo(440);
    expect(hz(81)).toBeCloseTo(880);
  });
});

describe("campo harmônico", () => {
  it("monta Am F C G em Dó", () => {
    expect(chordsOf([5, 3, 0, 4]).map((c) => c.name)).toEqual(["Am", "F", "C", "G"]);
  });
  it("transpõe com o nome certo", () => {
    expect(chordsOf([5, 3, 0, 4], 5).map((c) => c.name)).toEqual(["Dm", "Bb", "F", "C"]);
  });
  it("diz a função da nota no acorde", () => {
    const f = makeChord(3);
    expect(degreeIn(5, f)).toBe("T");
    expect(degreeIn(9, f)).toBe("3");
    expect(degreeIn(0, f)).toBe("5");
    expect(degreeIn(7, f)).toBeNull();
  });
});

describe("pentatônica no braço", () => {
  it("Lá menor pentatônica", () => {
    expect(minorPentatonic(0)).toEqual([9, 0, 2, 4, 7]);
  });
  // Ordem: 1ª corda (Mi agudo) até a 6ª (Mi grave).
  it("desenho 1 em Lá menor é a caixa da casa 5", () => {
    expect(frets(0, 1)).toEqual([[5, 8], [5, 8], [5, 7], [5, 7], [5, 7], [5, 8]]);
  });
  it("desenhos 2 a 5 em Lá menor", () => {
    expect(frets(0, 2)).toEqual([[8, 10], [8, 10], [7, 9], [7, 10], [7, 10], [8, 10]]);
    expect(frets(0, 3)).toEqual([[10, 12], [10, 13], [9, 12], [10, 12], [10, 12], [10, 12]]);
    expect(frets(0, 4)).toEqual([[12, 15], [13, 15], [12, 14], [12, 14], [12, 15], [12, 15]]);
    expect(frets(0, 5)).toEqual([[3, 5], [3, 5], [2, 5], [2, 5], [3, 5], [3, 5]]);
  });
  it("todo desenho só tem notas da escala, em qualquer tom", () => {
    for (let key = 0; key < 12; key++)
      for (let shape = 1; shape <= 5; shape++) {
        const scale = new Set(minorPentatonic(key));
        const pos = pentatonicShape(key, shape);
        expect(pos).toHaveLength(12);
        pos.forEach((p) => expect(scale.has(midiAt(p) % 12)).toBe(true));
      }
  });
  it("acha todas as posições de uma nota", () => {
    expect(positionsOf([9], 0, 5)).toEqual([{ string: 0, fret: 5 }, { string: 2, fret: 2 }, { string: 4, fret: 0 }, { string: 5, fret: 5 }]);
  });
});

describe("makeChord", () => {
  it("recusa grau fora de 0..6", () => {
    expect(() => makeChord(7)).toThrow(RangeError);
    expect(() => makeChord(-1)).toThrow(RangeError);
    expect(() => makeChord(1.5)).toThrow(RangeError);
  });
});
