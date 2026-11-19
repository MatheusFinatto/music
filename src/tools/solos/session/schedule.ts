// Montagem da sessão e agenda de revisão. Lógica pura: sem navegador, sem relógio escondido.
import type { Curriculum, Exercise, Lesson } from "../curriculum/types";

export type Rating = "ok" | "quase" | "nao";

/** Dia no formato AAAA-MM-DD. */
export type Day = string;

export type ExerciseState = { last: Rating; times: number; interval: number; due: Day; day: Day };

export type Progress = {
  version: 1;
  exercises: Record<string, ExerciseState>;
  /** Lição feita (dia) e, depois, confirmada no teste a frio (dia). `manual`: a pessoa marcou por conta própria. */
  lessons: Record<string, { learned: Day; cold?: Day; manual?: boolean; skipped?: boolean }>;
  /** Dias em que houve prática. */
  days: Day[];
  /** O que foi feito em cada dia (ids dos exercícios avaliados), para o calendário. Só existe de quando passou a ser gravado. */
  log?: Record<Day, string[]>;
};

export const EMPTY: Progress = { version: 1, exercises: {}, lessons: {}, days: [] };

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const isDay = (d: unknown): d is Day => typeof d === "string" && DAY.test(d);
const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** O progresso lido do navegador, descartando o que estiver malformado em vez de quebrar a página. */
export function cleanProgress(saved: unknown): Progress | null {
  if (!isRecord(saved)) return null;
  const exercises: Record<string, ExerciseState> = {};
  if (isRecord(saved.exercises))
    for (const [id, e] of Object.entries(saved.exercises))
      if (isRecord(e) && (e.last === "ok" || e.last === "quase" || e.last === "nao") && isDay(e.due) && isDay(e.day) && typeof e.times === "number" && typeof e.interval === "number")
        exercises[id] = { last: e.last, times: e.times, interval: e.interval, due: e.due, day: e.day };
  const lessons: Progress["lessons"] = {};
  if (isRecord(saved.lessons))
    for (const [id, l] of Object.entries(saved.lessons))
      if (isRecord(l) && isDay(l.learned))
        lessons[id] = { learned: l.learned, ...(isDay(l.cold) ? { cold: l.cold } : {}), ...(l.manual === true ? { manual: true } : {}), ...(l.skipped === true ? { skipped: true } : {}) };
  const days = Array.isArray(saved.days) ? saved.days.filter(isDay) : [];
  const log: Record<Day, string[]> = {};
  if (isRecord(saved.log))
    for (const [day, ids] of Object.entries(saved.log))
      if (isDay(day) && Array.isArray(ids)) log[day] = ids.filter((x): x is string => typeof x === "string");
  return { version: 1, exercises, lessons, days, ...(Object.keys(log).length ? { log } : {}) };
}

/** Intervalos de revisão, em dias. Cresce a cada "consegui"; volta ao começo no "ainda não". */
export const INTERVALS = [1, 3, 7, 14, 30] as const;

export const toDay = (d: Date): Day => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function addDays(day: Day, n: number): Day {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return toDay(new Date(y, m - 1, d + n));
}

const markDay = (p: Progress, today: Day): Day[] => (p.days.includes(today) ? p.days : [...p.days, today]);

export function rate(p: Progress, exerciseId: string, rating: Rating, today: Day): Progress {
  const prev = p.exercises[exerciseId];
  const i = prev ? INTERVALS.indexOf(prev.interval as (typeof INTERVALS)[number]) : -1;
  // O intervalo só cresce em dias diferentes: repetir "consegui" no mesmo dia não empurra a revisão para longe.
  const sameDay = prev?.day === today;
  const interval =
    rating === "nao" ? INTERVALS[0]
    : rating === "quase" || sameDay ? (prev?.interval ?? INTERVALS[0])
    : INTERVALS[Math.min(i + 1, INTERVALS.length - 1)]!;
  const state: ExerciseState = { last: rating, times: (prev?.times ?? 0) + 1, interval, due: addDays(today, interval), day: today };
  const done = p.log?.[today] ?? [];
  const log = done.includes(exerciseId) ? p.log : { ...p.log, [today]: [...done, exerciseId] };
  return { ...p, exercises: { ...p.exercises, [exerciseId]: state }, days: markDay(p, today), ...(log ? { log } : {}) };
}

export function learnLesson(p: Progress, lessonId: string, today: Day): Progress {
  if (p.lessons[lessonId]) return p;
  return { ...p, lessons: { ...p.lessons, [lessonId]: { learned: today } }, days: markDay(p, today) };
}

/** A pessoa marca ou desmarca uma lição por conta própria. Nada é travado: a trilha só recomenda. */
export function toggleLesson(p: Progress, lessonId: string, today: Day): Progress {
  const lessons = { ...p.lessons };
  if (lessons[lessonId]) delete lessons[lessonId];
  else lessons[lessonId] = { learned: today, manual: true };
  return { ...p, lessons };
}

/** A pessoa pula a lição sugerida: conta como feita, marcada como pulada (e sem teste a frio, como toda marca manual). */
export function skipLesson(p: Progress, lessonId: string, today: Day): Progress {
  if (p.lessons[lessonId]) return p;
  return { ...p, lessons: { ...p.lessons, [lessonId]: { learned: today, manual: true, skipped: true } } };
}

/** Registra o teste a frio. Só "consegui" confirma a lição. */
export function rateCold(p: Progress, lesson: Lesson, rating: Rating, today: Day): Progress {
  const next = rate(p, lesson.key, rating, today);
  const entry = next.lessons[lesson.id];
  if (rating !== "ok" || !entry) return next;
  return { ...next, lessons: { ...next.lessons, [lesson.id]: { ...entry, cold: today } } };
}

export const allLessons = (c: Curriculum): Lesson[] => c.units.flatMap((u) => u.lessons);

export const findExercise = (c: Curriculum, id: string): Exercise | undefined =>
  [...allLessons(c).flatMap((l) => l.exercises), ...c.phrases, c.take].find((e) => e.id === id);

export type UnitStatus = "feita" | "atual" | "aberta";

/** A próxima lição recomendada: a primeira ainda não feita, na ordem da trilha. */
export const nextLesson = (c: Curriculum, p: Progress): Lesson | undefined => allLessons(c).find((l) => !p.lessons[l.id]);

/** Todas as unidades ficam abertas. "atual" é só a recomendada: a que contém a próxima lição. */
export function unitStatuses(c: Curriculum, p: Progress): UnitStatus[] {
  const next = nextLesson(c, p);
  return c.units.map((u) => (u.lessons.every((l) => p.lessons[l.id]) ? "feita" : u.lessons.some((l) => l.id === next?.id) ? "atual" : "aberta"));
}

export type Session = {
  /** Lição de uma sessão anterior a refazer sem aquecimento. */
  cold?: Lesson;
  /** Lição recomendada. Ausente só quando todas já foram feitas. */
  lesson?: Lesson;
  /** A lição seguinte, quando a recomendada é só um vídeo: o dia 1 não acaba antes do primeiro shape. */
  also?: Lesson;
  phrase?: Exercise;
  reviews: Exercise[];
  take: Exercise;
  /** A trilha acabou. */
  finished: boolean;
};

const isWatch = (c: Curriculum, id: string): boolean => findExercise(c, id)?.kind === "watch";

export function buildSession(c: Curriculum, p: Progress, today: Day, maxReviews = 2): Session {
  const lessons = allLessons(c);
  const statuses = unitStatuses(c, p);

  // A frio: a lição feita mais recentemente em sessão, em outro dia, ainda não confirmada.
  // Lição marcada à mão não entra: a pessoa disse que já sabe.
  // Se o teste a frio já foi tentado hoje, não se repete no mesmo dia.
  const cold = lessons
    .map((l, order) => ({ l, order, e: p.lessons[l.id] }))
    .filter(({ l, e }) => e && !e.manual && !e.cold && !isWatch(c, l.key) && e.learned < today && p.exercises[l.key]?.day !== today)
    .sort((a, b) => b.e!.learned.localeCompare(a.e!.learned) || b.order - a.order)[0]?.l;

  const lesson = nextLesson(c, p);

  const all = allLessons(c);
  const also = lesson && isWatch(c, lesson.key) ? all[all.indexOf(lesson) + 1] : undefined;

  const phrase = c.phrases.find((e) => !p.exercises[e.id]);

  const skip = new Set<string>([cold?.key, phrase?.id, c.take.id, ...(lesson?.exercises.map((e) => e.id) ?? []), ...(also?.exercises.map((e) => e.id) ?? [])].filter(Boolean) as string[]);
  const due = Object.entries(p.exercises)
    .filter(([id, s]) => s.due <= today && s.day < today && !skip.has(id))
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => findExercise(c, id))
    .filter((e): e is Exercise => !!e && e.kind !== "watch");

  // Intercalar: no máximo uma revisão por lição.
  const reviews: Exercise[] = [];
  const seen = new Set<string>();
  for (const e of due) {
    const owner = lessons.find((l) => l.exercises.some((x) => x.id === e.id))?.id ?? e.id;
    if (seen.has(owner)) continue;
    seen.add(owner);
    reviews.push(e);
    if (reviews.length === maxReviews) break;
  }

  const finished = statuses.every((s) => s === "feita");
  // A tomada livre cobra o assunto da unidade em que a pessoa está.
  const current = c.units[Math.max(0, statuses.lastIndexOf("atual"))];
  const take = current?.takeCheck ? { ...c.take, check: current.takeCheck } : c.take;
  return { cold, lesson, also, phrase, reviews, take, finished };
}

/** Dias com prática na semana (segunda a domingo) de `today`. */
export function daysThisWeek(p: Progress, today: Day): number {
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const weekday = (new Date(y, m - 1, d).getDay() + 6) % 7; // 0 = segunda
  const monday = addDays(today, -weekday);
  return p.days.filter((x) => x >= monday && x <= today).length;
}
