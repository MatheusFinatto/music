"use client";
import { useId, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { addFavorite, favorites, inFavorite, leaveFavorite, removeFavorite, renameFavorite, selectFavorite, store, type Favorite } from "./store";

const STAR = "M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z";

/**
 * Os favoritos do metrônomo, no topo da página ao lado do "?": andamento, tempos, divisão e acentos, com um
 * nome opcional. Ficam neste navegador, como o resto. Mesmo modelo dos favoritos do app.
 * Escolher ou salvar um favorito é entrar nele: mexer no andamento, tempos, divisão ou acentos grava nele na hora, e a
 * estrela fica cheia, em verde, com o nome ao lado. Salvar sempre cria um novo (nome e padrão podem repetir); o lápis
 * troca o nome. Para sair (a estrela apaga e nada mais grava): "Sair do favorito" ou tocar de novo no favorito ativo.
 * [variant] "pill": a estrela grande da linha de cima do celular, como no app; a do topo da página some lá.
 */
export function MetroFavorites({ variant = "icon" }: { variant?: "icon" | "pill" }) {
  const titleId = useId();
  const t = useTranslations("metronomo");
  const favs = useSyncExternalStore(favorites.subscribe, favorites.get, favorites.getInitial);
  const settings = useSyncExternalStore(store.subscribe, store.get, store.getInitial);
  const list = favs.items;
  const active = inFavorite(favs, settings);
  const dialog = useRef<HTMLDialogElement>(null);
  const ajuda = useRef<HTMLDialogElement>(null);
  const ajudaId = useId();
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<{ i: number; name: string } | null>(null);

  const describe = (f: Favorite) =>
    t("favoriteDesc", { bpm: f.bpm, beats: f.beatsPerBar, sub: t(`sub.${f.subdivision}`) });
  const label = (f: Favorite) => f.name || describe(f);
  const current = list[active];

  const save = () => {
    favorites.set(addFavorite(favorites.get(), store.get(), name));
    setName("");
  };
  const leave = () => favorites.set(leaveFavorite(favorites.get()));
  const load = (i: number) => {
    // Tocar no favorito em que já está sai dele.
    if (i === active) leave(); else selectFavorite(i);
    dialog.current?.close();
  };
  const rename = () => {
    if (editing) favorites.set(renameFavorite(favorites.get(), editing.i, editing.name));
    setEditing(null);
  };
  const remove = (i: number) => {
    favorites.set(removeFavorite(favorites.get(), i));
    if (editing?.i === i) setEditing(null);
  };

  const closeIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;

  return (
    <>
      <button
        type="button"
        className={[variant === "pill" ? "metro-pill metro-pill-star" : "metro-info", current ? "metro-fav-on" : ""].join(" ")}
        onClick={() => dialog.current?.showModal()}
        aria-label={current ? t("favoritesIn", { name: label(current) }) : t("favorites")}
        title={current ? label(current) : t("favorites")}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
        {current?.name && <span className="metro-fav-name">{current.name}</span>}
      </button>
      <dialog
        ref={dialog}
        className="metro-dialog"
        aria-labelledby={titleId}
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
        onClose={() => setEditing(null)}
      >
        <div className="metro-dialog-head">
          <h2 id={titleId}>{t("favorites")}</h2>
          <button type="button" className="metro-close metro-fav-ajuda" onClick={() => ajuda.current?.showModal()} aria-label={t("favoritesInfo")} title={t("favoritesInfo")} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 9a2.9 2.9 0 1 1 4 2.7c-.7.3-1.2 1-1.2 1.8v.7M12 18v.01" /></svg>
          </button>
          <button type="button" className="metro-close" onClick={() => dialog.current?.close()} aria-label={t("close")}>{closeIcon}</button>
        </div>
        {list.length > 0 && (
          <ul className="metro-fav-list">
            {list.map((f, i) => (
              <li key={`${i}-${f.name}-${f.bpm}`}>
                {editing?.i === i ? (
                  // Editando, só o nome muda: o lápis vira ✓ (salvar) e o X vira cancelar. Enter salva, Esc cancela.
                  <form className="metro-fav-rename" onSubmit={(e) => { e.preventDefault(); rename(); }}>
                    <input
                      type="text"
                      value={editing.name}
                      maxLength={40}
                      autoFocus
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setEditing({ i, name: e.target.value })}
                      onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); setEditing(null); } }}
                      placeholder={describe(f)}
                      aria-label={t("favoriteName")}
                    />
                    <button type="submit" className="metro-close metro-fav-ok" aria-label={t("saveName")} title={t("saveName")}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                    </button>
                    <button type="button" className="metro-close" onClick={() => setEditing(null)} aria-label={t("cancelRename")} title={t("cancelRename")}>{closeIcon}</button>
                  </form>
                ) : (
                  <>
                    <button type="button" className="metro-fav-load" aria-pressed={i === active} onClick={() => load(i)}>
                      <span>{label(f)}</span>
                      {f.name && <small>{describe(f)}</small>}
                    </button>
                    <button type="button" className="metro-close" onClick={() => setEditing({ i, name: f.name })} aria-label={t("renameFavorite", { name: label(f) })} title={t("renameFavorite", { name: label(f) })}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" /></svg>
                    </button>
                    <button type="button" className="metro-close" onClick={() => remove(i)} aria-label={t("deleteFavorite", { name: label(f) })} title={t("deleteFavorite", { name: label(f) })}>{closeIcon}</button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {current && (
          <button type="button" className="metro-fav-leave" onClick={leave}>{t("leaveFavorite", { name: label(current) })}</button>
        )}
        <form className="metro-fav-save" onSubmit={(e) => { e.preventDefault(); save(); }}>
          <input type="text" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder={t("favoriteName")} aria-label={t("favoriteName")} />
          <button type="submit">{t("saveCurrent")}</button>
        </form>
      </dialog>
      {/* Como funcionam os favoritos: um diálogo como os outros do metrônomo (mesmo cartão e mesmo ×), por cima do de favoritos. */}
      <dialog
        ref={ajuda}
        className="metro-dialog"
        aria-labelledby={ajudaId}
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
      >
        <div className="metro-dialog-head">
          <h2 id={ajudaId}>{t("favoritesInfo")}</h2>
          <button type="button" className="metro-close" onClick={() => ajuda.current?.close()} aria-label={t("close")}>{closeIcon}</button>
        </div>
        <ul className="metro-fav-ajuda-lista">
          {(t.raw("favoritesInfoItems") as string[]).map((x) => <li key={x}>{x}</li>)}
        </ul>
      </dialog>
    </>
  );
}
