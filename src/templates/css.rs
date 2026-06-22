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
  src: url("{}.eot?t={}#iefix") format("embedded-opentype"),
       url("{}.woff2?t={}") format("woff2"),
       url("{}.woff?t={}") format("woff"),
       url("{}.ttf?t={}") format("truetype"),
       url("{}.svg?t={}#{}") format("svg");
  font-weight: normal;
  font-style: normal;
  font-display: block;
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
    css.push_str(&format!(
        r#".iconfont {{
  font-family: "{}" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}}

"#,
        font_name
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

    // SVG symbol mode styles
    css.push_str(
        r#"
.icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
"#,
    );

    css
}
