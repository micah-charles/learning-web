import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig(({ command }) => ({
  root: path.resolve(__dirname),
  // Use absolute base "/" in dev (localhost works fine with absolute paths).
  // Use relative "./" in production build so Render.com static hosting resolves
  // asset URLs correctly when the app is served from its root path.
  base: command === "build" ? "./" : "/",
  plugins: [
    react(),
    // Copy the data/ directory into dist/ so runtime fetch() calls to
    // ./data/generated/manifest.json and ./data/Packs/... resolve correctly.
    viteStaticCopy({
      targets: [
        // data/ is fetched at runtime (manifest.json, pack JSON files)
        { src: "data", dest: "." },
        // brand/ contains fox-tutor and other mascot images referenced as
        // HTML strings inside dangerouslySetInnerHTML — they are not imported
        // by Vite so must be copied verbatim into dist/
        { src: "brand", dest: "." },
      ],
    }),
  ],
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
}));
