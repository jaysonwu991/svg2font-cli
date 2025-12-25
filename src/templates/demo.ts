import { classNameVariants } from "../core/names";
import { GlyphMeta } from "../types";
import { unicodeEntity } from "./shared";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

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
  const { fontName, glyphs, fileBase, cacheBust } = params;

  const versionSuffix = cacheBust ? `?t=${cacheBust}` : "";

  // Generate Unicode icon list
  const unicodeIcons = glyphs
    .map((glyph) => {
      const entity = unicodeEntity(glyph.codepoint);
      return `
            <li class="dib">
              <span class="icon iconfont">${entity}</span>
                <div class="name">${escapeHtml(glyph.name)}</div>
                <div class="code-name">${escapeHtml(entity)}</div>
              </li>`;
    })
    .join("\n");

  // Generate Font class icon list
  const fontClassIcons = glyphs
    .map((glyph) => {
      const variants = classNameVariants("icon", glyph.name);
      const iconClass = variants[0] || glyph.name;
      return `
          <li class="dib">
            <span class="icon iconfont ${iconClass}"></span>
            <div class="name">
              ${escapeHtml(glyph.name)}
            </div>
            <div class="code-name">.${iconClass}
            </div>
          </li>`;
    })
    .join("\n");

  // Generate Symbol icon list
  const symbolIcons = glyphs
    .map((glyph) => {
      const variants = classNameVariants("icon", glyph.name);
      const iconId = variants[0] || glyph.name;
      return `
            <li class="dib">
                <svg class="icon svg-icon" aria-hidden="true">
                  <use xlink:href="#${iconId}"></use>
                </svg>
                <div class="name">${escapeHtml(glyph.name)}</div>
                <div class="code-name">#${iconId}</div>
            </li>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${fontName} Icon Font Demo</title>
  <link rel="stylesheet" href="demo.css">
  <link rel="stylesheet" href="${fileBase}.css">
  <script src="${fileBase}.js"></script>
  <!-- jQuery -->
  <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
  <!-- Prism.js for code highlighting -->
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-css.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-markup.min.js"></script>
  <style>
    .main .logo {
      margin-top: 0;
      height: auto;
    }

    .main .logo h1 {
      font-size: 32px;
      font-weight: 600;
      color: #333;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="main">
    <div class="logo">
      <h1>${fontName}</h1>
    </div>
    <div class="nav-tabs">
      <ul id="tabs" class="dib-box">
        <li class="dib active"><span>Unicode</span></li>
        <li class="dib"><span>Font class</span></li>
        <li class="dib"><span>Symbol</span></li>
      </ul>
    </div>
    <div class="tab-container">
      <div class="content unicode" style="display: block;">
          <ul class="icon_lists dib-box">
${unicodeIcons}

          </ul>
          <div class="article markdown">
          <h2 id="unicode-">Unicode Reference</h2>
          <hr>

          <p>Unicode is the most basic way to use fonts on the web. Features:</p>
          <ul>
            <li>Supports dynamic adjustment of icon size, color, etc. like regular fonts.</li>
            <li>Does not support multi-color by default. Multi-color icons will be automatically converted to single color.</li>
          </ul>
          <blockquote>
            <p>Note: Multi-color icons are supported via the SVG symbol method or color font mode.</p>
          </blockquote>
          <p>Usage steps:</p>
          <h3 id="-font-face">Step 1: Copy the generated <code>@font-face</code> code</h3>
<pre><code class="language-css"
>@font-face {
  font-family: '${fontName}';
  src: url('${fileBase}.woff2${versionSuffix}') format('woff2'),
       url('${fileBase}.woff${versionSuffix}') format('woff'),
       url('${fileBase}.ttf${versionSuffix}') format('truetype');
}
</code></pre>
          <h3 id="-iconfont-">Step 2: Define the iconfont styles</h3>
<pre><code class="language-css"
>.iconfont {
  font-family: "${fontName}" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</code></pre>
          <h3 id="-">Step 3: Select an icon and use its character code on the page</h3>
<pre>
<code class="language-html"
>&lt;span class="iconfont"&gt;&amp;#x33;&lt;/span&gt;
</code></pre>
          <blockquote>
            <p>Note: "${fontName}" is your project's font-family name. You can customize this when generating the font.</p>
          </blockquote>
          </div>
      </div>
      <div class="content font-class">
        <ul class="icon_lists dib-box">
${fontClassIcons}

        </ul>
        <div class="article markdown">
        <h2 id="font-class-">Font Class Reference</h2>
        <hr>

        <p>Font class is a variant of Unicode usage that addresses the issue of Unicode being unintuitive and unclear in meaning.</p>
        <p>Compared to Unicode usage, it has the following advantages:</p>
        <ul>
          <li>Compared to Unicode, it is semantically clear and more intuitive to write. You can easily tell what icon this is.</li>
          <li>Because icons are defined using classes, when you need to replace an icon, you only need to modify the Unicode reference in the class.</li>
        </ul>
        <p>Usage steps:</p>
        <h3 id="-fontclass-">Step 1: Include the generated fontclass CSS file in your project:</h3>
<pre><code class="language-html">&lt;link rel="stylesheet" href="./${fileBase}.css"&gt;
</code></pre>
        <h3 id="-">Step 2: Select an icon and use its class name on the page:</h3>
<pre><code class="language-html">&lt;span class="iconfont icon-xxx"&gt;&lt;/span&gt;
</code></pre>
        <blockquote>
          <p>Note: "${fontName}" is your project's font-family name. You can customize this when generating the font.</p>
        </blockquote>
      </div>
      </div>
      <div class="content symbol">
          <ul class="icon_lists dib-box">
${symbolIcons}

          </ul>
          <div class="article markdown">
          <h2 id="symbol-">Symbol Reference</h2>
          <hr>

          <p>This is a new way to use icons and represents the future mainstream approach, which is currently the recommended method by the platform. For more information, refer to this <a href="">article</a>.
            This approach creates an SVG sprite collection. Compared to the other two methods, it has the following features:</p>
          <ul>
            <li>Supports multi-color icons, no longer limited to single colors.</li>
            <li>Through some techniques, supports font-like styling via <code>font-size</code> and <code>color</code>.</li>
            <li>Lower browser compatibility, supports IE9+ and modern browsers.</li>
            <li>Browser SVG rendering performance is generally lower than PNG.</li>
          </ul>
          <p>Usage steps:</p>
          <h3 id="-symbol-">Step 1: Include the generated symbol JavaScript file in your project:</h3>
<pre><code class="language-html">&lt;script src="./${fileBase}.js"&gt;&lt;/script&gt;
</code></pre>
          <h3 id="-css-">Step 2: Add the general CSS code (include once):</h3>
<pre><code class="language-html">&lt;style&gt;
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
&lt;/style&gt;
</code></pre>
          <h3 id="-">Step 3: Select an icon and use it on the page:</h3>
<pre><code class="language-html">&lt;svg class="icon" aria-hidden="true"&gt;
  &lt;use xlink:href="#icon-xxx"&gt;&lt;/use&gt;
&lt;/svg&gt;
</code></pre>
          </div>
      </div>

    </div>
  </div>
  <script>
  $(document).ready(function () {
      $('.tab-container .content:first').show()

      $('#tabs li').click(function (e) {
        var tabContent = $('.tab-container .content')
        var index = $(this).index()

        if ($(this).hasClass('active')) {
          return
        } else {
          $('#tabs li').removeClass('active')
          $(this).addClass('active')

          tabContent.hide().eq(index).fadeIn()
        }
      })
    })
  </script>
</body>
</html>
`;
};
