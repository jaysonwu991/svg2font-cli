use std::path::PathBuf;

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use crate::{
    add_codepoints, build_css, build_demo_css, build_demo_html, build_iconfont_js,
    build_iconfont_manifest, create_sprite, create_svg_font, create_ttf, create_zip_bytes,
    utils::{ttf_to_eot, ttf_to_woff, ttf_to_woff2},
    SvgIcon, DEFAULT_PREFIX, DEFAULT_START_CODEPOINT,
};

#[derive(Deserialize)]
struct IconInput {
    name: String,
    content: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct WasmOptions {
    font_name: String,
    #[serde(default = "default_prefix")]
    prefix: String,
    #[serde(default = "default_start_codepoint")]
    start_codepoint: u32,
}

fn default_prefix() -> String {
    DEFAULT_PREFIX.to_string()
}

fn default_start_codepoint() -> u32 {
    DEFAULT_START_CODEPOINT
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WasmGlyphMeta {
    name: String,
    codepoint: u32,
    unicode: String,
    class_name: String,
}

#[derive(Serialize)]
struct WasmResult {
    glyphs: Vec<WasmGlyphMeta>,
    files: std::collections::HashMap<String, Vec<u8>>,
}

/// Generate icon font from an array of SVG icons.
///
/// `icons_json` — JSON array of `{name: string, content: string}` objects.
/// `opts_json`  — JSON object `{fontName, prefix?, startCodepoint?}`.
///
/// Returns a JS object `{glyphs, files}` where `files` maps filenames to `Uint8Array`.
#[wasm_bindgen(js_name = generateFromSvgs)]
pub fn generate_from_svgs(icons_json: &str, opts_json: &str) -> Result<JsValue, JsValue> {
    let icon_inputs: Vec<IconInput> =
        serde_json::from_str(icons_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let opts: WasmOptions =
        serde_json::from_str(opts_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let icons: Vec<SvgIcon> = icon_inputs
        .into_iter()
        .map(|i| SvgIcon {
            name: i.name,
            svg: i.content,
            source_path: PathBuf::new(),
        })
        .collect();

    let glyphs = add_codepoints(icons, opts.start_codepoint);

    let sprite = create_sprite(&glyphs, &opts.prefix);
    let svg_font = create_svg_font(&glyphs, &opts.font_name);
    let ttf_data = create_ttf(&glyphs, &opts.font_name)
        .map_err(|e| JsValue::from_str(&e.to_string()))?;
    let woff_data = ttf_to_woff(&ttf_data).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let woff2_data = ttf_to_woff2(&ttf_data).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let eot_data = ttf_to_eot(&ttf_data).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let file_base = &opts.font_name;
    let cache_bust = "0".to_string();

    let css = build_css(&opts.font_name, &opts.prefix, &glyphs, file_base, &cache_bust);
    let demo_css = build_demo_css();
    let demo_html = build_demo_html(
        &opts.font_name,
        &opts.prefix,
        &glyphs,
        file_base,
        &format!("{}.css", file_base),
        "demo.css",
        &format!("{}.js", file_base),
        &format!("{}.symbol.svg", file_base),
        &cache_bust,
        &sprite,
    );
    let iconfont_js = build_iconfont_js(&sprite, &opts.font_name);
    let manifest = build_iconfont_manifest(&opts.font_name, &opts.prefix, &glyphs);

    let mut file_list: Vec<(String, Vec<u8>)> = Vec::with_capacity(11);
    file_list.push((format!("{}.ttf", file_base), ttf_data));
    file_list.push((format!("{}.woff", file_base), woff_data));
    file_list.push((format!("{}.woff2", file_base), woff2_data));
    file_list.push((format!("{}.eot", file_base), eot_data));
    file_list.push((format!("{}.svg", file_base), svg_font.into_bytes()));
    file_list.push((format!("{}.css", file_base), css.into_bytes()));
    file_list.push((format!("{}.js", file_base), iconfont_js.into_bytes()));
    file_list.push((format!("{}.json", file_base), manifest.into_bytes()));
    file_list.push((format!("{}.symbol.svg", file_base), sprite.into_bytes()));
    file_list.push(("demo.css".to_string(), demo_css.into_bytes()));
    file_list.push(("demo.html".to_string(), demo_html.into_bytes()));

    let zip_bytes =
        create_zip_bytes(file_list.clone()).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let mut files: std::collections::HashMap<String, Vec<u8>> = file_list.into_iter().collect();
    files.insert(format!("{}.zip", file_base), zip_bytes);

    let wasm_glyphs: Vec<WasmGlyphMeta> = glyphs
        .iter()
        .map(|g| WasmGlyphMeta {
            name: g.name.clone(),
            codepoint: g.codepoint,
            unicode: g.unicode.clone(),
            class_name: g.class_name(&opts.prefix),
        })
        .collect();

    let result = WasmResult {
        glyphs: wasm_glyphs,
        files,
    };

    serde_wasm_bindgen::to_value(&result).map_err(|e| JsValue::from_str(&e.to_string()))
}
