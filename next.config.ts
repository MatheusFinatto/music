import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// O Laboratório é o site antigo (legacy/), gerado como estático em public/laboratorio/.
const LAB_PAGES = ["diario", "piano"];

const config: NextConfig = {
  turbopack: { root: import.meta.dirname },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/laboratorio", destination: "/laboratorio/index.html" },
        ...LAB_PAGES.map((p) => ({ source: `/laboratorio/${p}`, destination: `/laboratorio/${p}.html` })),
      ],
    };
  },
  async headers() {
    // As amostras do piano não mudam: cache longo evita baixar 14 arquivos de novo a cada visita.
    return [{ source: "/sons/piano/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  async redirects() {
    // Endereços de antes da reestruturação.
    return LAB_PAGES.map((p) => ({ source: `/${p}`, destination: `/laboratorio/${p}`, permanent: true }));
  },
};

export default withNextIntl(config);
