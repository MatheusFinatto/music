import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { APK_URL } from "./ToolHeader";

/**
 * No celular, o afinador e o metrônomo têm a cara do app (marmota-tuner, BottomNav.kt): a tela inteira e a barra
 * flutuante embaixo com as duas abas. O site acrescenta só o que o app não precisa: a volta para o início e
 * "Baixar app". No computador a barra não aparece (ver .app-nav em globals.css).
 */
export async function AppNav({ current }: { current: "afinador" | "metronomo" }) {
  const t = await getTranslations();
  return (
    <nav className="app-nav" aria-label={t("nav.app")}>
      <Link className="app-nav-icon" href="/" aria-label={t("nav.home")} title={t("nav.home")}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg>
      </Link>
      {(["afinador", "metronomo"] as const).map((slug) => (
        <Link key={slug} className="app-nav-tab" href={`/${slug}`} aria-current={slug === current ? "page" : undefined}>
          {t(`nav.short.${slug}`)}
        </Link>
      ))}
      <a className="app-nav-icon" href={APK_URL} download aria-label={t("site.downloadAppLabel")} title={t("site.downloadAppLabel")}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" /></svg>
      </a>
    </nav>
  );
}
