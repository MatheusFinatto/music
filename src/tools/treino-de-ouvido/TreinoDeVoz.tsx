"use client";
import { Programa } from "./Programas";
import { Voz } from "./Voz";
import "./treino.css";

/** Treino de voz: os programas por tempo e, abaixo, os exercícios isolados (com o microfone). */
export function TreinoDeVoz() {
  return (
    <div className="treino-secoes">
      <Programa
        secao="voz"
        livre={<Voz />}
        bloco={(p, chave) => <Voz key={chave} programa={p} />}
      />
    </div>
  );
}
