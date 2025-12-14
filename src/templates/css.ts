import { GlyphMeta } from "../types";
import { classNameVariants, normalizePrefix } from "../core/names";
import { buildFontFace, cssCodepoint } from "./shared";

export const buildCss = (params: {
  fontName: string;
  prefix: string;
  glyphs: GlyphMeta[];
  fileBase: string;
  cacheBust?: string;
}): string => {
  const { fontName, prefix, glyphs, fileBase, cacheBust } = params;

  const baseSelectors = Array.from(
    new Set(
      ["iconfont", normalizePrefix(prefix)].filter((value): value is string => Boolean(value)),
    ),
  )
    .map((cls) => `.${cls}`)
    .join(", ");

  const iconRules = glyphs
    .map((glyph) => {
      const selectors = classNameVariants(prefix, glyph.name)
        .map((name) => `.${name}:before`)
        .join(", ");
      return `${selectors} { content: "${cssCodepoint(glyph.codepoint)}"; }`;
    })
    .join("\n");

  const fontFace = buildFontFace({ fontName, fileBase, cacheBust });

  return [
    fontFace,
    "",
    `${baseSelectors} {`,
    `  font-family: "${fontName}" !important;`,
    "  font-size: 16px;",
    "  font-style: normal;",
    "  -webkit-font-smoothing: antialiased;",
    "  -moz-osx-font-smoothing: grayscale;",
    "}",
    "",
    iconRules,
    "",
  ].join("\n");
};
