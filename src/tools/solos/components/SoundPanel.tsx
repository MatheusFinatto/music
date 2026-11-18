"use client";
import { useRef, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { EQ_MAX, EQ_MIN, FLAT_EQ, eqStore, playPhrase, prepareLead, resumeAudio, soundStore, type BaseEq, type Instrument, type LeadNote, type Sound } from "@/core/audio";

const useSound = (): Sound => useSyncExternalStore(soundStore.subscribe, soundStore.get, soundStore.getInitial);
const useEq = (): BaseEq => useSyncExternalStore(eqStore.subscribe, eqStore.get, eqStore.getInitial);
const BANDS = ["low", "mid", "high"] as const;

const INSTRUMENTS: Instrument[] = ["violao", "sintetizador"];

/** Frase de teste: bend de D4 a E4, G4, e A4 longo com vibrato. */
const DEMO: LeadNote[] = [
  { midi: 64, from: 62, glide: 0.4, beat: 0, dur: 1 },
  { midi: 67, beat: 1, dur: 0.5 },
  { midi: 69, beat: 1.5, dur: 2, vibrato: { rate: 5, cents: 40, delay: 0.5 } },
];

/** Botão "Som" e a janela: instrumento da voz solista e equalizador da base. A escolha vale para o site todo. */
export function SoundPanel() {
  const t = useTranslations("solos.sound");
  const sound = useSound();
  const eq = useEq();
  const dialog = useRef<HTMLDialogElement>(null);
  const set = (patch: Partial<Sound>) => soundStore.set((s) => ({ ...s, ...patch }));
  const listen = () => {
    const g = resumeAudio();
    if (g) playPhrase(g, DEMO, g.ctx.currentTime + 0.05, 0.5);
  };
  const slider = (key: "tone" | "volume") => (
    <label className="slider">
      <span>{t(key)}</span>
      <input type="range" min={0} max={100} value={Math.round(sound[key] * 100)} onChange={(e) => set({ [key]: Number(e.target.value) / 100 })} />
    </label>
  );

  return (
    <>
      <button type="button" className="btn small" onClick={() => { const g = resumeAudio(); if (g) prepareLead(g); dialog.current?.showModal(); }}>
        {t("button", { instrument: t(`name.${sound.instrument}`) })}
      </button>
      <dialog ref={dialog} className="sound-panel" aria-labelledby="sound-title" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <h2 id="sound-title">{t("title")}</h2>
        <div className="seg" role="radiogroup" aria-label={t("instrument")}>
          {INSTRUMENTS.map((i) => (
            <button key={i} type="button" role="radio" aria-checked={sound.instrument === i} onClick={() => set({ instrument: i })}>
              {t(`name.${i}`)}
            </button>
          ))}
        </div>
        <p className="note">{t(`about.${sound.instrument}`)}</p>
        {sound.instrument !== "sintetizador" && slider("tone")}
        {slider("volume")}
        {sound.instrument !== "sintetizador" && (
          <p className="credits"><a href="https://github.com/nbrosowsky/tonejs-instruments" target="_blank" rel="noreferrer">{t("credits")}</a></p>
        )}
        <h3>{t("base")}</h3>
        <p className="note">{t("baseNote")}</p>
        {BANDS.map((b) => (
          <label key={b} className="slider">
            <span>{t(b)} <output>{t("db", { n: eq[b] > 0 ? `+${eq[b]}` : String(eq[b]) })}</output></span>
            <input type="range" min={EQ_MIN} max={EQ_MAX} step={1} value={eq[b]} onChange={(e) => eqStore.set((q) => ({ ...q, [b]: Number(e.target.value) }))} />
          </label>
        ))}
        <div className="row">
          <button type="button" className="btn quiet" onClick={() => eqStore.set(FLAT_EQ)} disabled={BANDS.every((b) => eq[b] === 0)}>{t("flat")}</button>
          <button type="button" className="btn" onClick={listen}>{t("listen")}</button>
          <button type="button" className="btn primary" onClick={() => dialog.current?.close()}>{t("close")}</button>
        </div>
      </dialog>
    </>
  );
}
