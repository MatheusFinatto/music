"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { atAudioTime, transport } from "@/core/audio";
import type { TakeExercise } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { useBeat } from "../components/useTransport";

/** Tomada livre: a base toca o número de compassos combinado e para sozinha. */
export function TakeEngine({ ex }: { ex: TakeExercise }) {
  const t = useTranslations("solos.take");
  const beat = useBeat();

  useEffect(() => {
    let cancel = () => {};
    const off = transport.on("beat", (info) => {
      if (info.beatInBar === 0 && info.bar === ex.bars) cancel = atAudioTime(info.time, () => transport.stop());
    });
    return () => { off(); cancel(); };
  }, [ex.bars]);

  const live = !!beat && beat.beat >= 0;
  const bar = live ? Math.min(beat.bar + 1, ex.bars) : 0;
  const arc = ex.arc ?? [];
  // Com arco, a faixa diz em que parte do solo você está; a contagem de compassos vai para a linha de baixo.
  const at = arc.length && live ? Math.min(arc.length - 1, Math.floor(((bar - 1) * arc.length) / ex.bars)) : -1;
  const part = at >= 0 ? arc[at]! : null;
  return (
    <div className="engine">
      <Banner state={live ? "play" : null} word={part ?? t("playing")} note={t("bar", { bar, total: ex.bars })} idle={t("idle")} />
      {arc.length > 0 && (
        <ol className="pattern" aria-label={t("arc")}>
          {arc.map((a, i) => <li key={i} className={`play${i === at ? " on" : ""}`}>{a}</li>)}
        </ol>
      )}
      <BackingBar base={ex.base!} />
    </div>
  );
}
