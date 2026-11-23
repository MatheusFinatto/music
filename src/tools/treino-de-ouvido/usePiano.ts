"use client";
import { useCallback, useEffect, useState } from "react";
import { getAudio, loadPiano, playPiano, resumeAudio, stopPiano, type PianoNote } from "@/core/audio";

/** Toca notas no piano de amostras (carrega na primeira vez). Devolve a duração em segundos, ou null se não deu. */
export function usePiano() {
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<"audio" | "piano" | null>(null);
  useEffect(() => () => { const g = getAudio(); if (g) stopPiano(g); }, []);
  const tocar = useCallback(async (notas: readonly PianoNote[]): Promise<number | null> => {
    const g = resumeAudio();
    if (!g) { setErro("audio"); return null; }
    try { setCarregando(true); await loadPiano(g); setErro(null); } catch { setErro("piano"); return null; } finally { setCarregando(false); }
    return playPiano(g, notas);
  }, []);
  const calar = useCallback(() => { const g = getAudio(); if (g) stopPiano(g); }, []);
  return { tocar, calar, carregando, erro };
}
