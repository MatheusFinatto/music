// A marmota do topo do hub. Pixel art de 52×42 (public/marmota-52x42.png), sempre em múltiplo inteiro.
// Dois quadros por cima da base: farejando (nariz, canto da boca e bigodes um pixel acima) e o olho fechado (pisca).
// A música fica na pauta logo abaixo (globals.css, "palco do hub"). Tudo para com redução de movimento.
export function Marmota() {
  return (
    <div className="marmota" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element -- pixel art em escala inteira; o otimizador do next/image borraria */}
      <img className="marmota-base" src="/marmota-52x42.png" width={52} height={42} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element -- idem */}
      <img className="marmota-fareja" src="/marmota-52x42-fareja.png" width={52} height={42} alt="" />
      {/* eslint-disable-next-line @next/next/no-img-element -- idem */}
      <img className="marmota-pisca" src="/marmota-52x42-piscando.png" width={52} height={42} alt="" />
    </div>
  );
}
