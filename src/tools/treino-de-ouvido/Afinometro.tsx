import { NOTE_NAMES } from "@/core/pitch";

/**
 * O afinômetro da voz: a nota que está saindo, e uma régua em cents ao redor do alvo (ou da nota mais próxima, quando
 * não há alvo). A faixa verde é a margem de acerto; a barra de baixo enche enquanto a nota é segurada.
 */
export function Afinometro({ midi, centsAlvo, tolerancia, progresso, rotulos, dica }: {
  midi: number | null; centsAlvo: number | null; tolerancia: number; progresso: number;
  rotulos: { sem: string; baixo: string; alto: string }; dica: string;
}) {
  const nota = midi === null ? null : (() => { const m = Math.round(midi); return `${NOTE_NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`; })();
  // Sem alvo, a régua mostra o desvio para a nota mais próxima.
  const cents = centsAlvo ?? (midi === null ? null : (midi - Math.round(midi)) * 100);
  const limite = Math.max(tolerancia, 50) * 1.2;
  const pos = (c: number) => `${50 + (Math.max(-limite, Math.min(limite, c)) / limite) * 50}%`;
  const dentro = cents !== null && Math.abs(cents) <= tolerancia;
  return (
    <div className="afinometro" role="group" aria-label={rotulos.sem}>
      <p className={`afinometro-nota${nota ? "" : " vazio"}`} aria-live="off">{nota ?? "—"}</p>
      <div className="afinometro-regua" aria-hidden="true">
        <span className="afinometro-faixa" style={{ left: pos(-tolerancia), width: `${(tolerancia * 2 / (limite * 2)) * 100}%` }} />
        <span className="afinometro-centro" />
        {cents !== null && <span className={`afinometro-ponto${dentro ? " dentro" : ""}`} style={{ left: pos(cents) }} />}
      </div>
      <div className="afinometro-nomes" aria-hidden="true"><span>{rotulos.baixo}</span><span>{rotulos.alto}</span></div>
      <div className="afinometro-seguro" aria-hidden="true"><i style={{ width: `${Math.round(progresso * 100)}%` }} /></div>
      <p className="afinometro-dica" role="status">{dica}</p>
    </div>
  );
}
