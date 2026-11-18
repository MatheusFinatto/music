import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Metronomo } from "./Metronomo";

export async function MetronomoPage() {
  const t = await getTranslations("metronomo");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <h1 className="mb-6 text-[clamp(1.45rem,2.6vw,1.9rem)] font-[650] leading-[1.15] tracking-[-0.025em]">{t("title")}</h1>
        <Metronomo />
        {/* O app é o do afinador: um app só, com afinador e metrônomo. O download e a instalação ficam lá. */}
        <div className="card mt-12">
          <h2 className="text-[1.2rem] font-[650] tracking-[-0.02em]">{t("appTitle")}</h2>
          <p>{t("appLead")}</p>
          <div className="foot">
            <Link className="go whitespace-nowrap no-underline" href="/afinador#app">{t("appLink")}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
