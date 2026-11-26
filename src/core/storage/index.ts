// Dados do usuário no navegador (localStorage, prefixo "musica:").
// Cada ferramenta tem uma chave própria, "musica:<slug>", com um campo `version` para migrar depois.
// O store é assinável, para uso com useSyncExternalStore.
// Cada gravação anota a hora em "musica:_em" e avisa com o evento "musica:mudou": é o que a conta opcional usa para saber o que
// sincronizar (src/core/conta). Quem não entra na conta não percebe nada disso.

const PREFIX = "musica:";
const CARIMBOS = PREFIX + "_em";
export const EVENTO_MUDOU = "musica:mudou";

/** A hora (ms) da última mudança local de cada chave. Dados de antes da conta não têm hora. */
export function carimbos(): Record<string, number> {
  try {
    const c = JSON.parse(window.localStorage.getItem(CARIMBOS) ?? "{}") as unknown;
    return c && typeof c === "object" ? (c as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function carimbar(name: string, em: number) {
  try { window.localStorage.setItem(CARIMBOS, JSON.stringify({ ...carimbos(), [name]: em })); } catch { /* sem armazenamento */ }
}

/** Quem relê a chave quando ela muda por fora (outra aba, ou a nuvem): cada store se registra aqui. */
const releitores = new Map<string, () => void>();

/** O JSON cru de uma chave, ou null. */
export function lerCru(name: string): string | null {
  try { return window.localStorage.getItem(PREFIX + name); } catch { return null; }
}

/**
 * Grava uma chave que veio de fora (a nuvem), com a hora dela, sem avisar a sincronização (não é mudança local). As telas
 * abertas releem.
 */
export function gravarDeFora(name: string, json: string, em: number) {
  try { window.localStorage.setItem(PREFIX + name, json); } catch { return; }
  carimbar(name, em);
  releitores.get(name)?.();
}

export type Versioned = { version: number };

export type Store<T extends Versioned> = {
  get: () => T;
  /** Valor inicial, usado na renderização do servidor. */
  getInitial: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (fn: () => void) => () => void;
};

/**
 * `migrate` recebe o que estava salvo (de qualquer versão antiga) e devolve um valor válido,
 * ou null para descartar e começar do zero.
 */
export function createStore<T extends Versioned>(name: string, initial: T, migrate?: (saved: unknown) => T | null): Store<T> {
  const key = PREFIX + name;
  const subs = new Set<() => void>();
  let cache: T | null = null;

  const read = (): T => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initial;
      const saved = JSON.parse(raw) as unknown;
      if (migrate) return migrate(saved) ?? initial;
      return (saved as T).version === initial.version ? (saved as T) : initial;
    } catch {
      return initial; // armazenamento bloqueado ou dado corrompido
    }
  };

  const notify = () => subs.forEach((f) => f());

  if (typeof window !== "undefined")
    window.addEventListener("storage", (e) => { if (e.key === key) { cache = null; notify(); } });
  releitores.set(name, () => { cache = null; notify(); });

  return {
    get: () => (cache ??= read()),
    getInitial: () => initial,
    set(next) {
      const prev = (cache ??= read());
      cache = typeof next === "function" ? next(prev) : next;
      try { window.localStorage.setItem(key, JSON.stringify(cache)); } catch { /* segue só em memória */ }
      carimbar(name, Date.now());
      notify();
      window.dispatchEvent(new CustomEvent(EVENTO_MUDOU, { detail: name }));
    },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}
