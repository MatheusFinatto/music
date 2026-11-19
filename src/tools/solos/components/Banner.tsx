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
  // A região viva fica sempre montada: só o conteúdo troca, e o leitor de tela anuncia a mudança.
  if (count !== null)
    return (
      <div className="banner count" role="status">
        <strong>{count}</strong>
        <span>{t("counting")}</span>
      </div>
    );
  return (
    <div className={state ? `banner ${state}` : "banner idle"} role="status" aria-live="polite">
      {state ? (
        <>
          <strong>{word}</strong>
          <span>{note || " "}</span>
        </>
      ) : (
        idle
      )}
    </div>
  );
}
