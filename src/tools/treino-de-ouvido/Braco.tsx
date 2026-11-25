"use client";
import { useEffect, useRef, useState } from "react";
import { nomeNota } from "./engine";
import { aoTocar } from "./toque";
import type { Marca } from "./Teclado";
import { ABERTAS, CASAS, melhorPosicao, type Pos } from "./violao";

const LARG = 46, ALT = 34, MARGEM = 34, TOPO = 16;

const INCRUSTACOES = [3, 5, 7, 9];
const cx = (casa: number) => (casa === 0 ? MARGEM / 2 : MARGEM + (casa - 0.5) * LARG);
const cy = (corda: number) => TOPO + corda * ALT;

/**
 * Braço de violão (12 casas) sempre à mostra: cada posição toca a nota. As marcas de altura (alvo, dada, erro) aparecem na
 * posição mais à frente da nota, salvo as notas de `extras`, que vêm com a posição escolhida (a forma de um acorde, uma nota por
 * corda, ou a forma de um arpejo, com várias por corda); a tecla escolhida e a que soa aparecem onde a pessoa tocou. Setas andam pelo braço.
 */
export function Braco({ marcas, onTocar, label, extras = [] }: { marcas: ReadonlyMap<number, Marca>; onTocar: (midi: number) => void; label: string; extras?: readonly (Pos & { marca: Marca })[] }) {
  const [foco, setFoco] = useState({ corda: 0, casa: 0 });
  const [clicada, setClicada] = useState<string | null>(null);
  const raiz = useRef<SVGSVGElement>(null);
  const caixa = useRef<HTMLDivElement>(null);
  const larguraTotal = MARGEM + CASAS * LARG + 10;
  const altura = TOPO * 2 + 5 * ALT + 16;
  const tocar = (corda: number, casa: number) => { setClicada(`${corda}:${casa}`); onTocar(ABERTAS[corda]! + casa); };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const dc = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const dr = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (dc || dr) {
      e.preventDefault();
      const prox = { corda: Math.min(5, Math.max(0, foco.corda + dr)), casa: Math.min(CASAS, Math.max(0, foco.casa + dc)) };
      setFoco(prox);
      raiz.current?.querySelector<SVGElement>(`[data-pos="${prox.corda}:${prox.casa}"]`)?.focus();
    } else if (e.key === "Enter" || e.code === "Space") {
      e.preventDefault();
      e.stopPropagation();
      tocar(foco.corda, foco.casa);
    }
  };
  // Marcas de altura: uma posição por nota (a mais à frente). Escolha e som: só onde a pessoa tocou.
  const bolas: { corda: number; casa: number; marca: Marca; midi: number }[] = [];
  const cobertas = new Set(extras.map((e) => e.midi));
  for (const e of extras) bolas.push({ corda: e.corda, casa: e.casa, marca: e.marca, midi: e.midi });
  for (const [midi, marca] of marcas) {
    if (marca === "sel" || marca === "toca" || cobertas.has(midi)) continue;
    const p = melhorPosicao(midi);
    if (p) bolas.push({ ...p, marca, midi });
  }
  if (clicada) {
    const [corda, casa] = clicada.split(":").map(Number) as [number, number];
    const midi = ABERTAS[corda]! + casa;
    const marca = marcas.get(midi);
    if (marca === "sel" || marca === "toca") bolas.push({ corda, casa, marca, midi });
  }
  // No celular só cabem umas seis casas: ao marcar notas, o braço rola até elas ficarem à vista.
  const chaveMarcas = bolas.map((b) => `${b.corda}:${b.casa}`).join(",");
  useEffect(() => {
    const c = caixa.current, svg = raiz.current;
    if (!c || !svg || c.scrollWidth <= c.clientWidth + 1 || bolas.length === 0) return;
    const escala = svg.clientWidth / larguraTotal;
    const xs = bolas.map((b) => cx(b.casa) * escala);
    const centro = (Math.min(...xs) + Math.max(...xs)) / 2;
    const calmo = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    c.scrollTo({ left: Math.max(0, centro - c.clientWidth / 2), behavior: calmo ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveMarcas]);
  return (
    <div className="braco-caixa" ref={caixa}>
      <svg ref={raiz} className="braco" viewBox={`0 0 ${larguraTotal} ${altura}`} role="group" aria-label={label} onKeyDown={onKeyDown}>
        <rect x={MARGEM} y={TOPO - 12} width={CASAS * LARG} height={5 * ALT + 24} rx={4} className="braco-madeira" />
        {Array.from({ length: CASAS + 1 }, (_, c) => <line key={c} x1={MARGEM + c * LARG} x2={MARGEM + c * LARG} y1={TOPO - 12} y2={TOPO + 5 * ALT + 12} className={c === 0 ? "braco-pestana" : "braco-traste"} />)}
        {INCRUSTACOES.map((c) => <circle key={c} cx={cx(c)} cy={TOPO + 2.5 * ALT} r={5} className="braco-incrust" />)}
        <circle cx={cx(12) - 9} cy={TOPO + 1.5 * ALT} r={5} className="braco-incrust" />
        <circle cx={cx(12) - 9} cy={TOPO + 3.5 * ALT} r={5} className="braco-incrust" />
        {ABERTAS.map((_, i) => <line key={i} x1={MARGEM} x2={MARGEM + CASAS * LARG} y1={cy(i)} y2={cy(i)} className="braco-corda" style={{ strokeWidth: 1 + i * 0.45 }} />)}
        {ABERTAS.flatMap((solta, corda) => Array.from({ length: CASAS + 1 }, (_, casa) => (
          <rect key={`${corda}:${casa}`} data-pos={`${corda}:${casa}`} role="button" tabIndex={foco.corda === corda && foco.casa === casa ? 0 : -1}
            aria-label={`${nomeNota(solta + casa)}, corda ${corda + 1}, ${casa === 0 ? "solta" : `casa ${casa}`}`} className="braco-celula"
            x={casa === 0 ? 0 : MARGEM + (casa - 1) * LARG} y={cy(corda) - ALT / 2} width={casa === 0 ? MARGEM : LARG} height={ALT}
            {...aoTocar(() => { setFoco({ corda, casa }); tocar(corda, casa); })}
            onFocus={() => setFoco({ corda, casa })} />
        )))}
        {Array.from({ length: CASAS }, (_, i) => <text key={i} className="braco-num" x={cx(i + 1)} y={altura - 4}>{i + 1}</text>)}
        {bolas.map((b) => (
          <g key={`${b.corda}:${b.casa}:${b.marca}`} className={`braco-bola ${b.marca}`} pointerEvents="none">
            <circle cx={cx(b.casa)} cy={cy(b.corda)} r={12} />
            <text x={cx(b.casa)} y={cy(b.corda) + 3.5}>{nomeNota(b.midi).replace(/\d/, "")}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
