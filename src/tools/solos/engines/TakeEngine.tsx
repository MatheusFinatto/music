"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { atAudioTime, getAudio, NATURAL_END, playPhrase, transport } from "@/core/audio";
import type { Phrase, TakeExercise } from "../curriculum/types";
import { BackingBar, backingOf, ChordStrip, TempoControl } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { chordNames, TextTab } from "../components/PhraseViews";
import { useBeat, useRunning } from "../components/useTransport";
import { saveBars, setCountBeforeExample, useCountBeforeExample, useSavedBars } from "../progress";
import { barOptions, chosenBars } from "./bars";

/**
 * Tomada livre: a base toca o número de compassos combinado e para sozinha. Com `arc`, a faixa diz em que
 * parte do solo você está. Com `examples`, cada um tem um botão que toca a base com o solo por cima:
 * ouvir é escolha da pessoa, não uma etapa obrigatória antes de cada tentativa. Com `bases`, a pessoa
 * escolhe sobre qual base solar; o exemplo toca sempre sobre a base para a qual foi escrito.
 * `bars` é o tamanho recomendado: a pessoa escolhe outro (fica salvo por tomada), e o arco se divide nele.
 * O exemplo toca sempre no tamanho recomendado, que é o dele.
 */
export function TakeEngine({ ex }: { ex: TakeExercise }) {
  const t = useTranslations("solos.take");
  const beat = useBeat();
  const running = useRunning();
  const examples = ex.examples ?? [];
  const bases = [ex.base!, ...(ex.bases ?? [])];
  /** Escolhas guardadas por exercício: ao trocar de tomada, voltam ao padrão. */
  const fresh = { id: ex.id, base: 0, example: 0, exBpm: null as number | null };
  const [pick, setPick] = useState(fresh);
  const mine = pick.id === ex.id ? pick : fresh;
  const base = bases[mine.base] ?? bases[0]!;
  const shown = examples[mine.example] ?? examples[0];
  /** O andamento do exemplo, separado do andamento da base em que a pessoa toca. */
  const exBpm = mine.exBpm ?? ex.base!.bpm;
  /** A base que está tocando é a do exemplo (com o solo por cima) ou a sua. */
  const [example, setExample] = useState(false);
  /** O exemplo que deve soar na próxima entrada da base, ou null. */
  const pending = useRef<Phrase | null>(null);
  const [sounding, setSounding] = useState(-1);
  const [tab, setTab] = useState(false);
  const bars = chosenBars(ex, useSavedBars()[ex.id]);
  const countBefore = useCountBeforeExample();
  /** O tamanho escolhido, lido pelo relógio da base (fora do render). */
  const barsRef = useRef(bars);
  useEffect(() => { barsRef.current = bars; }, [bars]);

  useEffect(() => {
    let timers: (() => void)[] = [];
    const clear = () => { timers.forEach((c) => c()); timers = []; };
    const offBeat = transport.on("beat", (info) => {
      if (info.beatInBar !== 0) return;
      // O exemplo tem o tamanho dele; a tomada da pessoa, o que ela escolheu.
      const total = pending.current ? ex.bars : barsRef.current;
      if (info.bar === total) timers.push(atAudioTime(info.time, () => transport.stop(NATURAL_END)));
      // No primeiro compasso da base do exemplo, agenda o solo inteiro e acende cada nota quando ela soa.
      const g = getAudio(), solo = pending.current;
      if (info.bar === 0 && solo && g) {
        const spb = transport.secondsPerBeat;
        playPhrase(g, solo.notes, info.time, spb);
        solo.notes.forEach((n, i) => {
          timers.push(atAudioTime(info.time + n.beat * spb, () => setSounding(i)));
          timers.push(atAudioTime(info.time + (n.beat + n.dur) * spb, () => setSounding((s) => (s === i ? -1 : s))));
        });
      }
    });
    const offStop = transport.on("stop", () => { clear(); pending.current = null; setExample(false); setSounding(-1); });
    return () => { offBeat(); offStop(); clear(); };
  }, [ex.bars]);

  const playExample = (i: number) => {
    if (transport.running) transport.stop();
    setPick({ ...mine, example: i });
    pending.current = examples[i]!;
    setExample(true);
    if (!transport.start(backingOf(ex.base!, exBpm), { countIn: countBefore ? 1 : 0 })) { pending.current = null; setExample(false); }
  };
  const chooseBase = (i: number) => {
    if (transport.running) transport.stop();
    setPick({ ...mine, base: i });
  };

  const chooseBars = (n: number) => {
    if (transport.running) transport.stop();
    saveBars(ex.id, n);
  };

  const live = !!beat && beat.beat >= 0;
  const total = example ? ex.bars : bars;
  const bar = live ? Math.min(beat.bar + 1, total) : 0;
  const arc = ex.arc ?? [];
  const at = arc.length && live ? Math.min(arc.length - 1, Math.floor(((bar - 1) * arc.length) / total)) : -1;
  const part = at >= 0 ? arc[at]! : null;
  const detailed = arc.some((a) => a.how);
  // De longe se lê o nome da parte; no exemplo, a faixa diz também que é o exemplo que está tocando.
  const word = part?.name ?? t(example ? "example" : "playing");
  const count = t("bar", { bar, total });
  const note = example && part ? `${t("example")} · ${count}` : count;

  return (
    <div className="engine take">
      <Banner state={live ? (example ? "call" : "play") : null} word={word} note={note} idle={t(shown ? "idleExample" : "idle")} />
      {arc.length > 0 && (
        // A explicação de cada parte fica aqui, dentro do palco: continua na tela com a base ou o exemplo tocando.
        <ol className={detailed ? "pattern detailed" : "pattern"} aria-label={t("arc")}>
          {arc.map((a, i) => (
            <li key={i} className={`play${i === at ? " on" : ""}`} aria-current={i === at ? "step" : undefined}>
              <b>{a.name}</b>
              {a.how && <span>{a.how}</span>}
            </li>
          ))}
        </ol>
      )}
      {ex.arcNote && (
        <details className="arc-note">
          <summary>{t("arcNote")}</summary>
          <p>{ex.arcNote}</p>
        </details>
      )}
      {/* Exemplo e base ficam em blocos separados, cada um com seus botões e seu andamento: ouvir o exemplo
          não mexe na base em que a pessoa vai tocar, e vice-versa. */}
      {shown && (
        <section className="block" aria-labelledby={`${ex.id}-example`}>
          <h2 id={`${ex.id}-example`} className="block-title">{t("example")}</h2>
          <div className="row">
            {examples.map((p, i) => {
              const on = example && running && i === mine.example;
              return (
                <button key={p.id} type="button" className="btn" onClick={on ? () => transport.stop() : () => playExample(i)} aria-pressed={on}>
                  {on ? t("stopExample") : examples.length > 1 ? t("playExampleN", { n: i + 1 }) : t("playExample")}
                </button>
              );
            })}
            <button type="button" className="btn" aria-expanded={tab} onClick={() => setTab((s) => !s)}>{tab ? t("hideTab") : t("showTab")}</button>
          </div>
          <label className="count-before">
            <input type="checkbox" checked={countBefore} onChange={(e) => setCountBeforeExample(e.target.checked)} />
            <span>{t("countBefore")}</span>
          </label>
          {/* Travado enquanto toca: o solo do exemplo é agendado inteiro na entrada e não acompanharia a mudança. */}
          <p className="note">{t("exampleTempo")}</p>
          <TempoControl bpm={exBpm} onChange={(n) => setPick({ ...mine, exBpm: n })} locked={example && running} />
          <ChordStrip base={ex.base!} live={example && running} />
          {tab && (
            <TextTab
              phrase={shown}
              now={running && example ? sounding : -1}
              chords={chordNames(ex.base!)}
              label={examples.length > 1 ? t("tabLabelN", { n: mine.example + 1 }) : t("tabLabel")}
            />
          )}
        </section>
      )}
      <section className={shown ? "block yours" : "yours"} aria-labelledby={shown ? `${ex.id}-yours` : undefined}>
        {shown && <h2 id={`${ex.id}-yours`} className="block-title">{t("yourTurn")}</h2>}
        <div className="take-options">
        {bases.length > 1 && (
          <label className="key-picker base-picker">
            <span>{t("base")}</span>
            <select value={mine.base} onChange={(e) => chooseBase(Number(e.target.value))}>
              {bases.map((b, i) => (
                <option key={i} value={i}>{`${chordNames(b).join(" ")} · ${t(`style.${b.style}`)} · ${b.bpm}`}</option>
              ))}
            </select>
          </label>
        )}
        <label className="key-picker base-picker">
          <span>{t("bars")}</span>
          <select value={bars} onChange={(e) => chooseBars(Number(e.target.value))}>
            {barOptions(ex).map((n) => (
              <option key={n} value={n}>{t(n === ex.bars ? "barsRecommended" : "barsN", { n })}</option>
            ))}
          </select>
        </label>
        </div>
        {/* A chave recria a barra ao trocar de base: o andamento volta ao da base escolhida. */}
        <BackingBar key={`${ex.id}-${mine.base}`} base={base} quiet={example} />
      </section>
    </div>
  );
}
