"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { transport } from "@/core/audio";
import { chordsOf } from "@/core/theory";
import type { Base } from "../curriculum/types";
import { useBeat, useRunning } from "./useTransport";

export const backingOf = (base: Base, bpm = base.bpm) => ({ chords: chordsOf(base.prog, base.key), bpm, style: base.style });

/** Número da contagem (1 a 4) enquanto a base conta antes de entrar; senão null. */
export function useCountIn(): number | null {
  const running = useRunning();
  const beat = useBeat();
  if (!running) return null;
  if (!beat) return 1;
  return beat.beat < 0 ? beat.beatInBar + 1 : null;
}

const isTyping = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(el.tagName) || el.getAttribute("role") === "button");

/** Tocar/parar, andamento e os acordes da base, com o acorde que está soando em destaque. */
export function BackingBar({ base, countIn = 1 }: { base: Base; countIn?: number }) {
  const t = useTranslations("solos.backing");
  const [bpm, setBpm] = useState(base.bpm);
  const running = useRunning();
  const beat = useBeat();
  const chords = chordsOf(base.prog, base.key);

  const toggle = () => {
    if (transport.running) transport.stop();
    else if (!transport.start(backingOf(base, bpm), { countIn })) window.alert(t("noAudio"));
  };
  const nudge = (d: number) => {
    const next = Math.min(160, Math.max(40, bpm + d));
    setBpm(next);
    if (transport.running) transport.setTempo(next);
  };

  // Barra de espaço toca e para, para quem está com a guitarra na mão.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isTyping(e.target)) return;
      e.preventDefault();
      if (transport.running) transport.stop();
      else transport.start(backingOf(base, bpm), { countIn });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [base, bpm, countIn]);

  // Mantém a tela acesa enquanto a base toca (celular apoiado no amplificador).
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    navigator.wakeLock.request("screen").then((l) => { if (cancelled) void l.release(); else lock = l; }).catch(() => {});
    return () => { cancelled = true; void lock?.release(); };
  }, [running]);

  return (
    <div className="backing">
      <button type="button" className="btn primary play" onClick={toggle} aria-pressed={running} aria-keyshortcuts="Space">
        {running ? t("stop") : t("play")}
      </button>
      <div className="tempo">
        <button type="button" className="btn square" onClick={() => nudge(-4)} aria-label={t("slower")}>−</button>
        <span className="num">{bpm} <small>bpm</small></span>
        <button type="button" className="btn square" onClick={() => nudge(4)} aria-label={t("faster")}>+</button>
      </div>
      <ol className="chords" aria-label={t("chords")}>
        {chords.map((c, i) => {
          const on = !!beat && beat.beat >= 0 && beat.barInCycle === i;
          return (
            <li key={i} className={on ? "on" : undefined} aria-current={on ? "true" : undefined}>
              <b>{c.name}</b>
              <span className="beats" aria-hidden="true">
                {[0, 1, 2, 3].map((b) => <i key={b} className={on && beat.beatInBar === b ? "on" : undefined} />)}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="keys">{t("space")}</p>
    </div>
  );
}
