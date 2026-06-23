import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { glob } from "glob";
import type { GenerateOptions, GenerateResult } from "../index.d.ts";

type WasmModule = {
  generateFromSvgs: (
    iconsJson: string,
    optsJson: string,
  ) => {
    glyphs: Array<{
      name: string;
      codepoint: number;
      unicode: string;
      className: string;
    }>;
    files: Record<string, Uint8Array>;
  };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wasm = require(path.join(__dirname, "../wasm/svg2font_wasm.js")) as WasmModule;

export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  const svgFiles = await glob(opts.src, { absolute: true });

  if (svgFiles.length === 0) {
    throw new Error(`@jayson991/svg2font: no SVG files found matching pattern "${opts.src}"`);
  }

  const icons = await Promise.all(
    svgFiles.map(async (filePath: string) => ({
      name: path.basename(filePath, ".svg"),
      content: await readFile(filePath, "utf-8"),
    })),
  );

  const result = wasm.generateFromSvgs(
    JSON.stringify(icons),
    JSON.stringify({
      fontName: opts.fontName,
      prefix: opts.prefix ?? "icon",
      startCodepoint: opts.startCodepoint ?? 0xe001,
    }),
  );

  const fontDir = path.join(opts.dist, opts.fontName);
  await mkdir(fontDir, { recursive: true });

  const zipName = `${opts.fontName}.zip`;
  const zipPath = path.join(opts.dist, zipName);

  for (const [name, bytes] of Object.entries(result.files)) {
    if (name === zipName) {
      await writeFile(zipPath, bytes);
    } else {
      await writeFile(path.join(fontDir, name), bytes);
    }
  }

  return {
    glyphs: result.glyphs,
    zipPath,
  };
}
