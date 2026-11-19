"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { chordsOf, degreeIn, midiAt, minorPentatonic, mod12, pcName, positionsOf } from "@/core/theory";
import type { LineExercise } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { Fretboard, type Dot } from "../components/Fretboard";
import { useBeat } from "../components/useTransport";

/** Uma corda só: a pentatônica ao longo do braço, com as notas do acorde da vez em laranja. */
export function LineEngine({ ex }: { ex: LineExercise }) {
  const t = useTranslations("solos.line");
  const base = ex.base!;
  const [picked, setPicked] = useState(0);
  const beat = useBeat();
  const live = !!beat && beat.beat >= 0;
  const chords = chordsOf(base.prog, base.key);
  const chord = chords[live ? beat.barInCycle : picked]!;
  const [lo, hi] = ex.frets;
  const notes = positionsOf(minorPentatonic(base.key), lo, hi).filter((p) => p.string === ex.string);
  const dots: Dot[] = notes.map((p) => {
    const d = degreeIn(midiAt(p), chord);
    return d ? { ...p, kind: "target", label: d } : { ...p, kind: "scale", label: pcName(mod12(midiAt(p)), base.key) };
  });

  return (
    <div className="engine">
      <BackingBar base={base} />
      <Banner state={live ? "play" : null} word={chord.name} note={t("follow", { n: ex.string + 1 })} idle={t("idle", { n: ex.string + 1 })} />
      {chords.length > 1 && (
        <div className="seg" role="group" aria-label={t("chord")}>
          {chords.map((c, i) => (
            <button key={i} type="button" aria-pressed={c === chord} onClick={() => setPicked(i)} disabled={live}>{c.name}</button>
          ))}
        </div>
      )}
      <Fretboard minFret={lo} maxFret={hi} dots={dots} label={t("label", { n: ex.string + 1, chord: chord.name })} />
    </div>
  );
}
