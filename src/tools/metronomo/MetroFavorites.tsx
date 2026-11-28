"use client";
import { useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { MAX_BEATS, MAX_BPM, MIN_BPM, SUBDIVISIONS } from "@/core/rhythm";
import { BpmWheel } from "./BpmWheel";
import {
  addFavorite, favoriteOf, favorites, loadFavorite, moveFavorite, removeFavorite, store, updateFavorite, type Favorite,
} from "./store";

const STAR = "M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z";

/** Chave estável por favorito (o objeto), para o React não perder o foco nem a linha arrastada ao reordenar. */
const ids = new WeakMap<Favorite, number>();
let nextId = 0;
const keyOf = (f: Favorite) => { let k = ids.get(f); if (k === undefined) { k = nextId++; ids.set(f, k); } return k; };

/** O que o modal de edição está montando: [i] = o favorito editado, ou null para um novo. [sub] é o índice em SUBDIVISIONS. */
type Draft = { i: number | null; name: string; bpm: number; beats: number; sub: number; accents: number[] };

/**
 * Os favoritos do metrônomo, no topo da página ao lado do "?": andamento, tempos, divisão e acentos, com um nome
 * opcional. Ficam neste navegador, como o resto. Mesmo modelo dos favoritos do app (MetronomeActivity).
 * A estrela abre a lista. Tocar num favorito só carrega ele; mexer no metrônomo depois não muda nenhum. O lápis abre o
 * modal de edição (nome, e tempos, andamento e divisão em rodas; Cancelar/Salvar), que também cria o novo a partir do
 * que está tocando ("Salvar o atual"). A lixeira exclui. "Reordenar" deixa arrastar as linhas (ou usar as setas).
 * [variant] "pill": a estrela grande da linha de cima do celular, como no app; a do topo da página some lá.
 */
export function MetroFavorites({ variant = "icon" }: { variant?: "icon" | "pill" }) {
  const t = useTranslations("metronomo");
  const titleId = useId();
  const editId = useId();
  const ajudaId = useId();
  const favs = useSyncExternalStore(favorites.subscribe, favorites.get, favorites.getInitial);
  const list = favs.items;
  const dialog = useRef<HTMLDialogElement>(null);
  const editor = useRef<HTMLDialogElement>(null);
  const ajuda = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [reordering, setReordering] = useState(false);
  /** O arrasto em curso: o favorito (índice atual), onde o dedo estava no último passo e a altura de uma linha. */
  const drag = useRef<{ id: number; i: number; y: number; row: number } | null>(null);
  const [dragging, setDragging] = useState<{ i: number; dy: number } | null>(null);

  const subName = (id: number) => t(`sub.${id}`);
  const describe = (f: Favorite) => t("favoriteDesc", { bpm: f.bpm, beats: f.beatsPerBar, sub: subName(f.subdivision) });
  const label = (f: Favorite) => f.name || describe(f);
  const subIndex = (id: number) => Math.max(0, SUBDIVISIONS.findIndex((s) => s.id === id));

  const load = (i: number) => {
    loadFavorite(i);
    dialog.current?.close();
  };
  const remove = (i: number) => favorites.set(removeFavorite(favorites.get(), i));
  const openEditor = (i: number | null) => {
    const f: Favorite = i === null ? { ...store.get(), name: "" } : list[i]!;
    setDraft({ i, name: f.name, bpm: f.bpm, beats: f.beatsPerBar, sub: subIndex(f.subdivision), accents: [...f.accents] });
    editor.current?.showModal();
  };
  const save = () => {
    if (!draft) return;
    const fav = favoriteOf(
      { bpm: draft.bpm, beatsPerBar: draft.beats, subdivision: SUBDIVISIONS[draft.sub]!.id, accents: draft.accents },
      draft.name,
    );
    const f = favorites.get();
    favorites.set(draft.i === null ? addFavorite(f, fav) : updateFavorite(f, draft.i, fav));
    editor.current?.close();
  };
  const move = (from: number, to: number) => favorites.set(moveFavorite(favorites.get(), from, to));

  // Reordenar: a alça segue o dedo; a cada meia linha andada, o favorito troca de lugar com o vizinho.
  const onGripDown = (i: number) => (e: PointerEvent<HTMLButtonElement>) => {
    const li = e.currentTarget.closest("li");
    if (!li) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, i, y: e.clientY, row: li.getBoundingClientRect().height + 4 };
    setDragging({ i, dy: 0 });
  };
  const onGripMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    let dy = e.clientY - d.y;
    const n = favorites.get().items.length;
    while (dy > d.row / 2 && d.i < n - 1) { move(d.i, d.i + 1); d.i++; d.y += d.row; dy -= d.row; }
    while (dy < -d.row / 2 && d.i > 0) { move(d.i, d.i - 1); d.i--; d.y -= d.row; dy += d.row; }
    setDragging({ i: d.i, dy });
  };
  const onGripUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(null);
  };
  const onGripKey = (i: number) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowUp" && i > 0) { e.preventDefault(); move(i, i - 1); }
    if (e.key === "ArrowDown" && i < list.length - 1) { e.preventDefault(); move(i, i + 1); }
  };

  const closeIcon = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>;

  return (
    <>
      <button
        type="button"
        className={variant === "pill" ? "metro-pill metro-pill-star" : "metro-info"}
        onClick={() => dialog.current?.showModal()}
        aria-label={t("favorites")}
        title={t("favorites")}
        aria-haspopup="dialog"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d={STAR} /></svg>
      </button>
      <dialog
        ref={dialog}
        className="metro-dialog"
        aria-labelledby={titleId}
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
        onClose={() => setReordering(false)}
      >
        <div className="metro-dialog-head">
          <h2 id={titleId}>{t("favorites")}</h2>
          <button type="button" className="metro-close metro-fav-ajuda" onClick={() => ajuda.current?.showModal()} aria-label={t("favoritesInfo")} title={t("favoritesInfo")} aria-haspopup="dialog">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.2 9a2.9 2.9 0 1 1 4 2.7c-.7.3-1.2 1-1.2 1.8v.7M12 18v.01" /></svg>
          </button>
          {list.length > 1 && (
            <button type="button" className="metro-fav-reorder" aria-pressed={reordering} onClick={() => setReordering((r) => !r)}>
              {reordering ? t("reorderDone") : t("reorder")}
            </button>
          )}
          <button type="button" className="metro-close" onClick={() => dialog.current?.close()} aria-label={t("close")}>{closeIcon}</button>
        </div>
        {list.length === 0 && <p className="metro-fav-empty">{t("favoritesEmpty")}</p>}
        {list.length > 0 && (
          <ul className={["metro-fav-list", reordering ? "reordering" : ""].join(" ")}>
            {list.map((f, i) => (
              <li
                key={keyOf(f)}
                className={dragging?.i === i ? "dragging" : undefined}
                style={dragging?.i === i ? { transform: `translateY(${dragging.dy}px)` } : undefined}
              >
                <button type="button" className="metro-fav-load" onClick={() => load(i)} disabled={reordering}>
                  <span>{label(f)}</span>
                  {f.name && <small>{describe(f)}</small>}
                </button>
                {reordering ? (
                  <button
                    type="button"
                    className="metro-close metro-fav-grip"
                    aria-label={t("dragFavorite", { name: label(f) })}
                    title={t("dragFavorite", { name: label(f) })}
                    onPointerDown={onGripDown(i)}
                    onPointerMove={onGripMove}
                    onPointerUp={onGripUp}
                    onPointerCancel={onGripUp}
                    onKeyDown={onGripKey(i)}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14M5 12h14M5 16h14" /></svg>
                  </button>
                ) : (
                  <>
                    <button type="button" className="metro-close" onClick={() => openEditor(i)} aria-label={t("editFavorite", { name: label(f) })} title={t("editFavorite", { name: label(f) })} aria-haspopup="dialog">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z M13.5 6.5l4 4" /></svg>
                    </button>
                    <button type="button" className="metro-close" onClick={() => remove(i)} aria-label={t("deleteFavorite", { name: label(f) })} title={t("deleteFavorite", { name: label(f) })}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 7V4.5h4V7M6.5 7l1 12.5h9l1-12.5M10 11v5M14 11v5" /></svg>
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        {!reordering && (
          <button type="button" className="metro-fav-new" onClick={() => openEditor(null)} aria-haspopup="dialog">{t("saveCurrent")}</button>
        )}
      </dialog>

      {/* Editar (ou criar): o nome primeiro, depois tempos, andamento e divisão em rodas; Cancelar e Salvar no fim. */}
      <dialog
        ref={editor}
        className="metro-dialog metro-fav-editor"
        aria-labelledby={editId}
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}
        onClose={() => setDraft(null)}
      >
        <div className="metro-dialog-head">
          <h2 id={editId}>{draft?.i === null ? t("newTitle") : t("editTitle")}</h2>
          <button type="button" className="metro-close" onClick={() => editor.current?.close()} aria-label={t("close")}>{closeIcon}</button>
        </div>
        {draft && (
          <form onSubmit={(e) => { e.preventDefault(); save(); }}>
            <input
              type="text"
              className="metro-fav-name-input"
              value={draft.name}
              maxLength={40}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder={t("favoriteName")}
              aria-label={t("favoriteName")}
            />
            <div className="metro-fav-wheels">
              <label>
                <span>{t("beats")}</span>
                <BpmWheel
                  value={draft.beats} min={1} max={MAX_BEATS} scale={0.6}
                  onChange={(beats) => setDraft((d) => d && { ...d, beats })}
                  label={t("beatsWheel")} unit={t("beats")} className="metro-fav-wheel narrow"
                />
              </label>
              <label>
                <span>{t("bpm")}</span>
                <BpmWheel
                  value={draft.bpm} min={MIN_BPM} max={MAX_BPM} scale={0.6}
                  onChange={(bpm) => setDraft((d) => d && { ...d, bpm })}
                  label={t("wheelLabel")} unit={t("bpm")} className="metro-fav-wheel"
                />
              </label>
              <label className="wide">
                <span>{t("subdivision")}</span>
                <BpmWheel
                  value={draft.sub} min={0} max={SUBDIVISIONS.length - 1} scale={0.5}
                  format={(n) => subName(SUBDIVISIONS[n]!.id)}
                  onChange={(sub) => setDraft((d) => d && { ...d, sub })}
                  label={t("subWheel")} unit="" className="metro-fav-wheel"
                />
              </label>
            </div>
            <div className="metro-fav-actions">
              <button type="button" onClick={() => editor.current?.close()}>{t("cancel")}</button>
              <button type="submit" className="primary">{t("save")}</button>
            </div>
          </form>
        )}
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
