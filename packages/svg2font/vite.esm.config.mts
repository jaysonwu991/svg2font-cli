import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.esm.mts",
      formats: ["es"],
      fileName: () => "index.esm.mjs",
    },
    outDir: "dist",
    target: "node18",
    ssr: true,
    minify: false,
    emptyOutDir: false,
  },
});
