import path from "path";
import { promises as fs } from "fs";
import fg from "fast-glob";
import { SvgIcon } from "../types";

let svgoOptimize: (typeof import("svgo"))["optimize"] | null = null;

const loadSvgo = async (): Promise<(typeof import("svgo"))["optimize"]> => {
  if (!svgoOptimize) {
    const { optimize } = await import("svgo");
    svgoOptimize = optimize;
  }

  return svgoOptimize;
};

const readSvg = async (filePath: string, useSvgo: boolean): Promise<string> => {
  const raw = await fs.readFile(filePath, "utf8");
  if (!useSvgo) {
    return raw;
  }

  const optimize = await loadSvgo();
  const optimized = optimize(raw, { path: filePath });
  return optimized.data;
};

export const sanitizeName = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-{2,}/g, "-");

export const toAbsolutePattern = async (input: string): Promise<string> => {
  const absoluteInput = path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);

  try {
    const stats = await fs.stat(absoluteInput);
    if (stats.isDirectory()) {
      return path.join(absoluteInput, "**/*.svg");
    }
  } catch {
    // Fall back to using the provided value as a glob.
  }

  return path.isAbsolute(input) ? input : path.resolve(process.cwd(), input);
};

export const loadIcons = async (pattern: string, useSvgo: boolean): Promise<SvgIcon[]> => {
  const files = await fg(pattern, {
    absolute: true,
    onlyFiles: true,
    caseSensitiveMatch: false,
  });

  const svgFiles = files.filter((file) => path.extname(file).toLowerCase() === ".svg").sort();

  if (!svgFiles.length) {
    throw new Error(`No SVG files found for pattern: ${pattern}`);
  }

  const icons: SvgIcon[] = [];

  for (const file of svgFiles) {
    const svg = await readSvg(file, useSvgo);
    icons.push({
      name: sanitizeName(path.basename(file, path.extname(file))),
      svg,
      sourcePath: file,
    });
  }

  return icons;
};
