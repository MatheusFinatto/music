/**
 * Régua do desvio da segunda nota: o centro é afinado, a esquerda é baixo e a direita é alto. O trecho colorido vai do
 * centro até o ponto (quanto maior, mais desafinada) e o número diz quantos cents.
 */
export function Regua({ cents, margem, label, baixo, alto }: { cents: number; margem: number; label: string; baixo: string; alto: string }) {
  const limite = Math.max(margem, 50) * 1.2;
  const pos = (c: number) => 50 + (c / limite) * 50;
  const ponto = pos(cents);
  const rotulo = cents === 0 ? "0" : `${cents > 0 ? "+" : "−"}${Math.abs(cents)}`;
  return (
    <div className="regua" role="img" aria-label={`${label}: ${cents > 0 ? "+" : ""}${cents}`}>
      <div className="regua-trilho">
        <span className="regua-marca" style={{ left: `${pos(-margem)}%` }} />
        <span className="regua-marca zero" style={{ left: "50%" }} />
        <span className="regua-marca" style={{ left: `${pos(margem)}%` }} />
        {cents !== 0 && <span className="regua-desvio" style={{ left: `${Math.min(50, ponto)}%`, width: `${Math.abs(ponto - 50)}%` }} />}
        <span className={`regua-ponto${cents === 0 ? " zero" : ""}`} style={{ left: `${ponto}%` }} />
        <span className={`regua-valor${cents === 0 ? " zero" : ""}`} style={{ left: `${ponto}%` }}>{rotulo}</span>
      </div>
      <div className="regua-nomes" aria-hidden="true"><span>{baixo}</span><span>{alto}</span></div>
    </div>
  );
}
