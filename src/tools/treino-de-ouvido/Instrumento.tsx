"use client";
import { Braco } from "./Braco";
import { Teclado, type Marca } from "./Teclado";
import type { Instrumento as Tipo } from "./instrumento";

/** O teclado ou o braço, conforme a escolha, com a mesma interface: marcas por nota e toque por nota. */
export function Instrumento({ tipo, janela, marcas, onTocar, label }: { tipo: Tipo; janela: readonly number[]; marcas: ReadonlyMap<number, Marca>; onTocar: (midi: number) => void; label: string }) {
  return tipo === "violao" ? <Braco marcas={marcas} onTocar={onTocar} label={label} /> : <Teclado janela={janela} marcas={marcas} onTocar={onTocar} label={label} />;
}
