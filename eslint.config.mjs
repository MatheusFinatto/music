import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "public/laboratorio/**", "legacy/**", "next-env.d.ts", ".impeccable/**"]),
  {
    // Regra de isolamento: uma ferramenta nunca importa de outra. O que for comum sobe para src/core/.
    // Dentro da própria ferramenta, use imports relativos.
    files: ["src/tools/*/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@/tools/*", "@/app/*"], message: "Ferramentas são isoladas: importe só de src/core/, src/components/ ou da própria pasta (import relativo)." }],
      }],
    },
  },
  {
    // O núcleo não conhece ferramentas nem páginas.
    files: ["src/core/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [{ group: ["@/tools/*", "@/app/*", "@/components/*"], message: "src/core/ não depende de ferramentas, páginas nem componentes de interface." }],
      }],
    },
  },
]);
