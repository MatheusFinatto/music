import { getTranslations } from "next-intl/server";
import { Metronomo } from "./Metronomo";

export async function MetronomoPage() {
  const t = await getTranslations("metronomo");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <h1 className="mb-6 text-[clamp(1.45rem,2.6vw,1.9rem)] font-[650] leading-[1.15] tracking-[-0.025em]">{t("title")}</h1>
        <Metronomo />
      </section>
    </main>
  );
}
