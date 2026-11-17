// Formato do conteúdo de "Como solar no violão e na guitarra". O conteúdo é dado: acrescentar lição não mexe em código.
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

/** Uma corda só, ao longo do braço: as notas da pentatônica e, em laranja, as do acorde que está soando. */
export type LineExercise = Common & { kind: "line"; string: number; frets: [number, number] };

/** O site pede uma nota ("a 3ª de F") e a pessoa aponta no braço. Corrigido na hora. */
export type FindExercise = Common & { kind: "find"; shape: number; ask: ChordDegree[]; rounds: number };

/** A base marca compassos de tocar e de calar, em ciclo. */
export type PlayRestExercise = Common & { kind: "play-rest"; pattern: ("play" | "rest")[]; rule?: string };

/** Frase curta com a posição de cada nota no braço (mesma ordem de `notes`). */
export type Phrase = { id: string; name: string; bars: number; notes: LeadNote[]; frets?: FretPos[] };

/** O site toca, a pessoa repete de ouvido. A escrita só aparece quando ela pede. */
export type EchoExercise = Common & { kind: "echo"; phrases: Phrase[]; reveal: "rhythm" | "tab" };

/**
 * A cada troca de acorde, o site sorteia um grau (tônica, 3ª ou 5ª) do acorde que vem e a pessoa
 * chega nele. O alvo é anunciado na segunda metade do compasso anterior. `blind` esconde os nomes
 * dos acordes e o braço: a troca tem que ser ouvida.
 */
export type TargetExercise = Common & {
  kind: "target";
  shape: number;
  degrees: ChordDegree[];
  rule?: string;
  blind?: boolean;
  /** Em vez do desenho, uma corda só (índice 0 = 1ª corda), entre as casas `frets`. */
  line?: { string: number; frets: [number, number] };
};

/**
 * Tomada livre sobre a base, seguida de uma escuta guiada. `arc` divide a tomada em partes iguais,
 * cada uma com uma indicação curta (ex.: "grave, poucas notas"): para treinar o desenho do solo inteiro.
 */
export type TakeExercise = Common & {
  kind: "take";
  bars: number;
  arc?: string[];
  /** Solo de exemplo, tocado sobre a base por um botão próprio (não é eco: a pessoa ouve quando quiser). */
  example?: Phrase;
};

export type Exercise = MapExercise | LineExercise | FindExercise | PlayRestExercise | EchoExercise | TargetExercise | TakeExercise;

export type Lesson = {
  id: string;
  title: string;
  /** Por que isto importa, em 2 ou 3 frases. */
  intro: string;
  exercises: Exercise[];
  /** Exercício refeito "a frio" no começo da sessão seguinte. */
  key: string;
  /**
   * Perguntas de teoria que a lição pressupõe ("O que é a tônica de um acorde?"). O site não explica teoria:
   * cada pergunta vira um link para a busca do Google com a frase exata.
   */
  concepts?: string[];
};

export type Unit = {
  id: string;
  title: string;
  skill: string;
  lessons: Lesson[];
  /** Pergunta da tomada livre enquanto a pessoa está nesta unidade: cobra o que a unidade ensina. */
  takeCheck?: string;
  /** Arco de fim de seção: o solo que junta o que a seção ensinou. */
  arc?: boolean;
};

/** Um trecho da trilha. A última unidade de cada seção é o arco dela. */
export type Section = { id: string; title: string; goal: string; units: string[] };

export type Curriculum = {
  /** A trilha, na ordem recomendada. Nada é travado: a pessoa faz na ordem que quiser. */
  units: Unit[];
  /** As unidades agrupadas, na mesma ordem de `units`. */
  sections: Section[];
  /** Frases para tirar de ouvido, em ordem de dificuldade. A sessão sugerida traz uma por vez. */
  phrases: EchoExercise[];
  /** Tomada livre que fecha toda sessão. */
  take: TakeExercise;
};
