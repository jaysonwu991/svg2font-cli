interface SvgstoreOptions {
  inline?: boolean;
}

const extractAttr = (tag: string, name: string): string | undefined => {
  const match = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i"));
  return match ? match[1] : undefined;
};

const extractInnerSvg = (
  svg: string,
): { inner: string; viewBox?: string; width?: string; height?: string } => {
  const svgTagMatch = svg.match(/<svg\b[^>]*>/i);
  if (!svgTagMatch) {
    return { inner: svg };
  }

  const svgOpenTag = svgTagMatch[0];
  const viewBox = extractAttr(svgOpenTag, "viewBox");
  const width = extractAttr(svgOpenTag, "width");
  const height = extractAttr(svgOpenTag, "height");
  const innerMatch = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);

  return { inner: innerMatch ? innerMatch[1] : svg, viewBox, width, height };
};

interface SvgstoreApi {
  add: (id: string, svg: string) => SvgstoreApi;
  toString: (options?: SvgstoreOptions) => string;
}

const svgstore = (options: SvgstoreOptions = {}): SvgstoreApi => {
  const symbols: string[] = [];
  const baseOptions = { inline: false, ...options };

  const api: SvgstoreApi = {
    add(id: string, svg: string) {
      const { inner, viewBox, width, height } = extractInnerSvg(svg);
      const attrs = [
        `id="${id}"`,
        viewBox ? `viewBox="${viewBox}"` : null,
        width ? `width="${width}"` : null,
        height ? `height="${height}"` : null,
      ]
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
