use super::glyphs::GlyphMeta;
use crate::{DEFAULT_ASCENT, DEFAULT_DESCENT, DEFAULT_UNITS_PER_EM};

/// Create SVG font from glyphs
pub fn create_svg_font(glyphs: &[GlyphMeta], font_name: &str) -> String {
    let units_per_em = DEFAULT_UNITS_PER_EM;
    let ascent = DEFAULT_ASCENT;
    let descent = DEFAULT_DESCENT;
    
    let mut font_glyphs = String::new();
    
    font_glyphs.push_str(r#"    <missing-glyph horiz-adv-x="1024" />"#);
    font_glyphs.push('\n');
    
    for glyph in glyphs {
        let unicode_char = glyph.unicode_char();
        let glyph_name = &glyph.name;
        let path_data = extract_path_data(&glyph.svg);
        
        font_glyphs.push_str(&format!(
            r#"    <glyph glyph-name="{}" unicode="{}" horiz-adv-x="1024" d="{}" />"#,
            glyph_name, unicode_char, path_data
        ));
        font_glyphs.push('\n');
    }
    
    format!(
        r#"<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg">
<defs>
  <font id="{}" horiz-adv-x="1024">
    <font-face
      font-family="{}"
      font-weight="400"
      font-stretch="normal"
      units-per-em="{}"
      ascent="{}"
      descent="{}"
    />
{}  </font>
</defs>
</svg>"#,
        font_name, font_name, units_per_em, ascent, descent, font_glyphs
    )
}

fn extract_path_data(svg: &str) -> String {
    let mut paths = Vec::new();
    let mut remaining = svg;
    
    while let Some(path_start) = remaining.find("<path") {
        let path_content = &remaining[path_start..];
        
        if let Some(d_start) = path_content.find("d=\"") {
            let d_content = &path_content[d_start + 3..];
            if let Some(d_end) = d_content.find('"') {
                paths.push(d_content[..d_end].to_string());
            }
        }
        
        if let Some(end) = path_content.find('>') {
            remaining = &path_content[end + 1..];
        } else {
            break;
        }
    }
    
    paths.join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_extract_path_data() {
        let svg = r#"<svg><path d="M10 20v-6h4v6"/><path d="M5 10h5"/></svg>"#;
        let path_data = extract_path_data(svg);
        assert!(path_data.contains("M10 20v-6h4v6"));
        assert!(path_data.contains("M5 10h5"));
    }
}
