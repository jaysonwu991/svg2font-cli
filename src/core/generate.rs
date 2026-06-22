use super::{
    glyphs::add_codepoints,
    icons::load_icons,
    sprite::create_sprite,
    svg_font::create_svg_font,
    zip::create_zip,
};
use crate::templates::{build_css, build_demo_css, build_demo_html, build_iconfont_js, build_iconfont_manifest};
use crate::utils::{ttf_to_eot, ttf_to_woff, ttf_to_woff2};
use crate::{GenerateOptions, GenerateResult, Result};

/// Main function to generate icon fonts
pub async fn generate_iconfont(options: GenerateOptions) -> Result<GenerateResult> {
    // Load SVG icons
    let icons = load_icons(&options.src).await?;

    // Assign Unicode codepoints
    let glyphs = add_codepoints(icons, options.start_codepoint);

    // Generate sprite
    let sprite = create_sprite(&glyphs, &options.prefix);

    // Generate SVG font
    let svg_font = create_svg_font(&glyphs, &options.font_name);

    // For simplified implementation, create a basic TTF
    // In production, you'd use proper TTF generation
    let ttf_data = create_basic_ttf(&glyphs, &options.font_name);

    // Generate other formats
    let woff_data = ttf_to_woff(&ttf_data)?;
    let woff2_data = ttf_to_woff2(&ttf_data)?;
    let eot_data = ttf_to_eot(&ttf_data)?;

    // Generate templates
    let file_base = &options.font_name;
    let cache_bust = chrono::Utc::now().timestamp().to_string();

    let css = build_css(&options.font_name, &options.prefix, &glyphs, file_base, &cache_bust);
    let demo_css = build_demo_css();
    let demo_html = build_demo_html(
        &options.font_name,
        &options.prefix,
        &glyphs,
        file_base,
        &format!("{}.css", file_base),
        "demo.css",
        &format!("{}.js", file_base),
        &format!("{}.symbol.svg", file_base),
        &cache_bust,
        &sprite,
    );
    let iconfont_js = build_iconfont_js(&sprite, &options.font_name);
    let manifest = build_iconfont_manifest(&options.font_name, &options.prefix, &glyphs);

    // Create ZIP with all files (pre-allocated)
    let mut files = Vec::with_capacity(11);
    files.push((format!("{}.ttf", file_base), ttf_data));
    files.push((format!("{}.woff", file_base), woff_data));
    files.push((format!("{}.woff2", file_base), woff2_data));
    files.push((format!("{}.eot", file_base), eot_data));
    files.push((format!("{}.svg", file_base), svg_font.into_bytes()));
    files.push((format!("{}.css", file_base), css.into_bytes()));
    files.push((format!("{}.js", file_base), iconfont_js.into_bytes()));
    files.push((format!("{}.json", file_base), manifest.into_bytes()));
    files.push((format!("{}.symbol.svg", file_base), sprite.into_bytes()));
    files.push(("demo.css".to_string(), demo_css.into_bytes()));
    files.push(("demo.html".to_string(), demo_html.into_bytes()));

    let zip_path = create_zip(&options.dist, file_base, files).await?;

    Ok(GenerateResult { glyphs, zip_path })
}

/// Create a basic TTF file (simplified version)
/// In production, use proper TTF generation with ttf_builder
fn create_basic_ttf(_glyphs: &[crate::GlyphMeta], _font_name: &str) -> Vec<u8> {
    // This is a placeholder. In production, use the full TTF builder
    // For now, create minimal valid TTF structure
    let mut ttf = Vec::new();

    // SFNT header (simplified)
    ttf.extend_from_slice(&[0x00, 0x01, 0x00, 0x00]); // sfnt version
    ttf.extend_from_slice(&[0x00, 0x00]); // numTables (0 for now)
    ttf.extend_from_slice(&[0x00, 0x00]); // searchRange
    ttf.extend_from_slice(&[0x00, 0x00]); // entrySelector
    ttf.extend_from_slice(&[0x00, 0x00]); // rangeShift

    ttf
}
