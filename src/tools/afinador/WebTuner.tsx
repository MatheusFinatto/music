"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MicError } from "@/core/audio";
import { TunerEngine } from "./engine";

type Status = "idle" | "starting" | "listening" | "denied" | "unavailable" | "failed";

// A tela do afinador no navegador. O motor (engine.ts) desenha e escuta; aqui ficam os botões e o estado.
export function WebTuner() {
  const t = useTranslations("afinador");
  const [engine] = useState(() => new TunerEngine());
  const [status, setStatus] = useState<Status>("idle");
  const [announce, setAnnounce] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Se a pessoa quer afinar: ao voltar de outra aba, o microfone abre de novo sozinho.
  const wantListening = useRef(false);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    engine.showMessage(t("idleMessage"));
    const detach = engine.attach(canvas, box, (r) => setAnnounce(`${r.name}${r.octave}${r.isInTune ? `, ${t("inTune")}` : ""}`));
    return () => { detach(); engine.stop(); };
  }, [engine, t]);

  async function listen() {
    setStatus("starting");
    try {
      await engine.listen();
      if (!wantListening.current) { engine.stop(); setStatus("idle"); return; }
      engine.showMessage(t("playAString"));
      setStatus("listening");
      // No celular a tela do afinador começa abaixo dos botões: traz ela para a vista.
      boxRef.current?.scrollIntoView({ block: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    } catch (err) {
      wantListening.current = false;
      const problem = err instanceof MicError ? err.problem : "failed";
      engine.showMessage(t(`mic.${problem}`));
      setStatus(problem);
    }
  }

  const start = () => { wantListening.current = true; void listen(); };
  const stop = () => { wantListening.current = false; engine.stop(); engine.showMessage(t("idleMessage")); setStatus("idle"); };

  // Como o app ao ir para segundo plano: solta o microfone e, ao voltar, pega de novo.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (engine.listening) engine.stop();
      } else if (wantListening.current && !engine.listening) {
        void (async () => {
          try { await engine.listen(); engine.showMessage(t("playAString")); }
          catch { wantListening.current = false; engine.showMessage(t("idleMessage")); setStatus("idle"); }
        })();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [engine, t]);

  // Tela acesa enquanto afina, como no app.
  useEffect(() => {
    if (status !== "listening" || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    const acquire = () => {
      navigator.wakeLock.request("screen").then((l) => { if (cancelled) void l.release(); else lock = l; }).catch(() => {});
    };
    const onVisible = () => { if (document.visibilityState === "visible") acquire(); };
    acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", onVisible); void lock?.release(); };
  }, [status]);

  return (
    <div className="tuner">
      <div className="tuner-actions">
        {status === "listening" ? (
          <button type="button" className="go" onClick={stop}>{t("stop")}</button>
        ) : (
          <button type="button" className="go" onClick={start} disabled={status === "starting"}>
            {status === "starting" ? t("starting") : status === "idle" ? t("start") : t("retry")}
          </button>
        )}
        <a className="tuner-alt" href="#app">{t("useApp")}</a>
      </div>
      <div ref={boxRef} className="tuner-screen">
        <canvas ref={canvasRef} role="img" aria-label={t("screenLabel")} />
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
}
