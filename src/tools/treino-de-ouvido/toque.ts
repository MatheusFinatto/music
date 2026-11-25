// Tocar uma nota no teclado ou no braço sem disparar ao rolar a tela.
// Mouse: toca no pointerdown, na hora (quem toca piano não espera soltar). Toque: toca ao soltar, se o dedo andou menos de 8px;
// quando o navegador assume a rolagem ele manda pointercancel e a nota não sai.

const FOLGA_PX = 8;
let inicio: { id: number; x: number; y: number } | null = null;

export function aoTocar(acao: () => void) {
  return {
    onPointerDown: (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      if (e.pointerType === "mouse") { acao(); return; }
      inicio = { id: e.pointerId, x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const i = inicio;
      inicio = null;
      if (!i || e.pointerType === "mouse" || i.id !== e.pointerId) return;
      if (Math.hypot(e.clientX - i.x, e.clientY - i.y) < FOLGA_PX) acao();
    },
    onPointerCancel: () => { inicio = null; },
  };
}
