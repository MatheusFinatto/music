import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

/** O app Android (Marmota Tuner: afinador e metrônomo). O APK é anexado a um Release do GitHub com este nome exato. */
export const APK_URL = "https://github.com/MatheusFinatto/music/releases/latest/download/marmota-tuner.apk";

/**
 * O topo das ferramentas que também estão no app: título à esquerda; à direita, as ações da página ([actions],
 * ex.: o microfone do afinador) e "Baixar app", que baixa o APK direto.
 */
export async function ToolHeader({ title, actions }: { title: string; actions?: ReactNode }) {
  const t = await getTranslations("site");
  return (
    <div className="tool-head">
      <h1>{title}</h1>
      <div className="tool-head-actions">
        {actions}
        <a className="tool-download" href={APK_URL} download aria-label={t("downloadAppLabel")} title={t("downloadAppLabel")}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" /></svg>
          {t("downloadApp")}
        </a>
      </div>
    </div>
  );
}
