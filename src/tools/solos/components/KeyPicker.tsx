"use client";
import { useTranslations } from "next-intl";
import { keyName, PRACTICE_KEYS } from "../curriculum/transpose";
import { keyStore, usePracticeKey } from "../progress";

/** Escolha do tom de prática. Vale para o site todo e fica guardada no navegador. */
export function KeyPicker() {
  const t = useTranslations("solos.key");
  const key = usePracticeKey();
  return (
    <label className="key-picker">
      <span>{t("label")}</span>
      <select value={key} onChange={(e) => keyStore.set({ version: 1, key: Number(e.target.value) })}>
        {PRACTICE_KEYS.map((k) => <option key={k} value={k}>{keyName(k)}</option>)}
      </select>
    </label>
  );
}
