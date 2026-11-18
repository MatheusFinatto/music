// Sorteio dos alvos de "chegar na troca". Lógica pura, com teste.
import { toneOf, type Chord, type ChordDegree } from "@/core/theory";

/**
 * O grau-alvo do compasso `bar`. Determinístico (a mesma volta toca igual de novo) e sem repetir o
 * grau do compasso anterior: com três graus, a ordem gira a cada volta (T 3 5, 3 5 T, 5 T 3...).
 */
export function targetDegree(bar: number, degrees: readonly ChordDegree[]): ChordDegree {
  const n = degrees.length;
  if (n === 0) throw new Error("targetDegree: lista de graus vazia");
  const b = Math.max(0, bar);
  if (n === 2) return degrees[b % 2]!;
  return degrees[(b + Math.floor(b / n)) % n]!;
}

/**
 * Os graus de `degrees` cuja nota está na pentatônica do tom: o curso é só de pentatônica, então o alvo
 * nunca pede nota de fora (o Fá sobre F, o Si sobre G). Se nenhum grau servir, devolve a lista original.
 */
export function pentaDegrees(chord: Chord, degrees: readonly ChordDegree[], penta: readonly number[]): ChordDegree[] {
  const set = new Set(penta);
  const ok = degrees.filter((d) => set.has(toneOf(chord, d)));
  return ok.length ? ok : [...degrees];
}
