"use client";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { transport } from "@/core/audio";
import type { Exercise, Video } from "./curriculum/types";
import { keyName, rootFret, transposeExercise } from "./curriculum/transpose";
import { usePracticeKey } from "./progress";
import type { Part } from "./session/route";
import type { Rating } from "./session/schedule";
import { DemoPlayer } from "./components/DemoPlayer";
import { useRunning } from "./components/useTransport";
import { EchoEngine } from "./engines/EchoEngine";
import { FindEngine } from "./engines/FindEngine";
import { LineEngine } from "./engines/LineEngine";
import { MapEngine } from "./engines/MapEngine";
import { PlayRestEngine } from "./engines/PlayRestEngine";
import { TakeEngine } from "./engines/TakeEngine";
import { TargetEngine } from "./engines/TargetEngine";


type Props = {
  ex: Exercise;
  part: Part;
  /** Texto da lição, mostrado antes do primeiro exercício dela. */
  intro?: { title: string; text: string; concepts?: string[]; videos?: Video[]; source?: { title: string; url: string } };
  progress?: { n: number; total: number };
  /** Avaliação já dada a este passo nesta sessão (ao voltar um passo). */
  rated?: Rating;
  onRate: (r: Rating) => void;
  onBack?: () => void;
  onExit: () => void;
  exitLabel: string;
};

const HINTED: Part[] = ["cold", "again", "review", "phrase", "take"];

export function ExerciseFrame({ ex: written, part, intro, progress, rated, onRate, onBack, onExit, exitLabel }: Props) {
  const t = useTranslations("solos");
  const running = useRunning();
  const key = usePracticeKey();
  // O exercício no tom de prática; o escrito em outro tom de propósito não muda.
  const ex = useMemo(() => transposeExercise(written, key), [written, key]);
  const moved = ex !== written;

  // Ao trocar de exercício ou sair, a base para.
  useEffect(() => () => transport.stop(), [ex.id, key]);
  // Ligar a base não mexe na tela: quem está com a guitarra na mão não quer a página pulando (pedido do dono).

  // Lição de solo de uma música (tem fonte): o "Tocar" vem primeiro; a teoria e o vídeo ficam logo abaixo do palco.
  const late = Boolean(intro?.source);
  const introNode = intro && (
      <section className="intro">
        <h2>{intro.title}</h2>
        <p>{intro.text}</p>
        {intro.concepts && intro.concepts.length > 0 && (
          <ul className="concepts" aria-label={t("frame.concepts")}>
            {intro.concepts.map((q) => (
              <li key={q}><a href={`https://www.google.com/search?q=${encodeURIComponent(q)}`} target="_blank" rel="noreferrer">{q}</a></li>
            ))}
          </ul>
        )}
        {intro.videos?.map((v) => (
          <figure key={v.youtube} className="lesson-video">
            <p>{v.note}</p>
            {/* Incorporado, não baixado: o vídeo continua sendo de quem fez. Só carrega quando aparece na tela. */}
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${v.youtube}`}
              title={v.title}
              loading="lazy"
              allow="encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <figcaption>{t("frame.video", { title: v.title, author: v.author })}</figcaption>
          </figure>
        ))}
        {intro.source && (
          <p className="source">
            {t.rich("frame.source", { link: (chunks) => <a href={intro.source!.url} target="_blank" rel="noreferrer">{chunks}</a>, title: intro.source.title })}
          </p>
        )}
      </section>
  );

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
        {intro && !late && introNode}
        <h1>{ex.title}</h1>
        <p className="goal">{ex.goal}</p>
        {moved && <p className="key-note">{t("key.note", { key: keyName(key), fret: rootFret(key) })}</p>}
        {part !== "cold" && ex.steps.length > 0 && (
          <ol className="steps" aria-label={t("frame.steps")}>{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        )}
      </div>

      <div className="stage">
        {ex.kind === "map" && <MapEngine ex={ex} />}
        {ex.kind === "line" && <LineEngine ex={ex} />}
        {ex.kind === "find" && <FindEngine ex={ex} onResult={onRate} />}
        {ex.kind === "play-rest" && <PlayRestEngine ex={ex} />}
        {ex.kind === "echo" && <EchoEngine ex={ex} />}
        {ex.kind === "target" && <TargetEngine ex={ex} />}
        {ex.kind === "take" && <TakeEngine ex={ex} />}
      </div>

      {intro && late && introNode}

      {/* O exemplo vem depois do palco: o "Tocar base" é a ação principal e tem que estar à vista (pedido do dono, 2026-11-19). */}
      {ex.demo && ex.base && <DemoPlayer key={ex.id} ex={ex} />}

      {ex.kind === "find" && rated && (
        <footer className="rate">
          <div className="row">
            <button type="button" className="btn primary next" onClick={() => onRate(rated)}>{t("frame.next")}</button>
          </div>
        </footer>
      )}
      {ex.kind !== "find" && (
        <footer className="rate">
          <div className="row">
            <button type="button" className="btn primary next" onClick={() => onRate("ok")}>{t("frame.next")}</button>
          </div>
        </footer>
      )}
    </article>
  );
}
