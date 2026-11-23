// Cantar músicas: as notas de um trecho correm numa pista de altura e cada uma vale se a altura certa foi cantada durante parte da
// janela dela. A lógica mora em Kotlin (marmota-tuner/core, a mesma do app Android) e chega aqui por src/core/treino; este arquivo
// só mantém os nomes que as telas já usam.
export {
  CURTA_S, GRACA_MAX, GRACA_S, LATENCIA_S, LIMIAR, acertoDaNota, dobrar, duracaoDe, ehCurta, janelas, resumir, tonicaParaCaber,
  type Acerto, type Amostra, type Janela, type Musica, type NotaMusica, type Resumo, type Trecho,
} from "@/core/treino";
