"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { apagarConta, conta, contaPronta, entrar, iniciarConta, prepararConta, sair } from "@/core/conta";

export type TextosConta = {
  entrarLabel: string; contaLabel: string; titulo: string; texto: string; guardado: string; entrar: string; carregando: string;
  dentro: string; dentroTexto: string; sair: string; apagar: string; apagarConfirma: string; apagarSim: string; cancelar: string;
  erroEntrar: string; erroApagar: string; fechar: string; itens: string[];
};

/** O "G" do Google, nas cores da marca, sem mudar o desenho. */
export function LogoGoogle() {
  return (
    <svg className="conta-g" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/**
 * A conta opcional (ver .specs/001-conta-e-sincronizacao.md): o bonequinho de conta, vazado (traço liso) para quem está fora e
 * cheio para quem entrou. O "G" do Google só aparece no botão "Entrar com Google", dentro do modal. Tocar abre o modal que
 * explica e tem as ações. [className] posiciona o botão (cabeçalho, barra do app).
 */
export function Conta({ t, className }: { t: TextosConta; className?: string }) {
  const s = useSyncExternalStore(conta.subscribe, conta.get, conta.getInitial);
  const dialog = useRef<HTMLDialogElement>(null);
  const titulo = useId();
  const [pronta, setPronta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  useEffect(() => { iniciarConta(); }, []);

  function abrir() {
    setConfirmando(false);
    dialog.current?.showModal();
    // Carrega o Firebase já: o "Entrar" precisa abrir o popup no mesmo toque, sem esperar download.
    setPronta(contaPronta());
    if (!contaPronta()) void prepararConta().then(() => setPronta(true)).catch(() => setPronta(false));
  }
  const fechar = () => dialog.current?.close();
  const dentro = s.fase === "dentro";

  return (
    <>
      <button type="button" className={`conta-btn${className ? ` ${className}` : ""}`} onClick={abrir}
        aria-label={dentro ? t.contaLabel : t.entrarLabel} title={dentro ? t.contaLabel : t.entrarLabel} aria-haspopup="dialog">
        <svg className={`conta-icone${dentro ? " cheio" : ""}`} viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8.5" r="3.5" /><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5z" />
        </svg>
      </button>
      <dialog ref={dialog} className="conta-dialog" aria-labelledby={titulo} onClick={(e) => { if (e.target === e.currentTarget) fechar(); }}>
        <div className="conta-head">
          <h2 id={titulo}>{dentro ? t.dentro : t.titulo}</h2>
          <button type="button" className="conta-fechar" onClick={fechar} aria-label={t.fechar} title={t.fechar}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        {/* Primeira linha: a ação, para quem só quer entrar (ou sair). Embaixo, para quem quer ler, o texto e o que fica guardado. */}
        {dentro ? (
          <>
            {s.email && <p className="conta-email">{s.email}</p>}
            {confirmando ? (
              <>
                <p className="conta-texto">{t.apagarConfirma}</p>
                <div className="conta-acoes">
                  <button type="button" className="conta-perigo" disabled={s.ocupado} onClick={() => void apagarConta().then(() => { if (conta.get().fase === "fora") fechar(); })}>{t.apagarSim}</button>
                  <button type="button" className="conta-sec" onClick={() => setConfirmando(false)}>{t.cancelar}</button>
                </div>
              </>
            ) : (
              <div className="conta-acoes">
                <button type="button" className="conta-sec" disabled={s.ocupado} onClick={() => void sair().then(fechar)}>{t.sair}</button>
                <button type="button" className="conta-link" disabled={s.ocupado} onClick={() => setConfirmando(true)}>{t.apagar}</button>
              </div>
            )}
            <p className="conta-texto">{t.dentroTexto}</p>
          </>
        ) : (
          <>
            <div className="conta-acoes">
              <button type="button" className="conta-google" disabled={!pronta || s.ocupado} onClick={() => void entrar().then(() => { if (conta.get().fase === "dentro") fechar(); })}>
                <LogoGoogle />{pronta ? t.entrar : t.carregando}
              </button>
            </div>
            <p className="conta-texto">{t.texto}</p>
          </>
        )}
        {s.erro && <p className="conta-erro" role="alert">{s.erro === "entrar" ? t.erroEntrar : t.erroApagar}</p>}
        <h3 className="conta-sub">{t.guardado}</h3>
        <ul className="conta-itens">{t.itens.map((x) => <li key={x}>{x}</li>)}</ul>
      </dialog>
    </>
  );
}
