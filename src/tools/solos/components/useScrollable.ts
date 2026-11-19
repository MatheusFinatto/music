"use client";
import { useEffect, useState, type RefObject } from "react";

/**
 * Diz se o elemento rola na horizontal. Quem usa só o teclado só alcança uma área que rola se ela puder receber
 * foco; por isso o chamador põe `tabIndex` e um nome nela apenas quando isto for verdadeiro.
 */
export function useScrollable(ref: RefObject<HTMLElement | null>): boolean {
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setScrollable(el.scrollWidth > el.clientWidth + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return scrollable;
}
