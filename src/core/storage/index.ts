// Dados do usuário no navegador (localStorage, prefixo "musica:").
// Cada ferramenta tem uma chave própria, "musica:<slug>", com um campo `version` para migrar depois.
// O store é assinável, para uso com useSyncExternalStore.

const PREFIX = "musica:";

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

  return {
    get: () => (cache ??= read()),
    getInitial: () => initial,
    set(next) {
      const prev = (cache ??= read());
      cache = typeof next === "function" ? next(prev) : next;
      try { window.localStorage.setItem(key, JSON.stringify(cache)); } catch { /* segue só em memória */ }
      notify();
    },
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
  };
}
