import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="site-footer">
      <div className="wrap">
        <p>{t("free")} {t("data")}</p>
        {/* Estático, fora do Next. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/laboratorio">{t("backup")}</a>
      </div>
    </footer>
  );
}
