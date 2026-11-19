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
  // O que as bolinhas dizem: o nome da nota, a função dela ou, nas lições de palhetada, o sentido da palheta.
  const [mode, setMode] = useState<"names" | "functions" | "up" | "down">(ex.picking ? "up" : "names");
  const functions = mode === "functions";
  const picking = mode === "up" || mode === "down";
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

  // Palhetada alternada: subindo, a 1ª nota de cada corda (a mais grave) é para cima e a 2ª para baixo; descendo, o contrário.
  const pick = (p: { string: number; fret: number }) => {
    const same = box.filter((q) => q.string === p.string).sort((a, b) => a.fret - b.fret);
    const first = same.findIndex((q) => q.fret === p.fret) % 2 === 0;
    return first === (mode === "up") ? "V" : "⊓";
  };
  let dots: Dot[];
  let anyOutside = false;
  if (ex.layer === "penta") {
    const text = (p: { string: number; fret: number }) => (picking ? pick(p) : name(p));
    dots = box.map((p) => (mod12(midiAt(p)) === root ? { ...p, kind: "root", label: text(p) } : { ...p, kind: "scale", label: text(p) }));
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
      <BackingBar base={base} />
      <Banner state={live ? "play" : null} word={chord.name} note={ex.layer === "chord" ? t("follow") : t("oneNote")} idle={t("idle")} />
      {ex.shapes.length > 1 && !ex.together && (
        <div className="seg" role="group" aria-label={t("shape")}>
          {ex.shapes.map((s) => (
            <button key={s} type="button" aria-pressed={s === shape} onClick={() => setShape(s)}>{t("shapeN", { n: s })}</button>
          ))}
        </div>
      )}
      <div className="seg" role="group" aria-label={t("labels")}>
        <button type="button" aria-pressed={mode === "names"} onClick={() => setMode("names")}>{t("names")}</button>
        <button type="button" aria-pressed={functions} onClick={() => setMode("functions")}>{t("functions")}</button>
        {ex.picking && <button type="button" aria-pressed={mode === "up"} onClick={() => setMode("up")}>{t("pickUp")}</button>}
        {ex.picking && <button type="button" aria-pressed={mode === "down"} onClick={() => setMode("down")}>{t("pickDown")}</button>}
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
      {picking && <p className="legend">{t("legendPick")}</p>}
    </div>
  );
}
