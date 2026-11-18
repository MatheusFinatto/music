// Calendário de estudos. Lógica pura: o plano é derivado do progresso, nunca guardado.
import type { Curriculum } from "../curriculum/types";
import { sessionSteps, type Part } from "./route";
import { addDays, allLessons, buildSession, findExercise, learnLesson, rate, rateCold, toDay, type Day, type Progress } from "./schedule";

export type PlanItem = { part: Part; title: string };
export type Past = { lessons: string[]; exercises: string[] };

/** Dia da semana: 0 = segunda … 6 = domingo. */
export function weekdayOf(day: Day): number {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return (new Date(y, m - 1, d).getDay() + 6) % 7;
}

/**
 * A previsão: uma sessão por dia de estudo escolhido, a partir de hoje, supondo "consegui" em tudo.
 * Quem faltar a um dia ou marcar "ainda não" muda o progresso, e a previsão se refaz sozinha.
 * Hoje fica de fora se a pessoa já praticou.
 */
export function planAhead(c: Curriculum, progress: Progress, today: Day, studyDays: number[], horizon = 120): Record<Day, PlanItem[]> {
  const plan: Record<Day, PlanItem[]> = {};
  let p = progress;
  for (let i = 0; i < horizon; i++) {
    const day = addDays(today, i);
    if (!studyDays.includes(weekdayOf(day)) || (i === 0 && p.days.includes(day))) continue;
    const session = buildSession(c, p, day);
    const steps = sessionSteps(session, p);
    if (steps.length === 0) {
      if (session.finished) break;
      continue;
    }
    plan[day] = steps.map((s) => ({ part: s.part, title: s.part === "new" || s.part === "again" || s.part === "cold" ? (s.lesson?.title ?? s.ex.title) : s.ex.title }));
    for (const s of steps) {
      p = s.part === "cold" && s.lesson ? rateCold(p, s.lesson, "ok", day) : rate(p, s.ex.id, "ok", day);
      if ((s.part === "new" || s.part === "again") && s.last && s.lesson) p = learnLesson(p, s.lesson.id, day);
    }
  }
  return plan;
}

/** O que a pessoa fez num dia: lições aprendidas e exercícios avaliados (do registro diário, ou do último dia de cada exercício). */
export function pastOf(c: Curriculum, p: Progress, day: Day): Past {
  const lessons = allLessons(c).filter((l) => p.lessons[l.id]?.learned === day).map((l) => l.title);
  const ids = new Set([...(p.log?.[day] ?? []), ...Object.entries(p.exercises).filter(([, s]) => s.day === day).map(([id]) => id)]);
  const exercises = [...ids].map((id) => findExercise(c, id)?.title).filter((x): x is string => !!x);
  return { lessons, exercises };
}

/** As semanas (segunda a domingo) de um mês; fora do mês, null. */
export function monthGrid(year: number, month: number): (Day | null)[][] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (Day | null)[] = [...Array<null>(lead).fill(null), ...Array.from({ length: total }, (_, i) => toDay(new Date(year, month, i + 1)))];
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));
}
