// Endereço de cada tela de "Como solar no violão e na guitarra". Lógica pura: o navegador fica em ../nav.ts.
//   /solos                       a trilha
//   /solos?licao=u3.l1           uma lição do começo (dá para mandar o link)
//   /solos?exercicio=f.07        um exercício avulso (frase de ouvido, tomada livre ou qualquer outro)
//   /solos?sessao                a sessão sugerida
import type { Curriculum, Exercise, Lesson } from "../curriculum/types";
import { allLessons, findExercise, type Progress, type Rating, type Session } from "./schedule";

export type Part = "cold" | "new" | "again" | "phrase" | "review" | "take" | "free";
export type Step = { part: Part; ex: Exercise; lesson?: Lesson; first?: boolean; last?: boolean };
export type Outcome = { cold?: string; done?: string; repeat?: string };

export type View =
  | { name: "home" }
  /** `lesson`: a sessão é uma lição aberta pela trilha (ou por link), não a sessão sugerida. */
  | { name: "session"; lesson?: string; steps: Step[]; at: number; ratings: (Rating | undefined)[] }
  | { name: "free"; ex: Exercise }
  | { name: "done"; lesson?: string; steps: Step[]; ratings: (Rating | undefined)[]; outcome: Outcome };

export type Route = { kind: "home" } | { kind: "session" } | { kind: "lesson"; id: string } | { kind: "exercise"; id: string };

export function parseRoute(search: string): Route {
  const q = new URLSearchParams(search);
  const lesson = q.get("licao"), exercise = q.get("exercicio");
  if (lesson) return { kind: "lesson", id: lesson };
  if (exercise) return { kind: "exercise", id: exercise };
  if (q.has("sessao")) return { kind: "session" };
  return { kind: "home" };
}

export function routeOf(v: View): Route {
  if (v.name === "free") return { kind: "exercise", id: v.ex.id };
  if (v.name === "session" || v.name === "done") return v.lesson ? { kind: "lesson", id: v.lesson } : { kind: "session" };
  return { kind: "home" };
}

/** O `search` do endereço ("" na trilha). Sem codificar os pontos dos ids, para o link ficar legível. */
export function hrefOf(r: Route): string {
  switch (r.kind) {
    case "home": return "";
    case "session": return "?sessao";
    case "lesson": return `?licao=${encodeURIComponent(r.id).replace(/%2E/gi, ".")}`;
    case "exercise": return `?exercicio=${encodeURIComponent(r.id).replace(/%2E/gi, ".")}`;
  }
}

export const findLesson = (c: Curriculum, id: string): Lesson | undefined => allLessons(c).find((l) => l.id === id);

/** Os passos de uma lição feita pela trilha. Lição já tentada e não aprendida volta como repetição. */
export function lessonSteps(lesson: Lesson, again: boolean): Step[] {
  const part: Part = again ? "again" : "new";
  return lesson.exercises.map((ex, i, all) => ({ part, ex, lesson, first: i === 0, last: i === all.length - 1 }));
}

/** Lição já tentada e não aprendida: volta marcada como repetição. */
export const isAgain = (lesson: Lesson, p: Progress): boolean => p.exercises[lesson.key]?.last === "nao" && !p.lessons[lesson.id];

/** Os passos da sessão sugerida: a frio, lição, frase, revisões e tomada livre. */
export function sessionSteps(s: Session, p: Progress): Step[] {
  const steps: Step[] = [];
  if (s.cold) steps.push({ part: "cold", ex: s.cold.exercises.find((e) => e.id === s.cold!.key)!, lesson: s.cold });
  if (s.lesson) steps.push(...lessonSteps(s.lesson, isAgain(s.lesson, p)));
  if (s.phrase) steps.push({ part: "phrase", ex: s.phrase });
  s.reviews.forEach((ex) => steps.push({ part: "review", ex }));
  if (steps.length > 0) steps.push({ part: "take", ex: s.take });
  return steps;
}

// ---------- guardar a tela no navegador (sessionStorage), para recarregar sem perder a posição ----------

type SavedStep = { part: Part; ex: string; lesson?: string; first?: boolean; last?: boolean };
type Saved =
  | { name: "session"; lesson?: string; steps: SavedStep[]; at: number; ratings: (Rating | null)[] }
  | { name: "done"; lesson?: string; steps: SavedStep[]; ratings: (Rating | null)[]; outcome: Outcome };

/** Só sessão e fim de sessão têm estado que o endereço não carrega. */
export function encodeView(v: View): string | null {
  if (v.name !== "session" && v.name !== "done") return null;
  const steps = v.steps.map((s): SavedStep => ({ part: s.part, ex: s.ex.id, lesson: s.lesson?.id, first: s.first, last: s.last }));
  // A lista de respostas pode ter buracos (passo pulado com "voltar"); Array.from os preenche.
  const ratings = Array.from({ length: v.ratings.length }, (_, i) => v.ratings[i] ?? null);
  return JSON.stringify({ ...v, steps, ratings });
}

/** Devolve null se o que estava guardado não serve mais (conteúdo mudou, dado corrompido). */
export function decodeView(c: Curriculum, raw: string | null): View | null {
  if (!raw) return null;
  try {
    const s = JSON.parse(raw) as Saved;
    if ((s.name !== "session" && s.name !== "done") || !Array.isArray(s.steps) || s.steps.length === 0) return null;
    const steps: Step[] = [];
    for (const x of s.steps) {
      const ex = findExercise(c, x.ex);
      const lesson = x.lesson ? findLesson(c, x.lesson) : undefined;
      if (!ex || (x.lesson && !lesson)) return null;
      steps.push({ part: x.part, ex, lesson, first: x.first, last: x.last });
    }
    const ratings = (Array.isArray(s.ratings) ? s.ratings : []).map((r) => r ?? undefined);
    if (s.name === "session") {
      const at = Number.isInteger(s.at) && s.at >= 0 && s.at < steps.length ? s.at : 0;
      return { name: "session", lesson: s.lesson, steps, at, ratings };
    }
    return { name: "done", lesson: s.lesson, steps, ratings, outcome: s.outcome ?? {} };
  } catch {
    return null;
  }
}
