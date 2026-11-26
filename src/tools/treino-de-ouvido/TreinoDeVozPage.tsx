import { getTranslations } from "next-intl/server";
import { AppNav } from "@/components/AppNav";
import { ToolHeader } from "@/components/ToolHeader";
import { TreinoDeVoz } from "./TreinoDeVoz";

export async function TreinoDeVozPage() {
  const t = await getTranslations("treino-de-ouvido");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <ToolHeader title={t("tituloVoz")} app="ear" />
        <TreinoDeVoz />
      </section>
      <AppNav current="treino-de-voz" />
    </main>
  );
}
