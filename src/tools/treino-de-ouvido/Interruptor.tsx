/** Liga/desliga de uma opção: o nome e a chave ao lado, com role="switch". Antes era um chip escrito "Ligado"/"Desligado", igual a uma escolha. */
export function Interruptor({ rotulo, ligado, aoMudar }: { rotulo: string; ligado: boolean; aoMudar: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} className="treino-switch" onClick={() => aoMudar(!ligado)}>
      <span>{rotulo}</span>
      <i aria-hidden="true" />
    </button>
  );
}
