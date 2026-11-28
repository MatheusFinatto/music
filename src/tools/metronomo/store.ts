// O que o metrônomo guarda no navegador: as configurações (lidas pelo metrônomo e pelos favoritos, no topo da
// página) e os favoritos. Chaves "musica:metronomo" e "musica:metronomo-favoritos".
import { createStore } from "@/core/storage";
import { ACCENT, BEAT, MAX_BEATS, MUTE, clampBpm, subdivisionById } from "@/core/rhythm";
import type { MetronomeSettings } from "./engine";

/** [hintSeen]: a dica das bolinhas some depois do primeiro clique numa delas. */
export type Saved = MetronomeSettings & { version: 2; seconds: number; hintSeen: boolean };
const defaultAccents = () => Array.from({ length: MAX_BEATS }, (_, i) => (i === 0 ? ACCENT : BEAT));
const DEFAULTS: Saved = { version: 2, bpm: 90, beatsPerBar: 4, subdivision: 1, accents: defaultAccents(), seconds: 0, hintSeen: false };
/** Os atalhos do timer, em minutos; 0 = sem limite. Fora deles, a pessoa digita minutos e segundos. */
export const MINUTES = [0, 1, 2, 3, 5, 10, 15, 20, 30] as const;
/** O timer vai até 99:59 (dois dígitos de minutos). */
export const MAX_TIMER = 99 * 60 + 59;

/** Minutos e segundos digitados viram a duração em segundos: segundos até 59, minutos até 99; vazio conta 0. */
export function timerFrom(min: string, sec: string): number {
  const n = (x: string, hi: number) => Math.min(hi, Number(x.replace(/\D/g, "") || 0));
  return n(min, 99) * 60 + n(sec, 59);
}

/** O relógio do timer: m:ss, arredondando para cima (1 ms que falta ainda mostra 0:01). */
export const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

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

/** O que estava salvo (de qualquer versão) virando configurações válidas; null = descarta. */
export function savedFrom(saved: unknown): Saved | null {
  const s = saved as (Partial<Saved> & { accentFirst?: unknown; minutes?: unknown }) | null;
  if (!s || typeof s !== "object") return null;
  const settings = settingsFrom(s);
  // Versão 1 tinha só "acentuar o primeiro tempo"; vira o acento do tempo 1.
  if (!accentsFrom(s.accents) && s.accentFirst === false) settings.accents[0] = BEAT;
  return {
    version: 2,
    ...settings,
    // Até a versão com atalhos, o timer guardava minutos ("minutes"), só os da lista.
    seconds: s.seconds !== undefined
      ? int(s.seconds, 0, MAX_TIMER, 0)
      : (MINUTES as readonly unknown[]).includes(s.minutes) ? (s.minutes as number) * 60 : 0,
    hintSeen: s.hintSeen === true,
  };
}

export const store = createStore<Saved>("metronomo", DEFAULTS, savedFrom);

/** Um favorito: as configurações do compasso e um nome opcional ("" = mostrado pelas configurações). */
export type Favorite = MetronomeSettings & { name: string };
/** [active] fica sempre -1: não existe mais "estar dentro" de um favorito (escolher só carrega). O campo continua no
 *  formato para os apps e a nuvem que ainda o leem. */
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
  return { version: 1, items, active: NONE };
});

const settingsOf = ({ bpm, beatsPerBar, subdivision, accents }: MetronomeSettings): MetronomeSettings =>
  ({ bpm, beatsPerBar, subdivision, accents: [...accents] });

/** O favorito como o modal grava: configurações válidas e nome aparado (até 40). */
export const favoriteOf = (s: MetronomeSettings, name: string): Favorite => ({ ...settingsFrom(settingsOf(s)), name: name.trim().slice(0, 40) });

/** Um favorito novo, no topo. Sempre um novo: nome e padrão podem repetir. */
export function addFavorite(f: Favorites, fav: Favorite): Favorites {
  return { version: 1, items: [fav, ...f.items].slice(0, MAX_FAVORITES), active: NONE };
}

/** Troca o favorito i pelo editado no modal. */
export function updateFavorite(f: Favorites, i: number, fav: Favorite): Favorites {
  return { version: 1, items: f.items.map((x, j) => (j === i ? fav : x)), active: NONE };
}

export function removeFavorite(f: Favorites, i: number): Favorites {
  return { version: 1, items: f.items.filter((_, j) => j !== i), active: NONE };
}

/** Reordenar: o favorito [from] vai para a posição [to]. */
export function moveFavorite(f: Favorites, from: number, to: number): Favorites {
  if (from === to || !f.items[from] || to < 0 || to >= f.items.length) return f;
  const items = [...f.items];
  const [x] = items.splice(from, 1);
  items.splice(to, 0, x!);
  return { version: 1, items, active: NONE };
}

/** Carrega o favorito i no metrônomo. Só isso: mexer depois não muda o favorito. */
export function loadFavorite(i: number) {
  const fav = favorites.get().items[i];
  if (fav) store.set({ ...store.get(), ...settingsOf(fav) });
}
