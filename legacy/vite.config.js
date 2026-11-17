import { defineConfig } from "vite";
import { resolve } from "node:path";

// Laboratório: o site antigo, congelado. Sai como estático em public/laboratorio/ e é servido pelo Next.
export default defineConfig({
  root: __dirname,
  base: "/laboratorio/",
  build: {
    outDir: resolve(__dirname, "../public/laboratorio"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        diario: resolve(__dirname, "diario.html"),
        piano: resolve(__dirname, "piano.html"),
      },
    },
  },
});
