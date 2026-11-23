// Treino de ouvido: o sorteio das perguntas e a correção. A lógica mora em Kotlin (marmota-tuner/core, a mesma do app Android) e
// chega aqui por src/core/treino; este arquivo só mantém os nomes que as telas já usam.
export {
  ACORDES, CADENCIAS, CAMPO, CLASSICA_INICIAL, DIRECOES, EXERCICIOS, FUNCIONAL_INICIAL, GRAUS, HARMONIA, IDS, INTERVALOS, MARGENS, PADROES,
  PLACAR_ZERO, PROGRESSOES, RESPOSTAS_AFINACAO, cadencia, compararAfinacao, mulberry32, nomeAcorde, nomeNota, nomeTom, perguntaAchar,
  perguntaAfinacao, perguntaClassica, perguntaFuncional, perguntaHarmonia, peso, registrar, somar,
  type ConfigClassica, type ConfigFuncional, type Direcao, type Exercicio, type Historico, type PerguntaClassica, type PerguntaFuncional,
  type Placar, type Rng,
} from "@/core/treino";
