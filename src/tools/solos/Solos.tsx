"use client";
import { useTranslations } from "next-intl";
import { curriculum } from "./curriculum/pt-BR";
import type { Exercise, Lesson } from "./curriculum/types";
import { Calendar } from "./Calendar";
import { NeckHero } from "./components/NeckHero";
import { ExerciseFrame } from "./ExerciseFrame";
import { Drill } from "./Drill";
import { follow, navigate, useView } from "./nav";
import { progressStore, useProgress, useToday } from "./progress";
import { hrefOf, isAgain, lessonSteps, sessionSteps, type Outcome, type Step } from "./session/route";
import { EMPTY, addDays, buildSession, daysThisWeek, learnLesson, nextLesson, rate, rateCold, skipLesson, toggleLesson, unitStatuses, type Rating } from "./session/schedule";
import "./solos.css";

/** Os passos da sessão agrupados: os exercícios de uma mesma lição viram uma linha só, com um "Pular" só. */
type Group = { part: Step["part"]; lesson?: Step["lesson"]; steps: Step[] };
function planGroups(steps: Step[]): Group[] {
  const out: Group[] = [];
  for (const s of steps) {
    const last = out.at(-1);
    if (last && s.lesson && (s.part === "new" || s.part === "again") && last.part === s.part && last.lesson?.id === s.lesson.id) last.steps.push(s);
    else out.push({ part: s.part, lesson: s.lesson, steps: [s] });
  }
  return out;
}

export function Solos() {
  const t = useTranslations("solos");
  const progress = useProgress();
  const today = useToday();
  const view = useView();
  const home = () => navigate({ name: "home" });

  if (view.name === "calendar") return <Calendar />;

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
      if (view.at + 1 < view.steps.length) navigate({ ...view, at: view.at + 1, ratings }, { replace: true });
      else {
        const lesson = view.steps.find((s) => s.part === "new" || s.part === "again")?.lesson;
        const tomorrow = buildSession(curriculum, next, addDays(today, 1)).cold;
        const outcome: Outcome = !lesson ? {}
          : !next.lessons[lesson.id] ? { repeat: lesson.title }
          : tomorrow?.id === lesson.id ? { cold: lesson.title }
          : { done: lesson.title };
        navigate({ name: "done", lesson: view.lesson, steps: view.steps, ratings, outcome }, { replace: true });
      }
      window.scrollTo({ top: 0 });
    };
    return (
      <main className="wrap solos" id="conteudo">
        <ExerciseFrame
          key={view.at}
          ex={step.ex}
          part={step.part}
          intro={step.first && step.lesson ? { title: step.lesson.title, text: step.lesson.intro, concepts: step.lesson.concepts, videos: step.lesson.videos, source: step.lesson.source } : undefined}
          progress={view.steps.length > 1 ? { n: view.at + 1, total: view.steps.length } : undefined}
          rated={view.ratings[view.at]}
          onRate={onRate}
          onBack={view.at > 0 ? () => navigate({ ...view, at: view.at - 1 }, { replace: true }) : undefined}
          onExit={home}
          exitLabel={t(view.steps.length > 1 ? "frame.quit" : "frame.back")}
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

  if (view.name === "done") {
    const doneLessons = planGroups(view.steps).flatMap((g) => (g.lesson && (g.part === "new" || g.part === "again") ? [g.lesson.title] : []));
    const upNext = nextLesson(curriculum, progress);
    return (
      <main className="wrap solos" id="conteudo">
        <section className="done">
          <h1>{t("done.title")}</h1>
          <ol className="recap">
            {planGroups(view.steps).map((g, i) => (
              <li key={i}>
                <span className={`tag ${g.part}`}>{t(`part.${g.part}`)}</span>
                <span className="what">{g.lesson && (g.part === "new" || g.part === "again") ? g.lesson.title : g.steps[0]!.ex.title}</span>
              </li>
            ))}
          </ol>
          <p>
            {doneLessons.length > 0 ? t("done.lessons", { n: doneLessons.length, list: doneLessons.join(", ") }) : view.outcome.cold ? t("done.learned", { lesson: view.outcome.cold }) : t("done.review")}
          </p>
          <p>{upNext ? t("done.next", { lesson: upNext.title }) : t("done.all")}</p>
          <a className="btn primary" href={hrefOf({ kind: "home" }) || "?"} onClick={follow(home)}>{t("done.back")}</a>
        </section>
      </main>
    );
  }

  const session = buildSession(curriculum, progress, today || "0000-00-00");
  const steps = sessionSteps(session, progress);
  const statuses = unitStatuses(curriculum, progress);
  const lessons = curriculum.units.flatMap((u) => u.lessons);
  const doneCount = lessons.filter((l) => progress.lessons[l.id]).length;
  const practicedToday = !!today && progress.days.includes(today);
  const week = today ? daysThisWeek(progress, today) : 0;
  const started = doneCount > 0 || progress.days.length > 0;
  const start = () => { if (steps.length) navigate({ name: "session", steps, at: 0, ratings: [] }); };
  const reset = () => { if (window.confirm(t("home.resetConfirm"))) progressStore.set(EMPTY); };
  const open = (ex: Exercise) => navigate({ name: "free", ex });
  // Desmarcar apaga o registro da lição; se ela foi feita em sessão (e não só marcada à mão), confirma antes.
  const toggle = (l: Lesson) => {
    const e = progress.lessons[l.id];
    if (e && !e.manual && !window.confirm(t("home.unmarkConfirm", { lesson: l.title }))) return;
    progressStore.set((p) => toggleLesson(p, l.id, today));
  };
  // Só abre o capítulo e a seção da unidade atual; o resto fica fechado para a trilha caber na tela.
  const current = curriculum.units[statuses.indexOf("atual")]?.id;
  const count = (units: string[]) => {
    const ls = units.flatMap((id) => curriculum.units.find((u) => u.id === id)!.lessons);
    return { done: ls.filter((l) => progress.lessons[l.id]).length, total: ls.length };
  };
  // Qualquer lição pode ser feita a qualquer momento; a trilha só recomenda a ordem.
  const startLesson = (lesson: Lesson) =>
    navigate({ name: "session", lesson: lesson.id, at: 0, ratings: [], steps: lessonSteps(lesson, isAgain(lesson, progress)) });

  return (
    <main className="wrap solos" id="conteudo">
      <header className="solos-hero">
        <div className="hero-copy">
          <h1>{t("title")}</h1>
          <p>{t("lead")}</p>
          {steps.length > 0 && (
            <button type="button" className="btn primary big" onClick={start} disabled={!today}>
              {practicedToday ? t("home.again") : started ? t("home.continue") : t("home.start")}
            </button>
          )}
          <p className="week">
            <a href={hrefOf({ kind: "calendar" })} onClick={follow(() => navigate({ name: "calendar" }))}>{t("home.calendar")}</a> ·{" "}
            {t("home.progress", { done: doneCount, total: lessons.length })}
            {week > 0 && <> · {t("home.week", { n: week })}</>}
          </p>
        </div>
        <NeckHero label={t("home.neck")} />
      </header>

      <section className="today" aria-labelledby="h-today">
        <h2 id="h-today">{practicedToday ? t("home.again") : t("home.today")}</h2>
        {practicedToday && <p className="note">{t("home.doneToday")}</p>}
        {steps.length > 0 ? (
          <ol className="plan">
            {planGroups(steps).map((g, i) => {
              const lesson = g.lesson && (g.part === "new" || g.part === "again") ? g.lesson : null;
              return (
                <li key={i}>
                  <span className="n" aria-hidden="true">{i + 1}</span>
                  <div className="what">
                    <span className="kind">{t(`part.${g.part}`)}</span>
                    <strong>
                      {/* A linha inteira é o link (área esticada por CSS): clicar na sessão sugerida abre a lição. */}
                      {g.lesson ? (
                        <a className="plan-link" href={hrefOf({ kind: "lesson", id: g.lesson.id })} onClick={follow(() => startLesson(g.lesson!))}>{g.lesson.title}</a>
                      ) : (
                        <a className="plan-link" href={hrefOf({ kind: "exercise", id: g.steps[0]!.ex.id })} onClick={follow(() => open(g.steps[0]!.ex))}>{g.steps[0]!.ex.title}</a>
                      )}
                    </strong>
                    {lesson && g.steps.length > 1 && (
                      <ul className="parts" aria-label={t("home.parts")}>
                        {g.steps.map((x) => <li key={x.ex.id}>{x.ex.title}</li>)}
                      </ul>
                    )}
                  </div>
                  {lesson && (
                    <button type="button" className="btn small plan-skip" aria-label={t("home.skipLesson", { lesson: lesson.title })} onClick={() => progressStore.set((p) => skipLesson(p, lesson.id, today))} disabled={!today}>{t("home.skipPlan")}</button>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="note">{t("home.nothing")}</p>
        )}
        {session.finished && <p className="note">{t("home.finished")}</p>}
      </section>

      <section aria-labelledby="h-trail">
        <h2 id="h-trail">{t("home.trail")}</h2>
        {curriculum.chapters.map((ch, ci) => {
          const secs = ch.sections.map((id) => curriculum.sections.find((x) => x.id === id)!);
          const chCount = count(secs.flatMap((x) => x.units));
          return (
            <details key={ch.id} className="chapter" open={secs.some((x) => x.units.includes(current ?? ""))}>
              <summary className="chapter-head">
                <div>
                  <h3><span className="ord" role="img" aria-label={t("home.chapter", { n: ci + 1 })}>{ci + 1}</span>{ch.title}</h3>
                  <p>{ch.goal}</p>
                </div>
                <span className={`badge${chCount.done === chCount.total ? " feita" : ""}`}>{t("home.count", chCount)}</span>
              </summary>
              {secs.map((sec) => {
                const secCount = count(sec.units);
                return (
                  <details key={sec.id} className="trail-section" open={sec.units.includes(current ?? "")}>
                    <summary className="section-head">
                      <div>
                        <h4>{sec.title}</h4>
                        <p>{sec.goal}</p>
                      </div>
                      {secCount.total > 0
                        ? <span className={`badge${secCount.done === secCount.total ? " feita" : ""}`}>{t("home.count", secCount)}</span>
                        : <span className="badge">{t("home.soonBadge")}</span>}
                    </summary>
                    <ol className="trail">
                      {sec.units.map((id) => {
                        const i = curriculum.units.findIndex((x) => x.id === id);
                        const u = curriculum.units[i]!;
                        const st = statuses[i]!;
                        const done = u.lessons.filter((l) => progress.lessons[l.id]).length;
                        // Unidade de uma lição só: entra direto, sem abrir para depois clicar em "Fazer".
                        if (u.lessons.length === 1) {
                          const l = u.lessons[0]!;
                          const e = progress.lessons[l.id];
                          const recommended = l.id === session.lesson?.id;
                          return (
                            <li key={u.id} className={`unit single ${st}${u.arc ? " arc" : ""}`}>
                              <div className="unit-head" role="presentation" onClick={(ev) => { if (ev.target === ev.currentTarget) startLesson(l); }}>
                                <span className="n" aria-hidden="true">{sec.units.indexOf(id) + 1}</span>
                                <div>
                                  <h5><a className="lesson-link" href={hrefOf({ kind: "lesson", id: l.id })} onClick={follow(() => startLesson(l))}>{u.title}</a>{u.arc && <span className="badge arc">{t("home.arcShort")}</span>}{u.optional && <span className="badge optional">{t("home.optional")}</span>}{e?.skipped && <span className="state">{t("home.skipped")}</span>}</h5>
                                  <p>{u.skill}</p>
                                </div>
                                <label className="check">
                                  <input type="checkbox" checked={!!e} onChange={() => toggle(l)} disabled={!today} />
                                  <span className="sr-only">{t("home.mark", { lesson: l.title })}</span>
                                </label>
                                {recommended && <button type="button" className="btn small" aria-label={t("home.skipLesson", { lesson: l.title })} onClick={() => progressStore.set((p) => skipLesson(p, l.id, today))} disabled={!today}>{t("home.skip")}</button>}
                                <a className={recommended ? "btn small primary" : "btn small"} href={hrefOf({ kind: "lesson", id: l.id })} aria-label={t(e ? "home.redoLesson" : "home.doLesson", { lesson: l.title })} onClick={follow(() => startLesson(l))}>{e ? t("home.redo") : t("home.do")}</a>
                              </div>
                            </li>
                          );
                        }
                        return (
                          <li key={u.id} className={`unit ${st}${u.arc ? " arc" : ""}`}>
                            <details open={st === "atual"}>
                              <summary className="unit-head">
                                <span className="n" aria-hidden="true">{sec.units.indexOf(id) + 1}</span>
                                <div>
                                  <h5>{u.title}{u.arc && <span className="badge arc">{t("home.arcShort")}</span>}{u.optional && <span className="badge optional">{t("home.optional")}</span>}</h5>
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
                                      <div className="lesson-head" role="presentation" onClick={(ev) => { if (ev.target === ev.currentTarget) startLesson(l); }}>
                                        <label className="check">
                                          <input type="checkbox" checked={!!e} onChange={() => toggle(l)} disabled={!today} />
                                          <span className="sr-only">{t("home.mark", { lesson: l.title })}</span>
                                        </label>
                                        <strong><a className="lesson-link" href={hrefOf({ kind: "lesson", id: l.id })} onClick={follow(() => startLesson(l))}>{l.title}</a></strong>
                                        {recommended && <span className="badge atual">{t("home.recommended")}</span>}
                                        {e?.cold && <span className="state lessonCold">{t("home.lessonCold")}</span>}
                                        {e?.skipped && <span className="state">{t("home.skipped")}</span>}
                                        {recommended && <button type="button" className="btn small" aria-label={t("home.skipLesson", { lesson: l.title })} onClick={() => progressStore.set((p) => skipLesson(p, l.id, today))} disabled={!today}>{t("home.skip")}</button>}
                                        <a className={recommended ? "btn small primary" : "btn small"} href={hrefOf({ kind: "lesson", id: l.id })} aria-label={t(e ? "home.redoLesson" : "home.doLesson", { lesson: `${l.title} (${u.title})` })} onClick={follow(() => startLesson(l))}>
                                          {e ? t("home.redo") : t("home.do")}
                                        </a>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </details>
                          </li>
                        );
                      })}
                    </ol>
                    {sec.soon && <p className="soon">{t("home.soon", { songs: sec.soon.join(", ") })}</p>}
                  </details>
                );
              })}
            </details>
          );
        })}

        <div className="trail-extra">
          <h3 className="section-title">{t("home.extra")}</h3>
        <ol className="trail">
          {/* As frases de ouvido correm em paralelo às unidades: a sessão sugerida traz uma por vez. */}
          <li className="unit frases">
            <details>
              <summary className="unit-head">
                <span className="n" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="6.5" cy="18" r="2.5" fill="currentColor" /><circle cx="16.5" cy="16" r="2.5" fill="currentColor" /></svg>
                </span>
                <div>
                  <h4>{t("home.phrases")}</h4>
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
                      <div className="lesson-head" role="presentation" onClick={(ev) => { if (ev.target === ev.currentTarget) open(ph); }}>
                        <span className={state?.last === "ok" ? "dot ok" : state ? "dot tried" : "dot"} aria-hidden="true" />
                        <strong><a className="lesson-link" href={hrefOf({ kind: "exercise", id: ph.id })} onClick={follow(() => open(ph))}>{ph.title}</a></strong>
                        {recommended && <span className="badge atual">{t("home.recommended")}</span>}
                        {state && <span className="state">{t(`frame.${state.last}`)}</span>}
                        <a className="btn small" href={hrefOf({ kind: "exercise", id: ph.id })} aria-label={t(state ? "home.redoLesson" : "home.doLesson", { lesson: ph.title })} onClick={follow(() => open(ph))}>{state ? t("home.redo") : t("home.do")}</a>
                      </div>
                    </li>
                  );
                })}
                <li>
                  <div className="lesson-head" role="presentation" onClick={(ev) => { if (ev.target === ev.currentTarget) open(curriculum.take); }}>
                    <span className="dot" aria-hidden="true" />
                    <strong><a className="lesson-link" href={hrefOf({ kind: "exercise", id: curriculum.take.id })} onClick={follow(() => open(curriculum.take))}>{curriculum.take.title}</a></strong>
                    <a className="btn small" href={hrefOf({ kind: "exercise", id: curriculum.take.id })} aria-label={t("home.doLesson", { lesson: curriculum.take.title })} onClick={follow(() => open(curriculum.take))}>{t("home.do")}</a>
                  </div>
                </li>
              </ul>
            </details>
          </li>
        </ol>
        <Drill />
        </div>
      </section>

      {started && (
        <p className="reset">
          <button type="button" className="btn small quiet" onClick={reset}>{t("home.reset")}</button>
        </p>
      )}
    </main>
  );
}
