"use client";
import { useSyncExternalStore } from "react";
import { createStore } from "@/core/storage";
import { EMPTY, toDay, type Day, type Progress } from "./session/schedule";

export const progressStore = createStore<Progress>("solos", EMPTY);

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
