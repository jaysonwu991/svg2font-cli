import path from "path";
import { promises as fs } from "fs";
import {
  buildCss,
  buildDemoCss,
  buildDemoHtml,
  buildIconfontJs,
  buildIconfontManifest,
} from "../templates";
import { resolveGenerateOptions } from "../defaults";
import { GenerateOptions, GenerateResult, GlyphMeta } from "../types";
import { addCodepoints } from "./glyphs";
import { createSprite } from "./sprite";
import { DEFAULT_UNITS_PER_EM, createSvgFont } from "./svg-font-generator";
import { loadIcons, toAbsolutePattern } from "./icons";
import { ZipArchive } from "./zip";
import { svgToTtf, ttfToEot, ttfToWoff } from "../utils/font/ttf-converter";
import { ttfToWoff2 } from "../utils/font/woff2-converter";

const toBuffer = (value: ArrayBuffer | Uint8Array | Buffer): Buffer => {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof ArrayBuffer) return Buffer.from(new Uint8Array(value));
  return Buffer.from(value);
};

const buildZip = async (params: {
  fontName: string;
  prefix: string;
  glyphs: GlyphMeta[];
  outputDir: string;
  svgFont: string;
  ttf: Buffer;
  woff: Buffer;
  woff2: Buffer;
  eot: Buffer;
  cacheBust: string;
}) => {
  const { fontName, prefix, glyphs, outputDir, svgFont, ttf, woff, woff2, eot, cacheBust } = params;
  const zip = new ZipArchive();
  const folderName = fontName;
  const fileBase = fontName;
  const assetPath = (name: string) => `${folderName}/${name}`;

  const sprite = createSprite(glyphs, prefix);
  const css = buildCss({ fontName, prefix, glyphs, fileBase, cacheBust });
  const cssFile = `${fileBase}.css`;
  const jsFile = `${fileBase}.js`;
  const symbolFile = `${fileBase}.symbol.svg`;

  const demoCssFile = "demo.css";

  const demoCss = buildDemoCss();
  const demo = buildDemoHtml({
    fontName,
    prefix,
    glyphs,
    fileBase,
    cssFile,
    demoCssFile,
    jsFile,
    symbolFile,
    cacheBust,
    sprite,
  });
  const manifest = buildIconfontManifest({ fontName, prefix, glyphs });
  const iconfontJs = buildIconfontJs(sprite, fontName);

  zip.addFile(assetPath(`${fileBase}.svg`), svgFont);
  zip.addFile(assetPath(`${fileBase}.ttf`), ttf);
  zip.addFile(assetPath(`${fileBase}.woff`), woff);
  zip.addFile(assetPath(`${fileBase}.woff2`), woff2);
  zip.addFile(assetPath(`${fileBase}.eot`), eot);
  zip.addFile(assetPath(cssFile), css);
  zip.addFile(assetPath(jsFile), iconfontJs);
  zip.addFile(assetPath(symbolFile), sprite);
  zip.addFile(assetPath(demoCssFile), demoCss);
  zip.addFile(assetPath("demo.html"), demo);
  zip.addFile(assetPath(`${fileBase}.json`), manifest);

  const resolvedOutput = path.isAbsolute(outputDir)
    ? outputDir
    : path.resolve(process.cwd(), outputDir);
  await fs.mkdir(resolvedOutput, { recursive: true });

  const content = zip.generate();
  const zipPath = path.resolve(resolvedOutput, `${fontName}.zip`);
  await fs.writeFile(zipPath, content);

  return { zipPath, zipBuffer: content };
};

/**
 * Generates an icon font from SVG files.
 *
 * @param options - Configuration options for icon font generation
 * @param options.input - Glob pattern or directory path to SVG files
 * @param options.output - Output directory for the generated font ZIP file
 * @param options.name - Font family name (default: "iconfont")
 * @param options.prefix - CSS class prefix for icons (default: "icon")
 * @param options.codepointStart - Starting codepoint for icon mapping (default: 0xE001)
 * @param options.optimize - Whether to optimize SVG files with SVGO (default: false)
 *
 * @returns A promise that resolves to the generation result containing:
 *   - zipPath: Absolute path to the generated ZIP file
 *   - glyphs: Array of processed glyph metadata
 *   - zipBuffer: Buffer containing the ZIP file content
 *
 * @example
 * ```typescript
 * import { generateIconfont } from 'svg2font-cli';
 *
 * const result = await generateIconfont({
 *   input: './icons/*.svg',
 *   output: './dist',
 *   name: 'my-icons',
 *   prefix: 'mi'
 * });
 *
 * console.log(`Font generated at: ${result.zipPath}`);
 * console.log(`Total glyphs: ${result.glyphs.length}`);
 * ```
 *
 * @throws {Error} If no SVG files are found matching the input pattern
 * @throws {Error} If font generation fails due to invalid SVG data
 */
export const generateIconfont = async (options: GenerateOptions): Promise<GenerateResult> => {
  const resolved = resolveGenerateOptions(options);

  const pattern = await toAbsolutePattern(resolved.input);
  const icons = await loadIcons(pattern, resolved.optimize);
  const glyphs = addCodepoints(icons, resolved.codepointStart);
  const unitsPerEm = DEFAULT_UNITS_PER_EM;
  const svgFont = createSvgFont(glyphs, resolved.name, unitsPerEm);

  const ttf = toBuffer(svgToTtf(glyphs, resolved.name, unitsPerEm));

  // Convert TTF to other formats in parallel
  const [woff, woff2, eot] = await Promise.all([
    Promise.resolve(toBuffer(ttfToWoff(new Uint8Array(ttf)))),
    Promise.resolve(toBuffer(ttfToWoff2(new Uint8Array(ttf)))),
    Promise.resolve(toBuffer(ttfToEot(new Uint8Array(ttf)))),
  ]);

  const cacheBust = Date.now().toString();

  const { zipPath, zipBuffer } = await buildZip({
    fontName: resolved.name,
    prefix: resolved.prefix,
    glyphs,
    outputDir: resolved.output,
    svgFont,
    ttf,
    woff,
    woff2,
    eot,
    cacheBust,
  });

  return { zipPath, glyphs, zipBuffer };
};
