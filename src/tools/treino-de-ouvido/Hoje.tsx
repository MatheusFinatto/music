"use client";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { hojeLocal, resumoDiario } from "@/core/treino";
import { diario } from "./diario";
import type { Secao } from "./programas";

/**
 * O cartão "Hoje", no topo do programa: os minutos e os acertos de hoje, os últimos 7 dias em barras de pixel e os dias
 * seguidos. Só números; sem prática nenhuma ainda, não aparece.
 */
export function Hoje({ secao }: { secao: Secao }) {
  const t = useTranslations("treino-de-ouvido.hoje");
  const d = useSyncExternalStore(diario.subscribe, diario.get, diario.getInitial);
  if (!d.dias.some((x) => x.secao === secao)) return null;
  const r = resumoDiario(d.dias, hojeLocal(), secao);
  const maior = Math.max(1, ...r.semana);
  return (
    <div className="treino-hoje">
      <div className="treino-hoje-texto">
        <p className="treino-hoje-titulo">{t("titulo")}</p>
        <p className="treino-hoje-num">
          {r.respostasHoje === 0 ? t("vazio") : t("resumo", { minutos: r.minutosHoje, acertos: r.acertosHoje, respostas: r.respostasHoje })}
        </p>
        {r.sequencia > 1 && <p className="treino-hoje-seq">{t("sequencia", { n: r.sequencia })}</p>}
      </div>
      {/* 7 colunas, hoje à direita; a altura anda em degraus de 4px (pixel). */}
      <ol className="treino-hoje-semana" aria-label={t("semana", { lista: r.semana.join(", ") })}>
        {r.semana.map((m, k) => (
          <li key={k} className={[k === 6 ? "hoje" : "", m === 0 ? "zero" : ""].join(" ").trim() || undefined} style={{ "--h": m === 0 ? 0 : Math.max(1, Math.round((m / maior) * 8)) } as React.CSSProperties} />
        ))}
      </ol>
    </div>
  );
}
