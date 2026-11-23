"use client";
import { useSyncExternalStore } from "react";
import { createStore } from "@/core/storage";

/** O instrumento que fica à mostra para tocar e marcar as notas: teclado ou braço de violão. Vale para o ouvido e para a voz. */
export type Instrumento = "teclado" | "violao";
type Saved = { version: 1; tipo: Instrumento };
const DEFAULTS: Saved = { version: 1, tipo: "teclado" };
const store = createStore<Saved>("treino-de-ouvido-instrumento", DEFAULTS, (saved) => {
  const s = saved as Partial<Saved> | null;
  return s && typeof s === "object" ? { version: 1, tipo: s.tipo === "violao" ? "violao" : "teclado" } : null;
});

export function useInstrumento(): [Instrumento, (tipo: Instrumento) => void] {
  const s = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  return [s.tipo, (tipo) => store.set({ version: 1, tipo })];
}
