import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { TOOLS, isLive, type Tool } from "@/tools/registry";
import { Staff } from "@/components/Staff";
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
  // As chaves vêm do registro: toda ferramenta tem tools.<slug>.name e .summary em messages.
  const name = (x: Tool) => t(`tools.${x.slug}.name` as "tools.afinador.name");
  const summary = (x: Tool) => t(`tools.${x.slug}.summary` as "tools.afinador.summary");
  const notes = [...live, ...next, ...planned].map((x) => ({ filled: isLive(x), target: x.status === "proxima" }));

  return (
    <main className="wrap" id="conteudo">
      <section className="hero">
        <h1 className="rise">{t("hub.title")}</h1>
        <p className="rise">{t("hub.lead")}</p>
        <Staff notes={notes} />
      </section>

      {live.length > 0 && (
        <section className="section" id="ferramentas" aria-labelledby="h-live">
          <h2 id="h-live">{t("hub.live")}</h2>
          <ul className="grid">
            {live.map((x, i) => (
              <li key={x.slug} className={i === 0 && x.slug === "solos" ? "rise featured" : "rise"} style={{ "--i": i + 2 } as React.CSSProperties}>
                <ToolLink href={x.href} featured={i === 0 && x.slug === "solos"}>
                  <ToolIcon slug={x.slug} />
                  <h3>{name(x)}</h3>
                  <p>{summary(x)}</p>
                  <span className="foot">
                    <span className="go">{t("hub.open")}<Arrow /></span>
                    {x.status === "laboratorio" && <span className="badge">{t("status.laboratorio")}</span>}
                  </span>
                </ToolLink>
              </li>
            ))}
          </ul>
        </section>
      )}

      {next.length > 0 && (
        <section className="section" aria-labelledby="h-next">
          <h2 id="h-next">{t("hub.next")}</h2>
          <ul className="grid">
            {next.map((x) => (
              <li key={x.slug}>
                <div className="card next">
                  <ToolIcon slug={x.slug} />
                  <div className="text">
                    <h3>{name(x)}</h3>
                    <p>{summary(x)}</p>
                  </div>
                  <span className="badge proxima">{t("status.proxima")}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {planned.length > 0 && (
        <section className="section" aria-labelledby="h-planned">
          <h2 id="h-planned">{t("hub.planned")}</h2>
          <p>{t("hub.plannedNote")}</p>
          <ul className="grid small">
            {planned.map((x) => (
              <li key={x.slug}>
                <div className="card planned">
                  <ToolIcon slug={x.slug} />
                  <h3>{name(x)}</h3>
                  <p>{summary(x)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

/** Ferramentas novas são rotas do Next; as do Laboratório são páginas estáticas fora dele. */
function ToolLink({ href, children, featured }: { href: string; children: React.ReactNode; featured?: boolean }) {
  const cls = featured ? "card featured" : "card";
  return href.startsWith("/laboratorio") ? <a className={cls} href={href}>{children}</a> : <Link className={cls} href={href}>{children}</Link>;
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
