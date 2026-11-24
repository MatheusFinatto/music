import type { Subdivision } from "@/core/rhythm";

// A figura rítmica de um tempo, desenhada em SVG a partir das notas que o núcleo descreve. O app desenha a
// mesma figura com as mesmas medidas (FigureDrawable.kt); mudou uma, mude a outra.
const STEP = 15;
const PAD = 8;
const HEAD_Y = 34;
const STEM_TOP = 12;
const BEAM = 3.6;
const BEAM_GAP = 5.5;
const STUB = 6;
const HEIGHT = 44;
/** Espaço a mais depois de uma nota pontuada, para o ponto não encostar na próxima. */
const DOT_ROOM = 6;

export function Figure({ subdivision, className }: { subdivision: Subdivision; className?: string }) {
  const notes = subdivision.notes;
  const n = notes.length;
  const xs: number[] = [];
  notes.forEach((note, i) => xs.push(i === 0 ? PAD + 5 : xs[i - 1]! + STEP + (notes[i - 1]!.dotted ? DOT_ROOM : 0)));
  const head = (i: number) => xs[i]!;
  const stem = (i: number) => head(i) + 4.6;
  // Com uma semínima no grupo (shuffle), cada nota fica solta e a colcheia ganha bandeira.
  const beamed = n > 1 && notes.every((x) => x.beams > 0);
  const beams: { x1: number; x2: number; y: number }[] = [];
  if (beamed) {
    beams.push({ x1: stem(0), x2: stem(n - 1), y: STEM_TOP });
    notes.forEach((note, i) => {
      if (note.beams < 2) return;
      const y = STEM_TOP + BEAM_GAP;
      if (i + 1 < n && notes[i + 1]!.beams === 2) beams.push({ x1: stem(i), x2: stem(i + 1), y });
      else if (i === 0 || notes[i - 1]!.beams < 2) {
        // Semicolcheia sozinha: meia barra para dentro do grupo.
        const right = i < n - 1;
        beams.push({ x1: right ? stem(i) : stem(i) - STUB, x2: right ? stem(i) + STUB : stem(i), y });
      }
    });
  }
  const width = head(n - 1) + 5 + PAD + (notes[n - 1]!.dotted ? DOT_ROOM : 0) + 4;
  return (
    <svg className={className} viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} aria-hidden="true" focusable="false">
      {subdivision.tuplet > 0 && (
        <text x={(stem(0) + stem(n - 1)) / 2} y={8} textAnchor="middle" fontSize={9} fontWeight={600} fill="currentColor">{subdivision.tuplet}</text>
      )}
      {notes.map((note, i) => (
        <g key={i}>
          <ellipse cx={head(i)} cy={HEAD_Y} rx={5.2} ry={3.8} transform={`rotate(-22 ${head(i)} ${HEAD_Y})`} fill="currentColor" />
          <line x1={stem(i)} y1={HEAD_Y - 1} x2={stem(i)} y2={STEM_TOP} stroke="currentColor" strokeWidth={1.6} />
          {note.dotted && <circle cx={head(i) + 8.5} cy={HEAD_Y - 1} r={1.6} fill="currentColor" />}
          {!beamed && note.beams > 0 && (
            <path d={`M${stem(i)} ${STEM_TOP} c0 6 7 6.5 5.5 14.5`} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
          )}
        </g>
      ))}
      {beams.map((b, i) => <rect key={i} x={b.x1 - 0.8} y={b.y} width={b.x2 - b.x1 + 1.6} height={BEAM} fill="currentColor" />)}
    </svg>
  );
}
