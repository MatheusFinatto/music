import { getTranslations } from "next-intl/server";
import { ToolHeader } from "@/components/ToolHeader";
import { MetroFavorites } from "./MetroFavorites";
import { MetroInfo } from "./MetroInfo";
import { Metronomo } from "./Metronomo";
import "./metronomo.css";

export async function MetronomoPage() {
  const t = await getTranslations("metronomo");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <ToolHeader title={t("title")} actions={<><MetroFavorites /><MetroInfo /></>} />
        <Metronomo />
      </section>
    </main>
  );
}
