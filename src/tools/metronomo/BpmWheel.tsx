"use client";
import { useEffect, useRef } from "react";

/**
 * O andamento como um tambor de números, igual ao app (BpmWheel.kt; mudou um, mude o outro): arrastar ou arremessar
 * para cima acelera, e ele para num número inteiro. Tocar no número de cima ou de baixo anda um. Mesmas medidas do
 * app: 76 px por número, o do meio com 88 px e os outros menores e apagados até as bordas. Os minutos e segundos do timer
 * usam o mesmo tambor, menor ([scale]) e com dois dígitos ([pad]).
 */
const BASE_ITEM = 76;
/** Quanto o dedo anda antes de virar arrasto (o touch slop do Android, ~8 dp). */
const SLOP = 8;
/** Abaixo disso (px/ms) não é arremesso: só assenta no número mais perto. */
const MIN_FLING = 0.15;
/** Constante de tempo do arremesso (ms): a velocidade cai a 1/e nesse tempo. */
const DECAY = 325;
const SETTLE_MS = 220;

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (bpm: number) => void;
  label: string;
  unit: string;
  className?: string;
  scale?: number;
  pad?: boolean;
};

export function BpmWheel({ value, min, max, onChange, label, unit, className, scale = 1, pad = false }: Props) {
  const ITEM = BASE_ITEM * scale;
  const canvas = useRef<HTMLCanvasElement>(null);
  // Estado do tambor fora do React: muda a cada quadro.
  const st = useRef({ offset: value * ITEM, shown: value, raf: 0, width: 0, height: 0 });
  /** O arrasto em curso (ver onPointerDown). */
  const drag = useRef<{ id: number; downY: number; lastY: number; moving: boolean; samples: { t: number; y: number }[] } | null>(null);
  const change = useRef(onChange);
  /** As funções da última renderização, para os ouvintes registrados uma vez só (redimensionar, roda do mouse). */
  const fns = useRef<{ draw: () => void; settle: (to: number) => void }>({ draw: () => {}, settle: () => {} });

  const draw = () => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    const { offset, width: w, height: h } = st.current;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const css = getComputedStyle(c);
    ctx.fillStyle = css.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const pos = offset / ITEM;
    const cy = h / 2;
    const base = Math.floor(pos);
    const reach = Math.floor(h / 2 / ITEM) + 2;
    for (let n = base - reach; n <= base + reach; n++) {
      if (n < min || n > max) continue;
      const d = n - pos;
      const ad = Math.abs(d);
      const y = cy + d * ITEM;
      const size = (88 - 34 * Math.min(ad, 1) - 6 * clamp(ad - 1, 0, 2)) * scale;
      const edge = clamp(Math.min(y, h - y) / (ITEM * 0.9), 0, 1);
      ctx.globalAlpha = clamp(edge * (1 - 0.62 * Math.min(ad, 1) - 0.2 * clamp(ad - 1, 0, 1.5)), 0, 1);
      ctx.font = `700 ${size}px ${css.fontFamily}`;
      ctx.fillText(pad ? String(n).padStart(2, "0") : String(n), w / 2, y + size * 0.04);
    }
    ctx.globalAlpha = 1;
  };

  /** Move o tambor; a cada número inteiro novo avisa e dá um toque de vibração, como o app. */
  const moveTo = (px: number, buzz: boolean) => {
    const s = st.current;
    s.offset = clamp(px, min * ITEM, max * ITEM);
    const v = Math.round(s.offset / ITEM);
    if (v !== s.shown) {
      s.shown = v;
      if (buzz) navigator.vibrate?.(4);
      change.current(v);
      canvas.current?.setAttribute("aria-valuenow", String(v));
    }
    draw();
  };

  const stop = () => { cancelAnimationFrame(st.current.raf); st.current.raf = 0; };

  const settle = (to: number) => {
    stop();
    const from = st.current.offset;
    const target = clamp(to, min, max) * ITEM;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / SETTLE_MS);
      moveTo(from + (target - from) * (1 - (1 - k) ** 3), true);
      st.current.raf = k < 1 ? requestAnimationFrame(step) : 0;
    };
    st.current.raf = requestAnimationFrame(step);
  };

  const fling = (velocity: number) => {
    stop();
    let v = velocity;
    let last = performance.now();
    const step = (now: number) => {
      const dt = now - last;
      last = now;
      const before = st.current.offset;
      moveTo(before + v * dt, true);
      v *= Math.exp(-dt / DECAY);
      const stuck = st.current.offset === before && dt > 0;
      if (Math.abs(v) < 0.05 || stuck) settle(Math.round(st.current.offset / ITEM));
      else st.current.raf = requestAnimationFrame(step);
    };
    st.current.raf = requestAnimationFrame(step);
  };

  // Declarado antes dos outros efeitos: na montagem eles já encontram as funções.
  useEffect(() => {
    change.current = onChange;
    fns.current = { draw, settle };
  });

  // O valor mudou por fora (tap, favorito, teclado): pula para ele sem animação e sem avisar de volta.
  useEffect(() => {
    // Enquanto gira ou é arrastado, o [value] pode chegar atrasado (o timer guarda num useState): não é mudança de fora.
    const s = st.current;
    if (s.raf || drag.current?.moving) return;
    if (value !== s.shown) {
      stop();
      s.offset = clamp(value, min, max) * ITEM;
      s.shown = clamp(value, min, max);
      draw();
    }
  });

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ro = new ResizeObserver(() => {
      const r = c.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      st.current.width = r.width;
      st.current.height = r.height;
      c.width = Math.round(r.width * dpr);
      c.height = Math.round(r.height * dpr);
      fns.current.draw();
    });
    ro.observe(c);
    // A fonte da página pode chegar depois do primeiro desenho.
    void document.fonts?.ready.then(() => fns.current.draw());
    return () => { ro.disconnect(); stop(); };
  }, []);

  // Arrastar: o dedo leva o tambor; ao soltar, arremessa com a velocidade dos últimos 100 ms ou assenta.
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    stop();
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { id: e.pointerId, downY: e.clientY, lastY: e.clientY, moving: false, samples: [{ t: e.timeStamp, y: e.clientY }] };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (!d.moving && Math.abs(e.clientY - d.downY) > SLOP) d.moving = true;
    if (d.moving) moveTo(st.current.offset - (e.clientY - d.lastY), true);
    d.lastY = e.clientY;
    d.samples.push({ t: e.timeStamp, y: e.clientY });
    while (d.samples.length > 2 && e.timeStamp - d.samples[0]!.t > 100) d.samples.shift();
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moving) {
      moveTo(st.current.offset - (e.clientY - d.lastY), true);
      const first = d.samples[0]!;
      const dt = e.timeStamp - first.t;
      const vy = dt > 0 ? (e.clientY - first.y) / dt : 0;
      if (Math.abs(vy) > MIN_FLING) fling(-vy);
      else settle(Math.round(st.current.offset / ITEM));
    } else {
      // Um toque: acima do número do meio volta um, abaixo avança um.
      const r = e.currentTarget.getBoundingClientRect();
      const off = e.clientY - (r.top + r.height / 2);
      if (Math.abs(off) > ITEM / 2) settle(st.current.shown + (off > 0 ? 1 : -1));
    }
  };
  const onPointerCancel = () => { drag.current = null; settle(Math.round(st.current.offset / ITEM)); };

  // Roda do mouse: um número por passo, na mesma direção do arrasto (rolar para baixo acelera).
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 1) return;
      fns.current.settle(st.current.shown + Math.sign(e.deltaY));
    };
    c.addEventListener("wheel", onWheel, { passive: false });
    return () => c.removeEventListener("wheel", onWheel);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const s = st.current.shown;
    const to =
      e.key === "ArrowUp" || e.key === "ArrowRight" ? s + (e.shiftKey ? 10 : 1)
      : e.key === "ArrowDown" || e.key === "ArrowLeft" ? s - (e.shiftKey ? 10 : 1)
      : e.key === "PageUp" ? s + 10
      : e.key === "PageDown" ? s - 10
      : e.key === "Home" ? min
      : e.key === "End" ? max
      : null;
    if (to === null) return;
    e.preventDefault();
    e.stopPropagation(); // o atalho de setas da página não soma de novo
    settle(to);
  };

  return (
    <canvas
      ref={canvas}
      className={className}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${value} ${unit}`}
      aria-orientation="vertical"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={onKeyDown}
    />
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}
