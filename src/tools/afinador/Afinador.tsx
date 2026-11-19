import { getTranslations } from "next-intl/server";
import { WebTuner } from "./WebTuner";
import "./afinador.css";

// Dois afinadores com a mesma lógica (marmota-tuner/core, em Kotlin): o do navegador, logo aqui,
// e o app Android Marmota Tuner, que a pessoa baixa se preferir. Ver marmota-tuner/README.md.
// O APK é anexado a um Release do GitHub com este nome exato.
const APK_URL = "https://github.com/MatheusFinatto/music/releases/latest/download/marmota-tuner.apk";
/** App livre que acompanha os lançamentos do GitHub e avisa da versão nova, sem pôr internet no nosso app. */
const OBTAINIUM_URL = "https://obtainium.imranr.dev/";

export async function Afinador() {
  const t = await getTranslations("afinador");
  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <h1 className="text-[clamp(1.45rem,2.6vw,1.9rem)] font-[650] leading-[1.15] tracking-[-0.025em]">{t("title")}</h1>

        <div className="mt-6">
          <WebTuner />
        </div>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label={t("stringsLabel")}>
          {["E2", "A2", "D3", "G3", "B3", "E4"].map((n) => <li key={n} className="rounded-full bg-soft px-3 py-1 text-[0.92rem] font-semibold tabular-nums text-ink">{n}</li>)}
        </ul>
        <p className="mt-4 text-[0.92rem] text-muted">{t("limits")}</p>

        <div id="app" className="card mt-12 scroll-mt-20 [&_p]:max-w-[62ch]">
          <h2 className="text-[1.4rem] font-[650] tracking-[-0.02em]">{t("appTitle")}</h2>
          <p>{t("appLead")}</p>
          <p className="text-muted">{t("appVersion")}</p>
          <div className="foot flex-wrap">
            <a className="go whitespace-nowrap no-underline" href={APK_URL}>{t("download")}</a>
            <span className="badge">{t("platform")}</span>
          </div>
          <h3 className="mt-4 text-[1.05rem] font-[650]">{t("installTitle")}</h3>
          <ol className="list-decimal space-y-2 pl-6 text-muted">
            {steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="text-muted">{t("notStore")}</p>
          <h3 className="mt-4 text-[1.05rem] font-[650]">{t("updateTitle")}</h3>
          <p className="text-muted">
            {t.rich("updateText", { link: (chunks) => <a href={OBTAINIUM_URL} target="_blank" rel="noreferrer">{chunks}</a> })}
          </p>
        </div>
      </section>
    </main>
  );
}
