// Formato do conteúdo de "Como fazer solos". O conteúdo é dado: acrescentar lição não mexe em código.
import type { LeadNote, StyleName } from "@/core/audio";
import type { ChordDegree, FretPos } from "@/core/theory";

/** A base que toca por baixo do exercício. `prog` são graus do campo harmônico (5 = vi). */
export type Base = { key: number; prog: number[]; bpm: number; style: StyleName };

type Common = {
  /** Identificador estável: o progresso do usuário é guardado por ele. Nunca reutilize. */
  id: string;
  title: string;
  /** O que fazer, em uma frase. */
  goal: string;
  steps: string[];
  /** Pergunta de autoavaliação, respondida com "consegui / quase / ainda não". */
  check: string;
  base?: Base;
};

/** Mostra desenhos da pentatônica ou as notas de cada acorde dentro de um desenho. */
export type MapExercise = Common & { kind: "map"; shapes: number[]; layer: "penta" | "chord" };

/** O site pede uma nota ("a 3ª de F") e a pessoa aponta no braço. Corrigido na hora. */
export type FindExercise = Common & { kind: "find"; shape: number; ask: ChordDegree[]; rounds: number };

/** A base marca compassos de tocar e de calar, em ciclo. */
export type PlayRestExercise = Common & { kind: "play-rest"; pattern: ("play" | "rest")[]; rule?: string };

/** Frase curta com a posição de cada nota no braço (mesma ordem de `notes`). */
export type Phrase = { id: string; name: string; bars: number; notes: LeadNote[]; frets?: FretPos[] };

/** O site toca, a pessoa repete de ouvido. A escrita só aparece quando ela pede. */
export type EchoExercise = Common & { kind: "echo"; phrases: Phrase[]; reveal: "rhythm" | "tab" };

/** Tomada livre sobre a base, seguida de uma escuta guiada. */
export type TakeExercise = Common & { kind: "take"; bars: number };

export type Exercise = MapExercise | FindExercise | PlayRestExercise | EchoExercise | TakeExercise;

export type Lesson = {
  id: string;
  title: string;
  /** Por que isto importa, em 2 ou 3 frases. */
  intro: string;
  exercises: Exercise[];
  /** Exercício refeito "a frio" no começo da sessão seguinte. */
  key: string;
};

export type Unit = {
  id: string;
  title: string;
  skill: string;
  lessons: Lesson[];
  /** Pergunta da tomada livre enquanto a pessoa está nesta unidade: cobra o que a unidade ensina. */
  takeCheck?: string;
};

export type Curriculum = {
  /** A trilha, na ordem recomendada. Nada é travado: a pessoa faz na ordem que quiser. */
  units: Unit[];
  /** Frases para tirar de ouvido, em ordem de dificuldade. A sessão sugerida traz uma por vez. */
  phrases: EchoExercise[];
  /** Tomada livre que fecha toda sessão. */
  take: TakeExercise;
};
