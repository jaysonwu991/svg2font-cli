import path from "path";
import { promises as fs } from "fs";
import { buildCss, buildDemoHtml, buildIconfontJs } from "../templates";
import { resolveGenerateOptions } from "../defaults";
import { GenerateOptions, GenerateResult, GlyphMeta } from "../types";
import { addCodepoints } from "./glyphs";
import { createSprite } from "./sprite";
import { DEFAULT_UNITS_PER_EM, createSvgFont } from "./svg-font";
import { loadIcons, toAbsolutePattern } from "./icons";
import { ZipArchive } from "./zip";
import { svgToTtf, ttfToEot, ttfToWoff } from "../internal/font-converter";
import { ttfToWoff2 } from "../internal/woff2";

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
}) => {
  const { fontName, prefix, glyphs, outputDir, svgFont, ttf, woff, woff2, eot } = params;
  const zip = new ZipArchive();
  const fileBase = fontName;
  const sprite = createSprite(glyphs, prefix);
  const css = buildCss({ fontName, prefix, glyphs, fileBase });
  const demo = buildDemoHtml({
    fontName,
    prefix,
    glyphs,
    cssFile: `${fileBase}.css`,
    jsFile: `${fileBase}.js`,
  });
  const iconfontJs = buildIconfontJs(sprite);

  zip.addFile(`${fileBase}.svg`, svgFont);
  zip.addFile(`${fileBase}.ttf`, ttf);
  zip.addFile(`${fileBase}.woff`, woff);
  zip.addFile(`${fileBase}.woff2`, woff2);
  zip.addFile(`${fileBase}.eot`, eot);
  zip.addFile(`${fileBase}.css`, css);
  zip.addFile(`${fileBase}.js`, iconfontJs);
  zip.addFile(`${fileBase}.symbol.svg`, sprite);
  zip.addFile("demo.html", demo);

  const resolvedOutput = path.isAbsolute(outputDir)
    ? outputDir
    : path.resolve(process.cwd(), outputDir);
  await fs.mkdir(resolvedOutput, { recursive: true });

  const content = zip.generate();
  const zipPath = path.resolve(resolvedOutput, `${fontName}.zip`);
  await fs.writeFile(zipPath, content);

  return { zipPath, zipBuffer: content };
};

export const generateIconfont = async (options: GenerateOptions): Promise<GenerateResult> => {
  const resolved = resolveGenerateOptions(options);

  const pattern = await toAbsolutePattern(resolved.input);
  const icons = await loadIcons(pattern, resolved.optimize);
  const glyphs = addCodepoints(icons, resolved.codepointStart);
  const unitsPerEm = DEFAULT_UNITS_PER_EM;
  const svgFont = createSvgFont(glyphs, resolved.name, unitsPerEm);

  const ttf = toBuffer(svgToTtf(glyphs, resolved.name, unitsPerEm));
  const woff = toBuffer(ttfToWoff(new Uint8Array(ttf)));
  const woff2 = toBuffer(ttfToWoff2(new Uint8Array(ttf)));
  const eot = toBuffer(ttfToEot(new Uint8Array(ttf)));

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
  });

  return { zipPath, glyphs, zipBuffer };
};
