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

/** Contagem antes do exemplo (eco e arco). Desligada por padrão: o exemplo começa direto. */
export const countStore = createStore<{ version: 1; beforeExample: boolean }>("solos-contagem", { version: 1, beforeExample: false }, (saved) => {
  const b = (saved as { beforeExample?: unknown } | null)?.beforeExample;
  return typeof b === "boolean" ? { version: 1, beforeExample: b } : null;
});
export const useCountBeforeExample = (): boolean =>
  useSyncExternalStore(countStore.subscribe, () => countStore.get().beforeExample, () => false);
export const setCountBeforeExample = (on: boolean) => countStore.set({ version: 1, beforeExample: on });

/** Dias da semana em que a pessoa estuda (0 = segunda … 6 = domingo). Padrão: segunda a sexta. */
export const DEFAULT_STUDY_DAYS = [0, 1, 2, 3, 4];
export const studyDaysStore = createStore<{ version: 1; days: number[] }>("solos-dias", { version: 1, days: DEFAULT_STUDY_DAYS }, (saved) => {
  const d = (saved as { days?: unknown } | null)?.days;
  if (!Array.isArray(d)) return null;
  return { version: 1, days: [...new Set(d.filter((x): x is number => Number.isInteger(x) && x >= 0 && x <= 6))].sort() };
});
export const useStudyDays = (): number[] =>
  useSyncExternalStore(studyDaysStore.subscribe, () => studyDaysStore.get().days, () => DEFAULT_STUDY_DAYS);
