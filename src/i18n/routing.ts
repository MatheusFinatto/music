import { defineRouting } from "next-intl/routing";

// Para acrescentar um idioma: inclua aqui e crie messages/<locale>.json.
// O idioma padrão não leva prefixo na URL; os outros levam (ex.: /en).
export const routing = defineRouting({
  locales: ["pt-BR"],
  defaultLocale: "pt-BR",
  localePrefix: "as-needed",
  localeDetection: false,
});
