import { extractInnerSvg } from "../utils/svg-helpers";

interface SvgstoreOptions {
  inline?: boolean;
}

interface SvgstoreApi {
  add: (id: string, svg: string) => SvgstoreApi;
  toString: (options?: SvgstoreOptions) => string;
}

const svgstore = (options: SvgstoreOptions = {}): SvgstoreApi => {
  const symbols: string[] = [];
  const baseOptions = { inline: false, ...options };

  const api: SvgstoreApi = {
    add(id: string, svg: string) {
      const { inner, viewBox } = extractInnerSvg(svg);
      const attrs = [`id="${id}"`, viewBox ? `viewBox="${viewBox}"` : null]
        .filter((attr): attr is string => typeof attr === "string")
        .join(" ");

      symbols.push(`<symbol ${attrs}>${inner}</symbol>`);
      return api;
    },
    toString(toStringOptions: SvgstoreOptions = {}) {
      const inline = toStringOptions.inline ?? baseOptions.inline;
      const body = symbols.join("");
      const svgSprite = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${body}</svg>`;
      if (inline) return svgSprite;

      const doctype =
        '<?xml version="1.0" encoding="UTF-8"?>' +
        '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';
      return `${doctype}${svgSprite}`;
    },
  };

  return api;
};

export default svgstore;
