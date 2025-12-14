const hexCode = (codepoint: number): string => codepoint.toString(16);

const versioned = (fileBase: string, ext: string, cacheBust?: string): string => {
  const query = cacheBust ? `?t=${cacheBust}` : "";
  return `${fileBase}.${ext}${query}`;
};

export const cssCodepoint = (codepoint: number): string =>
  `\\${hexCode(codepoint).padStart(4, "0")}`;

export const unicodeEntity = (codepoint: number): string => `&#x${hexCode(codepoint)};`;

export const buildFontFace = (params: {
  fontName: string;
  fileBase: string;
  cacheBust?: string;
  includeEot?: boolean;
}): string => {
  const { fontName, fileBase, cacheBust, includeEot = true } = params;
  const eot = versioned(fileBase, "eot", cacheBust);
  const woff2 = versioned(fileBase, "woff2", cacheBust);
  const woff = versioned(fileBase, "woff", cacheBust);
  const ttf = versioned(fileBase, "ttf", cacheBust);
  const svg = `${versioned(fileBase, "svg", cacheBust)}#${fontName}`;

  const lines = [
    "@font-face {",
    `  font-family: "${fontName}";`,
    includeEot ? `  src: url("${eot}");` : null,
    includeEot
      ? `  src: url("${eot}?#iefix") format("embedded-opentype"),`
      : `  src: url("${woff2}") format("woff2"),`,
    includeEot
      ? `       url("${woff2}") format("woff2"),`
      : `       url("${woff}") format("woff"),`,
    includeEot
      ? `       url("${woff}") format("woff"),`
      : `       url("${ttf}") format("truetype"),`,
    includeEot ? `       url("${ttf}") format("truetype"),` : `       url("${svg}") format("svg");`,
    includeEot ? `       url("${svg}") format("svg");` : null,
    "  font-weight: normal;",
    "  font-style: normal;",
    "  font-display: swap;",
    "}",
  ].filter((line): line is string => Boolean(line));

  return lines.join("\n");
};
