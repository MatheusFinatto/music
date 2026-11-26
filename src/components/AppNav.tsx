import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { APK_URL, EAR_APK_URL } from "./ToolHeader";
import { Conta } from "./Conta";
import { textosConta } from "./textosConta";

/** As ferramentas que são telas de um app, agrupadas pelo app: o site espelha a barra de cada um. */
const APPS = {
  tuner: { telas: ["afinador", "metronomo"], apk: APK_URL, rotulo: "site.downloadAppLabel" },
  trainer: { telas: ["treino-de-ouvido", "treino-de-voz"], apk: EAR_APK_URL, rotulo: "site.downloadEarLabel" },
} as const;
type Tela = (typeof APPS)[keyof typeof APPS]["telas"][number];

/**
 * No celular, o site espelha os apps: a barra flutuante embaixo com as abas do app da página (Afinador e Metrônomo do
 * Marmota Tuner, BottomNav.kt; Ouvido e Voz do Marmota Trainer, Abas em marmotaear/MainActivity.kt). O site acrescenta só
 * o que o app não precisa: a volta para o início e "Baixar app" (o APK daquele app). A conta opcional (o "G") fica nela como
 * nos apps. No computador a barra não aparece
 * (ver .app-nav em globals.css).
 */
export async function AppNav({ current }: { current: Tela }) {
  const t = await getTranslations();
  const app = APPS.tuner.telas.includes(current as never) ? APPS.tuner : APPS.trainer;
  return (
    <nav className="app-nav" aria-label={t("nav.app")}>
      <Link className="app-nav-icon" href="/" aria-label={t("nav.home")} title={t("nav.home")}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></svg>
      </Link>
      {app.telas.map((slug) => (
        <Link key={slug} className="app-nav-tab" href={`/${slug}`} aria-current={slug === current ? "page" : undefined}>
          {t(`nav.short.${slug}`)}
        </Link>
      ))}
      <Conta t={await textosConta()} className="app-nav-icon" />
      <a className="app-nav-icon" href={app.apk} download aria-label={t(app.rotulo)} title={t(app.rotulo)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" /></svg>
      </a>
    </nav>
  );
}
