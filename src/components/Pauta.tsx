"use client";
import { useEffect, useRef, useState } from "react";
import { PIANO_LEAD_S, getAudio, heardTime, loadPiano, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";
import { Info } from "./Info";
import { PixelArt } from "./PixelArt";

// A pauta do hub: "Marmotte", de Beethoven (op. 52 nº 7, poema de Goethe), a canção do menino que roda o mundo com a sua
// marmota, como na mão direita do piano da edição impressa: clave de sol, 6/8, "p" na anacruse, até o começo do 4º compasso.
// Lá menor, "Munter". Alturas conferidas na edição do WIMA (abcm2ps, 2007):
// E4 | A4♩ A4♪ A4♩ A4♪ | B4♪ C5♪ B4♪ A4♩ A4♪ | B4♩ B4♪ C5♪ B4♪ A4♪ | B4♩.
// Parada, a pauta acende cada nota na sua hora, em ciclo, por CSS (globals.css, "pauta"). Embaixo, discreto: o nome, o play e o "?"
// com a história. Tocando, o ciclo para e as notas acendem pelo relógio do áudio (o que está saindo no alto-falante, descontado o
// atraso da saída): luz e som batem em qualquer aparelho, mesmo com Bluetooth.

type Nota = { t: number; p: number; d: 1 | 2 | 3; grupo?: number };

/** t = início em colcheias desde a anacruse; p = altura em meias-linhas a partir da linha de cima (F5 = 0, E4 = 8); d = duração em
 *  colcheias (3 = semínima pontuada); grupo = colcheias ligadas por uma barra. */
const MELODIA: Nota[] = [
  { t: 0, p: 8, d: 1 }, // E4: "Ich"
  { t: 1, p: 5, d: 2 }, { t: 3, p: 5, d: 1 }, { t: 4, p: 5, d: 2 }, { t: 6, p: 5, d: 1 }, // A4 A4 A4 A4: "kom-me schon durch"
  { t: 7, p: 4, d: 1, grupo: 1 }, { t: 8, p: 3, d: 1, grupo: 1 }, { t: 9, p: 4, d: 1, grupo: 1 }, // B4 C5 B4: "man-che"
  { t: 10, p: 5, d: 2 }, { t: 12, p: 5, d: 1 }, // A4 A4: "Land, a-"
  { t: 13, p: 4, d: 2 }, { t: 15, p: 4, d: 1 }, // B4 B4: "-vec que"
  { t: 16, p: 3, d: 1, grupo: 2 }, { t: 17, p: 4, d: 1, grupo: 2 }, { t: 18, p: 5, d: 1, grupo: 2 }, // C5 B4 A4
  { t: 19, p: 4, d: 3 }, // B4: começo do 4º compasso
];
const BARRAS = [1, 7, 13, 19]; // barras de compasso, em colcheias
/** Lá menor natural, clave de sol: meia-linha → MIDI (F5, E5, D5, C5, B4, A4, G4, F4, E4). */
const MIDI = [77, 76, 74, 72, 71, 69, 67, 65, 64];
/** A colcheia, em segundos: a mesma de --colcheia no CSS. */
const COLCHEIA = 0.22;

/** Clave de sol em pixel: 6 linhas acima da pauta, a espiral em volta da linha do sol (G4), a cauda 5 linhas abaixo. */
const CLAVE = `
.....##....
....#..#...
....#..#...
....#..#...
....#.#....
....#.#....
....##.....
....#......
...##......
..#.#......
.#..#......
#...#......
#...#......
#..#####...
#.#..#..#..
#.#..#...#.
#.#..#...#.
#..#.#...#.
#...##...#.
.#...#..#..
..#..#.#...
...####....
.....#.....
.....#.....
.##..#.....
.##..#.....
..#.#......
...#.......`;
/** O 6/8 em pixel: a fonte, nessa altura, borra; o desenho fica nítido como o resto da pauta. */
const SEIS = `
.###.
#....
#....
####.
#...#
#...#
.###.`;
const OITO = `
.###.
#...#
#...#
.###.
#...#
#...#
.###.`;
/** "p" (piano), em negrito como na partitura. */
const PIANO = `
####.
##.##
##.##
##.##
####.
##...
##...`;
const CABECA = `
..###
.####
####.
###..`;
const BANDEIRA = `
#.
.#
.#
.#`;
const PLAY = `
#....
##...
###..
####.
###..
##...
#....`;
const STOP = `
#####
#####
#####
#####
#####`;

export type TextosPauta = { label: string; nome: string; tocar: string; parar: string; historia: string; fechar: string; travado: string; texto: string[] };

export function Pauta({ t }: { t: TextosPauta }) {
  const grupos = [1, 2].map((g) => {
    const ns = MELODIA.filter((n) => n.grupo === g);
    return { g, t0: ns[0]!.t, t1: ns.at(-1)!.t, topo: Math.min(...ns.map((n) => n.p)) };
  });
  // A barra das colcheias ligadas fica na altura da haste da nota mais aguda do grupo.
  const topo = (n: Nota) => grupos.find((x) => x.g === n.grupo)?.topo ?? n.p;
  const [estado, setEstado] = useState<"parado" | "carregando" | "tocando">("parado");
  const notasEl = useRef<(HTMLSpanElement | null)[]>([]);
  const quadro = useRef(0);
  /** Para o laço de luz e apaga as notas. */
  const apagar = () => {
    cancelAnimationFrame(quadro.current);
    for (const el of notasEl.current) el?.classList.remove("acesa", "pula");
  };
  useEffect(() => () => cancelAnimationFrame(quadro.current), []);

  async function tocar() {
    if (estado !== "parado") {
      apagar();
      const g = getAudio(); if (g) stopPiano(g);
      setEstado("parado");
      return;
    }
    const g = resumeAudio();
    if (!g) return;
    setEstado("carregando");
    try { await loadPiano(g); } catch { setEstado("parado"); return; }
    const notas: PianoNote[] = MELODIA.map((n) => ({ midi: MIDI[n.p]!, at: n.t * COLCHEIA, dur: n.d * COLCHEIA * 0.95 }));
    const inicio = g.ctx.currentTime + PIANO_LEAD_S;
    const dur = playPiano(g, notas, { inicio });
    if (dur === null) { setEstado("parado"); return; }
    setEstado("tocando");
    // Limite pelo relógio de parede: se o áudio não andar (contexto travado), a pauta não fica presa em "tocando".
    const limite = performance.now() + (dur + 1) * 1000;
    // A cada quadro: em que colcheia está o som que se ouve agora? Acende a nota que soa (e o pulo, na primeira meia colcheia).
    const passo = () => {
      const c = (heardTime(g.ctx) - inicio) / COLCHEIA;
      if (c > MELODIA.at(-1)!.t + MELODIA.at(-1)!.d || performance.now() > limite) { apagar(); setEstado("parado"); return; }
      MELODIA.forEach((n, i) => {
        const el = notasEl.current[i];
        if (!el) return;
        el.classList.toggle("acesa", c >= n.t && c < n.t + n.d);
        el.classList.toggle("pula", c >= n.t && c < n.t + 0.5);
      });
      quadro.current = requestAnimationFrame(passo);
    };
    quadro.current = requestAnimationFrame(passo);
  }

  return (
    <figure className="pauta-figura">
      <div className={`pauta${estado === "tocando" ? " tocando" : ""}`} role="img" aria-label={t.label}>
        <PixelArt grid={CLAVE} className="pauta-clave" />
        <span className="pauta-formula" aria-hidden="true"><PixelArt grid={SEIS} /><PixelArt grid={OITO} /></span>
        <PixelArt grid={PIANO} className="pauta-dinamica" />
        {BARRAS.map((b) => <span key={b} className="pauta-barra" style={{ "--t": b - 0.3 } as React.CSSProperties} />)}
        {MELODIA.map((n, i) => (
          <span key={i} ref={(el) => { notasEl.current[i] = el; }} className={`pauta-nota d${n.d}`}
            style={{ "--p": n.p, "--t": n.t, "--haste": n.p - topo(n) } as React.CSSProperties}>
            <PixelArt grid={CABECA} className="pauta-cabeca" />
            <span className="pauta-haste" />
            {n.d === 1 && !n.grupo && <PixelArt grid={BANDEIRA} className="pauta-bandeira" />}
            {n.d === 3 && <span className="pauta-ponto" />}
          </span>
        ))}
        {grupos.map((x) => (
          <span key={x.g} className="pauta-viga" style={{ "--t": x.t0, "--t1": x.t1, "--p": x.topo } as React.CSSProperties} />
        ))}
      </div>
      <figcaption className="pauta-rodape">
        <span className="pauta-nome">{t.nome}</span>
        <button type="button" className="pauta-play" onClick={() => void tocar()} aria-label={estado === "parado" ? t.tocar : t.parar} title={estado === "parado" ? t.tocar : t.parar} aria-busy={estado === "carregando"}>
          <PixelArt grid={estado === "parado" ? PLAY : STOP} />
        </button>
        <Info className="info-sutil" label={t.historia} title={t.nome} close={t.fechar} travado={t.travado} items={t.texto} texto />
      </figcaption>
    </figure>
  );
}
