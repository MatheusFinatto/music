"use client";
import { useEffect, useRef, useState } from "react";
import { getAudio, loadPiano, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";
import { Info } from "./Info";
import { PixelArt } from "./PixelArt";

// A pauta do hub: "Marmotte", de Beethoven (op. 52 nº 7, poema de Goethe), a canção do menino que roda o mundo com a sua
// marmota, como na mão direita do piano da edição impressa: clave de sol, 6/8, "p" na anacruse, até o começo do 4º compasso.
// Lá menor, "Munter". Alturas conferidas na edição do WIMA (abcm2ps, 2007):
// E4 | A4♩ A4♪ A4♩ A4♪ | B4♪ C5♪ B4♪ A4♩ A4♪ | B4♩ B4♪ C5♪ B4♪ A4♪ | B4♩.
// A pauta acende cada nota na sua hora, em ciclo (globals.css, "pauta"). Embaixo, discreto: o nome, o play (toca no piano do site e
// reinicia a animação junto, para som e luz baterem) e o "?" com a história.

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
/** Quanto cabe em cada largura (globals.css): no celular, a anacruse e o 1º compasso (.c2 some); no tablet, até o 2º (.c3 some). */
const compasso = (t: number) => (t >= 13 ? " c2 c3" : t >= 7 ? " c2" : "");
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

export type TextosPauta = { label: string; nome: string; tocar: string; parar: string; historia: string; fechar: string; texto: string[] };

export function Pauta({ t }: { t: TextosPauta }) {
  const grupos = [1, 2].map((g) => {
    const ns = MELODIA.filter((n) => n.grupo === g);
    return { g, t0: ns[0]!.t, t1: ns.at(-1)!.t, topo: Math.min(...ns.map((n) => n.p)) };
  });
  // A barra das colcheias ligadas fica na altura da haste da nota mais aguda do grupo.
  const topo = (n: Nota) => grupos.find((x) => x.g === n.grupo)?.topo ?? n.p;
  const [vez, setVez] = useState(0); // trocar remonta a pauta: a animação recomeça junto com o som
  const [estado, setEstado] = useState<"parado" | "carregando" | "tocando">("parado");
  const fim = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (fim.current) clearTimeout(fim.current); }, []);

  async function tocar() {
    if (estado !== "parado") {
      if (fim.current) clearTimeout(fim.current);
      const g = getAudio(); if (g) stopPiano(g);
      setEstado("parado");
      return;
    }
    const g = resumeAudio();
    if (!g) return;
    setEstado("carregando");
    try { await loadPiano(g); } catch { setEstado("parado"); return; }
    const notas: PianoNote[] = MELODIA.map((n) => ({ midi: MIDI[n.p]!, at: n.t * COLCHEIA, dur: n.d * COLCHEIA * 0.95 }));
    const dur = playPiano(g, notas);
    if (dur === null) { setEstado("parado"); return; }
    setVez((v) => v + 1);
    setEstado("tocando");
    fim.current = setTimeout(() => setEstado("parado"), (dur + 0.4) * 1000);
  }

  return (
    <figure className="pauta-figura">
      <div key={vez} className="pauta" role="img" aria-label={t.label}>
        <PixelArt grid={CLAVE} className="pauta-clave" />
        <span className="pauta-formula" aria-hidden="true"><PixelArt grid={SEIS} /><PixelArt grid={OITO} /></span>
        <PixelArt grid={PIANO} className="pauta-dinamica" />
        {BARRAS.map((b) => <span key={b} className={`pauta-barra${compasso(b)}`} style={{ "--t": b - 0.3 } as React.CSSProperties} />)}
        {MELODIA.map((n, i) => (
          <span key={i} className={`pauta-nota d${n.d}${compasso(n.t)}`}
            style={{ "--p": n.p, "--t": n.t, "--haste": n.p - topo(n) } as React.CSSProperties}>
            <PixelArt grid={CABECA} className="pauta-cabeca" />
            <span className="pauta-haste" />
            {n.d === 1 && !n.grupo && <PixelArt grid={BANDEIRA} className="pauta-bandeira" />}
            {n.d === 3 && <span className="pauta-ponto" />}
          </span>
        ))}
        {grupos.map((x) => (
          <span key={x.g} className={`pauta-viga${compasso(x.t0)}`} style={{ "--t": x.t0, "--t1": x.t1, "--p": x.topo } as React.CSSProperties} />
        ))}
      </div>
      <figcaption className="pauta-rodape">
        <span className="pauta-nome">{t.nome}</span>
        <button type="button" className="pauta-play" onClick={() => void tocar()} aria-label={estado === "parado" ? t.tocar : t.parar} title={estado === "parado" ? t.tocar : t.parar} aria-busy={estado === "carregando"}>
          <PixelArt grid={estado === "parado" ? PLAY : STOP} />
        </button>
        <Info className="info-sutil" label={t.historia} title={t.nome} close={t.fechar} items={t.texto} texto />
      </figcaption>
    </figure>
  );
}
