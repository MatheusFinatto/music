"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

/**
 * A tablatura de texto de um exercício mora num lugar só: no fim do exercício, logo antes do "Próximo".
 * Quem tem uma tab (o exemplo, o eco, a tomada) a entrega a `TabSlot`; o botão "Ver a tablatura" vem na linha
 * dos outros botões (`TabButton`) e, ao abrir, a tela rola até ela. A tab traz "Fechar" no começo e no fim.
 */
type Dock = { el: HTMLElement | null; open: boolean; has: boolean; toggle: () => void; close: () => void; register: () => () => void };
const Ctx = createContext<Dock | null>(null);
const useDock = () => useContext(Ctx);

export function TabDockProvider({ defaultOpen, children }: { defaultOpen: boolean; children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(defaultOpen);
  const [count, setCount] = useState(0);
  const jump = useRef(false);
  const toggle = useCallback(() => setOpen((o) => { if (!o) jump.current = true; return !o; }), []);
  const close = useCallback(() => setOpen(false), []);
  const register = useCallback(() => { setCount((c) => c + 1); return () => setCount((c) => c - 1); }, []);
  // Ao abrir pelo botão, a tela vai até a tablatura (sem animação para quem pediu menos movimento).
  useEffect(() => {
    if (!open || !jump.current || !el) return;
    jump.current = false;
    const calm = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: calm ? "auto" : "smooth" });
  }, [open, el]);
  return (
    <Ctx.Provider value={{ el, open, has: count > 0, toggle, close, register }}>
      {children}
      <div ref={setEl} className="tab-dock" />
    </Ctx.Provider>
  );
}

/** "Ver a tablatura" / "Esconder a tablatura", na linha dos botões do exercício; some se o exercício não tem tab. */
export function TabButton() {
  const t = useTranslations("solos.tabDock");
  const d = useDock();
  if (!d || !d.has) return null;
  return <button type="button" className="btn" aria-expanded={d.open} onClick={d.toggle}>{d.open ? t("hide") : t("show")}</button>;
}

/** A tablatura (`children`) vai para o fim do exercício quando aberta; registrar o espaço faz o botão aparecer. */
export function TabSlot({ label, children }: { label: string; children: ReactNode }) {
  const t = useTranslations("solos.tabDock");
  const d = useDock();
  const register = d?.register;
  useEffect(() => register?.(), [register]);
  if (!d?.el || !d.open) return null;
  const close = <button type="button" className="btn" onClick={d.close}>{t("close")}</button>;
  return createPortal(<section className="tab-panel" aria-label={label}>{close}{children}{close}</section>, d.el);
}
