import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, "src/react"),
  base: "./",
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: false,
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