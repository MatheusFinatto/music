"use client";
import { useTranslations } from "next-intl";
import { useCountIn } from "./BackingBar";

type Props = {
  /** Estado enquanto a base toca; null com a base parada. */
  state: "play" | "rest" | "call" | null;
  /** Palavra grande (ex.: "Toque"). */
  word?: string;
  /** Linha de apoio, lida de relance. */
  note?: string;
  /** Texto com a base parada. */
  idle: string;
};

/** A faixa que se lê de longe: contagem, e depois o que fazer agora. */
export function Banner({ state, word, note, idle }: Props) {
  const t = useTranslations("solos.backing");
  const count = useCountIn();
  if (count !== null)
    return (
      <div className="banner count" role="status">
        <strong>{count}</strong>
        <span>{t("counting")}</span>
      </div>
    );
  if (!state) return <p className="banner idle">{idle}</p>;
  return (
    <div className={`banner ${state}`} aria-live="polite">
      <strong>{word}</strong>
      <span>{note || " "}</span>
    </div>
  );
}
