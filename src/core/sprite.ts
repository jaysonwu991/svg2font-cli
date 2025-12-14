import { GlyphMeta } from "../types";
import { classNameVariants } from "./names";
import svgstore from "./svg-sprite-store";

export const createSprite = (glyphs: GlyphMeta[], prefix: string): string => {
  const store = svgstore({ inline: true });
  glyphs.forEach((glyph) => {
    const ids = classNameVariants(prefix, glyph.name);
    ids.forEach((id) => store.add(id, glyph.svg));
  });
  return store.toString({ inline: true });
};
