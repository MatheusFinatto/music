"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { atAudioTime, getAudio, playPhrase, transport } from "@/core/audio";
import type { EchoExercise, Phrase } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { Board, chordNames, TextTab } from "../components/PhraseViews";
import { useBeat, useRunning } from "../components/useTransport";

/** O site toca a frase, depois deixa o mesmo número de compassos para a pessoa responder. */
export function EchoEngine({ ex }: { ex: EchoExercise }) {
  const t = useTranslations("solos.echo");
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  const [tab, setTab] = useState(false);
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
  const go = (i: number) => setIndex(i);

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
        <div className="row">
          <button type="button" className="btn" aria-expanded={shown} onClick={() => setShown((s) => !s)}>
            {shown ? t(ex.reveal === "rhythm" ? "hideRhythm" : "hideBoard") : t(ex.reveal === "rhythm" ? "showRhythm" : "showTab")}
          </button>
          {phrase.frets && (
            <button type="button" className="btn" aria-expanded={tab} onClick={() => setTab((s) => !s)}>
              {tab ? t("hideText") : t("showText")}
            </button>
          )}
        </div>
        {shown && (ex.reveal === "rhythm"
          ? <RhythmGrid phrase={phrase} now={now} label={t("rhythmLabel")} />
          : <Board phrase={phrase} now={now} label={t("tabLabel")} half={t("bendHalf")} full={t("bendFull")} />)}
        {tab && phrase.frets && <TextTab phrase={phrase} now={now} chords={chordNames(ex.base!)} label={t("textLabel")} />}
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
