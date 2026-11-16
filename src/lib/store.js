// Armazenamento local (por navegador), com exportar/importar.

const PREFIX = "musica:";
const listeners = new Map();

export function load(name, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw) return Object.assign(structuredClone(fallback), JSON.parse(raw));
  } catch (e) { /* armazenamento indisponível */ }
  return structuredClone(fallback);
}

export function save(name, value) {
  try { localStorage.setItem(PREFIX + name, JSON.stringify(value)); return true; } catch (e) { return false; }
}

// Outra aba mudou os dados.
export function onExternalChange(name, cb) {
  if (!listeners.has(name)) listeners.set(name, []);
  listeners.get(name).push(cb);
}
window.addEventListener("storage", (e) => {
  if (!e.key || !e.key.startsWith(PREFIX)) return;
  const name = e.key.slice(PREFIX.length);
  (listeners.get(name) || []).forEach((cb) => cb());
});

export const SECTIONS = ["base", "piano", "diario"];

export function exportAll() {
  const out = { app: "musica", version: 1, exportedAt: new Date().toISOString() };
  SECTIONS.forEach((s) => {
    try { const raw = localStorage.getItem(PREFIX + s); if (raw) out[s] = JSON.parse(raw); } catch (e) { /* ignora */ }
  });
  return out;
}

export function importAll(obj) {
  if (!obj || obj.app !== "musica") throw new Error("Esse arquivo não é um backup deste site.");
  let n = 0;
  SECTIONS.forEach((s) => { if (obj[s]) { save(s, obj[s]); n++; } });
  return n;
}
