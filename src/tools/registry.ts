// Fonte única da lista de ferramentas. O hub e a navegação leem daqui.
// Para adicionar uma ferramenta, veja docs/ARQUITETURA.md ("Como adicionar uma ferramenta").

export type ToolStatus =
  | "pronta" // no ar, feita na estrutura nova
  | "laboratorio" // no ar, mas é experimento do site antigo (legacy/)
  | "proxima" // em construção agora
  | "planejada"; // ainda não começou

export type Tool = {
  /** Identificador estável; também é a chave dos textos em messages/<locale>.json → tools.<slug>. */
  slug: string;
  status: ToolStatus;
  /** Só para ferramentas no ar. Rotas do Laboratório ficam fora do Next (estático). */
  href?: string;
};

export const TOOLS = [
  // Diário do Solo e Piano de Ideias (site antigo) saíram do hub; seguem acessíveis em /laboratorio.
  { slug: "solos", status: "pronta", href: "/solos" },
  { slug: "tirar-de-ouvido", status: "planejada" },
  { slug: "afinador", status: "planejada" },
  { slug: "treino-de-ouvido", status: "planejada" },
  { slug: "player", status: "planejada" },
] as const satisfies readonly Tool[];

export type ToolSlug = (typeof TOOLS)[number]["slug"];

export const isLive = (t: Tool): t is Tool & { href: string } =>
  (t.status === "pronta" || t.status === "laboratorio") && !!t.href;
