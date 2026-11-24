"use client";
import { useEffect, useRef, useState } from "react";
import { desenharGrafico, novosEfeitos, temEfeito, type EstadoGrafico } from "./grafico";
import { lerCores } from "./pista";

type Entrada = Omit<EstadoGrafico, "w" | "h" | "cores" | "fonte" | "calmo">;

/**
 * A vista "gráfico" da voz (o jeito dos apps de canto): o palco com a nota pedida e a voz, e a dica embaixo.
 * `obter` é lido a cada quadro enquanto `rolando`; parado, o palco fica no último quadro (e termina os efeitos que estavam no ar).
 */
export function GraficoVoz({ obter, rolando, rotulo, dica, reiniciar }: {
  obter: () => Entrada; rolando: boolean; rotulo: string; dica: string;
  /** Muda a cada tentativa: zera os efeitos (faíscas, notas já comemoradas). */
  reiniciar: number;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const tela = useRef<HTMLCanvasElement>(null);
  const tamanho = useRef({ w: 320, h: 260 });
  const obterRef = useRef(obter);
  useEffect(() => { obterRef.current = obter; });
  const fx = useRef(novosEfeitos());
  useEffect(() => { fx.current = novosEfeitos(); }, [reiniciar]);
  const quadro = useRef(0);

  const desenhar = useRef(() => {
    const c = tela.current; const ctx = c?.getContext("2d"); if (!c || !ctx) return;
    const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
    desenharGrafico(ctx, { ...tamanho.current, ...obterRef.current(), cores: lerCores(c), fonte: getComputedStyle(c).fontFamily || "system-ui, sans-serif", calmo }, fx.current, performance.now() / 1000);
  });
  /** Desenha a cada quadro enquanto rola ou enquanto há efeito no ar. */
  const animar = useRef((sempre: () => boolean) => {
    cancelAnimationFrame(quadro.current);
    const laco = () => { desenhar.current(); if (sempre() || temEfeito(fx.current, performance.now() / 1000)) quadro.current = requestAnimationFrame(laco); };
    quadro.current = requestAnimationFrame(laco);
  });

  // O canvas acompanha a largura da caixa e a densidade de pixels da tela (inclusive quando o zoom muda).
  useEffect(() => {
    const el = caixa.current, c = tela.current; if (!el || !c) return;
    let dpr: MediaQueryList | null = null;
    const ajusta = () => {
      const w = Math.max(240, Math.round(el.clientWidth)), h = w < 480 ? 260 : 330, d = window.devicePixelRatio || 1;
      tamanho.current = { w, h };
      c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.height = `${h}px`;
      c.getContext("2d")?.setTransform(d, 0, 0, d, 0, 0);
      desenhar.current();
      dpr?.removeEventListener("change", ajusta);
      dpr = matchMedia(`(resolution: ${d}dppx)`); dpr.addEventListener("change", ajusta);
    };
    ajusta();
    const o = new ResizeObserver(ajusta); o.observe(el);
    return () => { o.disconnect(); dpr?.removeEventListener("change", ajusta); };
  }, []);

  useEffect(() => {
    animar.current(() => rolando);
    return () => cancelAnimationFrame(quadro.current);
  }, [rolando, reiniciar]);

  // A dica só troca depois de ficar parada um instante: a voz real oscila, e um leitor de tela não precisa ouvir cada oscilação.
  const [dicaFirme, setDicaFirme] = useState(dica);
  useEffect(() => {
    const id = setTimeout(() => setDicaFirme(dica), dica === "" ? 0 : 450);
    return () => clearTimeout(id);
  }, [dica]);

  return (
    <div className="voz-grafico">
      <div className="voz-grafico-pista" ref={caixa} role="img" aria-label={rotulo}>
        <canvas ref={tela} aria-hidden="true" />
      </div>
      <p className="afinometro-dica" role="status">{dicaFirme}</p>
    </div>
  );
}
