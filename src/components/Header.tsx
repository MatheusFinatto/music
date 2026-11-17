import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Header() {
  const t = await getTranslations();
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href="/">
          <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <rect width="64" height="64" rx="14" fill="#27598a" />
            <path d="M24 44V18l22-5v26" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="19" cy="44" r="7" fill="#f0a634" />
            <circle cx="41" cy="39" r="7" fill="#f0a634" />
          </svg>
          {t("site.name")}
        </Link>
        <nav aria-label={t("nav.label")}>
          {/* O Laboratório é estático, fora do Next: link comum, sem prefixo de idioma. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/laboratorio">{t("nav.lab")}</a>
        </nav>
      </div>
    </header>
  );
}
