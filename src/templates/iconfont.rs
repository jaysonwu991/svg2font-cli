use crate::core::glyphs::GlyphMeta;
use serde::Serialize;

#[derive(Serialize)]
struct GlyphInfo {
    font_class: String,
    unicode: String,
    unicode_decimal: u32,
}

#[derive(Serialize)]
struct Manifest {
    name: String,
    css_prefix_text: String,
    glyphs: Vec<GlyphInfo>,
}

/// Build iconfont manifest JSON
pub fn build_iconfont_manifest(font_name: &str, prefix: &str, glyphs: &[GlyphMeta]) -> String {
    let glyph_infos: Vec<GlyphInfo> = glyphs
        .iter()
        .map(|g| GlyphInfo {
            font_class: g.name.clone(),
            unicode: g.unicode.clone(),
            unicode_decimal: g.codepoint,
        })
        .collect();

    let manifest = Manifest {
        name: font_name.to_string(),
        css_prefix_text: prefix.to_string(),
        glyphs: glyph_infos,
    };

    serde_json::to_string_pretty(&manifest).unwrap_or_else(|_| "{}".to_string())
}

/// Build iconfont.js that auto-injects SVG sprite
pub fn build_iconfont_js(sprite: &str, _font_name: &str) -> String {
    format!(
        r#"(function(window) {{
  var svgSprite = {};

  var loadSvg = function() {{
    var div = document.createElement('div');
    div.innerHTML = svgSprite;
    var svg = div.getElementsByTagName('svg')[0];
    if (svg) {{
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.style.width = 0;
      svg.style.height = 0;
      svg.style.overflow = 'hidden';
      if (document.body.firstChild) {{
        document.body.insertBefore(svg, document.body.firstChild);
      }} else {{
        document.body.appendChild(svg);
      }}
    }}
  }};

  if (document.readyState === 'complete' || document.readyState === 'interactive') {{
    setTimeout(loadSvg, 0);
  }} else {{
    document.addEventListener('DOMContentLoaded', loadSvg, false);
  }}
}})(window);
"#,
        serde_json::to_string(sprite).unwrap_or_else(|_| "\"\"".to_string())
    )
}
