import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["cjs"],
      fileName: () => "index.js",
    },
    outDir: "dist",
    target: "node18",
    ssr: true,
    rollupOptions: {
      output: {
        exports: "auto",
      },
    },
    minify: false,
    emptyOutDir: true,
  },
});
