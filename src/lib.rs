mod core;
mod templates;
pub mod utils;

#[cfg(feature = "napi")]
mod napi;

pub use core::{
    generate::generate_iconfont,
    glyphs::{add_codepoints, GlyphMeta},
    icons::{load_icons, SvgIcon},
    sprite::create_sprite,
    svg_font::create_svg_font,
};

pub use templates::{
    css::build_css,
    demo::{build_demo_css, build_demo_html},
    iconfont::{build_iconfont_js, build_iconfont_manifest},
};

// Default constants
pub const DEFAULT_FONT_NAME: &str = "iconfont";
pub const DEFAULT_PREFIX: &str = "icon";
pub const DEFAULT_START_CODEPOINT: u32 = 0xe001;
pub const DEFAULT_UNITS_PER_EM: i32 = 1024;
pub const DEFAULT_ASCENT: i32 = 896;
pub const DEFAULT_DESCENT: i32 = -128;

/// Options for generating icon fonts
#[derive(Debug, Clone)]
pub struct GenerateOptions {
    /// Source SVG files pattern (glob)
    pub src: String,
    /// Output directory
    pub dist: String,
    /// Font family name
    pub font_name: String,
    /// CSS class prefix
    pub prefix: String,
    /// Starting Unicode codepoint
    pub start_codepoint: u32,
}

impl Default for GenerateOptions {
    fn default() -> Self {
        Self {
            src: "svg/**/*.svg".to_string(),
            dist: "dist".to_string(),
            font_name: DEFAULT_FONT_NAME.to_string(),
            prefix: DEFAULT_PREFIX.to_string(),
            start_codepoint: DEFAULT_START_CODEPOINT,
        }
    }
}

/// Result of icon font generation
#[derive(Debug)]
pub struct GenerateResult {
    /// Generated glyphs with metadata
    pub glyphs: Vec<GlyphMeta>,
    /// Path to generated ZIP file
    pub zip_path: String,
}

/// Error types
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("SVG parse error: {0}")]
    SvgParse(String),

    #[error("Font generation error: {0}")]
    FontGeneration(String),

    #[error("Zip creation error: {0}")]
    Zip(#[from] zip::result::ZipError),

    #[error("No SVG files found matching pattern: {0}")]
    NoFilesFound(String),
}

pub type Result<T> = std::result::Result<T, Error>;
