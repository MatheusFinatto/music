"use client";
import { useTranslations } from "next-intl";
import { Info } from "@/components/Info";

/** O "?" do metrônomo, no topo da página ao lado de "Baixar app": o "?" do site (balão no mouse, modal no toque). */
export function MetroInfo() {
  const t = useTranslations("metronomo");
  return <Info label={t("infoOpen")} title={t("infoTitle")} close={t("close")} travado={t("infoTravado")} items={t.raw("infoItems") as string[]} />;
}
