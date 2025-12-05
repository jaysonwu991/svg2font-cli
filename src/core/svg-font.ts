import { GlyphMeta } from "../types";

const DEFAULT_UNITS_PER_EM = 1000;
const DEFAULT_ASCENT = 850;
const DEFAULT_DESCENT = -150;

const escapeAttr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const extractAttr = (svg: string, attr: string): string | undefined => {
  const match =
    svg.match(new RegExp(`${attr}\\s*=\\s*"([^"]+)"`, "i")) ||
    svg.match(new RegExp(`${attr}\\s*=\\s*'([^']+)'`, "i"));
  return match ? match[1] : undefined;
};

type ViewBoxInfo = { width: number; height: number };

export const extractViewBox = (svg: string): ViewBoxInfo => {
  const viewBox = extractAttr(svg, "viewBox");
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map((p) => parseFloat(p));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return { width: parts[2], height: parts[3] };
    }
  }

  const width = parseFloat(extractAttr(svg, "width") || "");
  const height = parseFloat(extractAttr(svg, "height") || "");

  if (Number.isFinite(width) && Number.isFinite(height)) {
    return { width, height };
  }

  return { width: DEFAULT_UNITS_PER_EM, height: DEFAULT_UNITS_PER_EM };
};

export const extractPaths = (svg: string): string[] => {
  const paths: string[] = [];
  const regex = /<path\b[^>]*d\s*=\s*("(.*?)"|'(.*?)')[^>]*>/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(svg))) {
    const d = match[2] || match[3];
    if (d) paths.push(d.trim());
  }
  return paths;
};

export const createSvgFont = (glyphs: GlyphMeta[], fontName: string): string => {
  const defaultViewBox: ViewBoxInfo = { width: DEFAULT_UNITS_PER_EM, height: DEFAULT_UNITS_PER_EM };
  const { height } = glyphs.length ? extractViewBox(glyphs[0].svg) : defaultViewBox;
  const unitsPerEm = height || DEFAULT_UNITS_PER_EM;

  const glyphTags = glyphs
    .map((glyph) => {
      const paths = extractPaths(glyph.svg);
      const d = paths.join(" ");
      return `<glyph glyph-name="${escapeAttr(glyph.name)}" unicode="${escapeAttr(glyph.unicode)}" horiz-adv-x="${unitsPerEm}" d="${escapeAttr(
        d,
      )}" />`;
    })
    .join("\n");

  return [
    '<svg xmlns="http://www.w3.org/2000/svg">',
    "  <defs>",
    `    <font id="${escapeAttr(fontName)}" horiz-adv-x="${unitsPerEm}">`,
    `      <font-face font-family="${escapeAttr(fontName)}" units-per-em="${unitsPerEm}" ascent="${DEFAULT_ASCENT}" descent="${DEFAULT_DESCENT}" />`,
    "      <missing-glyph />",
    glyphTags
      .split("\n")
      .map((line) => `      ${line}`)
      .join("\n"),
    "    </font>",
    "  </defs>",
    "</svg>",
  ].join("\n");
};
