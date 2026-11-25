// Desenho em pixel a partir de um grid de texto ("#" = pixel aceso, "+" = pixel de sombra, "." = vazio).
// Sai um SVG com um único path por cor, sem suavização: ampliado pelo CSS, cada ponto continua um quadrado.

export type Grid = string;

function path(rows: string[], ch: string) {
  let d = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== ch) { x++; continue; }
      const start = x;
      while (row[x] === ch) x++;
      d += `M${start} ${y}h${x - start}v1h${start - x}z`;
    }
  });
  return d;
}

export function PixelArt({ grid, className }: { grid: Grid; className?: string }) {
  const rows = grid.trim().split("\n").map((r) => r.trim());
  const w = Math.max(...rows.map((r) => r.length));
  const shade = path(rows, "+");
  return (
    <svg className={className} viewBox={`0 0 ${w} ${rows.length}`} shapeRendering="crispEdges" aria-hidden="true" focusable="false">
      {shade && <path d={shade} className="px-shade" />}
      <path d={path(rows, "#")} fill="currentColor" />
    </svg>
  );
}

/** Colcheia em pixel: a nota que a marmota toca e que pousa na pauta do hub. */
export const NOTE: Grid = `
...#..
...##.
...#.#
...#.#
...#..
...#..
.###..
####..
.##...
`;
