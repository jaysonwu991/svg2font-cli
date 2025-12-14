import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { loadIcons, sanitizeName, toAbsolutePattern } from '../../src/core/icons';

describe('icons', () => {
  const testDir = path.join(__dirname, '../fixtures/temp-icons-test');

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });

    // Create test SVG files
    await fs.writeFile(
      path.join(testDir, 'test-icon.svg'),
      '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>'
    );
    await fs.writeFile(
      path.join(testDir, 'another-icon.svg'),
      '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14"/></svg>'
    );
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('sanitizeName', () => {
    it('should convert to lowercase', () => {
      expect(sanitizeName('HelloWorld')).toBe('helloworld');
    });

    it('should replace spaces with hyphens', () => {
      expect(sanitizeName('hello world')).toBe('hello-world');
    });

    it('should replace special characters with hyphens', () => {
      expect(sanitizeName('hello@world#test')).toBe('hello-world-test');
    });

    it('should collapse multiple hyphens', () => {
      expect(sanitizeName('hello---world')).toBe('hello-world');
    });

    it('should trim whitespace', () => {
      expect(sanitizeName('  hello world  ')).toBe('hello-world');
    });

    it('should handle underscores', () => {
      expect(sanitizeName('hello_world')).toBe('hello_world');
    });

    it('should handle mixed alphanumeric', () => {
      expect(sanitizeName('Icon123Test')).toBe('icon123test');
    });
  });

  describe('toAbsolutePattern', () => {
    it('should convert directory to glob pattern', async () => {
      const result = await toAbsolutePattern(testDir);
      expect(result).toContain(testDir);
      expect(result).toMatch(/\*\*\/\*\.svg$/);
    });

    it('should return absolute path for glob patterns', async () => {
      const pattern = '*.svg';
      const result = await toAbsolutePattern(pattern);
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toContain(pattern);
    });

    it('should handle already absolute paths', async () => {
      const absolutePath = path.join(testDir, '*.svg');
      const result = await toAbsolutePattern(absolutePath);
      expect(result).toBe(absolutePath);
    });

    it('should handle non-existent paths as glob patterns', async () => {
      const nonExistent = path.join(testDir, 'nonexistent', '*.svg');
      const result = await toAbsolutePattern(nonExistent);
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('loadIcons', () => {
    it('should load SVG files from pattern', async () => {
      const pattern = path.join(testDir, '*.svg');
      const icons = await loadIcons(pattern, false);

      expect(icons.length).toBe(2);
      expect(icons[0].name).toBe('another-icon');
      expect(icons[1].name).toBe('test-icon');
      expect(icons[0].svg).toContain('<svg');
      expect(icons[0].sourcePath).toContain('another-icon.svg');
    });

    it('should sanitize icon names from filenames', async () => {
      const specialNameDir = path.join(testDir, 'special-names');
      await fs.mkdir(specialNameDir, { recursive: true });
      await fs.writeFile(
        path.join(specialNameDir, 'My Icon.svg'),
        '<svg><circle/></svg>'
      );

      const icons = await loadIcons(path.join(specialNameDir, '*.svg'), false);
      expect(icons[0].name).toBe('my-icon');

      await fs.rm(specialNameDir, { recursive: true });
    });

    it('should throw error for no SVG files found', async () => {
      const emptyDir = path.join(testDir, 'empty');
      await fs.mkdir(emptyDir, { recursive: true });

      await expect(
        loadIcons(path.join(emptyDir, '*.svg'), false)
      ).rejects.toThrow('No SVG files found');

      await fs.rm(emptyDir, { recursive: true });
    });

    it('should sort files alphabetically', async () => {
      const icons = await loadIcons(path.join(testDir, '*.svg'), false);
      const names = icons.map(i => i.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should work with SVGO optimization enabled', async () => {
      const icons = await loadIcons(path.join(testDir, '*.svg'), true);
      expect(icons.length).toBe(2);
      expect(icons[0].svg).toContain('<svg');
    });

    it('should filter only .svg files', async () => {
      const mixedDir = path.join(testDir, 'mixed');
      await fs.mkdir(mixedDir, { recursive: true });
      await fs.writeFile(path.join(mixedDir, 'icon.svg'), '<svg><circle/></svg>');
      await fs.writeFile(path.join(mixedDir, 'readme.txt'), 'not an svg');

      const icons = await loadIcons(path.join(mixedDir, '*'), false);
      expect(icons.length).toBe(1);
      expect(icons[0].name).toBe('icon');

      await fs.rm(mixedDir, { recursive: true });
    });
  });
});
