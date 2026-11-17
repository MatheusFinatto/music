"use client";
import { useId } from "react";
import type { FretPos } from "@/core/theory";

export type DotKind = "scale" | "root" | "target" | "pick" | "ok" | "bad" | "now";
export type Dot = FretPos & { kind: DotKind; label?: string; outside?: boolean };

/**
 * Gesto desenhado como na tablatura, fora da bolinha. Bend: seta curva subindo, com `text` ("full", "½").
 * Soltar: a seta descendo. Slide: seta pela corda, da casa `fromFret` até a nota (a origem é desenhada como bolinha).
 * `now`: o gesto está soando.
 */
export type GestureMark = FretPos & ({ kind: "bend" | "release"; text: string } | { kind: "slide"; fromFret: number }) & { now?: boolean };

type Props = {
  minFret: number;
  maxFret: number;
  dots: Dot[];
  /** Torna as bolinhas clicáveis. */
  onPick?: (pos: FretPos) => void;
  /** Nome acessível do diagrama. */
  label: string;
  /** Texto de cada bolinha clicável para leitor de tela. */
  describe?: (pos: FretPos) => string;
  /** Só a madeira e as bolinhas, sem miniatura, nomes nem números: para uso decorativo. */
  plain?: boolean;
  gestures?: GestureMark[];
};

const FW = 66; // largura de uma casa
const SH = 38; // distância entre cordas
const LEFT = 34; // espaço para o nome das cordas
const RIGHT = 12;
const TOP = 44; // espaço para a miniatura do braço inteiro
const EDGE = 17; // sobra de madeira acima da 1ª e abaixo da 6ª corda
/** Nome de cada corda solta, da 1ª (em cima) à 6ª. */
const STRINGS = ["e", "B", "G", "D", "A", "E"];
const INLAYS = [3, 5, 7, 9, 15, 17];
const LAST = 17; // última casa da miniatura

/**
 * Braço da guitarra em jacarandá, visto como tablatura: 1ª corda em cima.
 * Mostra só a região de trabalho, grande; a miniatura em cima diz onde ela fica no braço inteiro.
 */
export function Fretboard({ minFret, maxFret, dots, onPick, label, describe, plain, gestures = [] }: Props) {
  const id = useId().replace(/:/g, "");
  const lo = Math.max(1, minFret);
  const n = Math.max(4, maxFret - lo + 1); // casas mostradas
  const bw = n * FW; // largura da madeira
  const width = LEFT + bw + RIGHT;
  const by = TOP - EDGE; // topo da madeira
  const bh = 5 * SH + EDGE * 2;
  const height = TOP + 5 * SH + EDGE + 34;
  const x = (fret: number) => LEFT + (fret - lo + 0.5) * FW;
  const y = (string: number) => TOP + string * SH;
  const mid = TOP + 2.5 * SH;
  // miniatura
  const mw = bw, cell = mw / LAST;

  return (
    <div className="fretboard">
      <svg
        viewBox={plain ? `${LEFT} ${by - 6} ${bw} ${bh + 18}` : `0 0 ${width} ${height}`}
        role={plain ? "img" : "group"}
        aria-label={label}
        // Braço longo (uma corda só) não encolhe até ficar ilegível: passa a rolar na horizontal dentro do quadro.
        style={plain ? undefined : { maxWidth: Math.round(width * 1.35), minWidth: Math.max(280, n * 44) }}
      >
        <defs>
          <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--wood-2)" />
            <stop offset="0.5" stopColor="var(--wood)" />
            <stop offset="1" stopColor="var(--wood-3)" />
          </linearGradient>
          <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--fret-shade)" />
            <stop offset="0.45" stopColor="var(--fret)" />
            <stop offset="1" stopColor="var(--fret-shade)" />
          </linearGradient>
          <filter id={`${id}g`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.006 0.42" numOctaves="3" seed="7" />
            <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.05" />
          </filter>
          <clipPath id={`${id}c`}><rect x={LEFT} y={by} width={bw} height={bh} rx="7" /></clipPath>
        </defs>

        {/* miniatura: o braço inteiro, com a região de trabalho marcada */}
        <g className="fb-mini" aria-hidden="true" display={plain ? "none" : undefined}>
          <rect x={LEFT} y="4" width={mw} height="12" rx="3" />
          {INLAYS.concat(12).map((f) => <circle key={f} cx={LEFT + (f - 0.5) * cell} cy="10" r="1.8" />)}
          <rect className="here" x={LEFT + (lo - 1) * cell} y="2" width={n * cell} height="16" rx="4" />
        </g>

        {/* madeira */}
        <rect className="fb-shadow" x={LEFT} y={by + 3} width={bw} height={bh} rx="7" />
        <rect x={LEFT} y={by} width={bw} height={bh} rx="7" fill={`url(#${id}w)`} />
        <g clipPath={`url(#${id}c)`}>
          <rect className="fb-grain" x={LEFT} y={by} width={bw} height={bh} filter={`url(#${id}g)`} />
          {/* marcações de madrepérola */}
          {Array.from({ length: n }, (_, i) => lo + i).map((f) =>
            f === 12 ? (
              <g key={f} className="fb-inlay">
                <circle cx={x(f)} cy={TOP + 1 * SH} r="7" />
                <circle cx={x(f)} cy={TOP + 4 * SH} r="7" />
              </g>
            ) : INLAYS.includes(f) ? (
              <circle key={f} className="fb-inlay" cx={x(f)} cy={mid} r="7" />
            ) : null,
          )}
          {/* trastes */}
          {Array.from({ length: n + 1 }, (_, i) =>
            lo === 1 && i === 0 ? (
              <rect key={i} className="fb-nut" x={LEFT - 1} y={by} width="9" height={bh} />
            ) : (
              <rect key={i} x={LEFT + i * FW - 2.5} y={by} width="5" height={bh} fill={`url(#${id}f)`} />
            ),
          )}
        </g>

        {/* cordas: as três graves são encapadas */}
        {STRINGS.map((name, s) => {
          const w = 1.3 + s * 0.55;
          return (
            <g key={s}>
              <line className="fb-string-shadow" x1={LEFT} x2={LEFT + bw} y1={y(s) + w / 2 + 1} y2={y(s) + w / 2 + 1} strokeWidth={w} />
              <line className={s >= 3 ? "fb-string wound" : "fb-string"} x1={LEFT} x2={LEFT + bw} y1={y(s)} y2={y(s)} strokeWidth={w} />
              {s >= 3 && <line className="fb-winding" x1={LEFT} x2={LEFT + bw} y1={y(s)} y2={y(s)} strokeWidth={w} />}
              {!plain && <text className="fb-name" x={LEFT - 12} y={y(s) + 6} textAnchor="end">{name}</text>}
            </g>
          );
        })}

        {!plain && Array.from({ length: n }, (_, i) => lo + i).map((f) => (
          <text key={f} className={INLAYS.includes(f) || f === 12 ? "fb-num mark" : "fb-num"} x={x(f)} y={by + bh + 26} textAnchor="middle">{f}</text>
        ))}

        {/* gestos: slides por baixo das bolinhas, setas de bend ao lado delas */}
        {gestures.map((g, gi) => {
          const cx = x(g.fret), cy = y(g.string);
          const cls = `fb-gesture ${g.kind}${g.now ? " now" : ""}`;
          if (g.kind === "slide") {
            // Seta pela corda, da bolinha de origem (uma nota tocada, desenhada com as outras) até o destino.
            const fx = x(g.fromFret), dir = Math.sign(cx - fx) || 1;
            const x1 = fx + dir * 15, x2 = cx - dir * 17;
            return (
              <g key={gi} className={cls} aria-hidden="true">
                <line x1={x1} x2={x2} y1={cy} y2={cy} />
                <path d={`M ${x2 - dir * 8} ${cy - 6} L ${x2} ${cy} L ${x2 - dir * 8} ${cy + 6}`} />
              </g>
            );
          }
          // A seta sobe (bend) ou desce (soltar) logo à direita da bolinha, como na tab.
          // Na 1ª corda a seta é mais curta, para não sair da madeira.
          const ax = cx + 23, top = cy - (g.string === 0 ? 17 : 30), low = cy - 7;
          const d = g.kind === "bend"
            ? `M ${cx + 13} ${cy - 3} Q ${ax} ${cy - 3} ${ax} ${top + 4}`
            : `M ${ax} ${top} L ${ax} ${low - 4}`;
          const head = g.kind === "bend"
            ? `M ${ax - 5} ${top + 9} L ${ax} ${top} L ${ax + 5} ${top + 9}`
            : `M ${ax - 5} ${low - 9} L ${ax} ${low} L ${ax + 5} ${low - 9}`;
          return (
            <g key={gi} className={cls} aria-hidden="true">
              <path d={d} />
              <path d={head} />
              <text x={ax + 6} y={top + 6}>{g.text}</text>
            </g>
          );
        })}

        {dots.map((d, di) => {
          const cls = `fb-dot ${d.kind}${d.outside ? " outside" : ""}`;
          const body = (
            <>
              <circle className="shade" cx={x(d.fret)} cy={y(d.string) + 2} r="13.5" />
              <circle className="face" cx={x(d.fret)} cy={y(d.string)} r="13.5" />
              {d.label && <text x={x(d.fret)} y={y(d.string) + 5} textAnchor="middle" className={d.label.length > 2 ? "long" : undefined}>{d.label}</text>}
            </>
          );
          const key = `${d.string}-${d.fret}`;
          if (!onPick) return <g key={key} className={cls} style={plain ? ({ "--i": di } as React.CSSProperties) : undefined}>{body}</g>;
          const pos = { string: d.string, fret: d.fret };
          return (
            <g
              key={key}
              className={cls + " pickable"}
              role="button"
              tabIndex={0}
              aria-label={describe?.(pos)}
              onClick={() => onPick(pos)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(pos); } }}
            >
              <rect className="hit" x={x(d.fret) - FW / 2} y={y(d.string) - SH / 2} width={FW} height={SH} />
              {body}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
