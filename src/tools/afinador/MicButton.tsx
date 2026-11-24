"use client";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { micState } from "./micState";

/**
 * O microfone, como o "mudo" do Discord: o ícone normal é microfone ligado; riscado é desligado (pela pessoa)
 * ou bloqueado (pelo navegador, em vermelho). Clicar liga, desliga ou tenta de novo.
 */
export function MicButton() {
  const t = useTranslations("afinador");
  const status = useSyncExternalStore(micState.subscribe, micState.get, micState.getServer);
  const on = status === "listening";
  const waiting = status === "starting" || status === "gesture";
  const blocked = status === "denied" || status === "unavailable" || status === "failed";
  const label = t(`micButton.${status}`);
  return (
    <button
      type="button"
      className={["tuner-mic", on ? "on" : "", waiting ? "waiting" : "", blocked ? "blocked" : ""].join(" ")}
      onClick={() => micState.toggle()}
      aria-pressed={on}
      aria-label={t("micLabel")}
      title={label}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="9" y="3.5" width="6" height="11" rx="3" />
        <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
        {!on && !waiting && <path className="slash" d="M4 4l16 16" />}
      </svg>
    </button>
  );
}
