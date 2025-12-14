export { generateIconfont } from "./core/generate";
export { loadIcons, sanitizeName, toAbsolutePattern } from "./core/icons";
export { addCodepoints } from "./core/glyphs";
export { createSprite } from "./core/sprite";
export {
  DEFAULT_ASCENT,
  DEFAULT_DESCENT,
  DEFAULT_UNITS_PER_EM,
  createSvgFont,
  extractPaths,
  extractViewBox,
  normalizeSvgPaths,
} from "./core/svg-font-generator";
export { ZipArchive } from "./core/zip";
export {
  DEFAULT_CLASS_PREFIX,
  DEFAULT_CLI_OPTIONS,
  DEFAULT_CODEPOINT_START,
  DEFAULT_FONT_NAME,
  DEFAULT_INPUT,
  DEFAULT_OPTIMIZE,
  DEFAULT_OUTPUT,
  resolveGenerateOptions,
} from "./defaults";
export type { ResolvedGenerateOptions } from "./defaults";
export * from "./types";
