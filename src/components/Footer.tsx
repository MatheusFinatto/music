import { getTranslations } from "next-intl/server";

const ISSUES = "https://github.com/MatheusFinatto/music/issues/new";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>{t("free")} {t("data")}</p>
        <div className="links">
          {/* O canal de retorno do site são as issues do GitHub: abertas, sem conta no site. */}
          <a href={ISSUES} target="_blank" rel="noreferrer">{t("issue")}</a>
          {/* Estático, fora do Next. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/laboratorio">{t("backup")}</a>
        </div>
      </div>
    </footer>
  );
}
