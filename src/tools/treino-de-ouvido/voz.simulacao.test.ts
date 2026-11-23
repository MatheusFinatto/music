import { describe, expect, it } from "vitest";
import { CHUNK_SAMPLES, PitchPipeline, PitchSmoother } from "@/core/pitch";
import { atualizar, SEGURANDO_ZERO, SEGURAR_MS } from "./voz";

// Vozes simuladas passadas pela mesma cadeia do app (detecção do afinador, suavização, regra de segurar a nota). Não é uma voz de
// verdade (sem formantes nem respiração), mas pega o que mais preocupa: voz que balança mais que a margem e erro de oitava.
const RATE = 44100;
type Voz = { vibCents?: number; jitterCents?: number; vies?: number; pesos?: number[]; ruido?: number };
function voz(hz: number, seg: number, o: Voz, seed = 7) {
  const n = Math.floor(seg * RATE);
  let s = seed;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const pesos = o.pesos ?? [1, 0.6, 0.4, 0.3, 0.2, 0.1];
  const soma = pesos.reduce((a, b) => a + b, 0);
  const out = new Float32Array(n);
  let fase = 0, deriva = 0;
  for (let i = 0; i < n; i++) {
    if (i % 441 === 0) deriva = deriva * 0.97 + (rnd() - 0.5) * 2 * (o.jitterCents ?? 0) * 0.35;
    const cents = (o.vies ?? 0) + deriva + (o.vibCents ?? 0) * Math.sin(2 * Math.PI * 5.5 * (i / RATE));
    fase += (2 * Math.PI * hz * 2 ** (cents / 1200)) / RATE;
    let v = 0;
    pesos.forEach((w, k) => { v += w * Math.sin(fase * (k + 1)); });
    out[i] = (0.3 * v) / soma + (o.ruido ?? 0) * (rnd() - 0.5);
  }
  return out;
}
/** Em que instante (ms) a nota foi aceita pela regra de segurar, ou null. */
function aceita(sinal: Float32Array, alvo: number, tol: number) {
  const pipe = new PitchPipeline(RATE), suav = new PitchSmoother();
  let st = SEGURANDO_ZERO;
  for (let ini = 0; ini + CHUNK_SAMPLES <= sinal.length; ini += CHUNK_SAMPLES) {
    const t = ((ini + CHUNK_SAMPLES) / RATE) * 1000;
    const midi = suav.push(pipe.process(sinal.slice(ini, ini + CHUNK_SAMPLES), CHUNK_SAMPLES).midi ?? null) ?? null;
    const p = atualizar(st, midi, t, alvo, tol, true, SEGURAR_MS);
    st = p.estado;
    if (p.ok) return t;
  }
  return null;
}
const hz = (nota: number) => 440 * 2 ** ((nota - 69) / 12);

describe("vozes simuladas na cadeia do app", () => {
  const vozes: [string, Voz][] = [
    ["firme", {}],
    ["vibrato de ±25 cents", { vibCents: 25 }],
    ["vibrato largo de ±40 cents (cantor)", { vibCents: 40 }],
    ["oscilação de iniciante, ±30 cents", { jitterCents: 30 }],
    ["segundo harmônico mais forte que o primeiro (risco de oitava)", { pesos: [0.6, 1, 0.5, 0.3] }],
    ["ruído de sala", { ruido: 0.15 }],
  ];
  for (const [nome, o] of vozes) {
    it(`firma a nota na margem de 30 cents: ${nome}`, () => {
      for (const nota of [45, 60, 76]) { // grave, média e aguda
        const t = aceita(voz(hz(nota), 3.2, o), nota, 30);
        expect(t, `${nome}, nota ${nota}`).not.toBeNull();
        expect(t!).toBeLessThan(2500);
      }
    }, 20000);
  }
  it("não aceita quem está fora da margem: 28 cents acima numa margem de 20", () => {
    expect(aceita(voz(hz(60), 3.2, { vies: 28, jitterCents: 10 }), 60, 20)).toBeNull();
  }, 20000);
  it("não aceita outra nota: um tom acima do alvo", () => {
    expect(aceita(voz(hz(62), 3.2, {}), 60, 30)).toBeNull();
  }, 20000);
});
