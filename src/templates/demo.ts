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
          <h2 id="unicode-">Unicode 引用</h2>
          <hr>

          <p>Unicode 是字体在网页端最原始的应用方式，特点是：</p>
          <ul>
            <li>支持按字体的方式去动态调整图标大小，颜色等等。</li>
            <li>默认情况下不支持多色，直接添加多色图标会自动去色。</li>
          </ul>
          <blockquote>
            <p>Note: Multi-color icons are supported via SVG symbol method or color font icon mode.</p>
          </blockquote>
          <p>Unicode 使用步骤如下：</p>
          <h3 id="-font-face">第一步：拷贝项目下面生成的 <code>@font-face</code></h3>
<pre><code class="language-css"
>@font-face {
  font-family: '${fontName}';
  src: url('${fileBase}.woff2${versionSuffix}') format('woff2'),
       url('${fileBase}.woff${versionSuffix}') format('woff'),
       url('${fileBase}.ttf${versionSuffix}') format('truetype');
}
</code></pre>
          <h3 id="-iconfont-">第二步：定义使用 iconfont 的样式</h3>
<pre><code class="language-css"
>.iconfont {
  font-family: "${fontName}" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</code></pre>
          <h3 id="-">第三步：挑选相应图标并获取字体编码，应用于页面</h3>
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
        <h2 id="font-class-">font-class 引用</h2>
        <hr>

        <p>font-class 是 Unicode 使用方式的一种变种，主要是解决 Unicode 书写不直观，语意不明确的问题。</p>
        <p>与 Unicode 使用方式相比，具有如下特点：</p>
        <ul>
          <li>相比于 Unicode 语意明确，书写更直观。可以很容易分辨这个 icon 是什么。</li>
          <li>因为使用 class 来定义图标，所以当要替换图标时，只需要修改 class 里面的 Unicode 引用。</li>
        </ul>
        <p>使用步骤如下：</p>
        <h3 id="-fontclass-">第一步：引入项目下面生成的 fontclass 代码：</h3>
<pre><code class="language-html">&lt;link rel="stylesheet" href="./${fileBase}.css"&gt;
</code></pre>
        <h3 id="-">第二步：挑选相应图标并获取类名，应用于页面：</h3>
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
          <h2 id="symbol-">Symbol 引用</h2>
          <hr>

          <p>这是一种全新的使用方式，应该说这才是未来的主流，也是平台目前推荐的用法。相关介绍可以参考这篇<a href="">文章</a>
            这种用法其实是做了一个 SVG 的集合，与另外两种相比具有如下特点：</p>
          <ul>
            <li>支持多色图标了，不再受单色限制。</li>
            <li>通过一些技巧，支持像字体那样，通过 <code>font-size</code>, <code>color</code> 来调整样式。</li>
            <li>兼容性较差，支持 IE9+，及现代浏览器。</li>
            <li>浏览器渲染 SVG 的性能一般，还不如 png。</li>
          </ul>
          <p>使用步骤如下：</p>
          <h3 id="-symbol-">第一步：引入项目下面生成的 symbol 代码：</h3>
<pre><code class="language-html">&lt;script src="./${fileBase}.js"&gt;&lt;/script&gt;
</code></pre>
          <h3 id="-css-">第二步：加入通用 CSS 代码（引入一次就行）：</h3>
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
          <h3 id="-">第三步：挑选相应图标并获取类名，应用于页面：</h3>
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
