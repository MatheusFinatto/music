import { getTranslations } from "next-intl/server";
import { WebTuner } from "./WebTuner";
import "./afinador.css";

// Dois afinadores com a mesma lógica (marmota-tuner/core, em Kotlin): o do navegador, logo aqui,
// e o app Android Marmota Tuner, que a pessoa baixa se preferir. Ver marmota-tuner/README.md.
// O APK é anexado a um Release do GitHub com este nome exato.
const APK_URL = "https://github.com/MatheusFinatto/music/releases/latest/download/marmota-tuner.apk";
const SOURCE_URL = "https://github.com/MatheusFinatto/music/tree/main/marmota-tuner";

export async function Afinador() {
  const t = await getTranslations("afinador");
  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <h1 className="text-[clamp(1.45rem,2.6vw,1.9rem)] font-[650] leading-[1.15] tracking-[-0.025em]">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("lead")}</p>

        <div className="mt-6">
          <WebTuner />
        </div>
        <p className="mt-4 text-[0.92rem] text-muted">{t("limits")}</p>

        <div id="app" className="card mt-12 scroll-mt-20">
          <h2 className="text-[1.2rem] font-[650] tracking-[-0.02em]">{t("appTitle")}</h2>
          <p>{t("appLead")}</p>
          <div className="foot flex-wrap">
            <a className="go whitespace-nowrap no-underline" href={APK_URL}>{t("download")}</a>
            <span className="badge">{t("platform")}</span>
          </div>
          <h3 className="mt-4 font-[650]">{t("installTitle")}</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="text-muted">{t("notStore")}</p>
          <p>
            <a className="font-semibold text-accent" href={SOURCE_URL}>{t("source")}</a>
          </p>
        </div>
      </section>
    </main>
  );
}
