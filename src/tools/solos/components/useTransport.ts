"use client";
// Liga o transporte (relógio do áudio) ao React: o tempo atual chega na tela no instante em que soa.
import { useSyncExternalStore } from "react";
import { atAudioTime, transport, type BeatInfo } from "@/core/audio";

let current: BeatInfo | null = null;
let running = false;
const subs = new Set<() => void>();
const notify = () => subs.forEach((f) => f());
let pending: (() => void)[] = [];

transport.on("start", () => { running = true; current = null; notify(); });
transport.on("stop", () => { pending.forEach((c) => c()); pending = []; running = false; current = null; notify(); });
transport.on("beat", (info) => {
  pending.push(atAudioTime(info.time, () => { if (running) { current = info; notify(); } }));
  if (pending.length > 64) pending = pending.slice(-32);
});

const subscribe = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };

/** O tempo que está soando agora, ou null com a base parada. Negativo durante a contagem. */
export const useBeat = (): BeatInfo | null => useSyncExternalStore(subscribe, () => current, () => null);
export const useRunning = (): boolean => useSyncExternalStore(subscribe, () => running, () => false);
