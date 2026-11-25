import { getTranslations } from "next-intl/server";
import { ToolHeader } from "@/components/ToolHeader";
import { TreinoDeOuvido } from "./TreinoDeOuvido";

export async function TreinoDeOuvidoPage() {
  const t = await getTranslations("treino-de-ouvido");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <ToolHeader title={t("title")} app="ear" />
        <TreinoDeOuvido />
      </section>
    </main>
  );
}
