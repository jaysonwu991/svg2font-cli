import { GlyphMeta } from "../types";
import svgstore from "./svgstore";

export const createSprite = (glyphs: GlyphMeta[], prefix: string): string => {
  const store = svgstore({ inline: true });
  glyphs.forEach((glyph) => store.add(`${prefix}-${glyph.name}`, glyph.svg));
  return store.toString({ inline: true });
};
