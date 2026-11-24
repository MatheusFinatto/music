// O estado do microfone do afinador, lido por dois lugares: a tela (WebTuner) e o botão do microfone no topo
// da página (MicButton), que ficam em partes diferentes da página. A tela manda; o botão mostra e pede.

/** gesture = o navegador espera um clique ou toque na página para o áudio rodar. idle = desligado pela pessoa. */
export type MicStatus = "starting" | "gesture" | "listening" | "idle" | "denied" | "unavailable" | "failed";

let status: MicStatus = "starting";
const subs = new Set<() => void>();
let onToggle: () => void = () => {};

export const micState = {
  get: (): MicStatus => status,
  getServer: (): MicStatus => "starting",
  set(next: MicStatus) {
    status = next;
    subs.forEach((f) => f());
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => { subs.delete(fn); };
  },
  /** O botão chama; a tela decide (liga, desliga ou tenta de novo). */
  toggle: () => onToggle(),
  onToggle(fn: () => void) {
    onToggle = fn;
    return () => { onToggle = () => {}; };
  },
};
