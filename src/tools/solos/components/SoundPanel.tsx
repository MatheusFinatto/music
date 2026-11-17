"use client";
import { useRef, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { playPhrase, prepareLead, resumeAudio, soundStore, type Instrument, type LeadNote, type Sound } from "@/core/audio";

const useSound = (): Sound => useSyncExternalStore(soundStore.subscribe, soundStore.get, soundStore.getInitial);

const INSTRUMENTS: Instrument[] = ["violao", "sintetizador"];

/** Frase de teste: bend de D4 a E4, G4, e A4 longo com vibrato. */
const DEMO: LeadNote[] = [
  { midi: 64, from: 62, glide: 0.4, beat: 0, dur: 1 },
  { midi: 67, beat: 1, dur: 0.5 },
  { midi: 69, beat: 1.5, dur: 2, vibrato: { rate: 5, cents: 40, delay: 0.5 } },
];

/** Botão "Som" e a janela para escolher o instrumento da voz solista. A escolha vale para o site todo. */
export function SoundPanel() {
  const t = useTranslations("solos.sound");
  const sound = useSound();
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
        <div className="row">
          <button type="button" className="btn" onClick={listen}>{t("listen")}</button>
          <button type="button" className="btn primary" onClick={() => dialog.current?.close()}>{t("close")}</button>
        </div>
      </dialog>
    </>
  );
}
