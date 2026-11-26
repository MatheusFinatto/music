import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { TOOLS, isLive, type Tool } from "@/tools/registry";
import { Marmota } from "@/components/Marmota";
import { Pauta } from "@/components/Pauta";
import { PixelArt } from "@/components/PixelArt";
import { ToolIcon } from "@/components/ToolIcon";

type Props = { params: Promise<{ locale: string }> };

export default async function Hub({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations();

  const tools: readonly Tool[] = TOOLS;
  const live = tools.filter(isLive);
  const next = tools.filter((x) => x.status === "proxima");
  const planned = tools.filter((x) => x.status === "planejada");
  // As chaves vêm do registro: toda ferramenta tem tools.<slug>.name em messages. O hub não descreve: ícone e nome bastam.
  const name = (x: Tool) => t(`tools.${x.slug}.name` as "tools.afinador.name");

  return (
    <main className="wrap hub" id="conteudo">
      <section className="stage">
        <Marmota />
        <div className="stage-text">
          <h1>{t("hub.title")}</h1>
        </div>
      </section>
      {/* A marmota senta na pauta, que toca o começo de "Marmotte", de Beethoven. */}
      <Pauta t={{
        label: t("hub.pauta.label"), nome: t("hub.pauta.nome"), tocar: t("hub.pauta.tocar"), parar: t("hub.pauta.parar"),
        historia: t("hub.pauta.historia"), fechar: t("hub.pauta.fechar"), travado: t("hub.pauta.travado"), texto: [t("hub.pauta.texto1"), t("hub.pauta.texto2")],
      }} />

      {/* Uma fileira só: as ferramentas no ar (o card inteiro é o link) e, quietas no fim, as que ainda não existem, com a
          situação dita no selo. No desktop tudo cabe na tela sem rolar; no celular rola. */}
      <section id="ferramentas" aria-label={t("hub.live")}>
        <ul className="score" style={{ "--n": live.length + next.length + planned.length } as React.CSSProperties}>
          {live.map((x) => (
            <li key={x.slug} className="part">
              <ToolLink href={x.href}>
                <ToolIcon slug={x.slug} />
                <h2>{name(x)}</h2>
                <span className="foot">
                  <span className="go">{t("hub.open")}<Arrow /></span>
                  {x.status === "laboratorio" && <span className="badge">{t("status.laboratorio")}</span>}
                </span>
              </ToolLink>
            </li>
          ))}
          {[...next, ...planned].map((x) => (
            <li key={x.slug} className="part">
              <div className={`card quieto${x.status === "proxima" ? " proxima" : ""}`}>
                <ToolIcon slug={x.slug} />
                <h2>{name(x)}</h2>
                <span className="foot">
                  <span className={`badge${x.status === "proxima" ? " proxima" : ""}`}>{t(x.status === "proxima" ? "status.proxima" : "status.planejada")}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

/** Ferramentas novas são rotas do Next; as do Laboratório são páginas estáticas fora dele. */
function ToolLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls = "card";
  return href.startsWith("/laboratorio") ? <a className={cls} href={href}>{children}</a> : <Link className={cls} href={href}>{children}</Link>;
}

/** Seta em pixel (7×5), no grid do resto. */
function Arrow() {
  return <PixelArt className="arrow" grid={`
....#..
.....#.
#######
.....#.
....#..`} />;
}
