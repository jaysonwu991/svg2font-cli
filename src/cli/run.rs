use crate::{generate_iconfont, GenerateOptions, Result};

pub async fn run_cli(options: GenerateOptions) -> Result<()> {
    let result = generate_iconfont(options).await?;

    println!(
        "Generated {} icons into {}",
        result.glyphs.len(),
        result.zip_path
    );

    Ok(())
}
