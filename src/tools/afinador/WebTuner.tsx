"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { MicError } from "@/core/audio";
import { TunerEngine } from "./engine";
import { micState } from "./micState";

// A tela do afinador no navegador. O motor (engine.ts) desenha e escuta; aqui fica o estado do microfone, que o
// botão no topo da página (MicButton) mostra e alterna. O microfone abre sozinho ao entrar na página.
export function WebTuner() {
  const t = useTranslations("afinador");
  const [engine] = useState(() => new TunerEngine());
  const status = useSyncExternalStore(micState.subscribe, micState.get, micState.getServer);
  const [announce, setAnnounce] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Se a pessoa quer afinar: ao voltar de outra aba, o microfone abre de novo sozinho.
  const wantListening = useRef(true);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const detach = engine.attach(canvas, box, (r) => setAnnounce(`${r.name}${r.octave}${r.isInTune ? `, ${t("inTune")}` : ""}`));

    async function listen() {
      micState.set("starting");
      engine.showMessage(t("starting"));
      try {
        await engine.listen(() => { micState.set("gesture"); engine.showMessage(t("tapToStart")); });
        if (!wantListening.current) { engine.stop(); return; }
        engine.showMessage(t("playAString"));
        micState.set("listening");
      } catch (err) {
        if (!wantListening.current) return;
        wantListening.current = false;
        const problem = err instanceof MicError ? err.problem : "failed";
        engine.showMessage(t(`mic.${problem}`));
        micState.set(problem);
      }
    }
    const start = () => { wantListening.current = true; void listen(); };
    const mute = () => { wantListening.current = false; engine.stop(); engine.showMessage(t("muted")); micState.set("idle"); };

    const offToggle = micState.onToggle(() => {
      const s = micState.get();
      if (s === "listening" || s === "starting" || s === "gesture") mute();
      else start();
    });

    // Como o app ao ir para segundo plano: solta o microfone e, ao voltar, pega de novo.
    const onVisibility = () => {
      if (document.visibilityState === "hidden") { if (engine.listening) engine.stop(); }
      else if (wantListening.current && !engine.listening) void listen();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // M liga e desliga o microfone, como o botão no topo.
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "KeyM" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target instanceof Element && e.target.closest("input, select, textarea")) return;
      micState.toggle();
    };
    window.addEventListener("keydown", onKey);

    // Liberou o microfone pelo navegador depois de ter bloqueado: começa sem precisar de outro clique.
    let permission: PermissionStatus | null = null;
    const onPermission = () => { if (permission?.state === "granted" && micState.get() === "denied") start(); };
    navigator.permissions?.query({ name: "microphone" as PermissionName })
      .then((p) => { permission = p; p.addEventListener("change", onPermission); })
      .catch(() => {});

    start();
    return () => {
      wantListening.current = false;
      offToggle();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("keydown", onKey);
      permission?.removeEventListener("change", onPermission);
      detach();
      engine.stop();
      micState.set("starting");
    };
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

  // Desligado ou com erro, a tela inteira liga (ou tenta de novo): é o alvo grande, perto da mensagem.
  const offline = status === "idle" || status === "denied" || status === "failed";
  return (
    <div className="tuner">
      <div ref={boxRef} className={["tuner-screen", offline ? "offline" : ""].join(" ")} onClick={offline ? () => micState.toggle() : undefined}>
        <canvas ref={canvasRef} role="img" aria-label={t("screenLabel")} />
      </div>
      <p className="sr-only" aria-live="polite">{announce}</p>
    </div>
  );
}
