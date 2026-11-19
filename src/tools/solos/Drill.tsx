"use client";
// Treino cronometrado: tom sorteado, um shape, andamento fixo; o tempo para passar pelos 12 tons fica guardado.
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { createStore } from "@/core/storage";
import { PRACTICE_KEYS, keyName, rootFret } from "./curriculum/transpose";
import { toDay } from "./session/schedule";

type Run = { day: string; shape: number; bpm: number; seconds: number };
type Saved = { version: 1; runs: Run[] };
const store = createStore<Saved>("solos-treino", { version: 1, runs: [] }, (saved) => {
  const runs = (saved as { runs?: unknown } | null)?.runs;
  if (!Array.isArray(runs)) return null;
  const ok = runs.filter((r): r is Run => !!r && typeof r.day === "string" && typeof r.shape === "number" && typeof r.bpm === "number" && typeof r.seconds === "number");
  return { version: 1, runs: ok.slice(-30) };
});
const useRuns = () => useSyncExternalStore(store.subscribe, () => store.get().runs, () => store.getInitial().runs);

const shuffle = <T,>(a: readonly T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j]!, b[i]!]; }
  return b;
};
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function Drill() {
  const t = useTranslations("solos.drill");
  const runs = useRuns();
  const [shape, setShape] = useState(1);
  const [bpm, setBpm] = useState(100);
  const [order, setOrder] = useState<number[] | null>(null);
  const [at, setAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!order || last !== null) return;
    const id = window.setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 250);
    return () => window.clearInterval(id);
  }, [order, last]);

  const start = () => { setOrder(shuffle(PRACTICE_KEYS)); setAt(0); setLast(null); setElapsed(0); startedAt.current = Date.now(); };
  const next = () => {
    if (!order) return;
    if (at + 1 < order.length) { setAt(at + 1); return; }
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    setLast(seconds);
    store.set((s) => ({ version: 1, runs: [...s.runs, { day: toDay(new Date()), shape, bpm, seconds }].slice(-30) }));
  };
  const mine = runs.filter((r) => r.shape === shape && r.bpm === bpm);
  const best = mine.length ? Math.min(...mine.map((r) => r.seconds)) : null;

  return (
    <details className="drill">
      <summary className="unit-head">
        <span className="n" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="13" r="7.5" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="M12 13V9M9.5 3h5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </span>
        <div>
          <h4>{t("title")}</h4>
          <p>{t("note")}</p>
        </div>
      </summary>
      <div className="drill-body">
        {!order && (
          <div className="row">
            <label className="key-picker"><span>{t("shape")}</span>
              <select value={shape} onChange={(e) => setShape(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>
            </label>
            <label className="key-picker"><span>{t("bpm")}</span>
              <input type="number" inputMode="numeric" name="bpm" autoComplete="off" min={40} max={200} value={bpm} onChange={(e) => setBpm(Math.max(40, Math.min(200, Number(e.target.value) || 100)))} />
            </label>
            <button type="button" className="btn primary" onClick={start}>{t("start")}</button>
          </div>
        )}
        {order && last === null && (
          <div className="drill-run" role="status">
            <p className="drill-key">{keyName(order[at]!)}</p>
            <p className="note">{t("where", { shape, fret: rootFret(order[at]!), n: at + 1, total: order.length, bpm })}</p>
            <p className="drill-time" aria-hidden="true">{fmt(elapsed)}</p>
            <div className="row">
              <button type="button" className="btn primary" onClick={next} autoFocus>{at + 1 < order.length ? t("next") : t("finish")}</button>
              <button type="button" className="btn" onClick={() => setOrder(null)}>{t("cancel")}</button>
            </div>
          </div>
        )}
        {order && last !== null && (
          <div className="drill-run" role="status">
            <p className="drill-key">{fmt(last)}</p>
            <p>{best !== null && last <= best ? t("record") : t("done", { best: best !== null ? fmt(best) : "" })}</p>
            <div className="row">
              <button type="button" className="btn primary" onClick={start}>{t("again")}</button>
              <button type="button" className="btn" onClick={() => setOrder(null)}>{t("close")}</button>
            </div>
          </div>
        )}
        {runs.length > 0 && (
          <ul className="drill-history" aria-label={t("history")}>
            {runs.slice(-6).reverse().map((r, i) => <li key={i}>{t("run", { day: r.day.split("-").reverse().join("/"), shape: r.shape, bpm: r.bpm, time: fmt(r.seconds) })}</li>)}
          </ul>
        )}
      </div>
    </details>
  );
}
