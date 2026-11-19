"use client";
import { onRadioKeyDown } from "@/core/ui/radioGroup";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { atAudioTime, getAudio, playPhrase, transport } from "@/core/audio";
import type { EchoExercise, Phrase } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { Board, chordNames, TextTab } from "../components/PhraseViews";
import { TabSlot } from "../components/tabDock";
import { useBeat, useRunning } from "../components/useTransport";
import { setCountBeforeExample, useCountBeforeExample } from "../progress";

/** Exemplo: a frase em loop (o padrão). Só a base: a pessoa sozinha. Alternado: o site toca e deixa o mesmo tanto para a pessoa (por último: ouvir e repetir foi o modo menos útil, segundo o dono). */
type Mode = "alternate" | "example" | "base";
const MODES: Mode[] = ["example", "base", "alternate"];

/** O site toca a frase, depois deixa o mesmo número de compassos para a pessoa responder. */
/** Abas agrupadas pelo começo do rótulo ("Solo 1: parte 2", "Solo 1 inteiro" ficam no grupo "Solo 1"). Poucas abas: um grupo só. */
function tabGroups(phrases: Phrase[], fallback: (i: number) => string) {
  const parse = (p: Phrase, i: number) => {
    const raw = p.label ?? fallback(i);
    const m = raw.match(/^(.+?)(?::\s*|\s+)(inteiro|parte\s.+)$/i);
    return { p, i, group: phrases.length > 5 && m ? m[1]!.trim() : "", label: phrases.length > 5 && m ? m[2]! : raw };
  };
  const out: { name: string; items: ReturnType<typeof parse>[] }[] = [];
  phrases.map(parse).forEach((x) => {
    const last = out.at(-1);
    if (last && last.name === x.group) last.items.push(x);
    else out.push({ name: x.group, items: [x] });
  });
  return out;
}

export function EchoEngine({ ex }: { ex: EchoExercise }) {
  const t = useTranslations("solos.echo");
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(false);
  /** Índice da nota que está soando agora (azul), ou -1. */
  const [sounding, setSounding] = useState(-1);
  const [mode, setMode] = useState<Mode>("example");
  const countBefore = useCountBeforeExample();
  const phrase = ex.phrases[index]!;
  // Cada aba pode ter a base dos seus compassos (a parte de um solo); trocar de aba com a base tocando para tudo.
  const base = phrase.base ?? ex.base!;
  const ref = useRef<Phrase>(phrase);
  useEffect(() => { ref.current = phrase; }, [phrase]);
  const modeRef = useRef<Mode>(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    let timers: (() => void)[] = [];
    const clear = () => { timers.forEach((c) => c()); timers = []; };
    const offBeat = transport.on("beat", (info) => {
      const p = ref.current, g = getAudio();
      if (!g || info.beatInBar !== 0 || info.bar < 0 || modeRef.current === "base") return;
      // Compasso a compasso, no andamento daquele compasso: mudar o andamento no meio da frase não a desalinha.
      const k = info.bar % (modeRef.current === "example" ? p.bars : p.bars * 2);
      if (k >= p.bars) return;
      if (k === 0) clear();
      const spb = transport.secondsPerBeat, from = k * 4;
      const inBar = p.notes.map((n, i) => ({ n, i })).filter(({ n }) => n.beat >= from && n.beat < from + 4);
      playPhrase(g, inBar.map(({ n }) => ({ ...n, beat: n.beat - from })), info.time, spb);
      for (const { n, i } of inBar) {
        timers.push(atAudioTime(info.time + (n.beat - from) * spb, () => setSounding(i)));
        timers.push(atAudioTime(info.time + (n.beat - from + n.dur) * spb, () => setSounding((s) => (s === i ? -1 : s))));
      }
    });
    const offStop = transport.on("stop", () => { clear(); setSounding(-1); });
    return () => { offBeat(); offStop(); clear(); };
  }, []);

  const beat = useBeat();
  const running = useRunning();
  const live = running && !!beat && beat.beat >= 0;
  const calling = live && mode !== "base" && (mode === "example" || beat.bar % (phrase.bars * 2) < phrase.bars);
  const now = running ? sounding : -1;
  const go = (i: number) => {
    if (i !== index && transport.running && (ex.phrases[i]!.base ?? ex.base) !== base) transport.stop();
    setIndex(i);
  };

  return (
    <div className="engine">
      {/* Quem começa é o exemplo: sem contagem, a não ser que a pessoa peça. Só a base: a pessoa começa, e conta. */}
      <BackingBar key={phrase.id} base={base} countIn={mode === "base" || countBefore ? 1 : 0} playLabel={mode === "base" ? undefined : t("play")} />
      <div className="play-mode">
        <div className="seg" role="radiogroup" aria-label={t("mode")} onKeyDown={onRadioKeyDown}>
          {MODES.map((m) => (
            <button key={m} type="button" role="radio" aria-checked={mode === m} tabIndex={mode === m ? 0 : -1} onClick={() => setMode(m)}>{t(`modes.${m}`)}</button>
          ))}
        </div>
        {mode !== "base" && (
          <label className="count-before">
            <input type="checkbox" checked={countBefore} onChange={(e) => setCountBeforeExample(e.target.checked)} />
            <span>{t("countBefore")}</span>
          </label>
        )}
      </div>
      {ex.phrases.length > 1 && (
        // Muitas abas (um solo em partes, em dois solos): uma fileira por grupo, com o nome do grupo à esquerda.
        <div className="tabs-groups" role="tablist" aria-label={t("which")}
          onKeyDown={(e) => {
            const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            const to = (index + d + ex.phrases.length) % ex.phrases.length;
            go(to);
            (e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[to])?.focus();
          }}>
          {tabGroups(ex.phrases, (i) => t("phraseN", { n: i + 1 })).map((g) => (
            <div key={g.name} className="seg">
              {g.name && <span className="seg-name" aria-hidden="true">{g.name}</span>}
              {g.items.map(({ p, i, label }) => (
                <button key={p.id} type="button" role="tab" aria-selected={i === index} tabIndex={i === index ? 0 : -1} aria-label={g.name ? `${g.name}: ${label}` : undefined} onClick={() => go(i)}>{label}</button>
              ))}
            </div>
          ))}
        </div>
      )}
      {(phrase.intro || phrase.steps) && (
        <div className="phrase-about">
          {phrase.intro && <p>{phrase.intro}</p>}
          {phrase.steps && (
            // A teoria da parte fica a um toque: não empurra o botão de tocar para fora da tela.
            <details key={phrase.id}>
              <summary>{t("aboutSteps", { n: phrase.steps.length })}</summary>
              <ol>{phrase.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            </details>
          )}
        </div>
      )}
      <Banner state={live ? (calling ? "call" : "play") : null} word={t(calling ? "listen" : "yourTurn")} note={phrase.name} idle={t(`idle.${mode}`)} />
      <div className="reveal">
        <div className="row">
          <button type="button" className="btn" aria-expanded={shown} onClick={() => setShown((s) => !s)}>
            {shown ? t(ex.reveal === "rhythm" ? "hideRhythm" : "hideBoard") : t(ex.reveal === "rhythm" ? "showRhythm" : "showTab")}
          </button>
        </div>
        {shown && (ex.reveal === "rhythm"
          ? <RhythmGrid phrase={phrase} now={now} label={t("rhythmLabel")} />
          : <Board phrase={phrase} now={now} label={t("tabLabel")} half={t("bendHalf")} full={t("bendFull")} />)}
      </div>
      {/* No eco o objetivo é tirar de ouvido: a tablatura começa fechada e abre no fim do exercício. */}
      {phrase.frets && <TabSlot label={t("textLabel")}><TextTab phrase={phrase} now={now} chords={chordNames(base)} label={t("textLabel")} /></TabSlot>}
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
