import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { TOOLS, isLive, type Tool } from "@/tools/registry";
import { NavLinks } from "./NavLinks";

export async function Header() {
  const t = await getTranslations();
  return (
    <header className="site-header">
      <div className="wrap">
        <Link className="brand" href="/" translate="no">
          {/* Pixel art de 32×32: mostrada em 32px exatos, sem suavizar, para cada ponto cair num pixel. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- 1 KB e tamanho fixo; o otimizador do next/image só borraria a pixel art */}
          <img src="/marmota.png" width={32} height={32} alt="" />
          {t("site.name")}
        </Link>
        <nav aria-label={t("nav.label")}>
          {/* As ferramentas vêm do registro: dá para ir de uma a outra sem passar pela home. O Laboratório fica só no rodapé. */}
          <NavLinks itens={(TOOLS as readonly Tool[]).filter(isLive).map((x) => ({
            href: x.href,
            nome: t.has(`nav.short.${x.slug}` as "nav.short.afinador") ? t(`nav.short.${x.slug}` as "nav.short.afinador") : t(`tools.${x.slug}.name` as "tools.afinador.name"),
          }))} />
        </nav>
      </div>
    </header>
  );
}
