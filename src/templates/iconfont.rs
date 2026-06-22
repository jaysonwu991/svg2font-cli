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

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn make_glyph(name: &str, codepoint: u32) -> GlyphMeta {
        GlyphMeta {
            name: name.to_string(),
            svg: "".to_string(),
            source_path: PathBuf::from(format!("{}.svg", name)),
            codepoint,
            unicode: format!("&#x{:x};", codepoint),
        }
    }

    #[test]
    fn test_manifest_is_valid_json() {
        let glyphs = vec![make_glyph("home", 0xe001), make_glyph("star", 0xe002)];
        let json = build_iconfont_manifest("iconfont", "icon", &glyphs);
        let parsed: serde_json::Value = serde_json::from_str(&json).expect("should be valid JSON");
        assert_eq!(parsed["name"], "iconfont");
        assert_eq!(parsed["css_prefix_text"], "icon");
        assert_eq!(parsed["glyphs"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn test_manifest_glyph_fields() {
        let glyphs = vec![make_glyph("home", 0xe001)];
        let json = build_iconfont_manifest("iconfont", "icon", &glyphs);
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        let glyph = &parsed["glyphs"][0];
        assert_eq!(glyph["font_class"], "home");
        assert_eq!(glyph["unicode"], "&#xe001;");
        assert_eq!(glyph["unicode_decimal"], 0xe001);
    }

    #[test]
    fn test_manifest_empty_glyphs() {
        let json = build_iconfont_manifest("myfont", "fa", &[]);
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["glyphs"].as_array().unwrap().len(), 0);
        assert_eq!(parsed["name"], "myfont");
    }

    #[test]
    fn test_iconfont_js_contains_sprite() {
        let sprite = r#"<svg><symbol id="icon-home"></symbol></svg>"#;
        let js = build_iconfont_js(sprite, "iconfont");
        assert!(js.contains("icon-home"));
        assert!(js.contains("loadSvg"));
        assert!(js.contains("DOMContentLoaded"));
    }

    #[test]
    fn test_iconfont_js_is_iife() {
        let js = build_iconfont_js("<svg></svg>", "iconfont");
        assert!(js.contains("(function(window)"));
        assert!(js.contains("})(window)"));
    }
}
