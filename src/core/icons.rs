use crate::{Error, Result};
use glob::glob;
use heck::AsKebabCase;
use std::path::PathBuf;
use tokio::fs;

/// SVG icon with metadata
#[derive(Debug, Clone)]
pub struct SvgIcon {
    pub name: String,
    pub svg: String,
    pub source_path: PathBuf,
}

/// Load SVG icons from glob pattern with optimized allocations
pub async fn load_icons(pattern: &str) -> Result<Vec<SvgIcon>> {
    // Collect paths first to estimate capacity
    let paths: Vec<_> = glob(pattern)
        .map_err(|e| Error::SvgParse(e.to_string()))?
        .filter_map(|entry| entry.ok())
        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("svg"))
        .collect();

    if paths.is_empty() {
        return Err(Error::NoFilesFound(pattern.to_string()));
    }

    // Pre-allocate with exact capacity
    let mut icons = Vec::with_capacity(paths.len());

    for path in paths {
        let content = fs::read_to_string(&path).await?;
        let name = sanitize_name(
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("icon")
        );

        icons.push(SvgIcon {
            name,
            svg: content,
            source_path: path,
        });
    }

    // Sort in place
    icons.sort_unstable_by(|a, b| a.name.cmp(&b.name));
    Ok(icons)
}

/// Sanitize icon name to kebab-case
fn sanitize_name(name: &str) -> String {
    format!("{}", AsKebabCase(name))
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_sanitize_name() {
        assert_eq!(sanitize_name("MyIcon"), "my-icon");
        assert_eq!(sanitize_name("home_icon"), "home-icon");
        assert_eq!(sanitize_name("user-profile"), "user-profile");
    }
}
