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
  cacheBust: string;
}) => {
  const { fontName, prefix, glyphs, outputDir, svgFont, ttf, woff, woff2, eot, cacheBust } =
    params;
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
  const demoHtmlFile = "demo_index.html";

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
  zip.addFile(assetPath(demoHtmlFile), demo);
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
