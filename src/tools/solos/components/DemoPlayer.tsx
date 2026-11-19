"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { atAudioTime, getAudio, NATURAL_END, playPhrase, transport } from "@/core/audio";
import type { Exercise } from "../curriculum/types";
import { backingOf, chosenBpm, setDemoPlaying } from "./BackingBar";
import { DemoCtx as Ctx } from "./demoCtx";
import { useRunning } from "./useTransport";

/**
 * O exemplo de um exercício que não tem eco: um botão toca a base com a frase por cima, o braço acende nota a nota
 * e a tablatura fica à mão. Ouvir é escolha da pessoa; para sozinho no fim da frase.
 * O provedor guarda o estado; o botão "Ouvir o exemplo" mora na barra da base, junto do "Iniciar exercício", e a
 * tablatura, logo abaixo dos acordes, junto do botão que a esconde.
 */
export function DemoProvider({ ex, children }: { ex: Exercise; children: ReactNode }) {
  const demo = ex.demo!;
  const running = useRunning();
  const [on, setOn] = useState(false);
  const [sounding, setSounding] = useState(-1);
  const pending = useRef(false);

  useEffect(() => {
    let timers: (() => void)[] = [];
    const clear = () => { timers.forEach((c) => c()); timers = []; };
    const offBeat = transport.on("beat", (info) => {
      if (info.beatInBar !== 0 || !pending.current) return;
      if (info.bar === demo.bars) timers.push(atAudioTime(info.time, () => transport.stop(NATURAL_END)));
      const g = getAudio();
      if (info.bar === 0 && g) {
        const spb = transport.secondsPerBeat;
        playPhrase(g, demo.notes, info.time, spb);
        demo.notes.forEach((n, i) => {
          timers.push(atAudioTime(info.time + n.beat * spb, () => setSounding(i)));
          timers.push(atAudioTime(info.time + (n.beat + n.dur) * spb, () => setSounding((s) => (s === i ? -1 : s))));
        });
      }
    });
    const offStop = transport.on("stop", () => { clear(); pending.current = false; setOn(false); setSounding(-1); setDemoPlaying(false); });
    return () => { offBeat(); offStop(); clear(); };
  }, [demo]);

  const play = () => {
    if (transport.running) transport.stop();
    pending.current = true;
    setOn(true);
    setDemoPlaying(true);
    if (!transport.start(backingOf(ex.base!, chosenBpm(ex.base!)), { countIn: 0 })) { pending.current = false; setOn(false); setDemoPlaying(false); }
  };
  const live = on && running;
  return <Ctx.Provider value={{ ex, live, sounding, play }}>{children}</Ctx.Provider>;
}

