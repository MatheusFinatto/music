"use client";
// A frase escrita: no braço (com os gestos desenhados) e em tablatura de texto. Usada no eco e no exemplo do arco.
import { useEffect, useRef, useState } from "react";
import { fretSpan, midiAt, pcName } from "@/core/theory";
import type { Phrase } from "../curriculum/types";
import { tabLayout, tabSystems, tabText, type TabCell } from "../engines/tab";
import { gestureOf } from "../engines/tech";
import { Fretboard, type Dot, type GestureMark } from "./Fretboard";
import { useScrollable } from "./useScrollable";

export { barNames as chordNames } from "./BackingBar";

export function Board({ phrase, now, label, half, full }: { phrase: Phrase; now: number; label: string; half: string; full: string }) {
  if (!phrase.frets) return null;
  const frets = phrase.frets;
  // As notas da frase são bolinhas de escala (madrepérola, com o nome da nota): o laranja fica só para a nota-alvo (Regra das Três Cores).
  // Cada casa mostra o nome da nota; a ordem aparece ao tocar (a bolinha acende) e na linha de notas.
  const uses = new Map<string, number[]>();
  frets.forEach((p, i) => uses.set(`${p.string}-${p.fret}`, [...(uses.get(`${p.string}-${p.fret}`) ?? []), i]));
  const dots: Dot[] = [...uses.entries()].map(([k, idx]) => {
    const [string, fret] = k.split("-").map(Number) as [number, number];
    return { string, fret, kind: idx.includes(now) ? "now" : "scale", label: pcName(midiAt({ string, fret })) };
  });
  // Os gestos vão desenhados no braço; um por casa e tipo, aceso quando é ele que está soando.
  const marks = new Map<string, GestureMark>();
  phrase.notes.forEach((n, i) => {
    const pos = frets[i]!, g = gestureOf(n, pos);
    if (!g) return;
    const k = `${pos.string}-${pos.fret}-${g.kind}`;
    const mark: GestureMark = g.kind === "slide"
      ? { ...pos, kind: "slide", fromFret: g.fromFret }
      : { ...pos, kind: g.kind, text: g.amount < 1 ? "¼" : g.amount === 1 ? half : g.amount === 2 ? full : `${g.amount / 2}` };
    marks.set(k, { ...mark, now: i === now || !!marks.get(k)?.now });
  });
  const gestures = [...marks.values()];
  // A origem do slide é uma nota palhetada: entra como bolinha, acesa junto com o slide.
  for (const g of gestures) {
    if (g.kind !== "slide") continue;
    const at = dots.find((d) => d.string === g.string && d.fret === g.fromFret);
    if (at) { if (g.now) at.kind = "now"; }
    else dots.push({ string: g.string, fret: g.fromFret, kind: g.now ? "now" : "scale", label: pcName(midiAt({ string: g.string, fret: g.fromFret })) });
  }
  const [lo, last] = fretSpan([...frets, ...gestures.flatMap((g) => (g.kind === "slide" ? [{ string: g.string, fret: g.fromFret }] : []))]);
  // A seta do bend fica à direita da nota: na última casa, abre mais uma para ela caber.
  const hi = gestures.some((g) => g.kind !== "slide" && g.fret === last) ? last + 1 : last;
  return (
    <>
      <Fretboard minFret={lo} maxFret={hi} dots={dots} gestures={gestures} label={label} />
    </>
  );
}

/** A frase em tablatura de texto. A largura da caixa decide quantos compassos cabem por linha. */
export function TextTab({ phrase, now, chords, label, picks }: { phrase: Phrase; now: number; chords: string[]; label: string; picks?: string[] }) {
  const box = useRef<HTMLPreElement>(null);
  const scrollable = useScrollable(box);
  const [chars, setChars] = useState(200);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    // Largura de um caractere da fonte monoespaçada, medida uma vez.
    const probe = document.createElement("span");
    probe.textContent = "0".repeat(40);
    el.appendChild(probe);
    const cw = probe.getBoundingClientRect().width / 40 || 8;
    probe.remove();
    const pad = parseFloat(getComputedStyle(el).paddingLeft) * 2 || 0;
    const ro = new ResizeObserver(() => setChars(Math.floor((el.clientWidth - pad) / cw)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const systems = tabSystems(phrase.notes, phrase.frets!, phrase.bars, chords, tabLayout(chars, phrase.bars), picks);
  // Junta os caracteres seguidos da mesma nota num span, para acender a nota inteira.
  const runs = (cells: TabCell[]) => {
    const out: { text: string; note: number }[] = [];
    for (const c of cells) {
      const last = out.at(-1);
      if (last && last.note === c.note) last.text += c.ch;
      else out.push({ text: c.ch, note: c.note });
    }
    return out;
  };
  return (
    <figure className="text-tab" aria-label={label}>
      <pre ref={box} {...(scrollable ? { tabIndex: 0, role: "img", "aria-label": label } : { "aria-hidden": true })}>
        {systems.map((sys, si) => (
          <span key={si} className="system">
            <span className="head">{sys.head}</span>{"\n"}
            {sys.pick && (
              <span>
                {"  "}
                {sys.pick.map((bar, bi) => (
                  <span key={bi}>{runs(bar).map((r, ri) => (r.note < 0 ? r.text : <span key={ri} className={r.note === now ? "tn now" : "tn"}>{r.text}</span>))}{bi < sys.pick!.length - 1 ? " " : ""}</span>
                ))}
                {"\n"}
              </span>
            )}
            {sys.rows.map((row) => (
              <span key={row.name}>
                {row.name}|
                {row.bars.map((bar, bi) => (
                  <span key={bi}>
                    {runs(bar).map((r, ri) => (r.note < 0 ? r.text : <span key={ri} className={r.note === now ? "tn now" : "tn"}>{r.text}</span>))}|
                  </span>
                ))}
                {"\n"}
              </span>
            ))}
            <span className="count">{sys.count}</span>{"\n"}
            {si < systems.length - 1 && "\n"}
          </span>
        ))}
      </pre>
      <figcaption className="sr-only">{tabText(systems)}</figcaption>
    </figure>
  );
}
