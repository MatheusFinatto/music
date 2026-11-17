import { getTranslations } from "next-intl/server";
import { ToolIcon } from "@/components/ToolIcon";

// Por enquanto o afinador é o app Android em marmota-tuner/. Esta página só explica e entrega o APK.
// O arquivo é anexado a um Release do GitHub com este nome exato (ver marmota-tuner/README.md).
const APK_URL = "https://github.com/MatheusFinatto/music/releases/latest/download/marmota-tuner.apk";
const SOURCE_URL = "https://github.com/MatheusFinatto/music/tree/main/marmota-tuner";

export async function Afinador() {
  const t = await getTranslations("afinador");
  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <main className="wrap" id="ferramentas">
      <section className="section mx-auto max-w-[640px]">
        <div className="card">
          <ToolIcon slug="afinador" />
          <h1 className="text-[clamp(1.45rem,2.6vw,1.9rem)] font-[650] leading-[1.15] tracking-[-0.025em]">{t("title")}</h1>
          <p>{t("lead")}</p>
          <div className="foot flex-wrap">
            <a className="go whitespace-nowrap no-underline" href={APK_URL}>{t("download")}</a>
            <span className="badge">{t("platform")}</span>
          </div>
        </div>

        <h2 className="mt-10 text-[1.2rem] font-[650] tracking-[-0.02em]">{t("installTitle")}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 text-muted">
          {steps.map((step) => <li key={step}>{step}</li>)}
        </ol>

        <p className="mt-8 text-muted">{t("notStore")}</p>
        <p className="mt-3 text-muted">{t("limits")}</p>
        <p className="mt-3">
          <a className="font-semibold text-accent" href={SOURCE_URL}>{t("source")}</a>
        </p>
      </section>
    </main>
  );
}
