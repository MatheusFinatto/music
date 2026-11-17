// O gesto de uma nota da frase (bend, soltar, slide), deduzido da casa e das alturas. Lógica pura, com teste.
import type { LeadNote } from "@/core/audio";
import { midiAt, type FretPos } from "@/core/theory";

/**
 * Bend: sai da casa e sobe. Soltar: começa dobrada e desce até a casa. Slide: vem de outra casa da
 * mesma corda. `amount` em semitons (2 = um tom).
 */
export type Gesture = { kind: "bend" | "release"; amount: number } | { kind: "slide"; fromFret: number } | null;

export function gestureOf(n: LeadNote, pos: FretPos): Gesture {
  if (n.from === undefined || n.from === n.midi) return null;
  const at = midiAt(pos);
  if (n.from === at) return { kind: "bend", amount: n.midi - at };
  if (n.hold !== undefined) return { kind: "release", amount: n.from - at };
  return { kind: "slide", fromFret: pos.fret - (n.midi - n.from) };
}
