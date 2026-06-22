use crate::core::glyphs::GlyphMeta;

/// Build demo HTML page
#[allow(clippy::too_many_arguments)]
pub fn build_demo_html(
    font_name: &str,
    prefix: &str,
    glyphs: &[GlyphMeta],
    _file_base: &str,
    css_file: &str,
    demo_css_file: &str,
    js_file: &str,
    _symbol_file: &str,
    cache_bust: &str,
    _sprite: &str,
) -> String {
    let mut unicode_items = String::new();
    let mut font_class_items = String::new();
    let mut symbol_items = String::new();

    for glyph in glyphs {
        let class_name = glyph.class_name(prefix);

        // Unicode mode
        unicode_items.push_str(&format!(
            r##"          <li>
            <span class="icon iconfont">{}</span>
            <div class="name">{}</div>
            <div class="code-name">{}</div>
          </li>
"##,
            glyph.unicode, glyph.name, glyph.unicode
        ));

        // Font class mode
        font_class_items.push_str(&format!(
            r##"          <li>
            <i class="icon iconfont {}"></i>
            <div class="name">{}</div>
            <div class="code-name">.{}</div>
          </li>
"##,
            class_name, glyph.name, class_name
        ));

        // Symbol mode
        let symbol_item = format!(
            "          <li>\n\
            <svg class=\"icon\" aria-hidden=\"true\">\n\
              <use xlink:href=\"#{}\"></use>\n\
            </svg>\n\
            <div class=\"name\">{}</div>\n\
            <div class=\"code-name\">#{}</div>\n\
          </li>\n",
            class_name, glyph.name, class_name
        );
        symbol_items.push_str(&symbol_item);
    }

    format!(
        r##"<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{} Icon Font Demo</title>
  <link rel="stylesheet" href="{}?t={}">
  <link rel="stylesheet" href="{}">
  <script src="{}?t={}"></script>
</head>
<body>
  <div class="main">
    <h1>{} Icon Font</h1>
    <p class="subtitle">Generated {} icons • {} total glyphs</p>

    <section class="font-usage">
      <h2>1. Unicode Mode</h2>
      <p>Direct Unicode character references:</p>
      <pre><code>&lt;span class="iconfont"&gt;&amp;#xe001;&lt;/span&gt;</code></pre>
      <ul class="icon-list">
{}
      </ul>
    </section>

    <section class="font-usage">
      <h2>2. Font Class Mode (Recommended)</h2>
      <p>Semantic class names:</p>
      <pre><code>&lt;i class="iconfont {}-home"&gt;&lt;/i&gt;</code></pre>
      <ul class="icon-list">
{}
      </ul>
    </section>

    <section class="font-usage">
      <h2>3. SVG Symbol Mode</h2>
      <p>SVG sprites with use elements:</p>
      <pre><code>&lt;svg class="icon"&gt;&lt;use href="#icon-home"&gt;&lt;/use&gt;&lt;/svg&gt;</code></pre>
      <ul class="icon-list">
{}
      </ul>
    </section>
  </div>
</body>
</html>
"##,
        font_name,
        css_file,
        cache_bust,
        demo_css_file,
        js_file,
        cache_bust,
        font_name,
        glyphs.len(),
        glyphs.len(),
        unicode_items.trim_end(),
        prefix,
        font_class_items.trim_end(),
        symbol_items.trim_end(),
    )
}

/// Build demo CSS
pub fn build_demo_css() -> String {
    r#"* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f5f5f5;
  padding: 20px;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
  color: #2c3e50;
}

.subtitle {
  color: #7f8c8d;
  margin-bottom: 40px;
}

.icon-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 20px;
  padding: 0;
}

.icon-list li {
  text-align: center;
  padding: 20px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.icon-list .icon,
.icon-list .iconfont {
  font-size: 32px;
  display: block;
  margin-bottom: 10px;
}
"#
    .to_string()
}
