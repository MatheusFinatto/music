import dados from "./musicas.json";
import type { Musica } from "./cantar";

/** As músicas do exercício de cantar: melodias tradicionais ou de domínio público, em semitons acima da tônica (ver docs/treino-de-ouvido/MUSICAS.md). */
export const MUSICAS: readonly Musica[] = dados as Musica[];
export const musicaDe = (id: string): Musica => MUSICAS.find((m) => m.id === id) ?? MUSICAS[0]!;
