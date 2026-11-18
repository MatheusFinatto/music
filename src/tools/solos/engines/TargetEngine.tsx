"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { chordsOf, degreeIn, fretSpan, midiAt, minorPentatonic, pentatonicShapes, positionsOf, toneOf } from "@/core/theory";
import type { TargetExercise } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { Fretboard, type Dot } from "../components/Fretboard";
import { useBeat } from "../components/useTransport";
import { pentaDegrees, targetDegree } from "./target";

/**
 * Chegar na troca. Na primeira metade do compasso, o alvo é o do acorde que está soando (você já devia
 * estar nele); na segunda metade, passa a ser o do próximo acorde, para dar tempo de ir até lá.
 */
export function TargetEngine({ ex }: { ex: TargetExercise }) {
  const t = useTranslations("solos.target");
  const base = ex.base!;
  const chords = chordsOf(base.prog, base.key);
  const beat = useBeat();
  const [board, setBoard] = useState(false);
  const live = !!beat && beat.beat >= 0;
  const ahead = live && beat.beatInBar >= 2;
  const bar = live ? beat.bar + (ahead ? 1 : 0) : 0;
  const chord = chords[bar % chords.length]!;
  const degree = targetDegree(bar, pentaDegrees(chord, ex.degrees, minorPentatonic(base.key)));
  const name = t(`degree.${degree}`);

  const line = ex.line;
  const box = line
    ? positionsOf(minorPentatonic(base.key), line.frets[0], line.frets[1]).filter((p) => p.string === line.string)
    : pentatonicShapes(base.key, [ex.shape].flat());
  const [lo, hi] = line ? line.frets : fretSpan(box);
  const targets = positionsOf([toneOf(chord, degree)], lo, hi).filter((p) => !line || p.string === line.string);
  const isTarget = new Set(targets.map((p) => `${p.string}-${p.fret}`));
  const dots: Dot[] = [
    ...box.filter((p) => !isTarget.has(`${p.string}-${p.fret}`)).map((p): Dot => ({ ...p, kind: "scale" })),
    ...targets.map((p): Dot => ({ ...p, kind: "target", label: degreeIn(midiAt(p), chord)! })),
  ];

  const word = ex.blind ? name : t("word", { degree: name, chord: chord.name });
  const note = !live ? undefined : ahead ? t("next") : t("now");
  const showBoard = !ex.blind || board;

  return (
    <div className="engine">
      {ex.rule && <p className="rule">{ex.rule}</p>}
      <Banner state={live ? (ahead ? "call" : "play") : null} word={word} note={note} idle={t(ex.blind ? "idleBlind" : "idle", { first: word })} />
      <BackingBar base={base} hideChords={ex.blind} />
      {ex.blind && (
        <div className="reveal">
          <button type="button" className="btn" aria-expanded={board} onClick={() => setBoard((b) => !b)}>{board ? t("hideBoard") : t("showBoard")}</button>
        </div>
      )}
      {showBoard && (
        <Fretboard minFret={lo} maxFret={hi} dots={dots} label={t("board", { degree: name, chord: ex.blind ? "?" : chord.name })} />
      )}
    </div>
  );
}
