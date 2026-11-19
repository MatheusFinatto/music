"use client";
import { useTranslations } from "next-intl";
import type { PlayRestExercise } from "../curriculum/types";
import { BackingBar } from "../components/BackingBar";
import { Banner } from "../components/Banner";
import { useBeat } from "../components/useTransport";

export function PlayRestEngine({ ex }: { ex: PlayRestExercise }) {
  const t = useTranslations("solos.playRest");
  const beat = useBeat();
  const n = ex.pattern.length;
  const live = !!beat && beat.beat >= 0;
  const at = live ? ((beat.bar % n) + n) % n : -1;
  const role = live ? ex.pattern[at]! : null;
  // Na segunda metade do compasso, avisa o que vem a seguir.
  const next = live && beat.beatInBar >= 2 ? ex.pattern[(at + 1) % n]! : null;
  const turning = next && next !== role;

  return (
    <div className="engine">
      <BackingBar base={ex.base!} />
      {ex.rule && <p className="rule">{ex.rule}</p>}
      <Banner
        state={role}
        word={role ? t(role) : undefined}
        note={turning ? t(next === "play" ? "nextPlay" : "nextRest") : undefined}
        idle={t("idle")}
      />
      <ol className="pattern" aria-label={t("pattern")}>
        {ex.pattern.map((r, i) => (
          <li key={i} className={`${r}${i === at ? " on" : ""}`}>{t(r === "play" ? "shortPlay" : "shortRest")}</li>
        ))}
      </ol>
    </div>
  );
}
