import { describe, it, expect } from 'vitest';
import { createSprite } from '../../src/core/sprite';
import { GlyphMeta } from '../../src/types';

describe('sprite', () => {
  const sampleGlyphs: GlyphMeta[] = [
    {
      name: 'home',
      svg: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
      sourcePath: 'home.svg',
      codepoint: 0xe001,
      unicode: '\ue001',
    },
    {
      name: 'user',
      svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/></svg>',
      sourcePath: 'user.svg',
      codepoint: 0xe002,
      unicode: '\ue002',
    },
  ];

  describe('createSprite', () => {
    it('should create SVG sprite from glyphs', () => {
      const sprite = createSprite(sampleGlyphs, 'icon');

      expect(sprite).toContain('<svg');
      expect(sprite).toContain('<symbol');
      expect(sprite).toContain('id="icon-home"');
      expect(sprite).toContain('id="icon-user"');
    });

    it('should preserve viewBox from original SVGs', () => {
      const sprite = createSprite(sampleGlyphs, 'icon');

      expect(sprite).toContain('viewBox="0 0 24 24"');
    });

    it('should include path data from glyphs', () => {
      const sprite = createSprite(sampleGlyphs, 'icon');

      expect(sprite).toContain('M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z');
      expect(sprite).toContain('<circle');
    });

    it('should use custom prefix', () => {
      const sprite = createSprite(sampleGlyphs, 'custom');

      expect(sprite).toContain('id="custom-home"');
      expect(sprite).toContain('id="custom-user"');
    });

    it('should handle single glyph', () => {
      const sprite = createSprite([sampleGlyphs[0]], 'icon');

      expect(sprite).toContain('<svg');
      expect(sprite).toContain('id="icon-home"');
      expect(sprite).not.toContain('icon-user');
    });

    it('should handle empty glyph array', () => {
      const sprite = createSprite([], 'icon');

      expect(sprite).toContain('<svg');
    });

    it('should create ID with prefix', () => {
      const glyphs: GlyphMeta[] = [
        {
          name: 'arrow-right',
          svg: '<svg><path d="M10 10"/></svg>',
          sourcePath: 'arrow-right.svg',
          codepoint: 0xe001,
          unicode: '\ue001',
        },
      ];

      const sprite = createSprite(glyphs, 'icon');

      // Should have prefixed version
      expect(sprite).toContain('id="icon-arrow-right"');
    });
  });
});
