"use client";
import { useRef } from "react";
import { useTranslations } from "next-intl";

/** O "i" do metrônomo, no topo da página ao lado de "Baixar app": abre as dicas num modal. */
export function MetroInfo() {
  const t = useTranslations("metronomo");
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="metro-info" onClick={() => dialog.current?.showModal()} aria-label={t("infoOpen")} title={t("infoOpen")} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.2" /><path d="M12 11v5.5" /><circle cx="12" cy="7.6" r="0.6" /></svg>
      </button>
      <dialog ref={dialog} className="metro-dialog" aria-labelledby="metro-info-title" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="metro-dialog-head">
          <h2 id="metro-info-title">{t("infoTitle")}</h2>
          <button type="button" className="metro-close" onClick={() => dialog.current?.close()} aria-label={t("close")}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <ul className="metro-info-list">
          {(t.raw("infoItems") as string[]).map((line) => <li key={line}>{line}</li>)}
        </ul>
      </dialog>
    </>
  );
}
