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

/**
 * Sanitizes a filename to create a valid icon name.
 * Converts to lowercase, replaces whitespace and special characters with hyphens.
 *
 * @param value - The filename or string to sanitize
 * @returns A sanitized icon name suitable for CSS classes and font glyphs
 *
 * @example
 * ```typescript
 * sanitizeName('My Icon (2).svg')  // Returns: 'my-icon-2'
 * sanitizeName('user profile')     // Returns: 'user-profile'
 * ```
 */
export const sanitizeName = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-{2,}/g, "-")
    .toLowerCase();

/**
 * Converts a file path or pattern to an absolute path.
 * If the input is a directory, appends '\*\*\/*.svg' pattern.
 *
 * @param input - File path, directory path, or glob pattern
 * @returns Absolute path or glob pattern
 *
 * @example
 * ```typescript
 * await toAbsolutePattern('./icons')           // Returns: '/absolute/path/to/icons/\*\*\/*.svg'
 * await toAbsolutePattern('./icons/\*.svg')    // Returns: '/absolute/path/to/icons/\*.svg'
 * ```
 */
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

/**
 * Loads SVG icon files from a glob pattern.
 *
 * @param pattern - Glob pattern to match SVG files
 * @param useSvgo - Whether to optimize SVGs with SVGO
 * @returns Array of loaded SVG icons with metadata
 *
 * @throws {Error} If no SVG files are found matching the pattern
 *
 * @example
 * ```typescript
 * const icons = await loadIcons('./icons/\*\*.svg', true);
 * console.log(`Loaded ${icons.length} icons`);
 * ```
 */
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

  const icons = await Promise.all(
    svgFiles.map(async (file) => {
      const svg = await readSvg(file, useSvgo);
      return {
        name: sanitizeName(path.basename(file, path.extname(file))),
        svg,
        sourcePath: file,
      };
    }),
  );

  return icons;
};
