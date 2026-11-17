// Sorteio dos alvos de "chegar na troca". Lógica pura, com teste.
import type { ChordDegree } from "@/core/theory";

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
