import { describe, it, expect } from 'vitest';
import { addCodepoints } from '../../src/core/glyphs';
import { DEFAULT_CODEPOINT_START } from '../../src/defaults';

describe('glyphs', () => {
  describe('addCodepoints', () => {
    it('should assign codepoints starting from default', () => {
      const icons = [
        { name: 'home', svg: '<svg></svg>', sourcePath: 'home.svg' },
        { name: 'user', svg: '<svg></svg>', sourcePath: 'user.svg' },
      ];
      const glyphs = addCodepoints(icons, DEFAULT_CODEPOINT_START);
      
      expect(glyphs).toHaveLength(2);
      expect(glyphs[0].codepoint).toBe(0xe001);
      expect(glyphs[1].codepoint).toBe(0xe002);
    });

    it('should assign codepoints starting from custom value', () => {
      const icons = [
        { name: 'home', svg: '<svg></svg>', sourcePath: 'home.svg' },
      ];
      const glyphs = addCodepoints(icons, 0xf000);
      
      expect(glyphs[0].codepoint).toBe(0xf000);
    });

    it('should generate unicode strings', () => {
      const icons = [
        { name: 'home', svg: '<svg></svg>', sourcePath: 'home.svg' },
      ];
      const glyphs = addCodepoints(icons, 0xe001);
      
      expect(glyphs[0].unicode).toBe(String.fromCodePoint(0xe001));
    });

    it('should preserve icon metadata', () => {
      const icons = [
        { name: 'home', svg: '<svg><path/></svg>', sourcePath: '/path/home.svg' },
      ];
      const glyphs = addCodepoints(icons, 0xe001);
      
      expect(glyphs[0].name).toBe('home');
      expect(glyphs[0].svg).toBe('<svg><path/></svg>');
      expect(glyphs[0].sourcePath).toBe('/path/home.svg');
    });

    it('should handle empty icon array', () => {
      const glyphs = addCodepoints([], 0xe001);
      expect(glyphs).toHaveLength(0);
    });

    it('should increment codepoints sequentially', () => {
      const icons = Array.from({ length: 5 }, (_, i) => ({
        name: `icon-${i}`,
        svg: '<svg></svg>',
        sourcePath: `icon-${i}.svg`,
      }));
      const glyphs = addCodepoints(icons, 0xe001);
      
      glyphs.forEach((glyph, index) => {
        expect(glyph.codepoint).toBe(0xe001 + index);
      });
    });
  });
});
