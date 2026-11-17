"use client";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { transport } from "@/core/audio";
import type { Exercise } from "./curriculum/types";
import type { Rating } from "./session/schedule";
import { useRunning } from "./components/useTransport";
import { EchoEngine } from "./engines/EchoEngine";
import { FindEngine } from "./engines/FindEngine";
import { MapEngine } from "./engines/MapEngine";
import { PlayRestEngine } from "./engines/PlayRestEngine";
import { TakeEngine } from "./engines/TakeEngine";

export type Part = "cold" | "new" | "again" | "phrase" | "review" | "take" | "free";

type Props = {
  ex: Exercise;
  part: Part;
  /** Texto da lição, mostrado antes do primeiro exercício dela. */
  intro?: { title: string; text: string };
  progress?: { n: number; total: number };
  /** Avaliação já dada a este passo nesta sessão (ao voltar um passo). */
  rated?: Rating;
  onRate: (r: Rating) => void;
  onBack?: () => void;
  onExit: () => void;
  exitLabel: string;
};

const HINTED: Part[] = ["cold", "again", "review", "phrase", "take"];
const RATINGS = ["ok", "quase", "nao"] as const;

export function ExerciseFrame({ ex, part, intro, progress, rated, onRate, onBack, onExit, exitLabel }: Props) {
  const t = useTranslations("solos");
  const running = useRunning();
  const [rating, setRating] = useState<Rating | null>(rated ?? null);
  const stage = useRef<HTMLDivElement>(null);

  // Ao trocar de exercício ou sair, a base para.
  useEffect(() => () => transport.stop(), [ex.id]);
  // Modo "tocando": ao ligar a base, o que se lê de longe sobe para o topo da tela.
  useEffect(() => { if (running) stage.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [running]);

  return (
    <article className={running ? "frame playing" : "frame"}>
      <header className="frame-head">
        <p className="crumb">
          <span className={`tag ${part}`}>{t(`part.${part}`)}</span>
          {progress && <span>{t("frame.step", progress)}</span>}
        </p>
        <div className="row">
          {onBack && <button type="button" className="btn small" onClick={onBack}>{t("frame.prev")}</button>}
          <button type="button" className="btn small" onClick={onExit}>{exitLabel}</button>
        </div>
      </header>

      <div className="reading">
        {HINTED.includes(part) && <p className="hint">{t(`partHint.${part as "cold"}`)}</p>}
        {intro && (
          <section className="intro">
            <h2>{intro.title}</h2>
            <p>{intro.text}</p>
          </section>
        )}
        <h1>{ex.title}</h1>
        <p className="goal">{ex.goal}</p>
        {part !== "cold" && ex.steps.length > 0 && (
          <ol className="steps" aria-label={t("frame.steps")}>{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        )}
      </div>

      <div className="stage" ref={stage}>
        <p className="stage-title">{ex.title}</p>
        {ex.kind === "map" && <MapEngine ex={ex} />}
        {ex.kind === "find" && <FindEngine ex={ex} onResult={onRate} />}
        {ex.kind === "play-rest" && <PlayRestEngine ex={ex} />}
        {ex.kind === "echo" && <EchoEngine ex={ex} />}
        {ex.kind === "take" && <TakeEngine ex={ex} />}
      </div>

      {ex.kind === "find" && rated && (
        <footer className="rate">
          <div className="row">
            <button type="button" className="btn primary next" onClick={() => onRate(rated)}>{t("frame.next")}</button>
          </div>
        </footer>
      )}
      {ex.kind !== "find" && (
        <footer className="rate">
          <p id="rate-q"><strong>{t("frame.rate")}</strong> {ex.check}</p>
          <div className="row" role="group" aria-labelledby="rate-q">
            {RATINGS.map((r) => (
              <button key={r} type="button" className="btn choice" aria-pressed={rating === r} onClick={() => setRating(r)}>{t(`frame.${r}`)}</button>
            ))}
            <button type="button" className="btn primary next" disabled={!rating} onClick={() => rating && onRate(rating)}>{t("frame.next")}</button>
          </div>
          {!rating && <p className="note">{t("frame.rateHint")}</p>}
        </footer>
      )}
    </article>
  );
}
