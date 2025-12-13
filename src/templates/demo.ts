import { classNameVariants, normalizePrefix } from "../core/names";
import { GlyphMeta } from "../types";
import { buildFontFace, unicodeEntity } from "./shared";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const joinClasses = (classes: (string | undefined)[]): string =>
  classes.filter((cls): cls is string => Boolean(cls)).join(" ");

const extractInnerSvg = (
  svg: string,
): { inner: string; viewBox?: string; width?: string; height?: string } => {
  const svgTagMatch = svg.match(/<svg\b([^>]*)>/i);
  const svgOpenTag = svgTagMatch?.[0] || "";
  const attr = (name: string) => {
    const match =
      svgOpenTag.match(new RegExp(`${name}\\s*=\\s*"([^"]+)"`, "i")) ||
      svgOpenTag.match(new RegExp(`${name}\\s*=\\s*'([^']+)'`, "i"));
    return match ? match[1] : undefined;
  };
  const viewBox = attr("viewBox");
  const width = attr("width");
  const height = attr("height");
  const innerMatch = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
  return { inner: innerMatch ? innerMatch[1] : svg, viewBox, width, height };
};

const inlineSymbolSvg = (svg: string, className: string): string => {
  const { inner, viewBox, width, height } = extractInnerSvg(svg);
  const attrs = [
    `class="${className}"`,
    viewBox ? `viewBox="${escapeHtml(viewBox)}"` : null,
    width ? `width="${escapeHtml(width)}"` : null,
    height ? `height="${escapeHtml(height)}"` : null,
    'aria-hidden="true"',
    'focusable="false"',
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");

  return `<svg ${attrs}>${inner}</svg>`;
};

export const buildDemoHtml = (params: {
  fontName: string;
  prefix: string;
  glyphs: GlyphMeta[];
  fileBase: string;
  cssFile: string;
  demoCssFile: string;
  jsFile: string;
  symbolFile: string;
  cacheBust?: string;
  sprite: string;
}): string => {
  const {
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
  } =
    params;

  const versionSuffix = cacheBust ? `?t=${cacheBust}` : "";
  const inlineSprite = sprite.replace(
    "<svg",
    '<svg aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden"',
  );
  const cssHref = `${cssFile}${versionSuffix}`;
  const demoCssHref = `${demoCssFile}${versionSuffix}`;
  const jsHref = `${jsFile}${versionSuffix}`;
  const symbolHref = `${symbolFile}${versionSuffix}`;

  const baseClasses = Array.from(
    new Set(["iconfont", normalizePrefix(prefix)].filter((value): value is string => Boolean(value))),
  );
  const baseSelector = baseClasses.map((cls) => `.${cls}`).join(", ");

  const fontFaceSnippet = buildFontFace({ fontName, fileBase, cacheBust });
  const baseClassSnippet = [
    `${baseSelector} {`,
    `  font-family: "${fontName}" !important;`,
    "  font-size: 16px;",
    "  font-style: normal;",
    "  -webkit-font-smoothing: antialiased;",
    "  -moz-osx-font-smoothing: grayscale;",
    "}",
  ].join("\n");

  const fallbackGlyph: GlyphMeta = glyphs[0] ?? {
    name: "sample",
    codepoint: 0xe001,
    unicode: String.fromCodePoint(0xe001),
    svg: "",
    sourcePath: "",
  };

  const sampleVariants = classNameVariants(prefix, fallbackGlyph.name);
  const primaryClass = sampleVariants[0] ?? fallbackGlyph.name;
  const secondaryClass = sampleVariants[1];
  const symbolId = primaryClass;

  const unicodeCards = glyphs
    .map((glyph) => {
      const entity = unicodeEntity(glyph.codepoint);
      const codeText = escapeHtml(entity);
      const previewClasses = joinClasses(["preview", ...baseClasses]);
      return `<div class="icon-card">
  <span class="${previewClasses}" aria-hidden="true">${entity}</span>
  <span class="name">${glyph.name}</span>
  <span class="code">${codeText}</span>
</div>`;
    })
    .join("\n");

  const fontClassCards = glyphs
    .map((glyph) => {
      const variants = classNameVariants(prefix, glyph.name);
      const iconClass = variants[0] || glyph.name;
      const altClass = variants[1];
      const classList = joinClasses(["preview", "iconfont", normalizePrefix(prefix), iconClass, altClass]);
      const codeName = altClass && altClass !== iconClass ? `.${iconClass} / .${altClass}` : `.${iconClass}`;
      return `<div class="icon-card">
  <span class="${classList}" aria-hidden="true"></span>
  <span class="name">${glyph.name}</span>
  <span class="code">${codeName}</span>
</div>`;
    })
    .join("\n");

  const symbolCards = glyphs
    .map((glyph) => {
      const id = classNameVariants(prefix, glyph.name)[0] || glyph.name;
      const inlineSvg = inlineSymbolSvg(glyph.svg, "symbol-icon");
      return `<div class="icon-card">
  <span class="preview" aria-hidden="true">
    ${inlineSvg}
  </span>
  <span class="name">${glyph.name}</span>
  <span class="code">#${id}</span>
</div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fontName} iconfont demo</title>
  <link rel="stylesheet" href="${demoCssHref}">
  <link rel="stylesheet" href="${cssHref}">
</head>
<body>
  <main class="page">
    ${inlineSprite}
    <div class="hero">
      <div>
        <h1>${fontName} iconfont</h1>
        <p class="sub">Unicode, font class, and SVG symbol usage in one place.</p>
      </div>
      <span class="badge">svg2font-cli</span>
    </div>

    <div class="tabs">
      <button class="tab is-active" data-tab="unicode">Unicode</button>
      <button class="tab" data-tab="font-class">Font Class</button>
      <button class="tab" data-tab="symbol">Symbol</button>
    </div>

    <section class="panel is-active" data-panel="unicode">
      <h2>Unicode mode</h2>
      <p>Reference glyphs directly by their Unicode value. Great when you want minimal CSS.</p>
      <div class="code-block"><code>${escapeHtml(fontFaceSnippet)}</code></div>
      <div class="code-block"><code>${escapeHtml(baseClassSnippet)}</code></div>
      <div class="code-block"><code>${escapeHtml(
        `<span class="${baseClasses.join(" ")}">${unicodeEntity(fallbackGlyph.codepoint)}</span>`,
      )}</code></div>
      <div class="icon-grid">
${unicodeCards}
      </div>
    </section>

    <section class="panel" data-panel="font-class">
      <h2>Font class</h2>
      <p>Import the generated CSS and use semantic class names for icons.</p>
      <div class="code-block"><code>${escapeHtml(
        `@import "${cssHref}";\n\n<span class="iconfont ${primaryClass}"></span>`,
      )}</code></div>
      ${
        secondaryClass && secondaryClass !== primaryClass
          ? `<p class="small">Both <code>.${primaryClass}</code> and <code>.${secondaryClass}</code> resolve to the same glyph.</p>`
          : `<p class="small">Use <code>.${primaryClass}</code> with the <code>.iconfont</code> base class.</p>`
      }
      <div class="icon-grid">
${fontClassCards}
      </div>
    </section>

    <section class="panel" data-panel="symbol">
      <h2>SVG symbol</h2>
      <p>Load the SVG sprite once and render crisp icons with <code>&lt;use&gt;</code>.</p>
      <div class="code-block"><code>${escapeHtml(
        `<script src="${jsHref}" data-injectcss="true"></script>\n<svg class="icon" aria-hidden="true">\n  <use href="#${symbolId}" xlink:href="#${symbolId}"></use>\n</svg>`,
      )}</code></div>
      <p class="small">Set <code>data-disable-injectsvg="true"</code> on the script tag to skip auto-injection and point <code>href</code> to <code>${symbolHref}#${symbolId}</code> instead.</p>
      <div class="icon-grid">
${symbolCards}
      </div>
    </section>
  </main>

  <script>
    (function() {
      var tabs = Array.prototype.slice.call(document.querySelectorAll('.tab'));
      var panels = Array.prototype.slice.call(document.querySelectorAll('.panel'));
      tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
          var target = tab.getAttribute('data-tab');
          tabs.forEach(function(btn) { btn.classList.toggle('is-active', btn === tab); });
          panels.forEach(function(panel) {
            panel.classList.toggle('is-active', panel.getAttribute('data-panel') === target);
          });
        });
      });
    })();
  </script>
  <script src="${jsHref}" data-injectcss="true"></script>
</body>
</html>`;
};
