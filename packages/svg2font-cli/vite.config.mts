import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: "src/svg2font.ts",
      formats: ["cjs"],
      fileName: () => "svg2font.js",
    },
    outDir: "bin",
    target: "node18",
    ssr: true,
    rollupOptions: {
      external: ["node:child_process", "child_process"],
      output: {
        banner: "#!/usr/bin/env node",
      },
    },
    minify: false,
    emptyOutDir: true,
  },
});
