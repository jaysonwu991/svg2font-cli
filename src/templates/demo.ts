import { GlyphMeta } from "../types";
import { cssCodepoint } from "./shared";

export const buildDemoHtml = (params: {
  fontName: string;
  prefix: string;
  glyphs: GlyphMeta[];
  cssFile: string;
  jsFile: string;
}): string => {
  const { fontName, prefix, glyphs, cssFile, jsFile } = params;
  const icons = glyphs
    .map(
      (glyph) =>
        `<div class="icon-item"><i class="${prefix} ${prefix}-${glyph.name}"></i><span class="icon-name">${glyph.name}</span><span class="icon-code">${cssCodepoint(glyph.codepoint)}</span></div>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fontName} preview</title>
  <link rel="stylesheet" href="${cssFile}">
  <style>
    :root { color-scheme: light; }
    body { font-family: "Helvetica Neue", Arial, sans-serif; margin: 0; padding: 24px; color: #1f2933; background: #f7f8fa; }
    h1 { margin: 0 0 12px; }
    p { margin: 0 0 16px; color: #52606d; }
    .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 16px; }
    .icon-item { display: flex; flex-direction: column; align-items: center; padding: 12px; border-radius: 12px; background: #fff; box-shadow: 0 6px 18px rgba(0,0,0,0.05); }
    .icon-item i { font-size: 32px; line-height: 1; }
    .icon-name { margin-top: 8px; font-size: 13px; font-weight: 600; }
    .icon-code { margin-top: 4px; font-size: 12px; color: #9aa5b1; }
  </style>
</head>
<body>
  <h1>${fontName} preview</h1>
  <p>Use the <code>${prefix}</code> prefix with the icon name. Example: <code>&lt;i class="${prefix} ${prefix}-${glyphs[0]?.name || "home"}"&gt;&lt;/i&gt;</code></p>
  <div class="icon-grid">
${icons}
  </div>
  <script src="${jsFile}" data-injectcss="true"></script>
</body>
</html>`;
};
