import { describe, expect, it } from "vitest";
import { ACORDES } from "./engine";
import { ABERTAS, acordeNoBraco, formaDoArpejo, melhorPosicao, posicoesDe } from "./violao";

describe("posições no violão", () => {
  it("o Mi da 1ª corda solta é E4 (64) e o mesmo Mi também está na 2ª corda, casa 5", () => {
    expect(posicoesDe(64).map((p) => `${p.corda}:${p.casa}`)).toEqual(["0:0", "1:5", "2:9"]);
    expect(melhorPosicao(64)).toMatchObject({ corda: 0, casa: 0 });
  });
  it("uma nota abaixo da 6ª corda solta não existe", () => { expect(melhorPosicao(39)).toBeNull(); });
});

describe("acorde no violão: uma nota por corda", () => {
  it("C maior (C3 E3 G3) é a forma x 3 2 0: A casa 3, D casa 2, G solta", () => {
    const f = acordeNoBraco([48, 52, 55])!;
    expect(f.map((p) => `${p.corda}:${p.casa}`)).toEqual(["4:3", "3:2", "2:0"]);
  });
  it("nunca repete corda, mantém as notas na ordem das cordas e cabe na mão, para todos os tipos e todas as raízes", () => {
    for (const tipo of ACORDES) for (let raiz = 48; raiz <= 64; raiz++) {
      const f = acordeNoBraco(tipo.semitons.map((s) => raiz + s));
      expect(f, `${tipo.id} em ${raiz}`).not.toBeNull();
      expect(new Set(f!.map((p) => p.corda)).size).toBe(f!.length);
      f!.forEach((p, i) => { expect(ABERTAS[p.corda]! + p.casa).toBe(p.midi); if (i) expect(p.corda).toBeLessThan(f![i - 1]!.corda); });
      // as notas são as do acorde, na mesma oitava ou numa oitava abaixo/acima
      expect(f!.map((p) => p.midi % 12).sort((a, b) => a - b)).toEqual(tipo.semitons.map((s) => (raiz + s) % 12).sort((a, b) => a - b));
      const apertadas = f!.filter((p) => p.casa > 0).map((p) => p.casa);
      if (apertadas.length) expect(Math.max(...apertadas) - Math.min(...apertadas)).toBeLessThanOrEqual(5);
    }
  });
});

describe("arpejo no violão: várias notas por corda", () => {
  it("o arpejo de Dó maior tem as três notas nas cordas, algumas cordas com duas, numa janela de 5 casas", () => {
    const f = formaDoArpejo([60, 64, 67, 64, 60])!;
    expect(f.ate - f.de).toBe(4);
    expect(new Set(f.posicoes.map((p) => p.midi % 12))).toEqual(new Set([0, 4, 7]));
    const porCorda = new Map<number, number>();
    f.posicoes.forEach((p) => porCorda.set(p.corda, (porCorda.get(p.corda) ?? 0) + 1));
    expect(Math.max(...porCorda.values())).toBeGreaterThanOrEqual(2); // mais de uma nota por corda
    expect(f.posicoes.some((p) => p.raiz && p.midi % 12 === 0)).toBe(true);
  });
  it("todo padrão de voz em qualquer tônica tem forma", () => {
    for (let t = 55; t <= 66; t++) for (const semis of [[0, 4, 7, 4, 0], [0, 3, 7, 3, 0], [0, 2, 4, 5, 7, 5, 4, 2, 0], [0, 2, 4, 5, 7, 9, 11, 12]]) {
      expect(formaDoArpejo(semis.map((s) => t + s)), `${t} ${semis}`).not.toBeNull();
    }
  });
});
