import { getTranslations } from "next-intl/server";
import { Metronomo } from "./Metronomo";

/** O app é o do afinador (Marmota Tuner): um app só, com afinador e metrônomo. O link baixa o APK do último Release. */
const APK_URL = "https://github.com/MatheusFinatto/music/releases/latest/download/marmota-tuner.apk";

export async function MetronomoPage() {
  const t = await getTranslations("metronomo");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[clamp(1.45rem,2.6vw,1.9rem)] font-[650] leading-[1.15] tracking-[-0.025em]">{t("title")}</h1>
          <a className="metro-download" href={APK_URL} download aria-label={t("downloadLabel")} title={t("downloadLabel")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" /></svg>
            {t("download")}
          </a>
        </div>
        <Metronomo />
      </section>
    </main>
  );
}
