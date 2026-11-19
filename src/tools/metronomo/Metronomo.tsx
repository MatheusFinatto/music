"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { createStore } from "@/core/storage";
import { MAX_BEATS, MAX_BPM, MIN_BPM, TapTempo, clampBpm, type Tick } from "@/core/rhythm";
import { MetronomeEngine, type MetronomeSettings } from "./engine";
import "./metronomo.css";

type Saved = MetronomeSettings & { version: 1 };
const DEFAULTS: Saved = { version: 1, bpm: 90, beatsPerBar: 4, subdivision: 1, accentFirst: true };
const SUBDIVISIONS = [1, 2, 3, 4] as const;

const store = createStore<Saved>("metronomo", DEFAULTS, (saved) => {
  const s = saved as Partial<Saved> | null;
  if (!s || typeof s !== "object") return null;
  const int = (n: unknown, lo: number, hi: number, d: number) => (typeof n === "number" && Number.isInteger(n) && n >= lo && n <= hi ? n : d);
  return {
    version: 1,
    bpm: typeof s.bpm === "number" && Number.isFinite(s.bpm) ? clampBpm(Math.round(s.bpm)) : DEFAULTS.bpm,
    beatsPerBar: int(s.beatsPerBar, 1, MAX_BEATS, DEFAULTS.beatsPerBar),
    subdivision: int(s.subdivision, 1, 4, DEFAULTS.subdivision),
    accentFirst: typeof s.accentFirst === "boolean" ? s.accentFirst : true,
  };
});

/** Metrônomo no navegador. A conta dos cliques é a mesma do app Android (Kotlin, marmota-tuner/core). */
export function Metronomo() {
  const t = useTranslations("metronomo");
  const s = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState<{ beat: number; sub: number } | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const engine = useRef<MetronomeEngine | null>(null);
  const tap = useRef<TapTempo | null>(null);

  const set = (patch: Partial<MetronomeSettings>) => {
    const next = { ...store.get(), ...patch, bpm: clampBpm(Math.round(patch.bpm ?? store.get().bpm)) };
    store.set(next);
    engine.current?.apply(next);
  };
  const toggle = () => {
    engine.current ??= new MetronomeEngine((tick: Tick) => setNow({ beat: tick.beat, sub: tick.sub }));
    if (engine.current.running) { engine.current.stop(); setRunning(false); setNow(null); return; }
    if (engine.current.start(store.get())) setRunning(true);
    else window.alert(t("noAudio"));
  };
  const onTap = () => {
    tap.current ??= new TapTempo();
    const bpm = tap.current.tap(performance.now() / 1000);
    if (bpm !== null && bpm !== undefined) set({ bpm });
  };
  const commit = () => {
    const n = Number(draft);
    setDraft(null);
    if (draft !== null && draft.trim() !== "" && Number.isFinite(n)) set({ bpm: n });
  };

  // Espaço toca e para; setas mudam o andamento (com Shift, de 10 em 10).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest("input, select, textarea, a, button")) return;
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) toggle(); }
      const step = e.shiftKey ? 10 : 1;
      if (e.code === "ArrowUp" || e.code === "ArrowRight") { e.preventDefault(); set({ bpm: store.get().bpm + step }); }
      if (e.code === "ArrowDown" || e.code === "ArrowLeft") { e.preventDefault(); set({ bpm: store.get().bpm - step }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Para ao sair da página; mantém a tela acesa enquanto toca.
  useEffect(() => () => engine.current?.stop(), []);
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    navigator.wakeLock.request("screen").then((l) => { if (cancelled) void l.release(); else lock = l; }).catch(() => {});
    return () => { cancelled = true; void lock?.release(); };
  }, [running]);

  return (
    <div className="metro">
      <ol className="metro-beats" aria-hidden="true">
        {Array.from({ length: s.beatsPerBar }, (_, i) => (
          <li key={i} className={[i === 0 && s.accentFirst && s.beatsPerBar > 1 ? "accent" : "", now?.beat === i ? (now.sub === 0 ? "on" : "sub") : ""].join(" ")} />
        ))}
      </ol>

      <div className="metro-tempo">
        <button type="button" className="metro-step" onClick={() => set({ bpm: s.bpm - 1 })} aria-label={t("slower")}>−</button>
        <label className="metro-bpm">
          <input
            type="text"
            inputMode="numeric"
            maxLength={3}
            aria-label={t("bpmLabel", { min: MIN_BPM, max: MAX_BPM })}
            value={draft ?? String(s.bpm)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") { if (e.key === "Escape") setDraft(null); e.currentTarget.blur(); } }}
          />
          <span>{t("bpm")}</span>
        </label>
        <button type="button" className="metro-step" onClick={() => set({ bpm: s.bpm + 1 })} aria-label={t("faster")}>+</button>
      </div>
      <input
        className="metro-slider"
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={s.bpm}
        onChange={(e) => set({ bpm: Number(e.target.value) })}
        aria-label={t("bpmSlider")}
      />

      <div className="metro-actions">
        <button type="button" className="go metro-play" onClick={toggle} aria-pressed={running} aria-keyshortcuts="Space">
          {running ? t("stop") : t("start")}
        </button>
        <button type="button" className="metro-tap" onClick={onTap}>{t("tap")}</button>
      </div>

      <div className="metro-options">
        <label className="metro-field">
          <span>{t("beats")}</span>
          <select value={s.beatsPerBar} onChange={(e) => set({ beatsPerBar: Number(e.target.value) })}>
            {Array.from({ length: MAX_BEATS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="metro-field">
          <span id="metro-sub">{t("subdivision")}</span>
          <div className="metro-seg" role="radiogroup" aria-labelledby="metro-sub">
            {SUBDIVISIONS.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={s.subdivision === n} onClick={() => set({ subdivision: n })}>
                {t(`sub.${n}`)}
              </button>
            ))}
          </div>
        </div>
        <label className="metro-check">
          <input type="checkbox" checked={s.accentFirst} onChange={(e) => set({ accentFirst: e.target.checked })} />
          <span>{t("accent")}</span>
        </label>
      </div>
      <p className="metro-keys">{t("keys")}</p>
    </div>
  );
}
