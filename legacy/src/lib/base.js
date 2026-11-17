// A base (acompanhamento): tom, progressão, andamento, estilo e mixagem.
import { load, save, onExternalChange } from "./store.js";
import { makeChord, keyLabel } from "./theory.js";

export const DEFAULT_BASE = {
  key: 0,                 // tônica do tom maior (0 = Dó; Am é o relativo)
  prog: [5, 3, 0, 4],     // graus: vi IV I V = Am F C G
  bpm: 72,
  style: "balada",
  mix: { drums: 70, bass: 75, chords: 60, master: 80 },
  click: false,
};

export const PRESETS = [
  ["Base do Diário", [5, 3, 0, 4]],
  ["Pop", [0, 4, 5, 3]],
  ["Balada", [0, 5, 3, 4]],
  ["Melancólica", [5, 2, 3, 4]],
  ["Descendo", [5, 4, 3, 4]],
  ["ii V I", [1, 4, 0, 5]],
  ["Menor", [5, 1, 2, 5]],
];

export const STYLES = {
  balada: {
    label: "Balada",
    kick:  [1,0,0,0, 0,0,0,0, 0,0,.6,0, 0,0,0,0],
    snare: [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    hat:   [.5,0,0,0, .35,0,0,0, .5,0,0,0, .35,0,0,0],
    bass:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  },
  rock: {
    label: "Rock",
    kick:  [1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:   [.55,0,.35,0, .55,0,.35,0, .55,0,.35,0, .55,0,.35,0],
    bass:  [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
  },
  pop: {
    label: "Pop",
    kick:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:   [.5,0,.3,0, .5,0,.3,0, .5,0,.3,0, .5,0,.3,0],
    bass:  [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,0,1,0],
  },
  acordes: {
    label: "Só acordes",
    kick: null, snare: null, hat: null,
    bass:  [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  },
};

let current = load("base", DEFAULT_BASE);
const subs = [];

export const getBase = () => current;
export const isDefaultBase = (b = current) => b.key === 0 && b.prog.join() === DEFAULT_BASE.prog.join();

export function setBase(patch) {
  current = { ...current, ...patch, mix: { ...current.mix, ...(patch.mix || {}) } };
  save("base", current);
  subs.forEach((f) => f(current));
}
export function resetBase() { setBase({ key: 0, prog: DEFAULT_BASE.prog.slice() }); }
export function onBaseChange(f) { subs.push(f); }
onExternalChange("base", () => { current = load("base", DEFAULT_BASE); subs.forEach((f) => f(current)); });

export const chordsOf = (b = current) => b.prog.map((d) => makeChord(d, b.key));
export const progName = (b = current) => chordsOf(b).map((c) => c.n).join(" ");
export { keyLabel };

// Deslocamento em semitons em relação ao tom padrão, na direção mais curta.
export const shiftOf = (b = current) => { const k = ((b.key % 12) + 12) % 12; return k <= 6 ? k : k - 12; };
