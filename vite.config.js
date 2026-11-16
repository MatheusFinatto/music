import { defineConfig } from "vite";
import { resolve } from "node:path";

// Site multi-página: cada página é um .html na raiz.
export default defineConfig({
  build: {
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
