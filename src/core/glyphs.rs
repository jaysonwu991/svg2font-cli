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
    
    #[test]
    fn test_add_codepoints() {
        let icons = vec![
            SvgIcon {
                name: "home".to_string(),
                svg: "<svg></svg>".to_string(),
                source_path: PathBuf::from("home.svg"),
            },
            SvgIcon {
                name: "user".to_string(),
                svg: "<svg></svg>".to_string(),
                source_path: PathBuf::from("user.svg"),
            },
        ];
        
        let glyphs = add_codepoints(icons, 0xe001);
        
        assert_eq!(glyphs.len(), 2);
        assert_eq!(glyphs[0].codepoint, 0xe001);
        assert_eq!(glyphs[1].codepoint, 0xe002);
        assert_eq!(glyphs[0].unicode, "&#xe001;");
    }
    
    #[test]
    fn test_glyph_class_name() {
        let glyph = GlyphMeta {
            name: "home".to_string(),
            svg: "".to_string(),
            source_path: PathBuf::from("home.svg"),
            codepoint: 0xe001,
            unicode: "&#xe001;".to_string(),
        };
        
        assert_eq!(glyph.class_name("icon"), "icon-home");
    }
}
