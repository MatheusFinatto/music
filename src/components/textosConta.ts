import { getTranslations } from "next-intl/server";
import type { TextosConta } from "./Conta";

/** Os textos da conta, traduzidos no servidor (o botão aparece em páginas do servidor: rodapé e barra do app). */
export async function textosConta(): Promise<TextosConta> {
  const t = await getTranslations("conta");
  const k = ["entrarLabel", "contaLabel", "titulo", "texto", "guardado", "entrar", "carregando", "dentro", "dentroTexto", "sair", "apagar",
    "apagarConfirma", "apagarSim", "cancelar", "erroEntrar", "erroApagar", "fechar"] as const;
  return Object.fromEntries(k.map((x) => [x, t(x)])) as TextosConta;
}
