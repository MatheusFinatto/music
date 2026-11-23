/** Régua do desvio da segunda nota: o centro é afinado, a esquerda é baixo e a direita é alto; o ponto marca onde ela estava. */
export function Regua({ cents, margem, label, baixo, alto }: { cents: number; margem: number; label: string; baixo: string; alto: string }) {
  const limite = Math.max(margem, 50) * 1.2;
  const pos = (c: number) => `${50 + (c / limite) * 50}%`;
  return (
    <div className="regua" role="img" aria-label={`${label}: ${cents > 0 ? "+" : ""}${cents}`}>
      <div className="regua-trilho">
        <span className="regua-marca" style={{ left: pos(-margem) }} />
        <span className="regua-marca zero" style={{ left: "50%" }} />
        <span className="regua-marca" style={{ left: pos(margem) }} />
        <span className={`regua-ponto${cents === 0 ? " zero" : ""}`} style={{ left: pos(cents) }} />
      </div>
      <div className="regua-nomes" aria-hidden="true"><span>{baixo}</span><span>{alto}</span></div>
    </div>
  );
}
