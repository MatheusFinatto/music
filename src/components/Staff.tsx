// Pauta decorativa do topo do hub: uma nota por ferramenta do registro.
// Cabeça cheia = no ar; vazada = ainda não. A nota laranja é a próxima (a "nota-alvo").
// A animação é só CSS (globals.css) e some para quem pede redução de movimento.

type Note = { filled: boolean; target: boolean };

const W = 1200;
const TOP = 46; // linha de cima
const GAP = 17; // distância entre linhas
const X0 = 40;
const X1 = 1160;
const CYCLE = 8; // segundos, igual ao @keyframes sweep
// Posição de cada nota em meias-linhas a partir da linha de cima (contorno de uma frase que sobe e resolve).
const CONTOUR = [7, 5, 3, 4, 2, 5, 6, 4, 3, 5];

export function Staff({ notes }: { notes: Note[] }) {
  const step = (X1 - X0) / (notes.length + 1);
  return (
    <svg className="staff" viewBox={`0 0 ${W} 170`} aria-hidden="true" focusable="false">
      <g className="lines">
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} d={`M${X0} ${TOP + i * GAP}H${X1}`} />
        ))}
      </g>
      {notes.map((n, i) => {
        const x = X0 + step * (i + 1);
        const y = TOP + ((CONTOUR[i % CONTOUR.length] ?? 4) * GAP) / 2;
        // Instante em que o cursor cruza a nota (o cursor anda de 4% a 96% do ciclo).
        const t = (0.04 + ((x - X0) / (X1 - X0)) * 0.92) * CYCLE;
        const up = y > TOP + 2 * GAP;
        return (
          <g
            key={i}
            className={n.filled ? "note" : "note hollow"}
            style={{ "--t": t.toFixed(2), ...(n.target ? { "--hit": "var(--target)" } : {}) } as React.CSSProperties}
          >
            <circle className="ring" cx={x} cy={y} r="13" />
            <path className="stem" d={up ? `M${x + 10.5} ${y - 3}V${y - 54}` : `M${x - 10.5} ${y + 3}V${y + 54}`} />
            <ellipse className="head" cx={x} cy={y} rx="11" ry="7.6" transform={`rotate(-22 ${x} ${y})`} />
          </g>
        );
      })}
      <path className="cursor" d={`M0 ${TOP - 22}V${TOP + 4 * GAP + 22}`} />
    </svg>
  );
}
