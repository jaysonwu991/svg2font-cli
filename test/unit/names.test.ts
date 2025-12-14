import { describe, it, expect } from 'vitest';
import { sanitizeName } from '../../src/core/icons';
import { classNameVariants, normalizePrefix } from '../../src/core/names';

describe('names', () => {
  describe('sanitizeName', () => {
    it('should convert to lowercase', () => {
      const result = sanitizeName('MyIcon');
      expect(result).toBe('myicon');
    });

    it('should replace spaces with hyphens', () => {
      const result = sanitizeName('my icon');
      expect(result).toBe('my-icon');
    });

    it('should handle special characters', () => {
      const result = sanitizeName('icon.svg');
      expect(result).toBe('icon-svg'); // . becomes -
    });

    it('should handle multiple separators', () => {
      const result = sanitizeName('my---icon');
      expect(result).toBe('my-icon');
    });
  });

  describe('classNameVariants', () => {
    it('should generate variants with prefix', () => {
      const variants = classNameVariants('icon', 'home');
      expect(variants).toContain('icon-home');
    });

    it('should handle empty prefix', () => {
      const variants = classNameVariants('', 'home');
      expect(variants.length).toBeGreaterThan(0);
    });

    it('should lowercase names', () => {
      const variants = classNameVariants('icon', 'Home');
      expect(variants[0]).toBe('icon-home');
    });
  });

  describe('normalizePrefix', () => {
    it('should return prefix as-is when valid', () => {
      expect(normalizePrefix('icon')).toBe('icon');
    });

    it('should handle empty prefix', () => {
      const result = normalizePrefix('');
      expect(typeof result).toBe('string');
    });

    it('should lowercase prefix', () => {
      expect(normalizePrefix('MyIcon')).toBe('myicon');
    });

    it('should trim trailing dash', () => {
      expect(normalizePrefix('icon-')).toBe('icon');
    });
  });
});
