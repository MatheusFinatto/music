"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { atAudioTime, getAudio, playPhrase, transport } from "@/core/audio";
import { fretSpan, noteName } from "@/core/theory";
import type { EchoExercise, Phrase } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { Fretboard, type Dot } from "../components/Fretboard";
import { useBeat, useRunning } from "../components/useTransport";

/** O site toca a frase, depois deixa o mesmo número de compassos para a pessoa responder. */
export function EchoEngine({ ex }: { ex: EchoExercise }) {
  const t = useTranslations("solos.echo");
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  /** Índice da nota que está soando agora (azul), ou -1. */
  const [sounding, setSounding] = useState(-1);
  const phrase = ex.phrases[index]!;
  const ref = useRef<Phrase>(phrase);
  useEffect(() => { ref.current = phrase; }, [phrase]);

  useEffect(() => {
    let timers: (() => void)[] = [];
    const clear = () => { timers.forEach((c) => c()); timers = []; };
    const offBeat = transport.on("beat", (info) => {
      const p = ref.current, g = getAudio();
      if (!g || info.beatInBar !== 0 || info.bar < 0 || info.bar % (p.bars * 2) !== 0) return;
      const spb = transport.secondsPerBeat;
      playPhrase(g, p.notes, info.time, spb);
      clear();
      p.notes.forEach((n, i) => {
        timers.push(atAudioTime(info.time + n.beat * spb, () => setSounding(i)));
        timers.push(atAudioTime(info.time + (n.beat + n.dur) * spb, () => setSounding((s) => (s === i ? -1 : s))));
      });
    });
    const offStop = transport.on("stop", () => { clear(); setSounding(-1); });
    return () => { offBeat(); offStop(); clear(); };
  }, []);

  const beat = useBeat();
  const running = useRunning();
  const live = running && !!beat && beat.beat >= 0;
  const calling = live && beat.bar % (phrase.bars * 2) < phrase.bars;
  const now = running ? sounding : -1;
  const go = (i: number) => { setIndex(i); setShown(false); };

  return (
    <div className="engine">
      {ex.phrases.length > 1 && (
        <div className="seg" role="group" aria-label={t("which")}>
          {ex.phrases.map((p, i) => (
            <button key={p.id} type="button" aria-pressed={i === index} onClick={() => go(i)}>{i + 1}</button>
          ))}
        </div>
      )}
      <Banner state={live ? (calling ? "call" : "play") : null} word={t(calling ? "listen" : "yourTurn")} note={phrase.name} idle={t("idle")} />
      <BackingBar base={ex.base!} />
      <div className="reveal">
        <button type="button" className="btn" aria-expanded={shown} onClick={() => setShown((s) => !s)}>
          {shown ? t("hide") : t(ex.reveal === "rhythm" ? "showRhythm" : "showTab")}
        </button>
        {shown && (ex.reveal === "rhythm"
          ? <RhythmGrid phrase={phrase} now={now} label={t("rhythmLabel")} />
          : <Tab phrase={phrase} now={now} label={t("tabLabel")} legend={t("tabLegend")} />)}
      </div>
    </div>
  );
}

function RhythmGrid({ phrase, now, label }: { phrase: Phrase; now: number; label: string }) {
  const steps = phrase.bars * 16;
  const start = phrase.notes.map((n) => Math.round(n.beat * 4));
  const cell = (s: number) => {
    const i = start.indexOf(s);
    if (i >= 0) return i === now ? "hit now" : "hit";
    const held = phrase.notes.findIndex((n, k) => s > start[k]! && s < start[k]! + Math.round(n.dur * 4));
    return held >= 0 ? "held" : "";
  };
  return (
    <ol className="rhythm" aria-label={label}>
      {Array.from({ length: steps }, (_, s) => (
        <li key={s} className={`${cell(s)}${s % 4 === 0 ? " beat" : ""}`}>{s % 4 === 0 ? ((s / 4) % 4) + 1 : ""}</li>
      ))}
    </ol>
  );
}

function Tab({ phrase, now, label, legend }: { phrase: Phrase; now: number; label: string; legend: string }) {
  if (!phrase.frets) return null;
  const [lo, hi] = fretSpan(phrase.frets);
  // A mesma posição pode ser tocada mais de uma vez: mostra a ordem de todas as passagens.
  const order = new Map<string, number[]>();
  phrase.frets.forEach((p, i) => order.set(`${p.string}-${p.fret}`, [...(order.get(`${p.string}-${p.fret}`) ?? []), i]));
  const dots: Dot[] = [...order.entries()].map(([k, idx]) => {
    const [string, fret] = k.split("-").map(Number) as [number, number];
    const ns = idx.map((i) => i + 1);
    return { string, fret, kind: idx.includes(now) ? "now" : "target", label: ns.length > 2 ? `${ns[0]}…` : ns.join("·") };
  });
  return (
    <>
      <Fretboard minFret={lo} maxFret={hi} dots={dots} label={label} />
      <p className="legend">{legend} <span className="notes">{phrase.notes.map((n) => noteName(n.midi)).join(" ")}</span></p>
    </>
  );
}
