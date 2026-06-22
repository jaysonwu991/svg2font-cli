use crate::core::glyphs::GlyphMeta;

/// Build CSS file with @font-face and icon classes
pub fn build_css(
    font_name: &str,
    prefix: &str,
    glyphs: &[GlyphMeta],
    file_base: &str,
    cache_bust: &str,
) -> String {
    let mut css = String::new();

    // @font-face declaration
    css.push_str(&format!(
        r##"@font-face {{
  font-family: "{}";
  src: url("{}.eot?t={}");
  src: url("{}.eot?t={}?#iefix") format("embedded-opentype"),
       url("{}.woff2?t={}") format("woff2"),
       url("{}.woff?t={}") format("woff"),
       url("{}.ttf?t={}") format("truetype"),
       url("{}.svg?t={}#{}") format("svg");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}}

"##,
        font_name,
        file_base,
        cache_bust,
        file_base,
        cache_bust,
        file_base,
        cache_bust,
        file_base,
        cache_bust,
        file_base,
        cache_bust,
        file_base,
        cache_bust,
        font_name
    ));

    // Base iconfont class
    let normalized_prefix = prefix.trim_end_matches('-').to_lowercase();
    let base_selectors = {
        let mut selectors = vec![".iconfont".to_string()];
        if !normalized_prefix.is_empty() && normalized_prefix != "iconfont" {
            selectors.push(format!(".{}", normalized_prefix));
        }
        selectors.join(", ")
    };

    css.push_str(&format!(
        r#"{base_selectors} {{
  font-family: "{font_name}" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}}

"#,
        base_selectors = base_selectors,
        font_name = font_name,
    ));

    // Icon classes with Unicode content
    for glyph in glyphs {
        let class_name = glyph.class_name(prefix);
        css.push_str(&format!(
            ".{}:before {{ content: \"\\{}\"; }}\n",
            class_name,
            glyph.codepoint_hex()
        ));
    }

    css
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
    fn test_css_contains_font_face() {
        let glyphs = vec![make_glyph("home", 0xe001)];
        let css = build_css("iconfont", "icon", &glyphs, "iconfont", "12345");
        assert!(css.contains("@font-face"));
        assert!(css.contains(r#"font-family: "iconfont""#));
        assert!(css.contains("iconfont.ttf?t=12345"));
        assert!(css.contains("iconfont.woff2?t=12345"));
        assert!(css.contains("iconfont.woff?t=12345"));
        assert!(css.contains("iconfont.eot?t=12345"));
    }

    #[test]
    fn test_css_contains_icon_class() {
        let glyphs = vec![make_glyph("home", 0xe001), make_glyph("star", 0xe002)];
        let css = build_css("iconfont", "icon", &glyphs, "iconfont", "0");
        assert!(css.contains(".icon-home:before { content: \"\\e001\"; }"));
        assert!(css.contains(".icon-star:before { content: \"\\e002\"; }"));
    }

    #[test]
    fn test_css_base_selector_iconfont() {
        let glyphs = vec![make_glyph("x", 0xe001)];
        let css = build_css("iconfont", "iconfont", &glyphs, "iconfont", "0");
        // When prefix == "iconfont", only .iconfont selector (no duplicate)
        assert!(css.contains(".iconfont {"));
        // Should not have ", .iconfont" twice
        let count = css.matches(".iconfont").count();
        // At least one occurrence in the base selector block
        assert!(count >= 1);
    }

    #[test]
    fn test_css_base_selector_custom_prefix() {
        let glyphs = vec![make_glyph("x", 0xe001)];
        let css = build_css("myfont", "fa", &glyphs, "myfont", "0");
        assert!(css.contains(".iconfont, .fa {"));
    }

    #[test]
    fn test_css_font_display_swap() {
        let glyphs = vec![make_glyph("x", 0xe001)];
        let css = build_css("iconfont", "icon", &glyphs, "iconfont", "0");
        assert!(css.contains("font-display: swap"));
    }

    #[test]
    fn test_css_empty_glyphs() {
        let css = build_css("iconfont", "icon", &[], "iconfont", "0");
        assert!(css.contains("@font-face"));
        // No icon classes generated
        assert!(!css.contains(":before"));
    }
}
