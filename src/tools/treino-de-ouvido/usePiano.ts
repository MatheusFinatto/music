"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getAudio, loadPiano, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";

/** De quanto em quanto tempo o bordão toca a nota de novo, por cima da anterior (a amostra dura ~3 s). */
const BORDAO_MS = 2400;

/** Toca notas no piano de amostras (carrega na primeira vez). Devolve a duração em segundos, ou null se não deu. */
export function usePiano() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<"audio" | "piano" | null>(null);
  const bordao = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Cada início de bordão ganha um número; parar ou desmontar invalida os que ainda esperam as amostras. */
  const geracao = useRef(0);
  const pararBordao = useCallback(() => { geracao.current++; if (bordao.current) clearInterval(bordao.current); bordao.current = null; }, []);
  useEffect(() => () => { pararBordao(); const g = getAudio(); if (g) stopPiano(g); }, [pararBordao]);
  const tocar = useCallback(async (notas: readonly PianoNote[], manter = false): Promise<number | null> => {
    const g = resumeAudio();
    if (!g) { setErro("audio"); return null; }
    try { setCarregando(true); await loadPiano(g); setErro(null); } catch { setErro("piano"); return null; } finally { setCarregando(false); }
    return playPiano(g, notas, { manter });
  }, []);
  const calar = useCallback(() => { pararBordao(); const g = getAudio(); if (g) stopPiano(g); }, [pararBordao]);
  /** Uma nota que não para: o piano a repete por cima de si mesmo até `calar` ou `pararBordao`. */
  const iniciarBordao = useCallback(async (midi: number): Promise<boolean> => {
    pararBordao();
    const minha = geracao.current;
    const nota: PianoNote[] = [{ midi, at: 0, dur: 3.0 }];
    if ((await tocar(nota)) === null) return false;
    if (minha !== geracao.current) { const g = getAudio(); if (g) stopPiano(g); return false; }
    bordao.current = setInterval(() => { const g = getAudio(); if (g) playPiano(g, nota, { manter: true }); }, BORDAO_MS);
    return true;
  }, [pararBordao, tocar]);
  return { tocar, calar, carregando, erro, iniciarBordao, pararBordao };
}
