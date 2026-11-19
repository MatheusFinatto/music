// Exemplos tocados para os exercícios que não têm um (mapa, alvo, tocar e calar, tomada sem exemplo). Lógica pura:
// o exemplo sai do desenho e da base do próprio exercício, no tom dele, e acompanha o tom de prática como o resto.
import type { LeadNote } from "@/core/audio";
import { chordsOf, midiAt, minorPentatonic, pentatonicShape, pentatonicShapes, positionsOf, type FretPos } from "@/core/theory";
import type { Base, Curriculum, Exercise, Phrase } from "./types";

type Step = { pos: FretPos; beat: number; dur: number };

function build(id: string, name: string, bars: number, steps: Step[]): Phrase {
  const notes: LeadNote[] = steps.map(({ pos, beat, dur }) => ({ midi: midiAt(pos), beat, dur }));
  return { id, name, bars, notes, frets: steps.map((s) => s.pos) };
}

const byPitch = (a: FretPos, b: FretPos) => midiAt(a) - midiAt(b);

/** O desenho sem notas repetidas (dois desenhos juntos repetem as casas que dividem), do grave ao agudo. */
function ladder(box: FretPos[]): FretPos[] {
  const seen = new Set<number>();
  return [...box].sort(byPitch).filter((p) => {
    const m = midiAt(p);
    if (seen.has(m)) return false;
    seen.add(m);
    return true;
  });
}

const shapeBox = (base: Base, shapes: number[], together = false): FretPos[] =>
  together && shapes.length > 1 ? pentatonicShapes(base.key, shapes) : pentatonicShape(base.key, shapes[0] ?? 1);

/** Sobe o desenho e desce: o que o mapa mostra, tocado. */
function runDemo(ex: Exercise, shapes: number[], together: boolean): Phrase | null {
  if (!ex.base) return null;
  const up = ladder(shapeBox(ex.base, shapes, together)).slice(0, 12);
  const seq = [...up, ...[...up].reverse().slice(1)];
  const steps = seq.map((pos, i) => ({ pos, beat: i * 0.5, dur: i === seq.length - 1 ? 2 : 0.5 }));
  const end = steps.at(-1)!.beat + steps.at(-1)!.dur;
  return build(`demo.${ex.id}`, "", Math.ceil(end / 4), steps);
}

/** A corda do exercício, subindo e descendo pelas notas da penta, num trecho do começo do intervalo dele. */
function lineDemo(ex: Exercise, string: number, frets: [number, number]): Phrase | null {
  if (!ex.base) return null;
  const all = ladder(positionsOf(minorPentatonic(ex.base.key), frets[0], frets[1]).filter((p) => p.string === string));
  // Só um trecho de até 9 casas: um exemplo mais largo não cabe no braço em todos os tons de prática.
  const up = all.filter((p) => p.fret - all[0]!.fret <= 9).slice(0, 8);
  if (up.length < 2) return null;
  const seq = [...up, ...[...up].reverse().slice(1)];
  const steps = seq.map((pos, i) => ({ pos, beat: i * 0.5, dur: i === seq.length - 1 ? 2 : 0.5 }));
  const end = steps.at(-1)!.beat + steps.at(-1)!.dur;
  return build(`demo.${ex.id}`, "", Math.ceil(end / 4), steps);
}

/** Os tons do acorde dentro do desenho, um acorde por compasso, em arpejo. */
function chordRunDemo(ex: Exercise, shapes: number[], together: boolean): Phrase | null {
  if (!ex.base) return null;
  const box = shapeBox(ex.base, shapes, together);
  const lo = Math.min(...box.map((p) => p.fret)), hi = Math.max(...box.map((p) => p.fret));
  const chords = chordsOf(ex.base.prog, ex.base.key).slice(0, 4);
  const steps: Step[] = [];
  chords.forEach((c, bar) => {
    const tones = ladder(positionsOf(c.tones, lo, hi)).slice(0, 4);
    tones.forEach((pos, i) => steps.push({ pos, beat: bar * 4 + i, dur: i === tones.length - 1 ? 1 : 0.9 }));
  });
  return steps.length ? build(`demo.${ex.id}`, "", chords.length, steps) : null;
}

/**
 * Um compasso: duas notas de passagem do desenho e pouso numa nota do acorde que está soando, segurada.
 * `grow` aumenta o número de notas de passagem (o solo que cresce).
 */
function lickBar(box: FretPos[], tones: FretPos[], bar: number, prev: FretPos | null, grow = 2): Step[] {
  const scale = ladder(box);
  const target = [...tones].sort((a, b) => Math.abs(midiAt(a) - (prev ? midiAt(prev) : 69)) - Math.abs(midiAt(b) - (prev ? midiAt(prev) : 69)))[0];
  if (!target) return [];
  const k = scale.findIndex((p) => midiAt(p) >= midiAt(target));
  const at = k < 0 ? scale.length - 1 : k;
  const dir = at >= 2 ? -1 : 1;
  const lead: FretPos[] = [];
  for (let i = grow; i >= 1; i--) {
    const q = scale[Math.min(scale.length - 1, Math.max(0, at + dir * i))];
    if (q) lead.push(q);
  }
  const steps: Step[] = lead.map((pos, i) => ({ pos, beat: bar * 4 + 0.5 + i * 0.5, dur: 0.5 }));
  const landing = 0.5 + lead.length * 0.5;
  steps.push({ pos: target, beat: bar * 4 + landing, dur: Math.min(1.5, 4 - landing) });
  return steps;
}

/** Uma frase por compasso de tocar, pousando no acorde da vez; os compassos de calar ficam em silêncio. */
function lickDemo(ex: Exercise, shape: number | number[], pattern: ("play" | "rest")[] | null, bars: number, growing = false): Phrase | null {
  if (!ex.base) return null;
  const shapes = Array.isArray(shape) ? shape : [shape];
  const box = shapeBox(ex.base, shapes, true);
  const lo = Math.min(...box.map((p) => p.fret)), hi = Math.max(...box.map((p) => p.fret));
  const chords = chordsOf(ex.base.prog, ex.base.key);
  const steps: Step[] = [];
  let prev: FretPos | null = null;
  for (let bar = 0; bar < bars; bar++) {
    if (pattern && pattern[bar % pattern.length] === "rest") continue;
    const c = chords[bar % chords.length]!;
    const bar_steps = lickBar(box, positionsOf(c.tones, lo, hi), bar, prev, growing ? Math.min(2 + (bar % 3), 4) : 2);
    steps.push(...bar_steps);
    prev = bar_steps.at(-1)?.pos ?? prev;
  }
  return steps.length ? build(`demo.${ex.id}`, "", bars, steps) : null;
}

export function demoFor(ex: Exercise): Phrase | null {
  switch (ex.kind) {
    case "map": return ex.layer === "chord" ? chordRunDemo(ex, ex.shapes, !!ex.together) : runDemo(ex, ex.shapes, !!ex.together);
    case "line": return lineDemo(ex, ex.string, ex.frets);
    case "target": return lickDemo(ex, ex.shape, null, Math.min(8, ex.base?.prog.length ?? 4));
    case "play-rest": {
      // O exemplo cobre a base inteira (4 compassos), não só uma volta do padrão curto: "um e um" tem padrão de 2.
      const n = ex.pattern.length, cycle = ex.base?.prog.length ?? n;
      return lickDemo(ex, 1, ex.pattern, Math.max(n, Math.ceil(cycle / n) * n));
    }
    case "take": return ex.examples?.length ? null : lickDemo(ex, 1, null, Math.min(ex.bars, 8), true);
    default: return null;
  }
}

/** Uma lição tem exemplo se algum exercício tem eco, exemplo de tomada ou demo. */
export const hasExample = (ex: Exercise): boolean =>
  ex.kind === "watch" || (ex.kind === "echo" && ex.phrases.length > 0) || (ex.kind === "take" && (ex.examples?.length ?? 0) > 0) || !!ex.demo;

/** O currículo com um exemplo em todo exercício que não tem eco nem exemplo, nas lições que ficariam sem nenhum. */
export function withDemos(c: Curriculum): Curriculum {
  return {
    ...c,
    units: c.units.map((u) => ({
      ...u,
      lessons: u.lessons.map((l) => {
        const hasOwn = l.exercises.some((e) => (e.kind === "echo" && e.phrases.length > 0) || (e.kind === "take" && (e.examples?.length ?? 0) > 0));
        // O exercício de linha é tocado sozinho, sem o eco da lição: ele ganha o exemplo dele mesmo quando a lição já tem outro.
        return { ...l, exercises: l.exercises.map((e) => { const demo = e.demo || (hasOwn && e.kind !== "line") ? null : demoFor(e); return demo ? { ...e, demo } : e; }) };
      }),
    })),
  };
}
