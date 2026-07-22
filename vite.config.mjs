import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  devtools: false,
  build: {
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        manage: resolve(import.meta.dirname, "manage.html"),
      },
    },
  },
});
