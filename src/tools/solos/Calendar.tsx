"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { curriculum } from "./curriculum/pt-BR";
import { navigate } from "./nav";
import { studyDaysStore, useProgress, useStudyDays, useToday } from "./progress";
import { monthGrid, pastOf, planAhead, weekdayOf } from "./session/calendar";
import type { Day } from "./session/schedule";

const MONDAY = new Date(2026, 0, 5); // uma segunda qualquer, para os nomes dos dias da semana
const weekdayName = (i: number, style: "short" | "long") => new Date(MONDAY.getFullYear(), 0, 5 + i).toLocaleDateString("pt-BR", { weekday: style });

export function Calendar() {
  const t = useTranslations("solos.calendar");
  const progress = useProgress();
  const today = useToday();
  const studyDays = useStudyDays();
  const [shown, setShown] = useState<{ y: number; m: number } | null>(null);
  const [picked, setPicked] = useState<Day | null>(null);

  const plan = useMemo(() => (today ? planAhead(curriculum, progress, today, studyDays) : {}), [progress, today, studyDays]);
  if (!today) return <main className="wrap solos" id="conteudo" />;

  const [ty, tm] = today.split("-").map(Number) as [number, number];
  const view = shown ?? { y: ty, m: tm - 1 };
  const weeks = monthGrid(view.y, view.m);
  const move = (n: number) => { const d = new Date(view.y, view.m + n, 1); setShown({ y: d.getFullYear(), m: d.getMonth() }); };
  const selected = picked ?? today;
  const past = pastOf(curriculum, progress, selected);
  const planned = plan[selected] ?? [];
  const toggleDay = (i: number) => studyDaysStore.set((s) => ({ ...s, days: s.days.includes(i) ? s.days.filter((x) => x !== i) : [...s.days, i].sort() }));
  const label = new Date(view.y, view.m, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const selectedLabel = (() => { const [y, m, d] = selected.split("-").map(Number) as [number, number, number]; return new Date(y, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }); })();

  return (
    <main className="wrap solos calendar" id="conteudo">
      <button type="button" className="btn small quiet" onClick={() => navigate({ name: "home" })}>{t("back")}</button>
      <h1>{t("title")}</h1>
      <p className="note">{t("lead")}</p>

      <fieldset className="study-days">
        <legend>{t("studyDays")}</legend>
        {Array.from({ length: 7 }, (_, i) => (
          <label key={i} className="check-day">
            <input type="checkbox" checked={studyDays.includes(i)} onChange={() => toggleDay(i)} />
            <span>{weekdayName(i, "short")}</span>
          </label>
        ))}
      </fieldset>

      <div className="month-head">
        <button type="button" className="btn small" onClick={() => move(-1)} aria-label={t("prev")}>‹</button>
        <h2>{label}</h2>
        <button type="button" className="btn small" onClick={() => move(1)} aria-label={t("next")}>›</button>
      </div>
      <div className="month">
        <div className="week-row head">
          {Array.from({ length: 7 }, (_, i) => <span key={i}>{weekdayName(i, "short")}</span>)}
        </div>
        {weeks.map((w, wi) => (
          <div className="week-row" key={wi}>
            {w.map((day, di) => {
              if (!day) return <span key={di} className="cell empty" />;
              const did = progress.days.includes(day);
              const cls = ["cell", day === today ? "today" : "", day === selected ? "picked" : "", did ? "did" : plan[day] ? "plan" : "", studyDays.includes(weekdayOf(day)) ? "study" : ""].filter(Boolean).join(" ");
              return (
                <button type="button" key={day} className={cls} onClick={() => setPicked(day)} aria-pressed={day === selected}
                  aria-label={`${Number(day.slice(8))}${did ? `, ${t("did")}` : plan[day] ? `, ${t("planned")}` : ""}`}>
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="legend"><span className="swatch did" /> {t("did")} <span className="swatch plan" /> {t("planned")}</p>

      <section className="day-detail" aria-live="polite">
        <h2>{selectedLabel}</h2>
        {past.lessons.length + past.exercises.length > 0 && (
          <>
            <h3>{t("done")}</h3>
            <ul>
              {past.lessons.map((x, i) => <li key={`l${i}`}><strong>{x}</strong></li>)}
              {past.exercises.map((x, i) => <li key={`e${i}`}>{x}</li>)}
            </ul>
          </>
        )}
        {planned.length > 0 && (
          <>
            <h3>{t("forecast")}</h3>
            <ul>{planned.filter((x, i) => planned.findIndex((y) => y.title === x.title && (y.part === "cold") === (x.part === "cold")) === i).map((x, i) => <li key={i}><span className={`tag ${x.part}`}>{x.part === "new" || x.part === "again" ? t("lesson") : x.part === "cold" ? t("cold") : t("review")}</span> {x.title}</li>)}</ul>
            <p className="note">{t("forecastNote")}</p>
          </>
        )}
        {past.lessons.length + past.exercises.length + planned.length === 0 && <p className="note">{t("empty")}</p>}
      </section>
    </main>
  );
}
