import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname),
  base: "./",
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@react": path.resolve(__dirname, "src/react"),
    },
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
});
