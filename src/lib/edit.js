// Edição de ideias (funções puras). Notas: { m, b, d } com b em tempos (0..15.75) e d em tempos.
// Cada função recebe a lista e o índice selecionado e devolve { notes, sel } novos.

export const GRIDS = [[1, "1 tempo"], [0.5, "½ tempo"], [0.25, "¼ de tempo"]];
const MIN = 0.25, END = 16;
const clone = (notes) => notes.map((x) => ({ ...x }));

// Ordena, corta sobreposições (melodia: uma nota por vez) e mantém tudo dentro dos 4 compassos.
export function normalize(notes) {
  const out = clone(notes).filter((x) => x.b < END).sort((a, b) => a.b - b.b || a.m - b.m);
  for (let i = 0; i < out.length; i++) {
    const x = out[i], nx = out[i + 1];
    x.b = Math.max(0, x.b);
    if (nx && nx.b > x.b && x.b + x.d > nx.b) x.d = nx.b - x.b;
    x.d = Math.max(MIN, Math.min(x.d, END - x.b));
  }
  return out;
}

const track = (notes, sel, f) => {
  const list = clone(notes), target = list[sel];
  f(list, target);
  const out = normalize(list);
  const idx = target ? out.findIndex((x) => x.m === target.m && x.b === target.b) : -1;
  return { notes: out, sel: idx };
};

// Puxa cada nota para a grade (início e duração). Remove notas repetidas no mesmo lugar.
export function quantize(notes, grid) {
  const seen = new Set();
  const q = clone(notes).map((x) => ({
    m: x.m,
    b: Math.min(END - grid, Math.max(0, Math.round(x.b / grid) * grid)),
    d: Math.max(grid, Math.round(x.d / grid) * grid),
  })).filter((x) => { const k = x.m + ":" + x.b; if (seen.has(k)) return false; seen.add(k); return true; });
  return { notes: normalize(q), sel: -1 };
}

export const moveNote = (notes, sel, delta) => track(notes, sel, (_, t) => { t.b = Math.min(END - MIN, Math.max(0, t.b + delta)); });
export const resizeNote = (notes, sel, delta) => track(notes, sel, (_, t) => { t.d = Math.max(MIN, t.d + delta); });
export const transposeNote = (notes, sel, semis) => track(notes, sel, (_, t) => { t.m += semis; });
export function deleteNote(notes, sel) {
  const list = clone(notes); list.splice(sel, 1);
  return { notes: normalize(list), sel: -1 };
}

// "compasso 2, tempo 1,5"
export function where(b) {
  const bar = Math.floor(b / 4) + 1, beat = (b % 4) + 1;
  return "compasso " + bar + ", tempo " + String(+beat.toFixed(2)).replace(".", ",");
}
