import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "privacidade" });
  return { title: t("title"), description: t("description") };
}

/** O que a conta opcional guarda (ver .specs/001-conta-e-sincronizacao.md). Curto: quem lê quer saber o que e como apagar. */
export default async function PrivacidadePage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("privacidade");
  return (
    <main className="wrap privacidade">
      <h1>{t("title")}</h1>
      {(t.raw("itens") as string[]).map((x) => <p key={x}>{x}</p>)}
    </main>
  );
}
