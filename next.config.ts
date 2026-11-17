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
  async redirects() {
    // Endereços de antes da reestruturação.
    return LAB_PAGES.map((p) => ({ source: `/${p}`, destination: `/laboratorio/${p}`, permanent: true }));
  },
};

export default withNextIntl(config);
