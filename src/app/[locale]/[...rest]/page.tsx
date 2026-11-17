import { notFound } from "next/navigation";

// Qualquer endereço desconhecido cai no not-found do idioma.
export default function CatchAll() {
  notFound();
}
