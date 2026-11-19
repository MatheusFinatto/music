"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { atAudioTime, getAudio, NATURAL_END, playPhrase, transport } from "@/core/audio";
import type { Exercise } from "../curriculum/types";
import { backingOf, chosenBpm } from "./BackingBar";
import { Board, chordNames, TextTab } from "./PhraseViews";
import { useRunning } from "./useTransport";

/**
 * O exemplo de um exercício que não tem eco: um botão toca a base com a frase por cima, o braço acende nota a nota
 * e a tablatura fica à mão. Ouvir é escolha da pessoa; para sozinho no fim da frase.
 */
export function DemoPlayer({ ex }: { ex: Exercise }) {
  const t = useTranslations("solos.demo");
  const demo = ex.demo!;
  const running = useRunning();
  const [on, setOn] = useState(false);
  const [tab, setTab] = useState(false);
  const [sounding, setSounding] = useState(-1);
  const pending = useRef(false);

  useEffect(() => {
    let timers: (() => void)[] = [];
    const clear = () => { timers.forEach((c) => c()); timers = []; };
    const offBeat = transport.on("beat", (info) => {
      if (info.beatInBar !== 0 || !pending.current) return;
      if (info.bar === demo.bars) timers.push(atAudioTime(info.time, () => transport.stop(NATURAL_END)));
      const g = getAudio();
      if (info.bar === 0 && g) {
        const spb = transport.secondsPerBeat;
        playPhrase(g, demo.notes, info.time, spb);
        demo.notes.forEach((n, i) => {
          timers.push(atAudioTime(info.time + n.beat * spb, () => setSounding(i)));
          timers.push(atAudioTime(info.time + (n.beat + n.dur) * spb, () => setSounding((s) => (s === i ? -1 : s))));
        });
      }
    });
    const offStop = transport.on("stop", () => { clear(); pending.current = false; setOn(false); setSounding(-1); });
    return () => { offBeat(); offStop(); clear(); };
  }, [demo]);

  const play = () => {
    if (transport.running) transport.stop();
    pending.current = true;
    setOn(true);
    if (!transport.start(backingOf(ex.base!, chosenBpm(ex.base!)), { countIn: 0 })) { pending.current = false; setOn(false); }
  };
  const live = on && running;

  return (
    <section className="block demo" aria-labelledby={`${ex.id}-demo`}>
      <h2 id={`${ex.id}-demo`} className="block-title">{t("title")}</h2>
      <div className="row">
        <button type="button" className="btn" onClick={live ? () => transport.stop() : play} aria-pressed={live}>{live ? t("stop") : t("play")}</button>
        <button type="button" className="btn" aria-expanded={tab} onClick={() => setTab((s) => !s)}>{tab ? t("hideTab") : t("showTab")}</button>
      </div>
      <Board phrase={demo} now={live ? sounding : -1} label={t("boardLabel")} half={t("bendHalf")} full={t("bendFull")} />
      {tab && <TextTab phrase={demo} now={live ? sounding : -1} chords={chordNames(ex.base!)} label={t("tabLabel")} />}
    </section>
  );
}
