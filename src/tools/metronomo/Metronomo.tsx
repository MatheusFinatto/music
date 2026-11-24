"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { ACCENT, BEAT, MAX_BEATS, MAX_BPM, MIN_BPM, MUTE, SUBDIVISIONS, TapTempo, clampBpm, subdivisionById, type Tick } from "@/core/rhythm";
import { MINUTES, store } from "./store";
import { MetronomeEngine, chime, type MetronomeSettings } from "./engine";
import { Figure } from "./Figure";
import "./metronomo.css";

const STEPS = [-10, -5, -1, 1, 5, 10] as const; // os negativos à esquerda do número, os positivos à direita
const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
/** Clicar num tempo: normal → forte → mudo → normal (a mesma ordem do núcleo, Metronome.cycleAccent). */
const nextAccent = (a: number) => (a === BEAT ? ACCENT : a === ACCENT ? MUTE : BEAT);

/** Metrônomo no navegador. A conta dos cliques é a mesma do app Android (Kotlin, marmota-tuner/core). */
export function Metronomo() {
  const t = useTranslations("metronomo");
  const s = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState<{ beat: number; sub: number } | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const engine = useRef<MetronomeEngine | null>(null);
  const tap = useRef<TapTempo | null>(null);
  const subDialog = useRef<HTMLDialogElement>(null);
  /** As setas no seletor de divisão também disparam click (radioGroup); só Enter, Espaço ou o mouse fecham o modal. */
  const arrowing = useRef(false);

  const set = (patch: Partial<MetronomeSettings>) => {
    const next = { ...store.get(), ...patch, bpm: clampBpm(Math.round(patch.bpm ?? store.get().bpm)) };
    store.set(next);
    engine.current?.apply(next);
  };
  const [audioError, setAudioError] = useState(false);
  /**
   * O timer: [left] é o que falta (ms; null = a duração inteira, ainda não começou), [deadline] é quando acaba
   * (relógio de performance.now) enquanto toca. Com timer, o botão principal pausa e guarda o que falta; Parar zera.
   */
  const [left, setLeft] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const deadline = useRef<number | null>(null);
  const halt = () => { engine.current?.stop(); deadline.current = null; setRunning(false); setNow(null); setLeft(null); setPaused(false); };
  const pause = (at: number) => {
    engine.current?.stop();
    setLeft(deadline.current !== null ? Math.max(0, deadline.current - at) : null);
    deadline.current = null;
    setRunning(false); setNow(null); setPaused(true);
  };
  const play = (at: number) => {
    setFinished(false);
    engine.current ??= new MetronomeEngine((tick: Tick) => setNow({ beat: tick.beat, sub: tick.sub }));
    if (!engine.current.start(store.get())) { setAudioError(true); return; }
    setRunning(true); setAudioError(false); setPaused(false);
    const min = store.get().minutes;
    const ms = min > 0 ? (paused && left !== null ? left : min * 60_000) : null;
    deadline.current = ms !== null ? at + ms : null;
    setLeft(ms);
  };
  /** [at] é o timeStamp do evento (ms, no relógio de performance.now). Com timer, pausa; sem timer, para. */
  const toggle = (at: number) => {
    if (!engine.current?.running) play(at);
    else if (store.get().minutes > 0) pause(at);
    else halt();
  };
  const setMinutes = (minutes: number, at: number) => {
    store.set({ ...store.get(), minutes });
    setFinished(false);
    if (running) {
      deadline.current = minutes > 0 ? at + minutes * 60_000 : null;
      setLeft(minutes > 0 ? minutes * 60_000 : null);
    } else { setLeft(null); setPaused(false); }
  };
  /** [at] é o timeStamp do evento, em ms. */
  const onTap = (at: number) => {
    tap.current ??= new TapTempo();
    const bpm = tap.current.tap(at / 1000);
    if (bpm !== null && bpm !== undefined) set({ bpm });
  };
  const commit = () => {
    const n = Number(draft);
    setDraft(null);
    if (draft !== null && draft.trim() !== "" && Number.isFinite(n)) set({ bpm: n });
  };
  const cycle = (beat: number) => {
    const accents = [...store.get().accents];
    accents[beat] = nextAccent(accents[beat] ?? BEAT);
    set({ accents });
    if (!store.get().hintSeen) store.set({ ...store.get(), hintSeen: true });
  };
  const accentName = (a: number) => t(a === ACCENT ? "accent.strong" : a === MUTE ? "accent.mute" : "accent.normal");

  // Espaço toca e para (mesmo com o foco num botão: é o atalho de quem está com o instrumento na mão);
  // T marca o tap; setas mudam o andamento (com Shift, de 10 em 10). Campo de texto, seletor e modal ficam com as teclas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest("input[type=text], select, textarea, dialog")) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === "Space") {
        // No botão Tocar, o próprio botão já alterna; nos outros, o Espaço não aperta o botão.
        if (el?.closest(".metro-play")) return;
        e.preventDefault();
        if (!e.repeat) toggle(e.timeStamp);
        return;
      }
      if (el?.closest("a, input")) return;
      if (e.code === "KeyT" && !e.repeat) onTap(e.timeStamp);
      const step = e.shiftKey ? 10 : 1;
      if (e.code === "ArrowUp" || e.code === "ArrowRight") { e.preventDefault(); set({ bpm: store.get().bpm + step }); }
      if (e.code === "ArrowDown" || e.code === "ArrowLeft") { e.preventDefault(); set({ bpm: store.get().bpm - step }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // O timer: conta em tempo de relógio e para sozinho no fim.
  useEffect(() => {
    if (!running || deadline.current === null) return;
    const id = setInterval(() => {
      const d = deadline.current;
      if (d === null) return;
      const rest = d - performance.now();
      if (rest <= 0) { halt(); setFinished(true); chime(); } else setLeft(rest);
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  // O que mudar o salvo por fora (um favorito carregado no topo da página) vale no próximo clique.
  useEffect(() => { engine.current?.apply(s); }, [s]);

  // Para ao sair da página; mantém a tela acesa enquanto toca.
  useEffect(() => () => engine.current?.stop(), []);
  useEffect(() => {
    if (!running || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;
    navigator.wakeLock.request("screen").then((l) => { if (cancelled) void l.release(); else lock = l; }).catch(() => {});
    return () => { cancelled = true; void lock?.release(); };
  }, [running]);

  const sub = subdivisionById(s.subdivision);
  // Clicar fora do conteúdo (no fundo escurecido) fecha o modal.
  const closeOnBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => { if (e.target === e.currentTarget) e.currentTarget.close(); };

  return (
    <div className="metro">
      <ol className="metro-beats">
        {Array.from({ length: s.beatsPerBar }, (_, i) => {
          const a = s.accents[i] ?? BEAT;
          const lit = now?.beat === i ? (now.sub === 0 ? "on" : "sub") : "";
          return (
            <li key={i}>
              <button
                type="button"
                className={["metro-dot", a === ACCENT ? "strong" : a === MUTE ? "mute" : "", lit].join(" ")}
                onClick={() => cycle(i)}
                aria-label={t("beatLabel", { n: i + 1, accent: accentName(a) })}
              />
            </li>
          );
        })}
      </ol>
      {!s.hintSeen && <p className="metro-hint">{t("beatHint")}</p>}

      <div className="metro-tempo">
        <div className="metro-steps down" role="group" aria-label={t("slowerGroup")}>
          {STEPS.filter((d) => d < 0).map((d) => (
            <button key={d} type="button" onClick={() => set({ bpm: store.get().bpm + d })} aria-label={t("slower", { n: -d })}>−{-d}</button>
          ))}
        </div>
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
        <div className="metro-steps up" role="group" aria-label={t("fasterGroup")}>
          {STEPS.filter((d) => d > 0).map((d) => (
            <button key={d} type="button" onClick={() => set({ bpm: store.get().bpm + d })} aria-label={t("faster", { n: d })}>+{d}</button>
          ))}
        </div>
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

      {s.minutes > 0 && (
        <div className={["metro-timer", running ? "live" : "", finished ? "done" : ""].join(" ")} aria-hidden="true">
          <span>{clock(finished ? 0 : left ?? s.minutes * 60_000)}</span>
          <small>{finished ? t("finished") : paused ? t("paused") : ""}</small>
        </div>
      )}

      <div className={["metro-actions", s.minutes > 0 ? "with-stop" : ""].join(" ")}>
        {/* Ícones universais: ▶ tocar ou continuar, ❚❚ pausar (com timer), ■ parar. O nome vai no aria-label. */}
        <button
          type="button"
          className="go metro-play"
          onClick={(e) => toggle(e.timeStamp)}
          aria-keyshortcuts="Space"
          aria-label={running ? (s.minutes > 0 ? t("pause") : t("stop")) : paused ? t("resume") : t("start")}
          title={running ? (s.minutes > 0 ? t("pause") : t("stop")) : paused ? t("resume") : t("start")}
        >
          <PlayIcon kind={running ? (s.minutes > 0 ? "pause" : "stop") : "play"} />
        </button>
        {/* Com timer, o ■ fica sempre no mesmo lugar (desligado enquanto não há o que parar): nada se mexe sob o dedo. */}
        {s.minutes > 0 && (
          <button type="button" className="metro-icon-btn" onClick={halt} disabled={!running && !paused} aria-label={t("stop")} title={t("stop")}>
            <PlayIcon kind="stop" />
          </button>
        )}
        <button type="button" className="metro-tap" onClick={(e) => onTap(e.timeStamp)} aria-keyshortcuts="T">{t("tap")}</button>
      </div>
      {/* Só pausa e fim são anunciados: ler a contagem a cada segundo atrapalharia quem está tocando. */}
      <p className="sr-only" role="status">{finished ? t("finished") : paused ? t("paused") : ""}</p>

      <div className="metro-options">
        <label className="metro-field">
          <span>{t("beats")}</span>
          <select value={s.beatsPerBar} onChange={(e) => set({ beatsPerBar: Number(e.target.value) })}>
            {Array.from({ length: MAX_BEATS }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <div className="metro-field">
          <span id="metro-sub-label">{t("subdivision")}</span>
          <button type="button" className="metro-sub-open" onClick={() => { subDialog.current?.showModal(); subDialog.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus(); }} aria-haspopup="dialog" aria-labelledby="metro-sub-label metro-sub-name">
            <Figure subdivision={sub} className="metro-figure" />
            <span id="metro-sub-name" className="sr-only">{t(`sub.${sub.id}`)}</span>
          </button>
        </div>
        <label className="metro-field">
          <span>{t("timer")}</span>
          <select value={s.minutes} onChange={(e) => setMinutes(Number(e.target.value), e.timeStamp)}>
            {MINUTES.map((m) => <option key={m} value={m}>{m === 0 ? t("noLimit") : t("minutes", { n: m })}</option>)}
          </select>
        </label>
      </div>
      {audioError && <p className="metro-error" role="alert">{t("noAudio")}</p>}

      <dialog ref={subDialog} className="metro-dialog" aria-labelledby="metro-sub-title" onClick={closeOnBackdrop}>
        <div className="metro-dialog-head">
          <h2 id="metro-sub-title">{t("subTitle")}</h2>
          <button type="button" className="metro-close" onClick={() => subDialog.current?.close()} aria-label={t("close")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="metro-subgrid" role="radiogroup" aria-labelledby="metro-sub-title" onKeyDown={(e) => { arrowing.current = true; onRadioKeyDown(e); arrowing.current = false; }}>
          {SUBDIVISIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              role="radio"
              aria-checked={d.id === s.subdivision}
              tabIndex={d.id === s.subdivision ? 0 : -1}
              onClick={() => { set({ subdivision: d.id }); if (!arrowing.current) subDialog.current?.close(); }}
            >
              <Figure subdivision={d} className="metro-figure" />
              <span>{t(`sub.${d.id}`)}</span>
            </button>
          ))}
        </div>
      </dialog>

    </div>
  );
}

/** Os ícones do transporte, cheios como nos players: triângulo, duas barras, quadrado. */
function PlayIcon({ kind }: { kind: "play" | "pause" | "stop" }) {
  return (
    <svg className="metro-transport" viewBox="0 0 24 24" aria-hidden="true">
      {kind === "play" && <path d="M8 5.2v13.6a.8.8 0 0 0 1.2.7l10.6-6.8a.8.8 0 0 0 0-1.4L9.2 4.5A.8.8 0 0 0 8 5.2z" />}
      {kind === "pause" && <><rect x="6.5" y="5" width="4" height="14" rx="1" /><rect x="13.5" y="5" width="4" height="14" rx="1" /></>}
      {kind === "stop" && <rect x="6" y="6" width="12" height="12" rx="1.6" />}
    </svg>
  );
}
