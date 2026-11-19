import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { Bricolage_Grotesque } from "next/font/google";
import { routing } from "@/i18n/routing";
import { Solos } from "@/tools/solos/Solos";

// O HTML gerado no servidor é sempre a trilha: o servidor não vê o `?licao=` do endereço. Quando o endereço já aponta para
// outra tela, esconde a trilha até o navegador montar a tela certa (o Solos tira a marca em seguida).
const DEEP_LINK = `if(/[?&](licao|exercicio|sessao|calendario)\\b/.test(location.search))document.documentElement.classList.add("solos-deep")`;

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
        <script dangerouslySetInnerHTML={{ __html: DEEP_LINK }} />
        <Solos />
      </div>
    </NextIntlClientProvider>
  );
}
