use crate::Result;
use std::io::Write;
use zip::write::FileOptions;
use zip::ZipWriter;

/// Create ZIP archive in memory and return the raw bytes
pub fn create_zip_bytes(files: Vec<(String, Vec<u8>)>) -> Result<Vec<u8>> {
    let buf = std::io::Cursor::new(Vec::new());
    let mut zip = ZipWriter::new(buf);

    let options = FileOptions::<()>::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o755);

    for (name, content) in files {
        zip.start_file(&name, options)?;
        zip.write_all(&content)?;
    }

    let cursor = zip.finish()?;
    Ok(cursor.into_inner())
}

/// Create ZIP archive with font files, writing to disk
#[cfg(feature = "native")]
pub async fn create_zip(
    dist: &str,
    file_base: &str,
    files: Vec<(String, Vec<u8>)>,
) -> Result<String> {
    use tokio::fs;

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

#[cfg(all(test, feature = "native"))]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use zip::ZipArchive;

    #[tokio::test]
    async fn test_create_zip_produces_valid_archive() {
        let dir = tempdir().unwrap();
        let dist = dir.path().to_str().unwrap();

        let files = vec![
            ("iconfont.ttf".to_string(), b"fake ttf data".to_vec()),
            ("iconfont.css".to_string(), b".icon {}".to_vec()),
        ];

        let zip_path = create_zip(dist, "iconfont", files).await.unwrap();
        assert!(std::path::Path::new(&zip_path).exists());

        let zip_file = std::fs::File::open(&zip_path).unwrap();
        let mut archive = ZipArchive::new(zip_file).unwrap();
        assert_eq!(archive.len(), 2);

        let names: Vec<String> = (0..archive.len())
            .map(|i| archive.by_index(i).unwrap().name().to_string())
            .collect();
        assert!(names.contains(&"iconfont.ttf".to_string()));
        assert!(names.contains(&"iconfont.css".to_string()));
    }

    #[tokio::test]
    async fn test_create_zip_path_format() {
        let dir = tempdir().unwrap();
        let dist = dir.path().to_str().unwrap();

        let zip_path = create_zip(dist, "myfont", vec![]).await.unwrap();
        assert!(zip_path.ends_with("myfont.zip"));
    }

    #[tokio::test]
    async fn test_create_zip_creates_dist_dir() {
        let dir = tempdir().unwrap();
        let dist = format!("{}/new_subdir", dir.path().display());

        create_zip(&dist, "font", vec![]).await.unwrap();
        assert!(std::path::Path::new(&dist).exists());
    }
}
