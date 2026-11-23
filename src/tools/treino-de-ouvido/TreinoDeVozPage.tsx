import { getTranslations } from "next-intl/server";
import { TreinoDeVoz } from "./TreinoDeVoz";

export async function TreinoDeVozPage() {
  const t = await getTranslations("treino-de-ouvido");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <h1 className="mb-6 text-[clamp(1.45rem,2.6vw,1.9rem)] font-[650] leading-[1.15] tracking-[-0.025em]">{t("tituloVoz")}</h1>
        <TreinoDeVoz />
      </section>
    </main>
  );
}
