// Escrita das técnicas de uma nota da frase. Lógica pura, com teste.
import type { LeadNote } from "@/core/audio";
import { midiAt, noteName, type FretPos } from "@/core/theory";

/**
 * O gesto da nota, deduzido da casa e das alturas. Bend: sai da casa e sobe. Soltar: começa dobrada
 * e desce até a casa. Slide: vem de outra casa da mesma corda. `amount` em semitons (2 = um tom).
 */
export type Gesture = { kind: "bend" | "release"; amount: number } | { kind: "slide"; fromFret: number } | null;

export function gestureOf(n: LeadNote, pos: FretPos): Gesture {
  if (n.from === undefined || n.from === n.midi) return null;
  const at = midiAt(pos);
  if (n.from === at) return { kind: "bend", amount: n.midi - at };
  if (n.hold !== undefined) return { kind: "release", amount: n.from - at };
  return { kind: "slide", fromFret: pos.fret - (n.midi - n.from) };
}

const SIGN = { bend: "↑", release: "↓", slide: "/" } as const;

/** A nota escrita com o gesto: D4↑E4, A4↓G4, G3/A3, C5~. */
export function spell(n: LeadNote, pos: FretPos): string {
  const g = gestureOf(n, pos);
  return (g ? noteName(n.from!) + SIGN[g.kind] : "") + noteName(n.midi) + (n.vibrato ? "~" : "");
}
