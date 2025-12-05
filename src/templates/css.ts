import { GlyphMeta } from "../types";
import { cssCodepoint } from "./shared";

export const buildCss = (params: {
  fontName: string;
  prefix: string;
  glyphs: GlyphMeta[];
  fileBase: string;
}): string => {
  const { fontName, prefix, glyphs, fileBase } = params;
  const iconRules = glyphs
    .map(
      (glyph) => `.${prefix}-${glyph.name}:before { content: "${cssCodepoint(glyph.codepoint)}"; }`,
    )
    .join("\n");

  return [
    "@font-face {",
    `  font-family: "${fontName}";`,
    `  src: url("${fileBase}.eot");`,
    `  src: url("${fileBase}.eot?#iefix") format("embedded-opentype"),`,
    `       url("${fileBase}.woff2") format("woff2"),`,
    `       url("${fileBase}.woff") format("woff"),`,
    `       url("${fileBase}.ttf") format("truetype"),`,
    `       url("${fileBase}.svg#${fontName}") format("svg");`,
    "  font-weight: normal;",
    "  font-style: normal;",
    "}",
    "",
    `.${prefix} {`,
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
