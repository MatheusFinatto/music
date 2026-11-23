"use client";
import { Link, usePathname } from "@/i18n/navigation";

/** Os links do cabeçalho; o da página aberta (ou de uma página dentro dela) ganha aria-current e o estilo de ativo. */
export function NavLinks({ itens }: { itens: readonly { href: string; nome: string }[] }) {
  const caminho = usePathname();
  return itens.map(({ href, nome }) => {
    const ativo = caminho === href || caminho.startsWith(`${href}/`);
    return <Link key={href} href={href} aria-current={ativo ? "page" : undefined}>{nome}</Link>;
  });
}
