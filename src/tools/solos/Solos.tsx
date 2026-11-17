"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { curriculum } from "./curriculum/pt-BR";
import type { Exercise, Lesson } from "./curriculum/types";
import { NeckHero } from "./components/NeckHero";
import { ExerciseFrame, type Part } from "./ExerciseFrame";
import { progressStore, useProgress, useToday } from "./progress";
import { EMPTY, addDays, buildSession, daysThisWeek, learnLesson, rate, rateCold, toggleLesson, unitStatuses, type Progress, type Rating, type Session } from "./session/schedule";
import "./solos.css";

type Step = { part: Part; ex: Exercise; lesson?: Lesson; first?: boolean; last?: boolean };
type Outcome = { cold?: string; done?: string; repeat?: string };

function stepsOf(s: Session, p: Progress): Step[] {
  const steps: Step[] = [];
  if (s.cold) steps.push({ part: "cold", ex: s.cold.exercises.find((e) => e.id === s.cold!.key)!, lesson: s.cold });
  // Lição já tentada e não aprendida volta marcada como repetição.
  const part: Part = s.lesson && p.exercises[s.lesson.key]?.last === "nao" ? "again" : "new";
  s.lesson?.exercises.forEach((ex, i, all) => steps.push({ part, ex, lesson: s.lesson, first: i === 0, last: i === all.length - 1 }));
  if (s.phrase) steps.push({ part: "phrase", ex: s.phrase });
  s.reviews.forEach((ex) => steps.push({ part: "review", ex }));
  if (steps.length > 0) steps.push({ part: "take", ex: s.take });
  return steps;
}

type View =
  | { name: "home" }
  | { name: "session"; steps: Step[]; at: number; ratings: (Rating | undefined)[] }
  | { name: "free"; ex: Exercise }
  | { name: "done"; steps: Step[]; ratings: (Rating | undefined)[]; outcome: Outcome };

export function Solos() {
  const t = useTranslations("solos");
  const progress = useProgress();
  const today = useToday();
  const [view, setView] = useState<View>({ name: "home" });
  const home = () => setView({ name: "home" });

  if (view.name === "session") {
    const step = view.steps[view.at]!;
    const onRate = (r: Rating) => {
      const before = progressStore.get();
      let next = step.part === "cold" && step.lesson ? rateCold(before, step.lesson, r, today) : rate(before, step.ex.id, r, today);
      // A lição só conta como aprendida se o exercício-chave não ficou em "ainda não"; senão ela volta na próxima sessão.
      if ((step.part === "new" || step.part === "again") && step.last && step.lesson && next.exercises[step.lesson.key]?.last !== "nao")
        next = learnLesson(next, step.lesson.id, today);
      progressStore.set(next);

      const ratings = [...view.ratings];
      ratings[view.at] = r;
      if (view.at + 1 < view.steps.length) setView({ ...view, at: view.at + 1, ratings });
      else {
        const lesson = view.steps.find((s) => s.part === "new" || s.part === "again")?.lesson;
        const tomorrow = buildSession(curriculum, next, addDays(today, 1)).cold;
        const outcome: Outcome = !lesson ? {}
          : !next.lessons[lesson.id] ? { repeat: lesson.title }
          : tomorrow?.id === lesson.id ? { cold: lesson.title }
          : { done: lesson.title };
        setView({ name: "done", steps: view.steps, ratings, outcome });
      }
      window.scrollTo({ top: 0 });
    };
    return (
      <main className="wrap solos" id="conteudo">
        <ExerciseFrame
          key={view.at}
          ex={step.ex}
          part={step.part}
          intro={step.first && step.lesson ? { title: step.lesson.title, text: step.lesson.intro } : undefined}
          progress={{ n: view.at + 1, total: view.steps.length }}
          rated={view.ratings[view.at]}
          onRate={onRate}
          onBack={view.at > 0 ? () => setView({ ...view, at: view.at - 1 }) : undefined}
          onExit={home}
          exitLabel={t("frame.quit")}
        />
      </main>
    );
  }

  if (view.name === "free")
    return (
      <main className="wrap solos" id="conteudo">
        <ExerciseFrame
          ex={view.ex}
          part="free"
          onRate={(r) => { progressStore.set((p) => rate(p, view.ex.id, r, today)); home(); }}
          onExit={home}
          exitLabel={t("frame.back")}
        />
      </main>
    );

  if (view.name === "done")
    return (
      <main className="wrap solos" id="conteudo">
        <section className="done">
          <h1>{t("done.title")}</h1>
          <ol className="recap">
            {view.steps.map((s, i) => (
              <li key={i}>
                <span className={`tag ${s.part}`}>{t(`part.${s.part}`)}</span>
                <span className="what">{s.ex.title}</span>
                {view.ratings[i] && <span className={`mark ${view.ratings[i]}`}>{t(`frame.${view.ratings[i]!}`)}</span>}
              </li>
            ))}
          </ol>
          <p>
            {view.outcome.cold ? t("done.learned", { lesson: view.outcome.cold })
              : view.outcome.done ? t("done.done", { lesson: view.outcome.done })
              : view.outcome.repeat ? t("done.repeat", { lesson: view.outcome.repeat })
              : t("done.review")}
          </p>
          <button type="button" className="btn primary" onClick={home}>{t("done.back")}</button>
        </section>
      </main>
    );

  const session = buildSession(curriculum, progress, today || "0000-00-00");
  const steps = stepsOf(session, progress);
  const statuses = unitStatuses(curriculum, progress);
  const lessons = curriculum.units.flatMap((u) => u.lessons);
  const doneCount = lessons.filter((l) => progress.lessons[l.id]).length;
  const practicedToday = !!today && progress.days.includes(today);
  const week = today ? daysThisWeek(progress, today) : 0;
  const started = doneCount > 0 || progress.days.length > 0;
  const start = () => { if (steps.length) setView({ name: "session", steps, at: 0, ratings: [] }); };
  const reset = () => { if (window.confirm(t("home.resetConfirm"))) progressStore.set(EMPTY); };
  const open = (ex: Exercise) => setView({ name: "free", ex });
  // Desmarcar apaga o registro da lição; se ela foi feita em sessão (e não só marcada à mão), confirma antes.
  const toggle = (l: Lesson) => {
    const e = progress.lessons[l.id];
    if (e && !e.manual && !window.confirm(t("home.unmarkConfirm", { lesson: l.title }))) return;
    progressStore.set((p) => toggleLesson(p, l.id, today));
  };
  // Qualquer lição pode ser feita a qualquer momento; a trilha só recomenda a ordem.
  const startLesson = (lesson: Lesson) => {
    const part: Part = progress.exercises[lesson.key]?.last === "nao" && !progress.lessons[lesson.id] ? "again" : "new";
    setView({ name: "session", at: 0, ratings: [], steps: lesson.exercises.map((ex, i, all) => ({ part, ex, lesson, first: i === 0, last: i === all.length - 1 })) });
  };

  return (
    <main className="wrap solos" id="conteudo">
      <header className="solos-hero">
        <div className="hero-copy">
          <h1>{t("title")}</h1>
          <p>{t("lead")}</p>
          {steps.length > 0 && (
            <button type="button" className="btn primary big" onClick={start} disabled={!today}>
              {started ? t("home.continue") : t("home.start")}
            </button>
          )}
          <p className="week">
            {t("home.progress", { done: doneCount, total: lessons.length })}
            {week > 0 && <> · {t("home.week", { n: week })}</>}
          </p>
        </div>
        <NeckHero label={t("home.neck")} />
      </header>

      <section className="today" aria-labelledby="h-today">
        <h2 id="h-today">{practicedToday ? t("home.again") : t("home.today")}</h2>
        <p className="note">{practicedToday ? t("home.doneToday") : t("home.suggestion")}</p>
        {steps.length > 0 ? (
          <ol className="plan">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="n" aria-hidden="true">{i + 1}</span>
                <span className="kind">{t(`part.${s.part}`)}</span>
                <strong>{s.ex.title}</strong>
              </li>
            ))}
          </ol>
        ) : (
          <p className="note">{t("home.nothing")}</p>
        )}
        {session.finished && <p className="note">{t("home.finished")}</p>}
      </section>

      <section aria-labelledby="h-trail">
        <h2 id="h-trail">{t("home.trail")}</h2>
        <p className="note">{t("home.trailNote")}</p>
        <ol className="trail">
          {curriculum.units.map((u, i) => {
            const st = statuses[i]!;
            const done = u.lessons.filter((l) => progress.lessons[l.id]).length;
            return (
              <li key={u.id} className={`unit ${st}`}>
                <details open={st === "atual"}>
                  <summary className="unit-head">
                    <span className="n" aria-hidden="true">{i + 1}</span>
                    <div>
                      <h3>{u.title}</h3>
                      <p>{u.skill}</p>
                    </div>
                    <span className={`badge ${st}`}>{t("home.count", { done, total: u.lessons.length })}</span>
                  </summary>
                  <ul className="lessons">
                    {u.lessons.map((l) => {
                      const e = progress.lessons[l.id];
                      const recommended = l.id === session.lesson?.id;
                      return (
                        <li key={l.id} className={recommended ? "next" : undefined}>
                          <div className="lesson-head">
                            <label className="check">
                              <input type="checkbox" checked={!!e} onChange={() => toggle(l)} disabled={!today} />
                              <span className="sr-only">{t("home.mark", { lesson: l.title })}</span>
                            </label>
                            <strong>{l.title}</strong>
                            {recommended && <span className="badge atual">{t("home.recommended")}</span>}
                            {e?.cold && <span className="state lessonCold">{t("home.lessonCold")}</span>}
                            <button type="button" className={recommended ? "btn small primary" : "btn small"} onClick={() => startLesson(l)}>
                              {e ? t("home.redo") : t("home.do")}
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </li>
            );
          })}

          {/* As frases de ouvido correm em paralelo às unidades: a sessão sugerida traz uma por vez. */}
          <li className="unit frases">
            <details>
              <summary className="unit-head">
                <span className="n" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6.5" cy="18" r="2.5" fill="currentColor" /><circle cx="16.5" cy="16" r="2.5" fill="currentColor" /></svg>
                </span>
                <div>
                  <h3>{t("home.phrases")}</h3>
                  <p>{t("home.phrasesNote")}</p>
                </div>
                <span className="badge">{t("home.count", { done: curriculum.phrases.filter((ph) => progress.exercises[ph.id]?.last === "ok").length, total: curriculum.phrases.length })}</span>
              </summary>
              <ul className="lessons">
                {curriculum.phrases.map((ph) => {
                  const state = progress.exercises[ph.id];
                  const recommended = ph.id === session.phrase?.id;
                  return (
                    <li key={ph.id} className={recommended ? "next" : undefined}>
                      <div className="lesson-head">
                        <span className={state?.last === "ok" ? "dot ok" : state ? "dot tried" : "dot"} aria-hidden="true" />
                        <strong>{ph.title}</strong>
                        {recommended && <span className="badge atual">{t("home.recommended")}</span>}
                        {state && <span className="state">{t(`frame.${state.last}`)}</span>}
                        <button type="button" className="btn small" onClick={() => open(ph)}>{state ? t("home.redo") : t("home.do")}</button>
                      </div>
                    </li>
                  );
                })}
                <li>
                  <div className="lesson-head">
                    <span className="dot" aria-hidden="true" />
                    <strong>{curriculum.take.title}</strong>
                    <button type="button" className="btn small" onClick={() => open(curriculum.take)}>{t("home.do")}</button>
                  </div>
                </li>
              </ul>
            </details>
          </li>
        </ol>
        <p className="note">{t("home.soon")}</p>
      </section>

      {started && (
        <p className="reset">
          <button type="button" className="btn small quiet" onClick={reset}>{t("home.reset")}</button>
        </p>
      )}
    </main>
  );
}
