"use client";
import { useEffect, useRef, useState } from "react";
import { faixaDoTeclado } from "@/core/treino";
import { nomeNota } from "./engine";
import { aoTocar } from "./toque";

export { faixaDoTeclado };

/** O que cada tecla pode estar mostrando: alvo (laranja), a nota dada, a escolha (verde), o erro (vermelho), o som soando (azul) e
 *  as pontas da voz medida (marfim). */
export type Marca = "alvo" | "dada" | "sel" | "errada" | "toca" | "extremo";
const PRETAS = new Set([1, 3, 6, 8, 10]);
const W = 22, H = 84, F = 20;

/**
 * Teclado de piano sempre à mostra: cada tecla toca a nota. A janela cobre as notas da pergunta (pelo menos duas
 * oitavas); as teclas marcadas ganham cor e o nome embaixo. Setas andam entre as teclas; Enter ou Espaço tocam.
 */
export function Teclado({ janela, marcas, onTocar, label }: { janela: readonly number[]; marcas: ReadonlyMap<number, Marca>; onTocar: (midi: number) => void; label: string }) {
  const [foco, setFoco] = useState(60);
  const raiz = useRef<SVGSVGElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const [lo, hi] = faixaDoTeclado(janela);
  const brancas: number[] = [];
  for (let m = lo; m <= hi; m++) if (!PRETAS.has(m % 12)) brancas.push(m);
  const pretas: number[] = [];
  for (let m = lo; m <= hi; m++) if (PRETAS.has(m % 12)) pretas.push(m);
  const x = new Map(brancas.map((m, i) => [m, i * W]));
  const atual = Math.min(hi, Math.max(lo, foco));
  const cls = (base: string, m: number) => `${base}${marcas.has(m) ? ` ${marcas.get(m)}` : ""}`;
  const tecla = (m: number, base: "b" | "p", props: { x: number; y: number; width: number; height: number; rx: number }) => (
    <rect key={m} data-midi={m} role="button" tabIndex={m === atual ? 0 : -1} aria-label={nomeNota(m)} className={cls(base, m)} {...props}
      {...aoTocar(() => { setFoco(m); onTocar(m); })}
      onFocus={() => setFoco(m)} />
  );
  const onKeyDown = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (d) {
      e.preventDefault();
      const prox = Math.min(hi, Math.max(lo, atual + d));
      setFoco(prox);
      raiz.current?.querySelector<SVGElement>(`[data-midi="${prox}"]`)?.focus();
    } else if (e.key === "Enter" || e.code === "Space") {
      e.preventDefault();
      e.stopPropagation();
      onTocar(atual);
    }
  };
  // No celular a tecla branca tem 28px (alvo de toque) e o teclado rola de lado como o braço: ao marcar notas, rola até elas.
  const chaveMarcas = [...marcas.keys()].join(",");
  useEffect(() => {
    const c = caixa.current;
    if (!c || c.scrollWidth <= c.clientWidth + 1 || marcas.size === 0) return;
    const escala = c.scrollWidth / (brancas.length * W);
    const xs = [...marcas.keys()].map((m) => ((x.get(m) ?? x.get(m - 1)! + W / 2) + W / 2) * escala);
    const centro = (Math.min(...xs) + Math.max(...xs)) / 2;
    c.scrollTo({ left: Math.max(0, centro - c.clientWidth / 2) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveMarcas, lo, hi]);
  return (
    <div className="teclado-caixa" ref={caixa}>
    <svg ref={raiz} className="teclado" viewBox={`0 0 ${brancas.length * W} ${H + F}`} role="group" aria-label={label} onKeyDown={onKeyDown}
      style={{ "--brancas": brancas.length } as React.CSSProperties}>
      {brancas.map((m) => tecla(m, "b", { x: x.get(m)! + 0.5, y: 0.5, width: W - 1, height: H - 1, rx: 3 }))}
      {pretas.map((m) => tecla(m, "p", { x: x.get(m - 1)! + W - 7, y: 0, width: 14, height: H * 0.6, rx: 2 }))}
      {[...marcas].filter(([, v]) => v !== "toca").map(([m, v]) => (
        <text key={m} className={`nome ${v}`} x={PRETAS.has(m % 12) ? x.get(m - 1)! + W : x.get(m)! + W / 2} y={H + 14}>{nomeNota(m)}</text>
      ))}
    </svg>
    </div>
  );
}
