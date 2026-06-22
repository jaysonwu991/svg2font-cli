use super::icons::SvgIcon;

/// Glyph with assigned Unicode codepoint
#[derive(Debug, Clone)]
pub struct GlyphMeta {
    pub name: String,
    pub svg: String,
    pub source_path: std::path::PathBuf,
    pub codepoint: u32,
    pub unicode: String,
}

/// Add Unicode codepoints to icons with optimized allocations
pub fn add_codepoints(icons: Vec<SvgIcon>, start: u32) -> Vec<GlyphMeta> {
    let len = icons.len();
    let mut glyphs = Vec::with_capacity(len);

    for (index, icon) in icons.into_iter().enumerate() {
        let codepoint = start + index as u32;
        let unicode = format!("&#x{:x};", codepoint);

        glyphs.push(GlyphMeta {
            name: icon.name,
            svg: icon.svg,
            source_path: icon.source_path,
            codepoint,
            unicode,
        });
    }

    glyphs
}

impl GlyphMeta {
    pub fn class_name(&self, prefix: &str) -> String {
        format!("{}-{}", prefix, self.name)
    }

    pub fn codepoint_hex(&self) -> String {
        format!("{:x}", self.codepoint)
    }

    pub fn unicode_char(&self) -> char {
        char::from_u32(self.codepoint).unwrap_or('\u{FFFD}')
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn make_icon(name: &str) -> SvgIcon {
        SvgIcon {
            name: name.to_string(),
            svg: "<svg></svg>".to_string(),
            source_path: PathBuf::from(format!("{}.svg", name)),
        }
    }

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
    fn test_add_codepoints() {
        let icons = vec![make_icon("home"), make_icon("user")];
        let glyphs = add_codepoints(icons, 0xe001);

        assert_eq!(glyphs.len(), 2);
        assert_eq!(glyphs[0].codepoint, 0xe001);
        assert_eq!(glyphs[1].codepoint, 0xe002);
        assert_eq!(glyphs[0].unicode, "&#xe001;");
        assert_eq!(glyphs[0].name, "home");
        assert_eq!(glyphs[1].name, "user");
    }

    #[test]
    fn test_add_codepoints_empty() {
        let glyphs = add_codepoints(vec![], 0xe001);
        assert!(glyphs.is_empty());
    }

    #[test]
    fn test_add_codepoints_single() {
        let icons = vec![make_icon("star")];
        let glyphs = add_codepoints(icons, 0xf000);
        assert_eq!(glyphs.len(), 1);
        assert_eq!(glyphs[0].codepoint, 0xf000);
        assert_eq!(glyphs[0].unicode, "&#xf000;");
    }

    #[test]
    fn test_add_codepoints_preserves_svg() {
        let icons = vec![SvgIcon {
            name: "check".to_string(),
            svg: "<svg><path d=\"M1 1\"/></svg>".to_string(),
            source_path: PathBuf::from("check.svg"),
        }];
        let glyphs = add_codepoints(icons, 0xe001);
        assert_eq!(glyphs[0].svg, "<svg><path d=\"M1 1\"/></svg>");
    }

    #[test]
    fn test_glyph_class_name() {
        let glyph = make_glyph("home", 0xe001);
        assert_eq!(glyph.class_name("icon"), "icon-home");
    }

    #[test]
    fn test_glyph_class_name_custom_prefix() {
        let glyph = make_glyph("arrow-right", 0xe002);
        assert_eq!(glyph.class_name("fa"), "fa-arrow-right");
    }

    #[test]
    fn test_codepoint_hex() {
        let glyph = make_glyph("home", 0xe001);
        assert_eq!(glyph.codepoint_hex(), "e001");

        let glyph2 = make_glyph("star", 0xf123);
        assert_eq!(glyph2.codepoint_hex(), "f123");
    }

    #[test]
    fn test_unicode_char() {
        let glyph = make_glyph("home", 0xe001);
        assert_eq!(glyph.unicode_char(), '\u{e001}');
    }

    #[test]
    fn test_unicode_char_invalid_falls_back() {
        // Surrogates (0xD800–0xDFFF) are not valid Unicode scalar values
        let glyph = GlyphMeta {
            name: "bad".to_string(),
            svg: "".to_string(),
            source_path: PathBuf::from("bad.svg"),
            codepoint: 0xD800,
            unicode: "&#xd800;".to_string(),
        };
        assert_eq!(glyph.unicode_char(), '\u{FFFD}');
    }
}
