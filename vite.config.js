import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export const CHINESE_INPUT_STATIC_COPY_TARGETS = [
  {
    src: "learning-data/chinese-input/generated-curriculum",
    dest: ".",
  },
  {
    src: "learning-data/chinese-input/canonical",
    dest: ".",
  },
];

export default defineConfig(({ command }) => ({
  root: path.resolve(__dirname),
  // Use absolute base "/" in dev (localhost works fine with absolute paths).
  // Use relative "./" in production build so Render.com static hosting resolves
  // asset URLs correctly when the app is served from its root path.
  base: command === "build" ? "./" : "/",
  plugins: [
    react(),
    // viteStaticCopy only runs during `vite build` (not `vite dev`).
    //
    // In dev mode, Vite serves all files from the project root directly, so
    // data/ and brand/ are already accessible at their natural paths.
    // Running viteStaticCopy in dev intercepts requests for brand/ files and
    // returns raw image bytes before Vite's asset-transform can wrap them in an
    // ES module — causing "Failed to load module script: image/jpeg" errors.
    //
    // In production build: data/ and brand/ must be explicitly copied into
    // dist/ because Vite only bundles files that are imported in the source.
    ...(command === "build"
      ? [viteStaticCopy({
          targets: [
            { src: "data",  dest: "." },
            { src: "brand", dest: "." },
            ...CHINESE_INPUT_STATIC_COPY_TARGETS,
          ],
        })]
      : []),
  ],
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    allowedHosts: [".onrender.com"],
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
}));
