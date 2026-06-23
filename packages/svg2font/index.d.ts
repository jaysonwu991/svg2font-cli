export interface GenerateOptions {
  /** Glob pattern for source SVG files (e.g. "icons/**\/*.svg") */
  src: string;
  /** Output directory for generated files */
  dist: string;
  /** Font family name used for file names and CSS (e.g. "myicons") */
  fontName: string;
  /** CSS class prefix (default: "icon") */
  prefix?: string;
  /** Starting Unicode codepoint as a decimal number (default: 0xe001 = 57345) */
  startCodepoint?: number;
}

export interface GlyphMeta {
  /** Icon name in kebab-case (e.g. "arrow-right") */
  name: string;
  /** Assigned Unicode codepoint (e.g. 57345 for U+E001) */
  codepoint: number;
  /** HTML entity string (e.g. "&#xe001;") */
  unicode: string;
  /** Full CSS class name (e.g. "icon-arrow-right") */
  className: string;
}

export interface GenerateResult {
  /** Metadata for every generated icon glyph */
  glyphs: GlyphMeta[];
  /** Absolute path to the generated ZIP archive */
  zipPath: string;
}

/**
 * Generate an iconfont bundle from a set of SVG files.
 *
 * @example
 * ```ts
 * import { generate } from '@jayson991/svg2font';
 *
 * const result = await generate({
 *   src: 'icons\/**\/*.svg',
 *   dist: 'dist',
 *   fontName: 'myicons',
 * });
 *
 * console.log(`Generated ${result.glyphs.length} icons → ${result.zipPath}`);
 * ```
 */
export function generate(options: GenerateOptions): Promise<GenerateResult>;
