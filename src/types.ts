export interface SvgIcon {
  name: string;
  svg: string;
  sourcePath: string;
}

export interface GlyphMeta extends SvgIcon {
  codepoint: number;
  unicode: string;
}

export interface CliOptions {
  input: string;
  output: string;
  name: string;
  prefix: string;
  optimize: boolean;
}

export interface GenerateOptions extends CliOptions {
  codepointStart?: number;
}

export interface GenerateResult {
  zipPath: string;
  zipBuffer: Buffer;
  glyphs: GlyphMeta[];
}
