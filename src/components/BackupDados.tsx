"use client";
import { useRef, useState } from "react";
import { exportar, restaurar } from "@/core/storage/backup";
import { PixelArt } from "./PixelArt";

type Textos = { abrir: string; titulo: string; texto: string; baixar: string; restaurar: string; baixado: string; restaurado: string; erro: string; fechar: string };

// "Backup de dados" do rodapé: um modal com uma frase e os dois botões (baixar e restaurar de um arquivo).
export function BackupDados({ t }: { t: Textos }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState("");

  function baixar() {
    const blob = new Blob([JSON.stringify(exportar(window.localStorage), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `marmota-music-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    setStatus(t.baixado);
  }

  async function aoEscolher(f: File | undefined) {
    if (!f) return;
    try {
      restaurar(JSON.parse(await f.text()), window.localStorage);
      setStatus(t.restaurado);
      setTimeout(() => window.location.reload(), 800); // as ferramentas releem os dados ao abrir
    } catch {
      setStatus(t.erro);
    }
    if (arquivo.current) arquivo.current.value = "";
  }

  return (
    <>
      <button type="button" className="footer-link" onClick={() => { setStatus(""); dialog.current?.showModal(); }} aria-haspopup="dialog">{t.abrir}</button>
      <dialog ref={dialog} className="info-dialog" aria-labelledby="backup-titulo" onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="info-head">
          <h2 id="backup-titulo">{t.titulo}</h2>
          <button type="button" className="info-close" onClick={() => dialog.current?.close()} aria-label={t.fechar} title={t.fechar}>
            <PixelArt grid={X} />
          </button>
        </div>
        <p className="backup-texto">{t.texto}</p>
        <div className="backup-acoes">
          <button type="button" className="go" onClick={baixar}>{t.baixar}</button>
          <button type="button" className="backup-sec" onClick={() => arquivo.current?.click()}>{t.restaurar}</button>
          <input ref={arquivo} type="file" accept="application/json,.json" hidden onChange={(e) => void aoEscolher(e.target.files?.[0])} />
        </div>
        <p className="backup-status" role="status">{status}</p>
      </dialog>
    </>
  );
}

const X = `
#.....#
.#...#.
..#.#..
...#...
..#.#..
.#...#.
#.....#`;
