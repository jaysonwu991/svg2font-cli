use napi::bindgen_prelude::*;
use napi_derive::napi;

use crate::{generate_iconfont, GenerateOptions, DEFAULT_PREFIX, DEFAULT_START_CODEPOINT};

#[napi(object)]
pub struct JsGenerateOptions {
    pub src: String,
    pub dist: String,
    pub font_name: String,
    pub prefix: Option<String>,
    pub start_codepoint: Option<u32>,
}

#[napi(object)]
pub struct JsGlyphMeta {
    pub name: String,
    pub codepoint: u32,
    pub unicode: String,
    pub class_name: String,
}

#[napi(object)]
pub struct JsGenerateResult {
    pub glyphs: Vec<JsGlyphMeta>,
    pub zip_path: String,
}

#[napi]
pub async fn generate(opts: JsGenerateOptions) -> Result<JsGenerateResult> {
    let prefix = opts
        .prefix
        .clone()
        .unwrap_or_else(|| DEFAULT_PREFIX.to_string());

    let options = GenerateOptions {
        src: opts.src,
        dist: opts.dist,
        font_name: opts.font_name,
        prefix: prefix.clone(),
        start_codepoint: opts.start_codepoint.unwrap_or(DEFAULT_START_CODEPOINT),
    };

    let result = generate_iconfont(options)
        .await
        .map_err(|e| napi::Error::from_reason(e.to_string()))?;

    let glyphs = result
        .glyphs
        .iter()
        .map(|g| JsGlyphMeta {
            name: g.name.clone(),
            codepoint: g.codepoint,
            unicode: g.unicode.clone(),
            class_name: g.class_name(&prefix),
        })
        .collect();

    Ok(JsGenerateResult {
        glyphs,
        zip_path: result.zip_path,
    })
}
