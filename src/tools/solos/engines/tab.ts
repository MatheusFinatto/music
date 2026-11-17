// Tablatura em texto de uma frase, no formato do Piano de Ideias (legacy/src/lib/score.js): o acorde em
// cima de cada compasso, seis linhas (1ª corda em cima), cada semicolcheia com largura fixa (o espaço
// mostra o ritmo) e a contagem embaixo. Gestos: 7b9 bend, 9r7 dobrar e soltar, 5/7 slide, ~ vibrato.
import type { LeadNote } from "@/core/audio";
import type { FretPos } from "@/core/theory";
import { gestureOf } from "./tech";

/** O que se escreve na corda para esta nota: 7, 7b9, 9r7, 5/7, com ~ se houver vibrato. */
export function tabToken(n: LeadNote, pos: FretPos): string {
  const g = gestureOf(n, pos), f = pos.fret;
  const body = !g ? `${f}`
    : g.kind === "slide" ? `${g.fromFret}/${f}`
    : g.kind === "bend" ? `${f}b${f + g.amount}`
    : `${f + g.amount}r${f}`;
  return body + (n.vibrato ? "~" : "");
}

/** Um caractere da tab e a nota a que ele pertence (-1: traço). */
export type TabCell = { ch: string; note: number };
/** Uma linha de compassos: cifra em cima, seis cordas, contagem embaixo. */
export type TabSystem = { head: string; rows: { name: string; bars: TabCell[][] }[]; count: string };
/** `cw`: caracteres por semicolcheia; `bpl`: compassos por linha. */
export type TabLayout = { cw: number; bpl: number };

const NAMES = ["e", "B", "G", "D", "A", "E"];

export function tabSystems(notes: readonly LeadNote[], frets: readonly FretPos[], bars: number, chords: readonly string[], { cw, bpl }: TabLayout): TabSystem[] {
  const perBar = 16 * cw;
  const grid = NAMES.map(() => Array.from({ length: bars }, () => Array.from({ length: perBar }, (): TabCell => ({ ch: "-", note: -1 }))));
  notes.forEach((n, i) => {
    const six = Math.round(n.beat * 4), bar = Math.floor(six / 16);
    if (bar >= bars) return;
    const pos = frets[i]!, token = tabToken(n, pos);
    const c = (six % 16) * cw + (cw > 2 ? 1 : 0);
    for (let k = 0; k < token.length && c + k < perBar; k++) grid[pos.string]![bar]![c + k] = { ch: token[k]!, note: i };
  });
  const systems: TabSystem[] = [];
  for (let b0 = 0; b0 < bars; b0 += bpl) {
    const idx = Array.from({ length: Math.min(bpl, bars - b0) }, (_, k) => b0 + k);
    const pad = (s: string, w: number) => (s + " ".repeat(w)).slice(0, w);
    systems.push({
      head: "  " + idx.map((b) => pad(chords[b % chords.length] ?? "", perBar)).join(" "),
      rows: NAMES.map((name, s) => ({ name, bars: idx.map((b) => grid[s]![b]!) })),
      count: "  " + idx.map(() => [1, 2, 3, 4].map((k) => pad(String(k), 4 * cw)).join("")).join(" "),
    });
  }
  return systems;
}

/** Quantos compassos por linha e quão larga cada semicolcheia, para caber em `chars` caracteres. */
export function tabLayout(chars: number, bars: number): TabLayout {
  const opts: TabLayout[] = [{ cw: 3, bpl: bars }, { cw: 2, bpl: bars }, { cw: 3, bpl: 1 }, { cw: 2, bpl: 1 }];
  return opts.find((o) => 2 + o.bpl * (16 * o.cw + 1) <= chars) ?? { cw: 2, bpl: 1 };
}

/** A tab como texto puro (para leitor de tela e para testes). */
export const tabText = (systems: readonly TabSystem[]) =>
  systems
    .map((s) => [s.head, ...s.rows.map((r) => `${r.name}|${r.bars.map((b) => b.map((c) => c.ch).join("")).join("|")}|`), s.count].join("\n"))
    .join("\n\n");
