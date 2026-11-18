// Teoria musical compartilhada. TypeScript puro, sem interface e sem navegador.
// Classe de altura (pc) = 0..11, com 0 = Dó. Notas MIDI: 60 = C4 (Dó central).

export type Pc = number;
export type Midi = number;

export const mod12 = (n: number): Pc => ((n % 12) + 12) % 12;

const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;
/** Tons maiores escritos com bemol (F, Bb, Eb, Ab, Db, Gb). */
const FLAT_KEYS = new Set([1, 3, 5, 6, 8, 10]);

/** Nome da classe de altura no contexto de um tom maior (`key` = tônica do tom maior). */
export const pcName = (pc: number, key = 0): string => (FLAT_KEYS.has(mod12(key)) ? FLAT : SHARP)[mod12(pc)]!;

/** Nome com oitava no formato do site: C4, Bb3, F#4. */
export const noteName = (m: Midi, key = 0): string => pcName(m, key) + (Math.floor(m / 12) - 1);

/** Frequência em Hz de uma nota MIDI (aceita fração, para bends). */
export const hz = (m: number, a4 = 440): number => a4 * Math.pow(2, (m - 69) / 12);

// ---------- campo harmônico maior ----------

export const MAJOR_SCALE = [0, 2, 4, 5, 7, 9, 11] as const;
const ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"] as const;
const SUFFIX = ["", "m", "m", "", "", "m", "°"] as const;

/** Função de uma nota dentro do acorde. */
export type ChordDegree = "T" | "3" | "5";
export const CHORD_DEGREES: readonly ChordDegree[] = ["T", "3", "5"];

export type Chord = {
  /** Grau no campo harmônico, 0..6. */
  deg: number;
  /** Tônica do tom maior. */
  key: Pc;
  name: string;
  roman: string;
  /** Classes de altura: tônica, terça, quinta. */
  tones: readonly [Pc, Pc, Pc];
};

const scalePc = (key: number, i: number): Pc => mod12(key + MAJOR_SCALE[((i % 7) + 7) % 7]!);

/** Acorde do grau `deg` (0..6) do tom maior de tônica `key`. Ex.: makeChord(5, 0) = Am. */
export function makeChord(deg: number, key = 0): Chord {
  const k = mod12(key);
  const tones = [scalePc(k, deg), scalePc(k, deg + 2), scalePc(k, deg + 4)] as const;
  return { deg, key: k, name: pcName(tones[0], k) + SUFFIX[deg]!, roman: ROMAN[deg]!, tones };
}

export const chordsOf = (progression: readonly number[], key = 0): Chord[] => progression.map((d) => makeChord(d, key));

/** T, 3 ou 5 se a nota pertence ao acorde; senão null. */
export function degreeIn(pc: number, chord: Chord): ChordDegree | null {
  const i = chord.tones.indexOf(mod12(pc));
  return i < 0 ? null : CHORD_DEGREES[i]!;
}

export const toneOf = (chord: Chord, degree: ChordDegree): Pc => chord.tones[CHORD_DEGREES.indexOf(degree)]!;

/** Pentatônica menor do relativo (as mesmas notas da pentatônica maior do tom). Am para key = 0. */
export const minorPentatonic = (key = 0): Pc[] => [0, 3, 5, 7, 10].map((x) => mod12(key + 9 + x));

/** Nome do tom: relativo menor e maior. */
export const keyLabel = (key: number) => ({ minor: pcName(key + 9, key) + "m", major: pcName(key, key) });

// ---------- braço da guitarra ----------

/** Cordas soltas em afinação padrão. Índice 0 = Mi agudo (1ª corda), 5 = Mi grave (6ª). */
export const STANDARD_TUNING: readonly Midi[] = [64, 59, 55, 50, 45, 40];

export type FretPos = { string: number; fret: number };

export const midiAt = (p: FretPos, tuning: readonly Midi[] = STANDARD_TUNING): Midi => tuning[p.string]! + p.fret;

/** Todas as posições de um conjunto de classes de altura entre duas casas. */
export function positionsOf(pcs: readonly Pc[], minFret = 0, maxFret = 15, tuning: readonly Midi[] = STANDARD_TUNING): FretPos[] {
  const set = new Set(pcs.map(mod12));
  const out: FretPos[] = [];
  for (let string = 0; string < tuning.length; string++)
    for (let fret = minFret; fret <= maxFret; fret++) if (set.has(mod12(tuning[string]! + fret))) out.push({ string, fret });
  return out;
}

/**
 * Um dos 5 desenhos da pentatônica menor (shape 1..5), duas notas por corda.
 * O desenho N começa na N-ésima nota da escala na 6ª corda. Regra: em cada corda, as duas
 * primeiras notas da escala a partir de uma casa antes do início do desenho.
 */
export function pentatonicShape(key: number, shape: number, tuning: readonly Midi[] = STANDARD_TUNING): FretPos[] {
  const scale = minorPentatonic(key);
  const startPc = scale[(((shape - 1) % 5) + 5) % 5]!;
  let start = mod12(startPc - tuning[tuning.length - 1]!);
  if (start === 0) start = 12; // prefere a região com casas presas a cordas soltas
  const set = new Set(scale);
  const out: FretPos[] = [];
  for (let string = 0; string < tuning.length; string++) {
    let found = 0;
    for (let fret = start - 1; found < 2 && fret <= start + 6; fret++) {
      if (set.has(mod12(tuning[string]! + fret))) { out.push({ string, fret }); found++; }
    }
  }
  return out;
}

/** Vários desenhos juntos, sem repetir posição. Ex.: pentatonicShapes(0, [1, 2]) → desenhos 1 e 2 de Lá menor. */
export function pentatonicShapes(key: number, shapes: readonly number[], tuning: readonly Midi[] = STANDARD_TUNING): FretPos[] {
  const seen = new Set<string>();
  return shapes.flatMap((s) => pentatonicShape(key, s, tuning)).filter((p) => {
    const k = `${p.string}-${p.fret}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Menor e maior casa de um conjunto de posições. */
export function fretSpan(positions: readonly FretPos[]): [number, number] {
  const frets = positions.map((p) => p.fret);
  return [Math.min(...frets), Math.max(...frets)];
}
