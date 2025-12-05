import { CliOptions, GenerateOptions } from "./types";

export const DEFAULT_INPUT = "assets";
export const DEFAULT_OUTPUT = "dist";
export const DEFAULT_FONT_NAME = "iconfont";
export const DEFAULT_CLASS_PREFIX = "icon";
export const DEFAULT_OPTIMIZE = true;
export const DEFAULT_CODEPOINT_START = 0xe001;

export const DEFAULT_CLI_OPTIONS: CliOptions = {
  input: DEFAULT_INPUT,
  output: DEFAULT_OUTPUT,
  name: DEFAULT_FONT_NAME,
  prefix: DEFAULT_CLASS_PREFIX,
  optimize: DEFAULT_OPTIMIZE,
};

export type ResolvedGenerateOptions = GenerateOptions & { codepointStart: number };

export const resolveGenerateOptions = (options: GenerateOptions): ResolvedGenerateOptions => ({
  ...options,
  codepointStart: options.codepointStart ?? DEFAULT_CODEPOINT_START,
});
