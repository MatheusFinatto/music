"use client";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { chordsOf, degreeIn, fretSpan, midiAt, minorPentatonic, mod12, pcName, pentatonicShape, pentatonicShapes, positionsOf } from "@/core/theory";
import type { MapExercise } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { Fretboard, type Dot } from "../components/Fretboard";
import { useBeat } from "../components/useTransport";

/** Função de cada nota da pentatônica menor, contada da tônica: pensar 1, ♭3, 4, 5, ♭7 ajuda a levar o shape a outro tom. */
const FUNCTION: Record<number, string> = { 0: "1", 3: "♭3", 5: "4", 7: "5", 10: "♭7" };

export function MapEngine({ ex }: { ex: MapExercise }) {
  const t = useTranslations("solos.map");
  const format = useFormatter();
  const base = ex.base!;
  const [shape, setShape] = useState(ex.shapes[0]!);
  const [picked, setPicked] = useState(0);
  const [functions, setFunctions] = useState(false);
  const beat = useBeat();
  const live = !!beat && beat.beat >= 0;
  const chords = chordsOf(base.prog, base.key);
  // Com a base tocando, o acorde mostrado acompanha a música.
  const chordIndex = live ? beat.barInCycle : picked;
  const chord = chords[chordIndex]!;

  const box = ex.together ? pentatonicShapes(base.key, ex.shapes) : pentatonicShape(base.key, shape);
  const [lo, hi] = fretSpan(box);
  const root = mod12(base.key + 9);
  const penta = new Set(minorPentatonic(base.key));
  const name = (p: { string: number; fret: number }) =>
    functions ? FUNCTION[mod12(midiAt(p) - root)] ?? pcName(midiAt(p), base.key) : pcName(midiAt(p), base.key);

  let dots: Dot[];
  let anyOutside = false;
  if (ex.layer === "penta") {
    dots = box.map((p) => (mod12(midiAt(p)) === root ? { ...p, kind: "root", label: name(p) } : { ...p, kind: "scale", label: name(p) }));
  } else {
    const tones = positionsOf(chord.tones, lo, hi);
    const isTone = new Set(tones.map((p) => `${p.string}-${p.fret}`));
    anyOutside = tones.some((p) => !penta.has(mod12(midiAt(p))));
    dots = [
      ...box.filter((p) => !isTone.has(`${p.string}-${p.fret}`)).map((p): Dot => ({ ...p, kind: "scale", label: name(p) })),
      ...tones.map((p): Dot => ({ ...p, kind: "target", label: degreeIn(midiAt(p), chord)!, outside: !penta.has(mod12(midiAt(p))) })),
    ];
  }

  return (
    <div className="engine">
      <Banner state={live ? "play" : null} word={chord.name} note={ex.layer === "chord" ? t("follow") : t("oneNote")} idle={t("idle")} />
      {ex.shapes.length > 1 && !ex.together && (
        <div className="seg" role="group" aria-label={t("shape")}>
          {ex.shapes.map((s) => (
            <button key={s} type="button" aria-pressed={s === shape} onClick={() => setShape(s)}>{t("shapeN", { n: s })}</button>
          ))}
        </div>
      )}
      <div className="seg" role="group" aria-label={t("labels")}>
        <button type="button" aria-pressed={!functions} onClick={() => setFunctions(false)}>{t("names")}</button>
        <button type="button" aria-pressed={functions} onClick={() => setFunctions(true)}>{t("functions")}</button>
      </div>
      {ex.layer === "chord" && (
        <div className="seg" role="group" aria-label={t("chord")}>
          {chords.map((c, i) => (
            <button key={i} type="button" aria-pressed={i === chordIndex} onClick={() => setPicked(i)} disabled={live}>{c.name}</button>
          ))}
        </div>
      )}
      <Fretboard minFret={lo} maxFret={hi} dots={dots} label={ex.layer === "chord" ? t("labelChord", { chord: chord.name }) : ex.together ? t("labelTogether", { shapes: format.list(ex.shapes.map(String)) }) : t("labelPenta", { n: shape })} />
      {anyOutside && <p className="legend">{t("legendOutside")}</p>}
      <BackingBar base={base} />
    </div>
  );
}
