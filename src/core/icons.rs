#[cfg(feature = "native")]
use heck::AsKebabCase;
use std::path::PathBuf;

/// SVG icon with metadata
#[derive(Debug, Clone)]
pub struct SvgIcon {
    pub name: String,
    pub svg: String,
    pub source_path: PathBuf,
}

#[cfg(feature = "native")]
pub fn sanitize_icon_name(name: &str) -> String {
    format!("{}", AsKebabCase(name))
}

/// Load SVG icons from glob pattern with optimized allocations
#[cfg(feature = "native")]
pub async fn load_icons(pattern: &str) -> crate::Result<Vec<SvgIcon>> {
    use crate::Error;
    use glob::glob;
    use tokio::fs;

    let paths: Vec<_> = glob(pattern)
        .map_err(|e| Error::SvgParse(e.to_string()))?
        .filter_map(|entry| entry.ok())
        .filter(|path| path.extension().and_then(|s| s.to_str()) == Some("svg"))
        .collect();

    if paths.is_empty() {
        return Err(Error::NoFilesFound(pattern.to_string()));
    }

    let mut icons = Vec::with_capacity(paths.len());

    for path in paths {
        let content = fs::read_to_string(&path).await?;
        let name = sanitize_icon_name(path.file_stem().and_then(|s| s.to_str()).unwrap_or("icon"));

        icons.push(SvgIcon {
            name,
            svg: content,
            source_path: path,
        });
    }

    icons.sort_unstable_by(|a, b| a.name.cmp(&b.name));
    Ok(icons)
}

#[cfg(all(test, feature = "native"))]
mod tests {
    use super::*;
    use tempfile::tempdir;
    use tokio::fs;

    #[test]
    fn test_sanitize_name() {
        assert_eq!(sanitize_icon_name("MyIcon"), "my-icon");
        assert_eq!(sanitize_icon_name("home_icon"), "home-icon");
        assert_eq!(sanitize_icon_name("user-profile"), "user-profile");
        assert_eq!(sanitize_icon_name("arrowRight"), "arrow-right");
        assert_eq!(sanitize_icon_name("icon"), "icon");
        assert_eq!(sanitize_icon_name("IconName"), "icon-name");
    }

    #[tokio::test]
    async fn test_load_icons_no_match() {
        let result = load_icons("/nonexistent/path/**/*.svg").await;
        assert!(result.is_err());
        let err = result.unwrap_err().to_string();
        assert!(err.contains("No SVG files found") || err.contains("nonexistent"));
    }

    #[tokio::test]
    async fn test_load_icons_from_dir() {
        let dir = tempdir().unwrap();
        let svg_content = r#"<svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z"/></svg>"#;

        fs::write(dir.path().join("home.svg"), svg_content)
            .await
            .unwrap();
        fs::write(dir.path().join("star.svg"), svg_content)
            .await
            .unwrap();
        fs::write(dir.path().join("notes.txt"), "ignore me")
            .await
            .unwrap();

        let pattern = format!("{}/*.svg", dir.path().display());
        let icons = load_icons(&pattern).await.unwrap();

        assert_eq!(icons.len(), 2);
        assert_eq!(icons[0].name, "home");
        assert_eq!(icons[1].name, "star");
        assert_eq!(icons[0].svg, svg_content);
    }

    #[tokio::test]
    async fn test_load_icons_sorted_order() {
        let dir = tempdir().unwrap();
        let svg = r#"<svg><path d="M0 0"/></svg>"#;

        for name in &["zebra", "apple", "mango"] {
            fs::write(dir.path().join(format!("{}.svg", name)), svg)
                .await
                .unwrap();
        }

        let pattern = format!("{}/*.svg", dir.path().display());
        let icons = load_icons(&pattern).await.unwrap();

        assert_eq!(icons[0].name, "apple");
        assert_eq!(icons[1].name, "mango");
        assert_eq!(icons[2].name, "zebra");
    }

    #[tokio::test]
    async fn test_load_icons_name_sanitization() {
        let dir = tempdir().unwrap();
        let svg = r#"<svg><path d="M0 0"/></svg>"#;
        fs::write(dir.path().join("MyIcon.svg"), svg).await.unwrap();

        let pattern = format!("{}/*.svg", dir.path().display());
        let icons = load_icons(&pattern).await.unwrap();

        assert_eq!(icons[0].name, "my-icon");
        assert_eq!(icons[0].source_path, dir.path().join("MyIcon.svg"));
    }
}
