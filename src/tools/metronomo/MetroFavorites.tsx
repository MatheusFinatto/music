"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { MAX_FAVORITES, favorites, sameSettings, store, type Favorite } from "./store";

/**
 * Os favoritos do metrônomo, no topo da página ao lado do "i": andamento, tempos, divisão e acentos, com um
 * nome opcional. Ficam neste navegador, como o resto. Mesmo modelo dos favoritos do app.
 */
export function MetroFavorites() {
  const t = useTranslations("metronomo");
  const list = useSyncExternalStore(favorites.subscribe, favorites.get, favorites.getInitial).items;
  const dialog = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");

  const describe = (f: Favorite) =>
    t("favoriteDesc", { bpm: f.bpm, beats: f.beatsPerBar, sub: t(`sub.${f.subdivision}`) });
  const save = () => {
    const { bpm, beatsPerBar, subdivision, accents } = store.get();
    const now: Favorite = { bpm, beatsPerBar, subdivision, accents: [...accents], name: name.trim() };
    // As mesmas configurações de novo: fica uma só, com o nome novo se veio um.
    const rest = list.filter((f) => !(sameSettings(f, now) && (now.name !== "" || f.name === "")));
    favorites.set({ version: 1, items: [now, ...rest].slice(0, MAX_FAVORITES) });
    setName("");
  };
  const load = (f: Favorite) => {
    store.set({ ...store.get(), bpm: f.bpm, beatsPerBar: f.beatsPerBar, subdivision: f.subdivision, accents: [...f.accents] });
    dialog.current?.close();
  };
  const remove = (i: number) => favorites.set({ version: 1, items: list.filter((_, j) => j !== i) });

  return (
    <>
      <button type="button" className="metro-info" onClick={() => dialog.current?.showModal()} aria-label={t("favorites")} title={t("favorites")} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" /></svg>
      </button>
      <dialog ref={dialog} className="metro-dialog" aria-labelledby="metro-fav-title" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="metro-dialog-head">
          <h2 id="metro-fav-title">{t("favorites")}</h2>
          <button type="button" className="metro-close" onClick={() => dialog.current?.close()} aria-label={t("close")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {list.length > 0 && (
          <ul className="metro-fav-list">
            {list.map((f, i) => (
              <li key={`${i}-${f.name}-${f.bpm}`}>
                <button type="button" className="metro-fav-load" onClick={() => load(f)}>
                  <span>{f.name || describe(f)}</span>
                  {f.name && <small>{describe(f)}</small>}
                </button>
                <button type="button" className="metro-close" onClick={() => remove(i)} aria-label={t("deleteFavorite", { name: f.name || describe(f) })}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <form className="metro-fav-save" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <input type="text" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={t("favoriteName")} aria-label={t("favoriteName")} />
          <button type="submit">{t("saveCurrent")}</button>
        </form>
      </dialog>
    </>
  );
}
