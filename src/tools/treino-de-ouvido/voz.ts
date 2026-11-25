// Treino de voz: a conta que decide se a pessoa cantou a nota. A lógica mora em Kotlin (marmota-tuner/core, a mesma do app
// Android) e chega aqui por src/core/treino; este arquivo só mantém os nomes que as telas já usam.
export {
  ALCANCE_ZERO, FAIXA_PADRAO, PARADO_MS, SEGURANDO_ZERO, SEGURAR_LONGA_MS, SEGURAR_MS, SEGURAR_PASSO_MS, TOLERANCIAS, VOZES, atualizar,
  centsDe, extensao, faixaConfortavel, inicioDaRodada, medirAlcance, notasDoPadrao, sortearAlvoDeVoz, sortearClasseDeVoz, vozMaisProxima,
  type Alcance, type Faixa, type Passo, type Segurando, type VozId,
} from "@/core/treino";
