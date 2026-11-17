// Armazenamento: localStorage (por navegador) + sincronização opcional com a conta Google (cloud.js).
// Cada seção (base, piano, diario) tem um carimbo de tempo da última mudança, usado para decidir
// qual versão vence ao sincronizar.

const PREFIX = "musica:";
const STAMPS = PREFIX + "_stamps";
const listeners = new Map();
const saveHooks = [];

export const SECTIONS = ["base", "piano", "diario"];

export function load(name, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw) return Object.assign(structuredClone(fallback), JSON.parse(raw));
  } catch (e) { /* armazenamento indisponível */ }
  return structuredClone(fallback);
}

export function stamps() {
  try { return JSON.parse(localStorage.getItem(STAMPS) || "{}"); } catch (e) { return {}; }
}
function setStamp(name, ts) {
  try { const s = stamps(); s[name] = ts; localStorage.setItem(STAMPS, JSON.stringify(s)); } catch (e) { /* ignora */ }
}

export function save(name, value) {
  try {
    localStorage.setItem(PREFIX + name, JSON.stringify(value));
    setStamp(name, Date.now());
    saveHooks.forEach((f) => f(name));
    return true;
  } catch (e) { return false; }
}

// Texto bruto de uma seção (para enviar à nuvem).
export function rawSection(name) {
  try { return localStorage.getItem(PREFIX + name); } catch (e) { return null; }
}

// Grava uma seção vinda de fora (nuvem ou backup) e avisa a página para redesenhar.
export function applyRemote(name, rawJson, ts) {
  try {
    localStorage.setItem(PREFIX + name, rawJson);
    setStamp(name, ts || Date.now());
  } catch (e) { return; }
  (listeners.get(name) || []).forEach((cb) => cb());
}

export function onSave(f) { saveHooks.push(f); }

// Outra aba (ou a nuvem) mudou os dados.
export function onExternalChange(name, cb) {
  if (!listeners.has(name)) listeners.set(name, []);
  listeners.get(name).push(cb);
}
window.addEventListener("storage", (e) => {
  if (!e.key || !e.key.startsWith(PREFIX) || e.key === STAMPS) return;
  const name = e.key.slice(PREFIX.length);
  (listeners.get(name) || []).forEach((cb) => cb());
});

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
