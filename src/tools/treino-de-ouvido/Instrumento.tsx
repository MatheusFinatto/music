"use client";
import { Braco } from "./Braco";
import type { Pos } from "./violao";
import { Teclado, type Marca } from "./Teclado";
import type { Instrumento as Tipo } from "./instrumento";

/** O teclado ou o braço, conforme a escolha, com a mesma interface: marcas por nota e toque por nota. */
/** `extras` só vale para o violão: posições já escolhidas (forma do acorde ou do arpejo). */
export function Instrumento({ tipo, janela, marcas, onTocar, label, extras }: { tipo: Tipo; janela: readonly number[]; marcas: ReadonlyMap<number, Marca>; onTocar: (midi: number) => void; label: string; extras?: readonly (Pos & { marca: Marca })[] }) {
  return tipo === "violao" ? <Braco marcas={marcas} onTocar={onTocar} label={label} extras={extras} /> : <Teclado janela={janela} marcas={marcas} onTocar={onTocar} label={label} />;
}
