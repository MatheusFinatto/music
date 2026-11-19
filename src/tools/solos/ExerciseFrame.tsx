"use client";
import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { transport } from "@/core/audio";
import type { Exercise, Video } from "./curriculum/types";
import { follow } from "./nav";
import { keyName, rootFret, transposeExercise } from "./curriculum/transpose";
import { usePracticeKey } from "./progress";
import type { Part } from "./session/route";
import type { Rating } from "./session/schedule";
import { DemoProvider } from "./components/DemoPlayer";
import { TabDockProvider } from "./components/tabDock";
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

  // A teoria, o vídeo e o crédito vêm antes do palco, e o exemplo também (auditoria do impeccable: o vídeo era a fonte
  // do solo e ficava a mais de quatro telas do topo no celular).
  // Um h1 só por tela: o título da lição, ou o do exercício do 2º passo em diante, quando não há teoria.
  const IntroTitle = "h1";
  const ExTitle = intro ? "h2" : "h1";
  // No último passo (ou no único), "Próximo" encerra a lição: o botão diz isso.
  const last = !progress || progress.n === progress.total;
  const nextLabel = t(last ? "frame.finish" : "frame.next");
  const introNode = intro && (
      <section className="intro">
        <IntroTitle className="intro-title">{intro.title}</IntroTitle>
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

  const stage = (
    <div className="stage">
      {ex.kind === "map" && <MapEngine ex={ex} />}
      {ex.kind === "line" && <LineEngine ex={ex} />}
      {ex.kind === "find" && <FindEngine ex={ex} onResult={onRate} />}
      {ex.kind === "play-rest" && <PlayRestEngine ex={ex} />}
      {ex.kind === "echo" && <EchoEngine ex={ex} />}
      {ex.kind === "target" && <TargetEngine ex={ex} />}
      {ex.kind === "take" && <TakeEngine ex={ex} />}
    </div>
  );

  return (
    <article className={running ? "frame playing" : "frame"}>
      <div className="reading">
        {HINTED.includes(part) && <p className="hint">{t(`partHint.${part as "cold"}`)}</p>}
        {intro && introNode}
        <ExTitle className="ex-title">{ex.title}</ExTitle>
        <p className="goal">{ex.goal}</p>
        {moved && <p className="key-note">{t("key.note", { key: keyName(key), fret: rootFret(key) })}</p>}
        {part !== "cold" && ex.steps.length > 0 && (
          <ol className="steps" aria-label={t("frame.steps")}>{ex.steps.map((s) => <li key={s}>{s}</li>)}</ol>
        )}
      </div>

      {/* O exemplo mora na barra da base ("Ouvir o exemplo" ao lado de "Iniciar exercício") e a tablatura dele, logo abaixo dos acordes. */}
      {/* A tablatura abre sempre aqui, no fim do exercício; no eco, de ouvido, ela começa fechada. */}
      <TabDockProvider key={ex.id} defaultOpen={ex.kind !== "echo"}>
        {ex.demo && ex.base ? <DemoProvider ex={ex}>{stage}</DemoProvider> : stage}
      </TabDockProvider>

      {ex.kind === "find" && rated && (
        <footer className="rate">
          <div className="row">
            <button type="button" className="btn primary next" onClick={() => onRate(rated)}>{nextLabel}</button>
          </div>
        </footer>
      )}
      {ex.kind !== "find" && (
        <footer className="rate">
          <div className="row">
            <button type="button" className="btn primary next" onClick={() => onRate("ok")}>{nextLabel}</button>
          </div>
        </footer>
      )}

      {/* No fim do DOM de propósito: o Tab começa no conteúdo; o CSS (order) o mantém no topo. */}
      <header className="frame-head">
        <p className="crumb">
          <span className={`tag ${part}`}>{t(`part.${part}`)}</span>
          {progress && <span>{t("frame.step", progress)}</span>}
        </p>
        <div className="row">
          {onBack && <button type="button" className="btn small" onClick={onBack}>{t("frame.prev")}</button>}
          <a className="btn small" href="?" onClick={follow(onExit)}>{exitLabel}</a>
        </div>
      </header>
    </article>
  );
}
