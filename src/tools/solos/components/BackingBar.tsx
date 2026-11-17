"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { transport } from "@/core/audio";
import { chordsOf } from "@/core/theory";
import type { Base } from "../curriculum/types";
import { SoundPanel } from "./SoundPanel";
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

// A barra de espaço é do transporte, mesmo com um botão em foco (quem usa teclado ativa botões com Enter).
// Só fica de fora onde o espaço tem outro papel: campos de texto, caixas de marcar, links e o braço clicável.
const keepsSpace = (el: EventTarget | null) =>
  el instanceof Element && (el.closest("input, textarea, select, a, summary, [contenteditable=true], [role=button]") !== null);

/**
 * Tocar/parar, andamento e os acordes da base, com o acorde que está soando em destaque.
 * `hideChords` esconde os nomes (o compasso continua marcado): para treinar ouvir a troca.
 */
export function BackingBar({ base, countIn = 1, hideChords = false }: { base: Base; countIn?: number; hideChords?: boolean }) {
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
    const onDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || keepsSpace(e.target)) return;
      e.preventDefault();
      if (e.repeat) return;
      if (transport.running) transport.stop();
      else transport.start(backingOf(base, bpm), { countIn });
    };
    // Botões disparam o clique ao soltar a tecla: sem isto, o espaço também acionaria o botão em foco.
    const onUp = (e: KeyboardEvent) => { if (e.code === "Space" && !keepsSpace(e.target)) e.preventDefault(); };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, [base, bpm, countIn]);

  // Mantém a tela acesa enquanto a base toca (celular apoiado no amplificador).
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = () => {
      navigator.wakeLock.request("screen").then((l) => { if (cancelled) void l.release(); else lock = l; }).catch(() => {});
    };
    // O navegador solta a trava quando a página some; ao voltar, pede de novo.
    const onVisible = () => { if (document.visibilityState === "visible") acquire(); };
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); void lock?.release(); };
  }, [running]);

  return (
    <div className="backing">
      <button type="button" className="btn primary play" onClick={toggle} aria-pressed={running} aria-keyshortcuts="Space">
        {running ? t("stop") : t("play")}
      </button>
      <div className="tempo">
        <button type="button" className="btn square" onClick={() => nudge(-4)} aria-label={t("slower")}>−</button>
        <span className="num">{bpm} <small>{t("bpm")}</small></span>
        <button type="button" className="btn square" onClick={() => nudge(4)} aria-label={t("faster")}>+</button>
      </div>
      <SoundPanel />
      <ol className="chords" aria-label={t("chords")}>
        {chords.map((c, i) => {
          const on = !!beat && beat.beat >= 0 && beat.barInCycle === i;
          return (
            <li key={i} className={on ? "on" : undefined} aria-current={on ? "true" : undefined}>
              <b>{hideChords ? "?" : c.name}</b>
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
