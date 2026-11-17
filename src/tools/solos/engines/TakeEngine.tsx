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
  return (
    <div className="engine">
      <Banner state={live ? "play" : null} word={t("playing")} note={t("bar", { bar, total: ex.bars })} idle={t("idle")} />
      <BackingBar base={ex.base!} />
    </div>
  );
}
