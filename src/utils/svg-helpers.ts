/**
 * Shared SVG utility functions
 * Used across svg-font, templates, and other modules
 */

export type ViewBoxInfo = { x: number; y: number; width: number; height: number };

/**
 * Extract an attribute value from SVG string
 */
export const extractAttr = (svg: string, attr: string): string | undefined => {
  const match =
    svg.match(new RegExp(`${attr}\\s*=\\s*"([^"]+)"`, "i")) ||
    svg.match(new RegExp(`${attr}\\s*=\\s*'([^']+)'`, "i"));
  return match ? match[1] : undefined;
};

/**
 * Extract viewBox information from SVG string
 */
export const extractViewBox = (
  svg: string,
  fallbackSize: number = 1024,
): ViewBoxInfo => {
  const viewBox = extractAttr(svg, "viewBox");
  if (viewBox) {
    const parts = viewBox.split(/\s+/).map((p) => parseFloat(p));
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
  }

  const width = parseFloat(extractAttr(svg, "width") || "");
  const height = parseFloat(extractAttr(svg, "height") || "");

  const widthHeight =
    Number.isFinite(width) && Number.isFinite(height)
      ? { width, height }
      : { width: fallbackSize, height: fallbackSize };

  return { x: 0, y: 0, ...widthHeight };
};

/**
 * Extract inner SVG content and attributes
 */
export const extractInnerSvg = (
  svg: string,
): { inner: string; viewBox?: string; width?: string; height?: string } => {
  const svgTagMatch = svg.match(/<svg\b([^>]*)>/i);
  const svgOpenTag = svgTagMatch?.[0] || "";

  const viewBox = extractAttr(svgOpenTag, "viewBox");
  const width = extractAttr(svgOpenTag, "width");
  const height = extractAttr(svgOpenTag, "height");

  const innerMatch = svg.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
  return { inner: innerMatch ? innerMatch[1] : svg, viewBox, width, height };
};
