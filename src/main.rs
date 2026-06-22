use clap::Parser;
use svg2font::{GenerateOptions, Result};

/// SVG to icon font converter
#[derive(Parser, Debug)]
#[command(name = "svg2font")]
#[command(version, about, long_about = None)]
struct Args {
    /// Source SVG files pattern (glob)
    #[arg(short, long, default_value = "svg/**/*.svg")]
    src: String,

    /// Output directory
    #[arg(short, long, default_value = "dist")]
    dist: String,

    /// Font family name
    #[arg(short, long, default_value = "iconfont")]
    font_name: String,

    /// CSS class prefix
    #[arg(short, long, default_value = "icon")]
    prefix: String,

    /// Starting Unicode codepoint (hex)
    #[arg(long, default_value = "e001")]
    start_unicode: String,
}

impl From<Args> for GenerateOptions {
    fn from(args: Args) -> Self {
        let start_codepoint = u32::from_str_radix(&args.start_unicode, 16)
            .unwrap_or(svg2font::DEFAULT_START_CODEPOINT);

        GenerateOptions {
            src: args.src,
            dist: args.dist,
            font_name: args.font_name,
            prefix: args.prefix,
            start_codepoint,
        }
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    let args = Args::parse();
    let options: GenerateOptions = args.into();

    let result = svg2font::generate_iconfont(options).await?;

    println!(
        "Generated {} icons into {}",
        result.glyphs.len(),
        result.zip_path
    );

    Ok(())
}
