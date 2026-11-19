import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const viewport: Viewport = { themeColor: "#120e0b", colorScheme: "dark" };

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "site" });
  return { title: { default: t("title"), template: `%s · ${t("name")}` }, description: t("description") };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations("site");

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body>
        {/* messages={null}: os textos não vão para o navegador por padrão. Ferramenta com
            componente cliente passa só o bloco dela (ver docs/ARQUITETURA.md). */}
        <NextIntlClientProvider messages={null}>
          <a className="skip" href="#conteudo">{t("skip")}</a>
          <Header />
          {children}
          <Footer />
        </NextIntlClientProvider>
        {/* Visitas por página (sem cookie). Só registra na Vercel, depois de ativado no painel do projeto. */}
        <Analytics />
      </body>
    </html>
  );
}
