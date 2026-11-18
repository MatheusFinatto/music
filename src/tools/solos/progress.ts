"use client";
import { useSyncExternalStore } from "react";
import { createStore } from "@/core/storage";
import { EMPTY, cleanProgress, toDay, type Day, type Progress } from "./session/schedule";

export const progressStore = createStore<Progress>("solos", EMPTY, cleanProgress);

export const useProgress = (): Progress => useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.getInitial);

const noop = () => () => {};
/** O dia de hoje no navegador; vazio enquanto a página ainda é a do servidor. */
export const useToday = (): Day => useSyncExternalStore(noop, () => toDay(new Date()), () => "");

/** Tom de prática, pela tônica do tom maior (0 = Lá menor). Vale para todo exercício escrito em Lá menor. */
export const keyStore = createStore<{ version: 1; key: number }>("solos-tom", { version: 1, key: 0 }, (saved) => {
  const k = (saved as { key?: unknown } | null)?.key;
  return typeof k === "number" && Number.isInteger(k) && k >= 0 && k < 12 ? { version: 1, key: k } : null;
});

export const usePracticeKey = (): number => useSyncExternalStore(keyStore.subscribe, () => keyStore.get().key, () => 0);

/** Quantos compassos a pessoa escolheu em cada tomada (id do exercício → compassos). Sem escolha, vale o recomendado. */
type BarsChoice = { version: 1; bars: Record<string, number> };
export const barsStore = createStore<BarsChoice>("solos-compassos", { version: 1, bars: {} }, (saved) => {
  const bars = (saved as { bars?: unknown } | null)?.bars;
  if (!bars || typeof bars !== "object") return null;
  const clean = Object.fromEntries(Object.entries(bars).filter(([, n]) => Number.isInteger(n) && (n as number) > 0)) as Record<string, number>;
  return { version: 1, bars: clean };
});

const noBars: Record<string, number> = {};
export const useSavedBars = (): Record<string, number> =>
  useSyncExternalStore(barsStore.subscribe, () => barsStore.get().bars, () => noBars);

export const saveBars = (id: string, n: number) => barsStore.set((prev) => ({ ...prev, bars: { ...prev.bars, [id]: n } }));
