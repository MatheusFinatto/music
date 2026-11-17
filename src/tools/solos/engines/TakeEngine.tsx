"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { atAudioTime, getAudio, playPhrase, transport } from "@/core/audio";
import type { TakeExercise } from "../curriculum/types";
import { BackingBar, backingOf } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { chordNames, TextTab } from "../components/PhraseViews";
import { useBeat, useRunning } from "../components/useTransport";

/**
 * Tomada livre: a base toca o número de compassos combinado e para sozinha. Com `arc`, a faixa diz em que
 * parte do solo você está. Com `example`, um botão próprio toca a base com o solo de exemplo por cima:
 * ouvir é escolha da pessoa, não uma etapa obrigatória antes de cada tentativa.
 */
export function TakeEngine({ ex }: { ex: TakeExercise }) {
  const t = useTranslations("solos.take");
  const beat = useBeat();
  const running = useRunning();
  /** A base que está tocando é a do exemplo (com o solo por cima) ou a sua. */
  const [example, setExample] = useState(false);
  const exampleRef = useRef(false);
  const [sounding, setSounding] = useState(-1);
  const [tab, setTab] = useState(false);

  useEffect(() => {
    let timers: (() => void)[] = [];
    const clear = () => { timers.forEach((c) => c()); timers = []; };
    const offBeat = transport.on("beat", (info) => {
      if (info.beatInBar !== 0) return;
      if (info.bar === ex.bars) timers.push(atAudioTime(info.time, () => transport.stop()));
      // No primeiro compasso da base do exemplo, agenda o solo inteiro e acende cada nota quando ela soa.
      const g = getAudio();
      if (info.bar === 0 && exampleRef.current && ex.example && g) {
        const spb = transport.secondsPerBeat;
        playPhrase(g, ex.example.notes, info.time, spb);
        ex.example.notes.forEach((n, i) => {
          timers.push(atAudioTime(info.time + n.beat * spb, () => setSounding(i)));
          timers.push(atAudioTime(info.time + (n.beat + n.dur) * spb, () => setSounding((s) => (s === i ? -1 : s))));
        });
      }
    });
    const offStop = transport.on("stop", () => { clear(); exampleRef.current = false; setExample(false); setSounding(-1); });
    return () => { offBeat(); offStop(); clear(); };
  }, [ex]);

  const playExample = () => {
    if (transport.running) transport.stop();
    exampleRef.current = true;
    setExample(true);
    if (!transport.start(backingOf(ex.base!), { countIn: 1 })) { exampleRef.current = false; setExample(false); }
  };

  const live = !!beat && beat.beat >= 0;
  const bar = live ? Math.min(beat.bar + 1, ex.bars) : 0;
  const arc = ex.arc ?? [];
  const at = arc.length && live ? Math.min(arc.length - 1, Math.floor(((bar - 1) * arc.length) / ex.bars)) : -1;
  const part = at >= 0 ? arc[at]! : null;
  const word = example ? t("example") : part ?? t("playing");
  const note = example && part ? `${part} · ${t("bar", { bar, total: ex.bars })}` : t("bar", { bar, total: ex.bars });

  return (
    <div className="engine">
      <Banner state={live ? (example ? "call" : "play") : null} word={word} note={note} idle={t(ex.example ? "idleExample" : "idle")} />
      {arc.length > 0 && (
        <ol className="pattern" aria-label={t("arc")}>
          {arc.map((a, i) => <li key={i} className={`play${i === at ? " on" : ""}`}>{a}</li>)}
        </ol>
      )}
      {ex.example && (
        <div className="row">
          <button type="button" className="btn" onClick={example && running ? () => transport.stop() : playExample} aria-pressed={example && running}>
            {example && running ? t("stopExample") : t("playExample")}
          </button>
          <button type="button" className="btn" aria-expanded={tab} onClick={() => setTab((s) => !s)}>{tab ? t("hideTab") : t("showTab")}</button>
        </div>
      )}
      <BackingBar base={ex.base!} />
      {ex.example && tab && <TextTab phrase={ex.example} now={running && example ? sounding : -1} chords={chordNames(ex.base!)} label={t("tabLabel")} />}
    </div>
  );
}
