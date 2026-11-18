"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { transport } from "@/core/audio";
import { chordsOf } from "@/core/theory";
import type { Base } from "../curriculum/types";
import { KeyPicker } from "./KeyPicker";
import { SoundPanel } from "./SoundPanel";
import { useBeat, useRunning } from "./useTransport";

/** Limites do andamento, para os botões e para o campo digitado. */
const MIN_BPM = 40, MAX_BPM = 200;

export const backingOf = (base: Base, bpm = base.bpm) => ({ chords: chordsOf(base.prog, base.key), bpm, style: base.style });

/** Número da contagem (1 a 4) enquanto a base conta antes de entrar; senão null. */
export function useCountIn(): number | null {
  const running = useRunning();
  const beat = useBeat();
  if (!running || !beat) return null;
  return beat.beat < 0 ? beat.beatInBar + 1 : null;
}

// A barra de espaço é do transporte, mesmo com um botão em foco (quem usa teclado ativa botões com Enter).
// Só fica de fora onde o espaço tem outro papel: campos de texto, caixas de marcar, links e o braço clicável.
const keepsSpace = (el: EventTarget | null) =>
  el instanceof Element && (el.closest("input, textarea, select, a, summary, [contenteditable=true], [role=button]") !== null);

/** Menos, campo digitável e mais. O andamento fica entre 40 e 200; o que se digita vale ao sair do campo ou no Enter. */
export function TempoControl({ bpm, onChange, locked = false }: { bpm: number; onChange: (bpm: number) => void; locked?: boolean }) {
  const t = useTranslations("solos.backing");
  /** O que a pessoa está digitando; null quando o campo mostra o andamento em uso. */
  const [draft, setDraft] = useState<string | null>(null);
  const cancelled = useRef(false);
  const apply = (n: number) => onChange(Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(n))));
  const commit = () => {
    const text = draft;
    setDraft(null);
    if (cancelled.current) { cancelled.current = false; return; }
    if (text !== null && text.trim() !== "" && Number.isFinite(Number(text))) apply(Number(text));
  };
  return (
    <div className="tempo">
      <button type="button" className="btn square" onClick={() => apply(bpm - 4)} aria-label={t("slower")} disabled={locked}>−</button>
      <label className="num">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={3}
          aria-label={t("tempo", { min: MIN_BPM, max: MAX_BPM })}
          value={draft ?? String(bpm)}
          disabled={locked}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") cancelled.current = true;
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
        />
        <small>{t("bpm")}</small>
      </label>
      <button type="button" className="btn square" onClick={() => apply(bpm + 4)} aria-label={t("faster")} disabled={locked}>+</button>
    </div>
  );
}

/** Os acordes da base, com o que está soando em destaque quando `live`. */
export function ChordStrip({ base, live, hideChords = false }: { base: Base; live: boolean; hideChords?: boolean }) {
  const t = useTranslations("solos.backing");
  const beat = useBeat();
  return (
    <ol className="chords" aria-label={t("chords")}>
      {chordsOf(base.prog, base.key).map((c, i) => {
        const on = live && !!beat && beat.beat >= 0 && beat.barInCycle === i;
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
  );
}

type Props = {
  base: Base;
  countIn?: number;
  hideChords?: boolean;
  /**
   * Outra coisa está usando o transporte (o exemplo do arco, que tem base e andamento próprios). A barra
   * se mostra parada: "Tocar base" interrompe o exemplo e começa a base daqui.
   */
  quiet?: boolean;
  /** Texto do botão de tocar, quando não é só a base que toca (ex.: o eco, com a frase junto). */
  playLabel?: string;
};

/**
 * Tocar/parar, andamento e os acordes da base, com o acorde que está soando em destaque.
 * `hideChords` esconde os nomes (o compasso continua marcado): para treinar ouvir a troca.
 */
export function BackingBar({ base, countIn = 1, hideChords = false, quiet = false, playLabel }: Props) {
  const t = useTranslations("solos.backing");
  const [bpm, setBpm] = useState(base.bpm);
  const playing = useRunning();
  const running = playing && !quiet;

  const start = () => { if (!transport.start(backingOf(base, bpm), { countIn })) window.alert(t("noAudio")); };
  const toggle = () => {
    const mine = transport.running && !quiet;
    if (transport.running) transport.stop();
    if (!mine) start();
  };
  const changeTempo = (next: number) => {
    setBpm(next);
    if (transport.running && !quiet) transport.setTempo(next);
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
    if (!playing || !("wakeLock" in navigator)) return;
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
  }, [playing]);

  return (
    <div className="backing">
      <button type="button" className="btn primary play" onClick={toggle} aria-pressed={running} aria-keyshortcuts="Space">
        {running ? t("stop") : (playLabel ?? t("play"))}
      </button>
      <TempoControl bpm={bpm} onChange={changeTempo} />
      <div className="backing-extra">
        <KeyPicker />
        <SoundPanel />
      </div>
      <ChordStrip base={base} live={running} hideChords={hideChords} />
      <p className="keys">{t("space")}</p>
    </div>
  );
}
