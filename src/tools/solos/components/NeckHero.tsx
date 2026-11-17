"use client";
import { midiAt, minorPentatonic, mod12, pcName, positionsOf } from "@/core/theory";
import { Fretboard, type Dot } from "./Fretboard";

/** Abertura da ferramenta: o braço inteiro, com a pentatônica de Lá menor acendendo em onda. */
export function NeckHero({ label }: { label: string }) {
  const root = 9;
  const dots: Dot[] = positionsOf(minorPentatonic(0), 3, 12)
    // da 6ª corda para a 1ª, casa a casa: a onda sobe o braço como uma escala
    .sort((a, b) => a.fret - b.fret || b.string - a.string)
    .map((p) => ({ ...p, kind: mod12(midiAt(p)) === root ? "root" : "scale", label: pcName(midiAt(p)) }));
  return (
    <div className="neck-hero" aria-hidden="true">
      <Fretboard minFret={3} maxFret={12} dots={dots} label={label} plain />
    </div>
  );
}
