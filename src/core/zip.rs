use crate::Result;
use std::io::Write;
use tokio::fs;
use zip::write::FileOptions;
use zip::ZipWriter;

/// Create ZIP archive with font files
pub async fn create_zip(
    dist: &str,
    file_base: &str,
    files: Vec<(String, Vec<u8>)>,
) -> Result<String> {
    fs::create_dir_all(dist).await?;

    let zip_path = format!("{}/{}.zip", dist, file_base);
    let zip_file = std::fs::File::create(&zip_path)?;
    let mut zip = ZipWriter::new(zip_file);

    let options = FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    for (name, content) in files {
        zip.start_file(&name, options)?;
        zip.write_all(&content)?;
    }
    
    zip.finish()?;
    Ok(zip_path)
}
