import { GlyphMeta, SvgIcon } from "../types";

export const addCodepoints = (icons: SvgIcon[], start: number): GlyphMeta[] =>
  icons.map((icon, index) => {
    const codepoint = start + index;
    return {
      ...icon,
      codepoint,
      unicode: String.fromCodePoint(codepoint),
    };
  });
