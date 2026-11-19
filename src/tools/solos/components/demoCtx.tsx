"use client";
import { createContext, useContext } from "react";
import { useTranslations } from "next-intl";
import { transport } from "@/core/audio";
import type { Exercise } from "../curriculum/types";
import { Board, chordNames, TextTab } from "./PhraseViews";
import { TabSlot } from "./tabDock";

export type DemoState = { ex: Exercise; live: boolean; sounding: number; play: () => void };
export const DemoCtx = createContext<DemoState | null>(null);
/** O exemplo da tela, se o exercício tem um: a barra da base e a tablatura leem daqui. */
export const useDemo = () => useContext(DemoCtx);

/** "Ouvir o exemplo" / "Parar o exemplo": mora na barra da base, ao lado de "Iniciar exercício". */
export function DemoButton() {
  const t = useTranslations("solos.demo");
  const d = useDemo()!;
  return (
    <button type="button" className="btn" onClick={d.live ? () => transport.stop() : d.play} aria-pressed={d.live}>{d.live ? t("stop") : t("play")}</button>
  );
}

/** A tablatura do exemplo (e o braço dele, nos exercícios sem braço na tela): vai para o fim do exercício. */
export function DemoTab() {
  const t = useTranslations("solos.demo");
  const d = useDemo()!;
  const { ex } = d, demo = ex.demo!;
  return (
    <TabSlot label={t("tabLabel")}>
      {/* Palhetada alternada: o exemplo sobe e desce sem nunca repetir o sentido, começando para cima (V). */}
      <TextTab phrase={demo} now={d.live ? d.sounding : -1} chords={chordNames(ex.base!)} label={t("tabLabel")} picks={ex.kind === "map" && ex.picking ? demo.notes.map((_, i) => (i % 2 === 0 ? "V" : "⊓")) : undefined} />
      {/* No exercício de mapa o braço já está na tela: dois braços iguais só confundem. */}
      {ex.kind !== "map" && <Board phrase={demo} now={d.live ? d.sounding : -1} label={t("boardLabel")} half={t("bendHalf")} full={t("bendFull")} />}
    </TabSlot>
  );
}
