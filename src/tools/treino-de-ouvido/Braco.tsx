"use client";
import { useRef, useState } from "react";
import { nomeNota } from "./engine";
import type { Marca } from "./Teclado";

/** MIDI das cordas soltas, da 1ª (mais fina) à 6ª: e B G D A E. */
const ABERTAS = [64, 59, 55, 50, 45, 40] as const;
const CASAS = 12;
const LARG = 46, ALT = 34, MARGEM = 34, TOPO = 16;

/** A posição mais à frente do braço (menor casa) onde soa a nota, ou null se não cabe nas 12 primeiras casas. */
export function melhorPosicao(midi: number): { corda: number; casa: number } | null {
  let melhor: { corda: number; casa: number } | null = null;
  ABERTAS.forEach((solta, corda) => {
    const casa = midi - solta;
    if (casa >= 0 && casa <= CASAS && (melhor === null || casa < melhor.casa)) melhor = { corda, casa };
  });
  return melhor;
}

const INCRUSTACOES = [3, 5, 7, 9];
const cx = (casa: number) => (casa === 0 ? MARGEM / 2 : MARGEM + (casa - 0.5) * LARG);
const cy = (corda: number) => TOPO + corda * ALT;

/**
 * Braço de violão (12 casas) sempre à mostra: cada posição toca a nota. As marcas de altura (alvo, dada, erro) aparecem na
 * posição mais à frente da nota; a tecla escolhida e a que soa aparecem onde a pessoa tocou. Setas andam pelo braço.
 */
export function Braco({ marcas, onTocar, label }: { marcas: ReadonlyMap<number, Marca>; onTocar: (midi: number) => void; label: string }) {
  const [foco, setFoco] = useState({ corda: 0, casa: 0 });
  const [clicada, setClicada] = useState<string | null>(null);
  const raiz = useRef<SVGSVGElement>(null);
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
  for (const [midi, marca] of marcas) {
    if (marca === "sel" || marca === "toca") continue;
    const p = melhorPosicao(midi);
    if (p) bolas.push({ ...p, marca, midi });
  }
  if (clicada) {
    const [corda, casa] = clicada.split(":").map(Number) as [number, number];
    const midi = ABERTAS[corda]! + casa;
    const marca = marcas.get(midi);
    if (marca === "sel" || marca === "toca") bolas.push({ corda, casa, marca, midi });
  }
  return (
    <div className="braco-caixa">
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
            onPointerDown={(e) => { if (e.button === 0) { setFoco({ corda, casa }); tocar(corda, casa); } }}
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
