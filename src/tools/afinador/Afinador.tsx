import { getTranslations } from "next-intl/server";
import { ToolHeader } from "@/components/ToolHeader";
import { MicButton } from "./MicButton";
import { WebTuner } from "./WebTuner";
import "./afinador.css";

// Dois afinadores com a mesma lógica (marmota-tuner/core, em Kotlin): o do navegador, logo aqui, e o app
// Android Marmota Tuner, que "Baixar app" baixa direto. Ver marmota-tuner/README.md.
export async function Afinador() {
  const t = await getTranslations("afinador");
  return (
    <main className="wrap" id="conteudo">
      <section className="section mx-auto max-w-[640px]">
        <ToolHeader title={t("title")} actions={<MicButton />} />
        <WebTuner />
      </section>
    </main>
  );
}
