// Backup dos dados do usuário: tudo o que está no localStorage com o prefixo "musica:" vira um arquivo JSON.
// Formato compatível com o do Laboratório (legacy/src/lib/store.js): { app: "musica", version: 1, exportedAt, <nome>: valor }.
// Os carimbos internos ("_stamps" e afins) ficam de fora.

const PREFIX = "musica:";
const META = new Set(["app", "version", "exportedAt"]);

type Armazem = Pick<Storage, "length" | "key" | "getItem" | "setItem">;

export type Backup = { app: "musica"; version: 1; exportedAt: string } & Record<string, unknown>;

export function exportar(store: Armazem, agora = new Date()): Backup {
  const out: Backup = { app: "musica", version: 1, exportedAt: agora.toISOString() };
  for (let i = 0; i < store.length; i++) {
    const key = store.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    const nome = key.slice(PREFIX.length);
    if (!nome || nome.startsWith("_") || META.has(nome)) continue;
    try { out[nome] = JSON.parse(store.getItem(key) ?? "null"); } catch { /* valor corrompido: fica de fora */ }
  }
  return out;
}

/** Grava o que veio do arquivo e devolve quantas partes entraram. Lança erro se o arquivo não for um backup deste site. */
export function restaurar(obj: unknown, store: Armazem): number {
  if (!obj || typeof obj !== "object" || (obj as { app?: unknown }).app !== "musica") throw new Error("arquivo");
  let n = 0;
  for (const [nome, valor] of Object.entries(obj)) {
    if (META.has(nome) || nome.startsWith("_") || valor === undefined) continue;
    store.setItem(PREFIX + nome, JSON.stringify(valor));
    n++;
  }
  return n;
}
