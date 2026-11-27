import { getTranslations } from "next-intl/server";

const ISSUES = "https://github.com/MatheusFinatto/music/issues/new";

export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="links">
          {/* O canal de retorno do site são as issues do GitHub: abertas, sem conta no site. Só aparece na home (globals.css). */}
          <a className="footer-issue" href={ISSUES} target="_blank" rel="noreferrer">{t("issue")}</a>
        </div>
      </div>
    </footer>
  );
}
