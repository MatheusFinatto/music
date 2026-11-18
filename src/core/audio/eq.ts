// Equalizador da base (bateria, baixo e acordes), escolhido pela pessoa e guardado no navegador (musica:base-eq).
// Três faixas em dB (graves, médios e agudos) e o volume da base (0 a 1). A voz solista não passa por ele.
import { createStore } from "@/core/storage";

export type BaseEq = { version: 1; low: number; mid: number; high: number; volume: number };

export const EQ_MIN = -12, EQ_MAX = 6;
export const FLAT_EQ: BaseEq = { version: 1, low: 0, mid: 0, high: 0, volume: 1 };

/** Volume da base: o salvo antes de existir o campo vale cheio. */
const vol = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.min(1, Math.max(0, Math.round(n * 100) / 100)) : 1);
const db = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.min(EQ_MAX, Math.max(EQ_MIN, Math.round(n))) : 0);

/** O que veio do navegador, limpo: faixas inteiras dentro dos limites, volume entre 0 e 1. */
export function cleanEq(saved: unknown): BaseEq | null {
  const s = saved as Partial<BaseEq> | null;
  if (!s || typeof s !== "object") return null;
  return { version: 1, low: db(s.low), mid: db(s.mid), high: db(s.high), volume: vol(s.volume) };
}

export const eqStore = createStore<BaseEq>("base-eq", FLAT_EQ, cleanEq);

/** Graves (prateleira em 200 Hz), médios (sino em 1 kHz) e agudos (prateleira em 4 kHz), em série, e o volume no fim. */
export function buildEq(ctx: BaseAudioContext, out: AudioNode): { input: AudioNode; apply: (eq: BaseEq) => void } {
  const low = ctx.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 200;
  const mid = ctx.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1000;
  mid.Q.value = 0.8;
  const high = ctx.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 4000;
  const level = ctx.createGain();
  low.connect(mid).connect(high).connect(level).connect(out);
  const apply = (eq: BaseEq) => {
    const now = ctx.currentTime;
    low.gain.setTargetAtTime(eq.low, now, 0.03);
    mid.gain.setTargetAtTime(eq.mid, now, 0.03);
    high.gain.setTargetAtTime(eq.high, now, 0.03);
    level.gain.setTargetAtTime(eq.volume, now, 0.03);
  };
  return { input: low, apply };
}
