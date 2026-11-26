import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/** O app Android (Marmota Tuner: afinador e metrônomo). O APK é anexado a um Release do GitHub com este nome exato. */
export const APK_URL = "https://github.com/MatheusFinatto/music/releases/latest/download/marmota-tuner.apk";

/**
 * O segundo app (Marmota Trainer: treino de ouvido e de voz). "latest" é do Tuner, então este link aponta para a
 * versão: ao publicar uma nova, o Release sai sem "Latest" e este link muda para a tag nova.
 */
export const EAR_APK_URL = "https://github.com/MatheusFinatto/music/releases/download/marmota-trainer-v1.6/marmota-trainer.apk";

/**
 * O topo das ferramentas que também estão no app: título à esquerda (no celular, a volta ao início é a casinha da barra do
 * app); à direita, as ações da página ([actions],
 * ex.: o microfone do afinador) e "Baixar app", que baixa o APK direto: o Tuner ou, no treino ([app] = "ear"), o Trainer.
 */
export async function ToolHeader({ title, actions, app = "tuner" }: { title: string; actions?: ReactNode; app?: "tuner" | "ear" }) {
  const t = await getTranslations("site");
  return (
    <div className="tool-head">
      <h1>{title}</h1>
      <div className="tool-head-actions">
        {actions}
        <a
          className="tool-download"
          href={app === "ear" ? EAR_APK_URL : APK_URL}
          download
          aria-label={t(app === "ear" ? "downloadEarLabel" : "downloadAppLabel")}
          title={t(app === "ear" ? "downloadEarLabel" : "downloadAppLabel")}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" /></svg>
          {t("downloadApp")}
        </a>
      </div>
    </div>
  );
}

