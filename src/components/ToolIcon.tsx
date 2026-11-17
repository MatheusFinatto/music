import type { ReactNode } from "react";

// Ícones de linha, traço único (o estilo vem de .icon svg em globals.css).
// Ferramenta nova sem ícone aqui usa o genérico; acrescente o dela pela chave do slug.
const ICONS: Record<string, ReactNode> = {
  diario: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16M8.5 15l2.2 2.2 4.6-4.6" /></>,
  piano: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M9 5v14M15 5v14M7 5v8h4V5M13 5v8h4V5" /></>,
  "tirar-de-ouvido": <><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2" /></>,
  afinador: <><path d="M4 16a8 8 0 0 1 16 0" /><path d="M12 16l3.5-6" /><circle cx="12" cy="16" r="1.4" /><path d="M12 5v2M5.5 9.5l1.4 1.2M18.5 9.5l-1.4 1.2" /></>,
  "treino-de-ouvido": <><path d="M7 10a5 5 0 0 1 10 0c0 3-2.5 3.6-2.5 6a2.8 2.8 0 0 1-5.4 1" /><path d="M10 10.5a2 2 0 0 1 4 0c0 1.2-1.5 1.6-1.5 3" /></>,
  improvisacao: <><path d="M3 15c3 0 3-6 6-6s3 8 6 8 3-10 6-10" /></>,
  player: <><path d="M3 7h18M3 12h8M3 17h8" /><path d="M15 11.5v6l5-3z" /></>,
};
const FALLBACK = <><path d="M9 18V6l10-2v12" /><circle cx="6.5" cy="18" r="2.5" /><circle cx="16.5" cy="16" r="2.5" /></>;

export function ToolIcon({ slug }: { slug: string }) {
  return (
    <span className="icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">{ICONS[slug] ?? FALLBACK}</svg>
    </span>
  );
}
