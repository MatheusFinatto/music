import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  // src/core/pitch/generated/ é JS compilado do Kotlin (marmota-tuner/core): não se edita à mão.
  // marmota-tuner/ é o app Android (Kotlin); a pasta de build dele tem JS que não é nosso.
  globalIgnores([".next/**", "public/laboratorio/**", "legacy/**", "next-env.d.ts", ".impeccable/**", "src/core/pitch/generated/**", "marmota-tuner/**"]),
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
