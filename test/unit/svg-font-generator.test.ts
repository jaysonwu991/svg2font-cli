import { describe, it, expect } from 'vitest';
import {
  createSvgFont,
  extractPaths,
  extractViewBox,
  normalizeSvgPaths,
  DEFAULT_UNITS_PER_EM,
  DEFAULT_ASCENT,
  DEFAULT_DESCENT,
} from '../../src/core/svg-font-generator';
import { GlyphMeta } from '../../src/types';

describe('svg-font-generator', () => {
  const sampleGlyph: GlyphMeta = {
    name: 'test-icon',
    svg: '<svg viewBox="0 0 24 24"><path d="M10 10 L20 20"/></svg>',
    sourcePath: 'test-icon.svg',
    codepoint: 0xe001,
    unicode: '\ue001',
  };

  describe('constants', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_UNITS_PER_EM).toBe(1024);
      expect(DEFAULT_ASCENT).toBe(896);
      expect(DEFAULT_DESCENT).toBe(-128);
    });
  });

  describe('extractViewBox', () => {
    it('should extract viewBox from SVG', () => {
      const svg = '<svg viewBox="0 0 100 100">';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: 0, y: 0, width: 100, height: 100 });
    });

    it('should use width/height when viewBox is missing', () => {
      const svg = '<svg width="50" height="50">';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: 0, y: 0, width: 50, height: 50 });
    });

    it('should use default when no size info available', () => {
      const svg = '<svg>';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: 0, y: 0, width: DEFAULT_UNITS_PER_EM, height: DEFAULT_UNITS_PER_EM });
    });

    it('should handle negative viewBox values', () => {
      const svg = '<svg viewBox="-10 -10 120 120">';
      const result = extractViewBox(svg);
      expect(result).toEqual({ x: -10, y: -10, width: 120, height: 120 });
    });
  });

  describe('extractPaths', () => {
    it('should extract single path', () => {
      const svg = '<svg><path d="M0 0 L10 10"/></svg>';
      const paths = extractPaths(svg);
      expect(paths).toHaveLength(1);
      expect(paths[0]).toBe('M0 0 L10 10');
    });

    it('should extract multiple paths', () => {
      const svg = '<svg><path d="M0 0"/><path d="M10 10"/></svg>';
      const paths = extractPaths(svg);
      expect(paths).toHaveLength(2);
      expect(paths[0]).toBe('M0 0');
      expect(paths[1]).toBe('M10 10');
    });

    it('should return empty array for SVG without paths', () => {
      const svg = '<svg><circle cx="10" cy="10" r="5"/></svg>';
      const paths = extractPaths(svg);
      expect(paths).toHaveLength(0);
    });

    it('should handle path with various attributes', () => {
      const svg = '<svg><path d="M5 5 L15 15" fill="red" stroke="blue"/></svg>';
      const paths = extractPaths(svg);
      expect(paths[0]).toBe('M5 5 L15 15');
    });
  });

  describe('normalizeSvgPaths', () => {
    it('should normalize simple path', () => {
      const svg = '<svg viewBox="0 0 24 24"><path d="M0 0 L24 24"/></svg>';
      const normalized = normalizeSvgPaths(svg);
      expect(normalized).toHaveProperty('d');
      expect(normalized).toHaveProperty('viewBox');
      expect(normalized).toHaveProperty('paths');
      expect(typeof normalized.d).toBe('string');
    });

    it('should handle empty SVG', () => {
      const svg = '<svg viewBox="0 0 24 24"></svg>';
      const normalized = normalizeSvgPaths(svg);
      expect(normalized.d).toBe('');
      expect(normalized.paths).toEqual([]);
    });

    it('should handle white fill paths', () => {
      const svg = '<svg viewBox="0 0 24 24"><path d="M0 0" fill="#fff"/></svg>';
      const normalized = normalizeSvgPaths(svg);
      expect(normalized).toHaveProperty('d');
      expect(normalized.viewBox).toEqual({ x: 0, y: 0, width: 24, height: 24 });
    });
  });

  describe('createSvgFont', () => {
    it('should generate valid SVG font', () => {
      const glyphs = [sampleGlyph];
      const font = createSvgFont(glyphs, 'testfont', DEFAULT_UNITS_PER_EM);

      expect(font).toContain('<font');
      expect(font).toContain('testfont');
      expect(font).toContain('<glyph');
      expect(font).toContain('unicode="');
    });

    it('should include font metadata', () => {
      const glyphs = [sampleGlyph];
      const font = createSvgFont(glyphs, 'myfont', DEFAULT_UNITS_PER_EM);

      expect(font).toContain('font-family="myfont"');
      expect(font).toContain(`units-per-em="${DEFAULT_UNITS_PER_EM}"`);
      expect(font).toContain(`ascent="${DEFAULT_ASCENT}"`);
      expect(font).toContain(`descent="${DEFAULT_DESCENT}"`);
    });

    it('should handle multiple glyphs', () => {
      const glyphs: GlyphMeta[] = [
        { ...sampleGlyph, name: 'icon1', codepoint: 0xe001, unicode: '\ue001' },
        { ...sampleGlyph, name: 'icon2', codepoint: 0xe002, unicode: '\ue002' },
        { ...sampleGlyph, name: 'icon3', codepoint: 0xe003, unicode: '\ue003' },
      ];
      const font = createSvgFont(glyphs, 'multifont', DEFAULT_UNITS_PER_EM);

      expect(font).toContain('icon1');
      expect(font).toContain('icon2');
      expect(font).toContain('icon3');
    });

    it('should handle glyphs with special characters in names', () => {
      const glyph = {
        ...sampleGlyph,
        name: 'test-icon<>"&',
      };
      const font = createSvgFont([glyph], 'testfont', DEFAULT_UNITS_PER_EM);

      // Should escape special characters
      expect(font).toContain('glyph-name=');
    });

    it('should generate missing glyph', () => {
      const glyphs = [sampleGlyph];
      const font = createSvgFont(glyphs, 'testfont', DEFAULT_UNITS_PER_EM);

      expect(font).toContain('missing-glyph');
    });

    it('should use custom units per em', () => {
      const customUnits = 2048;
      const font = createSvgFont([sampleGlyph], 'testfont', customUnits);

      expect(font).toContain(`units-per-em="${customUnits}"`);
    });
  });
});
