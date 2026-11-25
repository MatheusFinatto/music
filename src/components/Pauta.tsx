"use client";
import { useEffect, useRef, useState } from "react";
import { getAudio, loadPiano, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";
import { Info } from "./Info";
import { PixelArt } from "./PixelArt";

// A pauta do hub: a anacruse e os dois primeiros compassos de "Marmotte", de Beethoven (op. 52 nº 7, poema de Goethe), a canção
// do menino que roda o mundo com a sua marmota. Lá menor, 6/8, "Munter". Conferido na edição do WIMA (abcm2ps, 2007):
// E4 | A4♩ A4♪ A4♩ A4♪ | B4♪ C5♪ B4♪ A4♩ A4♪ |
// A pauta acende cada nota na sua hora, em ciclo (globals.css, "pauta"). Embaixo, discreto: o nome, o play (toca no piano do site e
// reinicia a animação junto, para som e luz baterem) e o "?" com a história.

type Nota = { t: number; p: number; d: 1 | 2; grupo?: number };

/** t = início em colcheias desde a anacruse; p = altura em meias-linhas a partir da linha de cima (F5 = 0, E4 = 8); d = duração em colcheias. */
const MELODIA: Nota[] = [
  { t: 0, p: 8, d: 1 }, // E4: "Ich"
  { t: 1, p: 5, d: 2 }, { t: 3, p: 5, d: 1 }, { t: 4, p: 5, d: 2 }, { t: 6, p: 5, d: 1 }, // A4 A4 A4 A4: "kom-me schon durch"
  { t: 7, p: 4, d: 1, grupo: 1 }, { t: 8, p: 3, d: 1, grupo: 1 }, { t: 9, p: 4, d: 1, grupo: 1 }, // B4 C5 B4: "man-che"
  { t: 10, p: 5, d: 2 }, { t: 12, p: 5, d: 1 }, // A4 A4: "Land, a-"
];
const BARRAS = [1, 7, 13]; // barras de compasso, em colcheias
// A posição horizontal sai do CSS (--t em colcheias): no celular só cabem a anacruse e o primeiro compasso.
const SEGUNDO_COMPASSO = 7;
/** Lá menor natural, clave de sol: meia-linha → MIDI (F5, E5, D5, C5, B4, A4, G4, F4, E4). */
const MIDI = [77, 76, 74, 72, 71, 69, 67, 65, 64];
/** A colcheia, em segundos: a mesma de --colcheia no CSS. */
const COLCHEIA = 0.22;

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
  // A barra das colcheias ligadas fica na altura da haste da nota mais aguda do grupo.
  const grupo = MELODIA.filter((n) => n.grupo === 1);
  const pTopo = Math.min(...grupo.map((n) => n.p));
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
        <span className="pauta-formula" aria-hidden="true"><span>6</span><span>8</span></span>
        {BARRAS.map((b) => <span key={b} className={`pauta-barra${b > SEGUNDO_COMPASSO ? " c2" : ""}`} style={{ "--t": b - 0.3 } as React.CSSProperties} />)}
        {MELODIA.map((n, i) => (
          <span key={i} className={`pauta-nota${n.d === 2 ? " longa" : ""}${n.t >= SEGUNDO_COMPASSO ? " c2" : ""}`}
            style={{ "--p": n.p, "--t": n.t, "--haste": n.grupo ? n.p - pTopo : 0 } as React.CSSProperties}>
            <PixelArt grid={CABECA} className="pauta-cabeca" />
            <span className="pauta-haste" />
            {n.d === 1 && !n.grupo && <PixelArt grid={BANDEIRA} className="pauta-bandeira" />}
          </span>
        ))}
        <span className="pauta-viga c2" style={{ "--t": grupo[0]!.t, "--t1": grupo.at(-1)!.t, "--p": pTopo } as React.CSSProperties} />
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
