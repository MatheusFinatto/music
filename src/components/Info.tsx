"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { PixelArt } from "./PixelArt";

// O "?" do site: a única casa de explicação. A tela mostra só o que se usa; o que precisa ser dito vai aqui.
// No celular (toque), abre um modal. No computador (mouse), um balão com espera e trava, como nos jogos:
// - parar o mouse em cima "carrega" o ? de baixo para cima por 1 s (em degraus de pixel) e só então o balão abre,
//   para não pipocar balão em quem só está passando o mouse;
// - continuar em cima até 3 s trava o balão aberto (a barra no topo do balão enche nesse meio-tempo): dá para levar o mouse até ele; fecha com Esc ou clique fora;
// - clicar no ? trava na hora; o foco pelo teclado abre na hora.
// Os textos chegam prontos (o chamador traduz), para servir tanto a páginas do servidor quanto a componentes cliente.
// `texto`: os itens viram parágrafos (uma história) em vez de lista.

const ABRE_MS = 1000;
const TRAVA_MS = 3000;
// "aberto": abriu pelo hover e a barra do balão enche até travar; "foco": abriu pelo teclado, sem barra (não trava sozinho).
type Estado = "fechado" | "carregando" | "aberto" | "foco" | "travado";
const temMouse = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function Info({ label, title, close, items, className, texto }: { label: string; title: string; close: string; items: string[]; className?: string; texto?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const caixa = useRef<HTMLSpanElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [estado, setEstado] = useState<Estado>("fechado");
  const tip = useId();

  const limpar = useCallback(() => { timers.current.forEach(clearTimeout); timers.current = []; }, []);
  const fechar = useCallback(() => { limpar(); setEstado("fechado"); }, [limpar]);
  useEffect(() => limpar, [limpar]);

  // Travado: Esc ou clique fora fecham.
  useEffect(() => {
    if (estado !== "travado") return;
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") fechar(); };
    const fora = (e: PointerEvent) => { if (!caixa.current?.contains(e.target as Node)) fechar(); };
    document.addEventListener("keydown", tecla);
    document.addEventListener("pointerdown", fora);
    return () => { document.removeEventListener("keydown", tecla); document.removeEventListener("pointerdown", fora); };
  }, [estado, fechar]);

  const lista = items.filter(Boolean);
  if (lista.length === 0) return null;
  const corpo = texto ? lista.map((x) => <p key={x}>{x}</p>) : <ul>{lista.map((x) => <li key={x}>{x}</li>)}</ul>;

  function entrar() {
    if (!temMouse() || estado !== "fechado") return;
    setEstado("carregando");
    timers.current = [
      setTimeout(() => setEstado((s) => (s === "carregando" ? "aberto" : s)), ABRE_MS),
      setTimeout(() => setEstado((s) => (s === "aberto" ? "travado" : s)), TRAVA_MS),
    ];
  }
  function sair() { if (estado !== "travado" && estado !== "foco") fechar(); }
  function clicar() {
    if (!temMouse()) { dialog.current?.showModal(); return; }
    if (estado === "travado") { fechar(); return; }
    limpar(); setEstado("travado");
  }

  return (
    <span ref={caixa} className={`info${className ? ` ${className}` : ""}`} data-estado={estado} onMouseEnter={entrar} onMouseLeave={sair}>
      <button type="button" className="info-btn" aria-label={label} aria-describedby={tip} aria-haspopup="dialog" aria-expanded={estado === "aberto" || estado === "foco" || estado === "travado"}
        onClick={clicar}
        onFocus={(e) => { if (temMouse() && e.currentTarget.matches(":focus-visible") && estado === "fechado") setEstado("foco"); }}
        onBlur={() => { if (estado === "aberto" || estado === "foco") fechar(); }}
        onKeyDown={(e) => { if (e.key === "Escape" && estado !== "fechado") { e.stopPropagation(); fechar(); } }}>
        <PixelArt grid={INTERROGACAO} className="info-glifo" />
        <PixelArt grid={INTERROGACAO} className="info-carga" />
      </button>
      <span id={tip} role="tooltip" className="info-tip">
        {/* A barra do topo enche em degraus do abrir ao travar (2 s): mostra quanto falta para o balão ficar parado. */}
        <span className="info-tip-barra" aria-hidden="true" />
        {/* Só aparece travado (aí o mouse alcança o balão): fecha como o Esc e o clique fora. */}
        <button type="button" className="info-tip-x" onClick={fechar} aria-label={close} title={close} tabIndex={estado === "travado" ? 0 : -1}>
          <PixelArt grid={X} />
        </button>
        {corpo}
      </span>
      <dialog ref={dialog} className="info-dialog" aria-label={title} onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close(); }}>
        <div className="info-head">
          <h2>{title}</h2>
          <button type="button" className="info-close" onClick={() => dialog.current?.close()} aria-label={close} title={close}>
            <PixelArt grid={X} />
          </button>
        </div>
        <div className="info-corpo">{corpo}</div>
      </dialog>
    </span>
  );
}

const INTERROGACAO = `
.###.
#...#
....#
...#.
..#..
..#..
.....
..#..`;

const X = `
#.....#
.#...#.
..#.#..
...#...
..#.#..
.#...#.
#.....#`;
