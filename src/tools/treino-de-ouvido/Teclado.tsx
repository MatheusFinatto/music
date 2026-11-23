import { nomeNota } from "./engine";

const PRETAS = new Set([1, 3, 6, 8, 10]);
const W = 22, H = 84, F = 20;

/** Teclado de piano com as notas tocadas acesas (em verde) e o nome de cada uma embaixo. Mostra pelo menos duas oitavas. */
export function Teclado({ midis, label }: { midis: readonly number[]; label: string }) {
  const lo = Math.floor((Math.min(...midis) - 1) / 12) * 12;
  const hi = Math.max(lo + 23, Math.floor(Math.max(...midis) / 12) * 12 + 11);
  const brancas: number[] = [];
  for (let m = lo; m <= hi; m++) if (!PRETAS.has(m % 12)) brancas.push(m);
  const x = new Map(brancas.map((m, i) => [m, i * W]));
  const alvo = new Set(midis);
  const atraso = (m: number) => ({ animationDelay: `${midis.indexOf(m) * 0.12}s` });
  const pretas: number[] = [];
  for (let m = lo; m <= hi; m++) if (PRETAS.has(m % 12)) pretas.push(m);
  return (
    <svg className="teclado" viewBox={`0 0 ${brancas.length * W} ${H + F}`} role="img" aria-label={label}>
      {brancas.map((m) => (
        <rect key={m} className={alvo.has(m) ? "b on" : "b"} style={alvo.has(m) ? atraso(m) : undefined} x={x.get(m)! + 0.5} y={0.5} width={W - 1} height={H - 1} rx={3} />
      ))}
      {pretas.map((m) => (
        <rect key={m} className={alvo.has(m) ? "p on" : "p"} style={alvo.has(m) ? atraso(m) : undefined} x={x.get(m - 1)! + W - 7} y={0} width={14} height={H * 0.6} rx={2} />
      ))}
      {[...alvo].map((m) => (
        <text key={m} className="nome" style={atraso(m)} x={PRETAS.has(m % 12) ? x.get(m - 1)! + W : x.get(m)! + W / 2} y={H + 14}>{nomeNota(m)}</text>
      ))}
    </svg>
  );
}
