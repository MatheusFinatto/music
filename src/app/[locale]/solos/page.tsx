import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Bricolage_Grotesque } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Solos } from "@/tools/solos/Solos";

// Fonte de título da ferramenta; declarada aqui para não pesar nas outras páginas.
const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", display: "swap" });

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "solos" });
  return { title: t("title"), description: t("meta") };
}

export default async function SolosPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  // Só os textos desta ferramenta vão para o navegador.
  return (
    <NextIntlClientProvider messages={{ solos: messages.solos }}>
      <div className={`solos-root ${display.variable}`}>
        <Solos />
      </div>
    </NextIntlClientProvider>
  );
}
