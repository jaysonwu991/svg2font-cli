import { describe, it, expect } from 'vitest';
import { extractAttr, extractViewBox, extractInnerSvg } from '../../src/utils/svg-helpers';

describe('svg-helpers', () => {
  describe('extractAttr', () => {
    it('should extract attribute with double quotes', () => {
      const svg = '<svg width="24" height="32">';
      expect(extractAttr(svg, 'width')).toBe('24');
      expect(extractAttr(svg, 'height')).toBe('32');
    });

    it('should extract attribute with single quotes', () => {
      const svg = "<svg width='24' height='32'>";
      expect(extractAttr(svg, 'width')).toBe('24');
      expect(extractAttr(svg, 'height')).toBe('32');
    });

    it('should return undefined for missing attribute', () => {
      const svg = '<svg width="24">';
      expect(extractAttr(svg, 'missing')).toBeUndefined();
    });

    it('should handle attributes with spaces', () => {
      const svg = '<svg   width  =  "24"  >';
      expect(extractAttr(svg, 'width')).toBe('24');
    });
  });

  describe('extractViewBox', () => {
    it('should extract viewBox attribute', () => {
      const svg = '<svg viewBox="0 0 24 24">';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: 0, y: 0, width: 24, height: 24 });
    });

    it('should extract width and height when viewBox is missing', () => {
      const svg = '<svg width="100" height="200">';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: 0, y: 0, width: 100, height: 200 });
    });

    it('should use fallback size when no dimensions found', () => {
      const svg = '<svg>';
      const result = extractViewBox(svg, 512);
      expect(result).toEqual({ x: 0, y: 0, width: 512, height: 512 });
    });

    it('should handle negative viewBox values', () => {
      const svg = '<svg viewBox="-10 -10 100 100">';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: -10, y: -10, width: 100, height: 100 });
    });

    it('should handle decimal viewBox values', () => {
      const svg = '<svg viewBox="0.5 1.5 23.5 24.5">';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: 0.5, y: 1.5, width: 23.5, height: 24.5 });
    });
  });

  describe('extractInnerSvg', () => {
    it('should extract inner SVG content', () => {
      const svg = '<svg><path d="M0 0"/></svg>';
      const result = extractInnerSvg(svg);
      expect(result.inner).toBe('<path d="M0 0"/>');
    });

    it('should extract SVG attributes', () => {
      const svg = '<svg viewBox="0 0 24 24" width="24" height="24"><path/></svg>';
      const result = extractInnerSvg(svg);
      expect(result.viewBox).toBe('0 0 24 24');
      expect(result.width).toBe('24');
      expect(result.height).toBe('24');
    });

    it('should handle SVG without attributes', () => {
      const svg = '<svg><path/></svg>';
      const result = extractInnerSvg(svg);
      expect(result.viewBox).toBeUndefined();
      expect(result.width).toBeUndefined();
      expect(result.height).toBeUndefined();
    });

    it('should handle multiline SVG', () => {
      const svg = `<svg viewBox="0 0 24 24">
  <path d="M0 0"/>
  <circle cx="12" cy="12" r="10"/>
</svg>`;
      const result = extractInnerSvg(svg);
      expect(result.inner).toContain('<path d="M0 0"/>');
      expect(result.inner).toContain('<circle cx="12" cy="12" r="10"/>');
    });
  });
});
