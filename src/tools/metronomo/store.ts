// O que o metrônomo guarda no navegador: as configurações (lidas pelo metrônomo e pelos favoritos, no topo da
// página) e os favoritos. Chaves "musica:metronomo" e "musica:metronomo-favoritos".
import { createStore } from "@/core/storage";
import { ACCENT, BEAT, MAX_BEATS, MUTE, clampBpm, subdivisionById } from "@/core/rhythm";
import type { MetronomeSettings } from "./engine";

/** [hintSeen]: a dica das bolinhas some depois do primeiro clique numa delas. */
export type Saved = MetronomeSettings & { version: 2; minutes: number; hintSeen: boolean };
const defaultAccents = () => Array.from({ length: MAX_BEATS }, (_, i) => (i === 0 ? ACCENT : BEAT));
const DEFAULTS: Saved = { version: 2, bpm: 90, beatsPerBar: 4, subdivision: 1, accents: defaultAccents(), minutes: 0, hintSeen: false };
/** Duração do timer em minutos; 0 = sem limite. */
export const MINUTES = [0, 1, 2, 3, 5, 10, 15, 20, 30] as const;

const int = (n: unknown, lo: number, hi: number, d: number) => (typeof n === "number" && Number.isInteger(n) && n >= lo && n <= hi ? n : d);
const accentsFrom = (a: unknown): number[] | null =>
  Array.isArray(a) && a.length === MAX_BEATS ? a.map((x) => ([ACCENT, BEAT, MUTE].includes(x as number) ? (x as number) : BEAT)) : null;

/** Valida andamento, tempos, divisão e acentos vindos do armazenamento (de qualquer versão). */
function settingsFrom(s: Partial<MetronomeSettings>): MetronomeSettings {
  return {
    bpm: typeof s.bpm === "number" && Number.isFinite(s.bpm) ? clampBpm(Math.round(s.bpm)) : DEFAULTS.bpm,
    beatsPerBar: int(s.beatsPerBar, 1, MAX_BEATS, DEFAULTS.beatsPerBar),
    subdivision: subdivisionById(int(s.subdivision, 1, 99, 1)).id,
    accents: accentsFrom(s.accents) ?? defaultAccents(),
  };
}

export const store = createStore<Saved>("metronomo", DEFAULTS, (saved) => {
  const s = saved as (Partial<Saved> & { accentFirst?: unknown }) | null;
  if (!s || typeof s !== "object") return null;
  const settings = settingsFrom(s);
  // Versão 1 tinha só "acentuar o primeiro tempo"; vira o acento do tempo 1.
  if (!accentsFrom(s.accents) && s.accentFirst === false) settings.accents[0] = BEAT;
  return {
    version: 2,
    ...settings,
    minutes: (MINUTES as readonly unknown[]).includes(s.minutes) ? (s.minutes as number) : 0,
    hintSeen: s.hintSeen === true,
  };
});

/** Um favorito: as configurações do compasso e um nome opcional ("" = mostrado pelas configurações). */
export type Favorite = MetronomeSettings & { name: string };
/** [active]: o favorito em que se está (índice em items), ou -1 para nenhum. Estando nele, mexer no metrônomo muda ele. */
export type Favorites = { version: 1; items: Favorite[]; active: number };
export const MAX_FAVORITES = 30;
export const NONE = -1;

export const favorites = createStore<Favorites>("metronomo-favoritos", { version: 1, items: [], active: NONE }, (saved) => {
  const s = saved as Partial<Favorites> | null;
  if (!s || !Array.isArray(s.items)) return null;
  const items = s.items
    .filter((f): f is Favorite => !!f && typeof f === "object")
    .map((f) => ({ ...settingsFrom(f), name: typeof f.name === "string" ? f.name.slice(0, 40) : "" }))
    .slice(0, MAX_FAVORITES);
  return { version: 1, items, active: int(s.active, 0, items.length - 1, NONE) };
});

/** Mesmo andamento, tempos, divisão e acentos. */
export const sameSettings = (a: MetronomeSettings, b: MetronomeSettings) =>
  a.bpm === b.bpm && a.beatsPerBar === b.beatsPerBar && a.subdivision === b.subdivision && a.accents.join() === b.accents.join();

const settingsOf = ({ bpm, beatsPerBar, subdivision, accents }: MetronomeSettings): MetronomeSettings =>
  ({ bpm, beatsPerBar, subdivision, accents: [...accents] });

/** Salva o atual como favorito novo, no topo, e entra nele. As mesmas configurações de novo ficam uma só, com o nome novo se veio um. */
export function addFavorite(f: Favorites, now: MetronomeSettings, name: string): Favorites {
  const fav: Favorite = { ...settingsOf(now), name: name.trim().slice(0, 40) };
  const rest = f.items.filter((x) => !(sameSettings(x, fav) && (fav.name !== "" || x.name === "")));
  return { version: 1, items: [fav, ...rest].slice(0, MAX_FAVORITES), active: 0 };
}

/** Apaga o favorito i; se era o ativo, sai para nenhum. */
export function removeFavorite(f: Favorites, i: number): Favorites {
  const active = i === f.active ? NONE : i < f.active ? f.active - 1 : f.active;
  return { version: 1, items: f.items.filter((_, j) => j !== i), active };
}

export function renameFavorite(f: Favorites, i: number, name: string): Favorites {
  return { ...f, items: f.items.map((x, j) => (j === i ? { ...x, name: name.trim().slice(0, 40) } : x)) };
}

/** Copia as configurações para o favorito ativo. Devolve o mesmo objeto quando não há o que mudar. */
export function syncActive(f: Favorites, now: MetronomeSettings): Favorites {
  const cur = f.items[f.active];
  if (!cur || sameSettings(cur, now)) return f;
  return { ...f, items: f.items.map((x, j) => (j === f.active ? { ...settingsOf(now), name: x.name } : x)) };
}

/** Entra no favorito i (ou sai, com NONE). Marca o ativo antes de carregar: senão a sincronização gravaria as configurações
 *  novas no favorito de antes. */
export function selectFavorite(i: number) {
  const f = favorites.get();
  const fav = f.items[i];
  favorites.set({ ...f, active: fav ? i : NONE });
  if (fav) store.set({ ...store.get(), ...settingsOf(fav) });
}

// Estando num favorito, cada mudança no metrônomo vai para ele na hora.
if (typeof window !== "undefined")
  store.subscribe(() => {
    const f = favorites.get();
    const next = syncActive(f, store.get());
    if (next !== f) favorites.set(next);
  });
