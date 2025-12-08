import SvgPath from "../internal/svg-path";
import { GlyphMeta } from "../types";

export const DEFAULT_UNITS_PER_EM = 1024;
export const DEFAULT_ASCENT = 896;
export const DEFAULT_DESCENT = -128;

const escapeAttr = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const extractAttr = (svg: string, attr: string): string | undefined => {
  const match =
    svg.match(new RegExp(`${attr}\\s*=\\s*"([^"]+)"`, "i")) ||
    svg.match(new RegExp(`${attr}\\s*=\\s*'([^']+)'`, "i"));
  return match ? match[1] : undefined;
};

export type ViewBoxInfo = { x: number; y: number; width: number; height: number };
export type PathEntry = { d: string; fill?: string };

export const extractViewBox = (svg: string): ViewBoxInfo => {
  const viewBox = extractAttr(svg, "viewBox");
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map((p) => parseFloat(p));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }

  const width = parseFloat(extractAttr(svg, "width") || "");
  const height = parseFloat(extractAttr(svg, "height") || "");

  const widthHeight =
    Number.isFinite(width) && Number.isFinite(height)
      ? { width, height }
      : { width: DEFAULT_UNITS_PER_EM, height: DEFAULT_UNITS_PER_EM };

  return { x: 0, y: 0, ...widthHeight };
};

const extractPathEntries = (svg: string): PathEntry[] => {
  const entries: PathEntry[] = [];
  const regex = /<path\b([^>]*?)>/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(svg))) {
    const tag = match[0];
    const dMatch = tag.match(/d\s*=\s*("(.*?)"|'(.*?)')/i);
    const fillMatch = tag.match(/fill\s*=\s*("(.*?)"|'(.*?)')/i);
    const d = dMatch?.[2] || dMatch?.[3];
    const fill = fillMatch?.[2] || fillMatch?.[3];
    if (d) {
      entries.push({ d: d.trim(), fill: fill?.trim() });
    }
  }
  return entries;
};

export const extractPaths = (svg: string): string[] => extractPathEntries(svg).map((p) => p.d);

const formatNumber = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  if (Object.is(rounded, -0)) return "0";
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded}`.replace(/\.?0+$/, "");
};

const normalizePathData = (
  entries: PathEntry[],
  viewBox: ViewBoxInfo,
  unitsPerEm: number,
): { paths: PathEntry[]; combined: string } => {
  if (!entries.length) return { paths: [], combined: "" };

  const width = viewBox.width || DEFAULT_UNITS_PER_EM;
  const height = viewBox.height || DEFAULT_UNITS_PER_EM;
  const scaleX = unitsPerEm / width;
  const scaleY = unitsPerEm / height;

  const transformPoint = (x: number, y: number): [number, number] => {
    const normalizedX = (x - viewBox.x) * scaleX;
    const normalizedY = (height - (y - viewBox.y)) * scaleY;
    return [normalizedX, normalizedY];
  };

  const normalizedPaths: PathEntry[] = [];

  entries.forEach((entry) => {
    const svgPath = new SvgPath(entry.d).abs().unshort().unarc();
    const commands: string[] = [];

    svgPath.iterate((segment, _index, currentX, currentY) => {
      const emit = (cmd: string, coords: number[]) => {
        const formatted = coords.map(formatNumber).join(" ");
        commands.push(formatted ? `${cmd} ${formatted}` : cmd);
      };

      switch (segment[0]) {
        case "M": {
          const [x, y] = transformPoint(segment[1] as number, segment[2] as number);
          emit("M", [x, y]);
          break;
        }
        case "L": {
          const [x, y] = transformPoint(segment[1] as number, segment[2] as number);
          emit("L", [x, y]);
          break;
        }
        case "H": {
          const [x, y] = transformPoint(segment[1] as number, currentY);
          emit("L", [x, y]);
          break;
        }
        case "V": {
          const [x, y] = transformPoint(currentX, segment[1] as number);
          emit("L", [x, y]);
          break;
        }
        case "Q": {
          const [cx, cy] = transformPoint(segment[1] as number, segment[2] as number);
          const [x, y] = transformPoint(segment[3] as number, segment[4] as number);
          emit("Q", [cx, cy, x, y]);
          break;
        }
        case "C": {
          const [c1x, c1y] = transformPoint(segment[1] as number, segment[2] as number);
          const [c2x, c2y] = transformPoint(segment[3] as number, segment[4] as number);
          const [x, y] = transformPoint(segment[5] as number, segment[6] as number);
          emit("C", [c1x, c1y, c2x, c2y, x, y]);
          break;
        }
        case "Z":
        case "z": {
          emit("Z", []);
          break;
        }
        default:
          break;
      }
    });

    normalizedPaths.push({ d: commands.join(" "), fill: entry.fill });
  });

  return { paths: normalizedPaths, combined: normalizedPaths.map((p) => p.d).join(" ") };
};

export const normalizeSvgPaths = (
  svg: string,
  unitsPerEm: number = DEFAULT_UNITS_PER_EM,
): { d: string; viewBox: ViewBoxInfo; paths: PathEntry[] } => {
  const viewBox = extractViewBox(svg);
  const entries = extractPathEntries(svg);
  const { paths, combined } = normalizePathData(entries, viewBox, unitsPerEm);
  return { d: combined, viewBox, paths };
};

export const createSvgFont = (
  glyphs: GlyphMeta[],
  fontName: string,
  unitsPerEm: number = DEFAULT_UNITS_PER_EM,
): string => {
  const glyphTags = glyphs
    .map((glyph) => {
      const { d } = normalizeSvgPaths(glyph.svg, unitsPerEm);
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
