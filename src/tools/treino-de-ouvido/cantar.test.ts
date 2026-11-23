import { describe, expect, it } from "vitest";
import { CHUNK_SAMPLES, PitchPipeline, PitchSmoother } from "@/core/pitch";
import { acertoDaNota, dobrar, duracaoDe, janelas, LATENCIA_S, resumir, tonicaParaCaber, type Amostra, type NotaMusica } from "./cantar";

const n = (st: number | null, dur = 1, sil = ""): NotaMusica => ({ st, dur, sil });
const BRILHA: NotaMusica[] = [n(0), n(0), n(7), n(7), n(9), n(9), n(7, 2)];

/** Leituras de uma voz que canta `midi` o tempo todo, a cada 20 ms, já carimbadas com o atraso do microfone. */
const canta = (de: number, ate: number, midi: number | null, passo = 0.02): Amostra[] => {
  const out: Amostra[] = [];
  for (let t = de; t < ate; t += passo) out.push({ t: t + LATENCIA_S, midi });
  return out;
};

describe("janelas no tempo", () => {
  it("acumula as durações no andamento (60 bpm = 1 s por tempo) e a pausa ocupa tempo", () => {
    const js = janelas([n(0), n(null, 1), n(4, 2)], 60, 60);
    expect(js.map((j) => [j.ini, j.fim, j.midi])).toEqual([[0, 1, 60], [1, 2, null], [2, 4, 64]]);
    expect(duracaoDe(js)).toBe(4);
  });
  it("um andamento mais rápido encurta tudo na mesma proporção", () => {
    expect(janelas([n(0, 2)], 120, 60)[0]!.fim).toBe(1);
  });
});

describe("tom que cabe", () => {
  it("põe a melodia em volta do Dó central, para qualquer tônica, dentro do piano", () => {
    for (let classe = 0; classe < 12; classe++) {
      const t = tonicaParaCaber(classe, BRILHA);
      expect(t % 12).toBe(classe);
      expect(t + 0).toBeGreaterThanOrEqual(45);
      expect(t + 9).toBeLessThanOrEqual(84);
      expect(Math.abs(t + 4.5 - 60)).toBeLessThanOrEqual(6.5);
    }
  });
  it("dobra a voz para a oitava mais perto da pista", () => {
    expect(dobrar(48, 60)).toBe(60);
    expect(dobrar(74, 60)).toBe(62);
    expect(dobrar(61.4, 60)).toBeCloseTo(61.4);
  });
});

describe("acerto por nota", () => {
  const js = janelas(BRILHA, 60, 60); // 1 s por tempo: Dó Dó Sol Sol Lá Lá Sol(2)
  it("quem canta todas as notas na altura passa todas, inclusive as repetidas (sem detector de início de nota)", () => {
    const amostras = js.flatMap((j) => canta(j.ini, j.fim, j.midi));
    const r = js.map((j) => acertoDaNota(amostras, j, 30, true));
    expect(r.every((a) => a.ok)).toBe(true);
    expect(resumir(js, r)).toEqual({ acertadas: 7, total: 7, ok: true });
  });
  it("entrar atrasado, dentro da folga do começo, ainda vale", () => {
    const amostras = js.flatMap((j) => [...canta(j.ini, j.ini + 0.25, null), ...canta(j.ini + 0.25, j.fim, j.midi)]);
    expect(js.every((j) => acertoDaNota(amostras, j, 30, true).ok)).toBe(true);
  });
  it("cantar a nota errada não vale, e o silêncio também não", () => {
    const errada = js.flatMap((j) => canta(j.ini, j.fim, (j.midi ?? 0) + 2));
    expect(js.some((j) => acertoDaNota(errada, j, 30, true).ok)).toBe(false);
    expect(acertoDaNota([], js[0]!, 30, true).ok).toBe(false);
  });
  it("uma oitava abaixo vale com qualquer oitava, e não vale sem ela", () => {
    const grave = js.flatMap((j) => canta(j.ini, j.fim, (j.midi ?? 0) - 12));
    expect(acertoDaNota(grave, js[2]!, 30, true).ok).toBe(true);
    expect(acertoDaNota(grave, js[2]!, 30, false).ok).toBe(false);
  });
  it("quase metade da janela na altura (depois da folga do começo) é o limite; menos que isso não passa", () => {
    const j = js[6]!; // Sol de 2 s
    const metade = [...canta(j.ini, j.ini + 1.1, j.midi), ...canta(j.ini + 1.1, j.fim, (j.midi ?? 0) + 3)]; // vale 0,75 s de 1,65 s (depois da folga)
    const pouco = [...canta(j.ini, j.ini + 0.9, j.midi), ...canta(j.ini + 0.9, j.fim, (j.midi ?? 0) + 3)]; // 0,55 s de 1,65 s
    expect(acertoDaNota(metade, j, 30, true).ok).toBe(true);
    expect(acertoDaNota(pouco, j, 30, true).ok).toBe(false);
  });
  it("pausa não conta como nota", () => {
    const comPausa = janelas([n(0), n(null, 1), n(4)], 60, 60);
    const amostras = [...canta(0, 1, 60), ...canta(2, 3, 64)];
    const r = comPausa.map((j) => acertoDaNota(amostras, j, 30, true));
    expect(resumir(comPausa, r)).toEqual({ acertadas: 2, total: 2, ok: true });
  });
  it("o trecho passa com 80% das notas", () => {
    const amostras = js.flatMap((j, i) => (i === 3 ? [] : canta(j.ini, j.fim, j.midi))); // falha uma de 7
    const r = resumir(js, js.map((j) => acertoDaNota(amostras, j, 30, true)));
    expect(r.acertadas).toBe(6);
    expect(r.ok).toBe(true);
    const duas = js.flatMap((j, i) => (i === 3 || i === 4 ? [] : canta(j.ini, j.fim, j.midi)));
    expect(resumir(js, js.map((j) => acertoDaNota(duas, j, 30, true))).ok).toBe(false);
  });
});

// A mesma cadeia do app: voz simulada -> detecção -> suavização -> acerto por janela.
describe("voz simulada cantando a melodia, na cadeia do app", () => {
  const RATE = 44100;
  const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
  function melodia(js: ReturnType<typeof janelas>, vib: number): Float32Array {
    const out = new Float32Array(Math.ceil((duracaoDe(js) + 0.6) * RATE));
    let fase = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const j = js.find((x) => t >= x.ini && t < x.fim);
      if (!j || j.midi === null) continue;
      const cents = vib * Math.sin(2 * Math.PI * 5.5 * t);
      fase += (2 * Math.PI * hz(j.midi) * 2 ** (cents / 1200)) / RATE;
      // pequena queda de volume no começo de cada nota, como numa sílaba
      const env = Math.min(1, (t - j.ini) / 0.05) * Math.min(1, (j.fim - t) / 0.03);
      out[i] = 0.3 * env * (Math.sin(fase) + 0.6 * Math.sin(2 * fase) + 0.4 * Math.sin(3 * fase)) / 2;
    }
    return out;
  }
  function amostrar(sinal: Float32Array): Amostra[] {
    const pipe = new PitchPipeline(RATE), suav = new PitchSmoother();
    const out: Amostra[] = [];
    for (let ini = 0; ini + CHUNK_SAMPLES <= sinal.length; ini += CHUNK_SAMPLES) {
      const midi = suav.push(pipe.process(sinal.slice(ini, ini + CHUNK_SAMPLES), CHUNK_SAMPLES).midi ?? null) ?? null;
      out.push({ t: (ini + CHUNK_SAMPLES) / RATE, midi });
    }
    return out;
  }
  for (const [nome, vib] of [["firme", 0], ["vibrato de ±30 cents", 30]] as const) {
    it(`passa Brilha, brilha com a voz ${nome}, sem perder as notas repetidas`, () => {
      const js = janelas(BRILHA, 90, 60);
      const amostras = amostrar(melodia(js, vib));
      const r = js.map((j) => acertoDaNota(amostras, j, 30, true));
      expect(resumir(js, r), r.map((a) => a.fracao.toFixed(2)).join(" ")).toMatchObject({ acertadas: 7, total: 7 });
    }, 30000);
  }
});

describe("tom para a faixa da pessoa", () => {
  it("escolhe a oitava em que a melodia cabe na faixa de um barítono e na de uma soprano", () => {
    const sts = BRILHA.map((n) => n.st).filter((x): x is number => x !== null);
    const lo = Math.min(...sts), hi = Math.max(...sts);
    for (let classe = 0; classe < 12; classe++) {
      const bar = tonicaParaCaber(classe, BRILHA, { min: 45, max: 65 });
      expect(bar + lo).toBeGreaterThanOrEqual(45); expect(bar + hi).toBeLessThanOrEqual(65);
      const sop = tonicaParaCaber(classe, BRILHA, { min: 60, max: 81 });
      expect(sop + lo).toBeGreaterThanOrEqual(60); expect(sop + hi).toBeLessThanOrEqual(81);
    }
  });
});
