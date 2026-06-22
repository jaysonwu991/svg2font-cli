use super::glyphs::GlyphMeta;

/// Create SVG sprite from glyphs with optimized string building
pub fn create_sprite(glyphs: &[GlyphMeta], prefix: &str) -> String {
    // Pre-allocate string capacity (estimated)
    let estimated_size = glyphs.len() * 150; // ~150 chars per symbol
    let mut symbols = String::with_capacity(estimated_size);

    for glyph in glyphs {
        let id = glyph.class_name(prefix);
        let (viewbox, paths) = extract_svg_content(&glyph.svg);

        use std::fmt::Write;
        let _ = writeln!(
            &mut symbols,
            "  <symbol id=\"{}\" viewBox=\"{}\">{}</symbol>",
            id, viewbox, paths
        );
    }

    format!(
        "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" style=\"display:none;\">\n{}</svg>",
        symbols.trim_end()
    )
}

fn extract_svg_content(svg: &str) -> (String, String) {
    let mut viewbox = "0 0 1024 1024".to_string();
    let mut content = String::new();

    if let Some(start) = svg.find("<svg") {
        if let Some(end) = svg[start..].find('>') {
            let svg_tag = &svg[start..start + end + 1];

            if let Some(vb_start) = svg_tag.find("viewBox=\"") {
                let vb_content = &svg_tag[vb_start + 9..];
                if let Some(vb_end) = vb_content.find('"') {
                    viewbox = vb_content[..vb_end].to_string();
                }
            } else if let Some(w_start) = svg_tag.find("width=\"") {
                let w_content = &svg_tag[w_start + 7..];
                if let Some(w_end) = w_content.find('"') {
                    let width = &w_content[..w_end];
                    if let Some(h_start) = svg_tag.find("height=\"") {
                        let h_content = &svg_tag[h_start + 8..];
                        if let Some(h_end) = h_content.find('"') {
                            let height = &h_content[..h_end];
                            viewbox = format!("0 0 {} {}", width, height);
                        }
                    }
                }
            }

            let content_start = start + end + 1;
            if let Some(svg_end) = svg.rfind("</svg>") {
                content = svg[content_start..svg_end].trim().to_string();
            }
        }
    }

    (viewbox, content)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn make_glyph(name: &str, svg: &str, codepoint: u32) -> GlyphMeta {
        GlyphMeta {
            name: name.to_string(),
            svg: svg.to_string(),
            source_path: PathBuf::from(format!("{}.svg", name)),
            codepoint,
            unicode: format!("&#x{:x};", codepoint),
        }
    }

    #[test]
    fn test_create_sprite() {
        let glyphs = vec![make_glyph(
            "home",
            r#"<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>"#,
            0xe001,
        )];
        let sprite = create_sprite(&glyphs, "icon");
        assert!(sprite.contains(r#"<symbol id="icon-home""#));
        assert!(sprite.contains(r#"viewBox="0 0 24 24""#));
        assert!(sprite.contains(r#"xmlns="http://www.w3.org/2000/svg""#));
    }

    #[test]
    fn test_create_sprite_multiple_glyphs() {
        let glyphs = vec![
            make_glyph(
                "home",
                r#"<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>"#,
                0xe001,
            ),
            make_glyph(
                "star",
                r#"<svg viewBox="0 0 32 32"><path d="M2 2"/></svg>"#,
                0xe002,
            ),
        ];
        let sprite = create_sprite(&glyphs, "icon");
        assert!(sprite.contains(r#"<symbol id="icon-home""#));
        assert!(sprite.contains(r#"<symbol id="icon-star""#));
        assert!(sprite.contains(r#"viewBox="0 0 24 24""#));
        assert!(sprite.contains(r#"viewBox="0 0 32 32""#));
    }

    #[test]
    fn test_create_sprite_empty_glyphs() {
        let sprite = create_sprite(&[], "icon");
        assert!(sprite.contains("<svg"));
        assert!(sprite.contains("</svg>"));
        assert!(!sprite.contains("<symbol"));
    }

    #[test]
    fn test_create_sprite_default_viewbox() {
        // SVG with no viewBox and no width/height → should fall back to "0 0 1024 1024"
        let glyphs = vec![make_glyph("x", r#"<svg><path d="M0 0"/></svg>"#, 0xe001)];
        let sprite = create_sprite(&glyphs, "icon");
        assert!(sprite.contains(r#"viewBox="0 0 1024 1024""#));
    }

    #[test]
    fn test_create_sprite_width_height_viewbox() {
        // SVG with width/height but no viewBox
        let glyphs = vec![make_glyph(
            "box",
            r#"<svg width="48" height="48"><path d="M0 0"/></svg>"#,
            0xe001,
        )];
        let sprite = create_sprite(&glyphs, "icon");
        assert!(sprite.contains(r#"viewBox="0 0 48 48""#));
    }

    #[test]
    fn test_create_sprite_custom_prefix() {
        let glyphs = vec![make_glyph(
            "arrow",
            r#"<svg viewBox="0 0 16 16"><path d="M0 0"/></svg>"#,
            0xe001,
        )];
        let sprite = create_sprite(&glyphs, "fa");
        assert!(sprite.contains(r#"<symbol id="fa-arrow""#));
    }

    #[test]
    fn test_create_sprite_style_hidden() {
        let glyphs = vec![make_glyph("x", r#"<svg viewBox="0 0 1 1"/>"#, 0xe001)];
        let sprite = create_sprite(&glyphs, "icon");
        assert!(sprite.contains("display:none"));
    }
}
