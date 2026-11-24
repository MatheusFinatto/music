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
type Favorites = { version: 1; items: Favorite[] };
export const MAX_FAVORITES = 30;

export const favorites = createStore<Favorites>("metronomo-favoritos", { version: 1, items: [] }, (saved) => {
  const s = saved as Partial<Favorites> | null;
  if (!s || !Array.isArray(s.items)) return null;
  const items = s.items
    .filter((f): f is Favorite => !!f && typeof f === "object")
    .map((f) => ({ ...settingsFrom(f), name: typeof f.name === "string" ? f.name.slice(0, 40) : "" }));
  return { version: 1, items: items.slice(0, MAX_FAVORITES) };
});

/** Mesmo andamento, tempos, divisão e acentos. */
export const sameSettings = (a: MetronomeSettings, b: MetronomeSettings) =>
  a.bpm === b.bpm && a.beatsPerBar === b.beatsPerBar && a.subdivision === b.subdivision && a.accents.join() === b.accents.join();
