import type { KeyboardEvent } from "react";

/**
 * Teclado de um grupo de botões `role="radio"`: setas movem a escolha e o foco (padrão ARIA).
 * Use no contêiner `role="radiogroup"`, junto com `tabIndex={checked ? 0 : -1}` em cada botão.
 */
export function onRadioKeyDown(e: KeyboardEvent<HTMLElement>) {
  const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
  if (!d) return;
  const radios = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]:not(:disabled)')];
  const at = radios.indexOf(document.activeElement as HTMLElement);
  if (at < 0) return;
  e.preventDefault();
  const to = radios[(at + d + radios.length) % radios.length]!;
  to.click();
  to.focus();
}
