import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";
import { defineConfig } from "vite";

type PackageJson = { dependencies?: Record<string, string> };

const pkgJsonPath = new URL("./package.json", import.meta.url);
const pkg: PackageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));

const external = [
  ...builtinModules,
  ...builtinModules.map((mod) => `node:${mod}`),
  ...Object.keys(pkg.dependencies ?? {}),
];

const sharedBuild = {
  target: "node18",
  sourcemap: false,
  minify: false,
  rollupOptions: { external },
} as const;

export default defineConfig(({ mode }) => {
  if (mode === "cli") {
    return {
      build: {
        ...sharedBuild,
        outDir: "lib",
        emptyOutDir: false,
        rollupOptions: {
          external,
          input: path.resolve(__dirname, "src/cli.ts"),
          output: {
            format: "cjs",
            entryFileNames: "cli.js",
            chunkFileNames: "[name].js",
            banner: "#!/usr/bin/env node",
          },
        },
      },
    };
  }

  return {
    build: {
      ...sharedBuild,
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"),
        formats: ["cjs"],
        fileName: () => "index.js",
      },
      outDir: "lib",
      emptyOutDir: true,
    },
  };
});
