"use client";
import { useSyncExternalStore } from "react";
import { createStore } from "@/core/storage";
import { EMPTY, toDay, type Day, type Progress } from "./session/schedule";

export const progressStore = createStore<Progress>("solos", EMPTY);

export const useProgress = (): Progress => useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.getInitial);

const noop = () => () => {};
/** O dia de hoje no navegador; vazio enquanto a página ainda é a do servidor. */
export const useToday = (): Day => useSyncExternalStore(noop, () => toDay(new Date()), () => "");
