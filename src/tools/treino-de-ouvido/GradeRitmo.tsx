import { RITMOS } from "@/core/treino";

/**
 * Um compasso de 4/4 em grade de pixel: 8 colcheias, agrupadas de duas em duas (os tempos). Onde a nota começa, um bloco
 * cheio; enquanto ela dura, um traço. Lê-se sem saber partitura. Decorativa: o nome do ritmo vai no texto ao lado.
 */
export function GradeRitmo({ id, grande = false }: { id: string; grande?: boolean }) {
  const inicios = RITMOS.find((r) => r.id === id)?.inicios ?? [];
  const celulas = Array.from({ length: 8 }, (_, k) => (inicios.includes(k) ? "nota" : inicios.some((i) => i < k) ? "dura" : ""));
  return (
    <span className={`ritmo-grade${grande ? " grande" : ""}`} aria-hidden="true">
      {celulas.map((c, k) => <i key={k} className={c || undefined} />)}
    </span>
  );
}
