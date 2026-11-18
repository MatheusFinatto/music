// Tom de prática: o conteúdo é escrito em Lá menor e deslocado para o tom escolhido. Lógica pura.
// Exercícios escritos de propósito em outro tom (a unidade "Outro tom") não mudam.
import { mod12, keyLabel } from "@/core/theory";
import type { Exercise, Phrase } from "./types";

/** Os 12 tons de prática, pela tônica do tom maior (0 = Dó maior = Lá menor): Am, A#m, Bm... */
export const PRACTICE_KEYS: readonly number[] = Array.from({ length: 12 }, (_, i) => i);

/** Casa da tônica menor na 6ª corda: onde começa o desenho 1 (Lá menor: casa 5; Mi menor: casa 12). */
export const rootFret = (key: number): number => mod12(key + 9 - 4) || 12;

/** Quantas casas o desenho 1 se move em relação a Lá menor (de -4 a +7). */
export const keyOffset = (key: number): number => rootFret(key) - rootFret(0);

/** Nome do tom de prática: "Am", "Em", "F#m". */
export const keyName = (key: number): string => keyLabel(key).minor;

export function transposePhrase(p: Phrase, shift: number): Phrase {
  if (shift === 0) return p;
  return {
    ...p,
    notes: p.notes.map((n) => ({ ...n, midi: n.midi + shift, ...(n.from !== undefined ? { from: n.from + shift } : {}) })),
    ...(p.frets ? { frets: p.frets.map((f) => ({ ...f, fret: f.fret + shift })) } : {}),
  };
}

/** Casa mais alta usada: violão de aço e guitarra comuns têm 20 ou mais. Frase de até 9 casas cabe nos 12 tons. */
const MAX_FRET = 20;

/**
 * O deslocamento que leva a frase para o tom: o do desenho, ou uma oitava abaixo ou acima se a frase
 * sairia do braço. Frase sem casas (ritmo numa nota só) fica na oitava mais próxima. Null: não cabe.
 */
export function fitShift(p: Phrase, offset: number): number | null {
  if (!p.frets) return Math.abs(offset) <= 6 ? offset : offset - 12 * Math.sign(offset);
  for (const s of [offset, offset - 12, offset + 12]) if (p.frets.every((f) => f.fret + s >= 0 && f.fret + s <= MAX_FRET)) return s;
  return null;
}

function fit(p: Phrase, offset: number): Phrase {
  const s = fitShift(p, offset);
  if (s === null) throw new Error(`frase ${p.id} não cabe no braço com deslocamento ${offset}`);
  return transposePhrase(p, s);
}

/** O exercício no tom de prática `key`. Só muda o que foi escrito em Lá menor. */
export function transposeExercise(ex: Exercise, key: number): Exercise {
  if (!ex.base || ex.base.key !== 0 || mod12(key) === 0) return ex;
  const off = keyOffset(key);
  const base = { ...ex.base, key: mod12(key) };
  if (ex.kind === "echo") return { ...ex, base, phrases: ex.phrases.map((p) => fit(p, off)) };
  if (ex.kind === "take")
    return {
      ...ex,
      base,
      ...(ex.examples ? { examples: ex.examples.map((p) => fit(p, off)) } : {}),
      // As outras bases acompanham o tom; a que foi escrita em outro tom de propósito fica.
      ...(ex.bases ? { bases: ex.bases.map((b) => (b.key === 0 ? { ...b, key: mod12(key) } : b)) } : {}),
    };
  return { ...ex, base };
}
