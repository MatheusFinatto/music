// Teoria: campo harmônico maior, nomes de notas e acordes, funções.

export const SCALE = [0, 2, 4, 5, 7, 9, 11];
export const DEG_ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const DEG_SUFFIX = ["", "m", "m", "", "", "m", "°"];

const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const FLAT_KEYS = new Set([1, 3, 5, 6, 8, 10]);

// Nome de nota com oitava para mostrar ao usuário (C4 = Dó central).
export const LETTER = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];
export const noteName = (m) => LETTER[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

export const pcName = (pc, key = 0) => (FLAT_KEYS.has(((key % 12) + 12) % 12) ? FLAT : SHARP)[((pc % 12) + 12) % 12];

// Função de um intervalo (semitons acima da fundamental).
export const IV = { 0: "T", 1: "b9", 2: "9", 3: "3", 4: "3", 5: "4", 6: "b5", 7: "5", 8: "b6", 9: "6", 10: "7", 11: "7" };

// Acorde do grau `deg` (0..6) no tom maior com tônica `key` (0 = Dó).
export function makeChord(deg, key = 0) {
  const k = ((key % 12) + 12) % 12;
  const r = (k + SCALE[deg]) % 12;
  const t = [r, (k + SCALE[(deg + 2) % 7]) % 12, (k + SCALE[(deg + 4) % 7]) % 12];
  const nine = (k + SCALE[(deg + 1) % 7]) % 12;
  let bass = r + 36;
  if (bass > 45) bass -= 12;
  const pad = t.map((pc) => { let m = pc + 48; while (m < 52) m += 12; return m; }).sort((a, b) => a - b);
  return {
    deg, key: k, r, t,
    n: pcName(r, k) + DEG_SUFFIX[deg],
    roman: DEG_ROMAN[deg],
    third: t[1],
    ninth: ((nine - r + 12) % 12) === 2 ? nine : null,
    bass, pad,
  };
}

export const fnOf = (m, ch) => IV[(((m - ch.r) % 12) + 12) % 12];

// Nome do tom: relativo menor e maior.
export function keyLabel(key) {
  const k = ((key % 12) + 12) % 12;
  return { minor: pcName((k + 9) % 12, k) + "m", major: pcName(k, k) };
}

// Pentatônica do relativo menor (as mesmas notas da pentatônica maior do tom).
export const pentatonic = (key) => [0, 3, 5, 7, 10].map((x) => (((key + 9 + x) % 12) + 12) % 12);

// Converte nomes antigos (tom de Dó) em graus.
const LEGACY = { C: 0, Dm: 1, Em: 2, F: 3, G: 4, Am: 5, Bdim: 6 };
export const legacyToDegrees = (names) => names.map((n) => LEGACY[n] ?? 0);

// Guitarra: posição preferida na região da casa 5.
export const OPEN = [64, 59, 55, 50, 45, 40];
export const STRING_LETTER = ["e", "B", "G", "D", "A", "E"];
export function place(m) {
  let best = null;
  for (let s = 0; s < 6; s++) {
    const f = m - OPEN[s];
    if (f < 0 || f > 17) continue;
    const cost = (f >= 4 && f <= 10 ? 0 : 10) + Math.abs(f - 6.5) + s * 0.01;
    if (!best || cost < best.c) best = { s, f, c: cost };
  }
  return best;
}
