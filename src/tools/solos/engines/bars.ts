import type { TakeExercise } from "../curriculum/types";

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

/** Tamanhos que o seletor oferece, além do recomendado. */
const SIZES = [4, 8, 12, 16, 20, 24, 32];

/**
 * Quantos compassos a pessoa pode escolher para a tomada. `bars` do exercício é o recomendado, e sempre
 * está na lista. As outras opções fecham o ciclo de toda base oferecida e dividem o arco em partes iguais.
 *
 * Ex.: arco de 4 partes sobre Am F C G → [4, 8, 12, 16, 20, 24, 32].
 */
export function barOptions(ex: TakeExercise): number[] {
  const bases = [ex.base!, ...(ex.bases ?? [])];
  const unit = [ex.arc?.length ?? 1, ...bases.map((b) => b.prog.length)].reduce(lcm, 1);
  return [...new Set([...SIZES.filter((n) => n % unit === 0), ex.bars])].sort((a, b) => a - b);
}

/** O tamanho escolhido, se ainda for uma opção válida; senão, o recomendado. */
export function chosenBars(ex: TakeExercise, saved: number | undefined): number {
  return saved !== undefined && barOptions(ex).includes(saved) ? saved : ex.bars;
}
