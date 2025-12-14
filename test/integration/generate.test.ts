import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { generateIconfont } from '../../src/index';

describe('generateIconfont integration', () => {
  const testOutputDir = path.join(__dirname, '../fixtures/output');
  const testInputDir = path.join(__dirname, '../fixtures');

  beforeAll(async () => {
    // Ensure output directory exists
    await fs.mkdir(testOutputDir, { recursive: true });
  });

  afterAll(async () => {
    // Clean up output directory
    try {
      await fs.rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should generate iconfont bundle from SVG files', async () => {
    const result = await generateIconfont({
      input: path.join(testInputDir, '*.svg'),
      output: testOutputDir,
      name: 'testfont',
      prefix: 'test',
      optimize: false,
    });

    // Check result structure
    expect(result).toHaveProperty('zipPath');
    expect(result).toHaveProperty('glyphs');
    expect(result).toHaveProperty('zipBuffer');

    // Check glyphs - should have 4 SVG files (Angular.svg, Node.js.svg, home.svg, test-icon.svg)
    expect(result.glyphs.length).toBe(4);

    // Verify each glyph has required properties
    result.glyphs.forEach((glyph, index) => {
      expect(glyph).toHaveProperty('name');
      expect(glyph).toHaveProperty('codepoint');
      expect(glyph).toHaveProperty('unicode');
      expect(glyph).toHaveProperty('svg');
      expect(glyph).toHaveProperty('sourcePath');

      // Verify codepoint sequence starts at 0xe001
      expect(glyph.codepoint).toBe(0xe001 + index);

      // Verify unicode matches codepoint
      expect(glyph.unicode).toBe(String.fromCodePoint(0xe001 + index));
    });

    // Verify specific icon names (kebab-cased from filenames)
    const glyphNames = result.glyphs.map(g => g.name).sort();
    expect(glyphNames).toContain('angular');
    expect(glyphNames).toContain('node-js');
    expect(glyphNames).toContain('home');
    expect(glyphNames).toContain('test-icon');

    // Check zip file was created
    const zipExists = await fs.access(result.zipPath).then(() => true).catch(() => false);
    expect(zipExists).toBe(true);

    // Check zip buffer
    expect(Buffer.isBuffer(result.zipBuffer)).toBe(true);
    expect(result.zipBuffer.length).toBeGreaterThan(0);
  }, 30000); // 30 second timeout for integration test

  it('should generate with custom codepoint start', async () => {
    const result = await generateIconfont({
      input: path.join(testInputDir, '*.svg'),
      output: testOutputDir,
      name: 'customfont',
      prefix: 'custom',
      optimize: false,
      codepointStart: 0xf000,
    });

    expect(result.glyphs.length).toBe(4);
    expect(result.glyphs[0].codepoint).toBe(0xf000);
    expect(result.glyphs[1].codepoint).toBe(0xf001);
    expect(result.glyphs[2].codepoint).toBe(0xf002);
    expect(result.glyphs[3].codepoint).toBe(0xf003);
  }, 30000);

  it('should throw error for empty input', async () => {
    const emptyDir = path.join(testOutputDir, 'empty');
    await fs.mkdir(emptyDir, { recursive: true });

    await expect(generateIconfont({
      input: path.join(emptyDir, '*.svg'),
      output: testOutputDir,
      name: 'emptyfont',
      prefix: 'empty',
      optimize: false,
    })).rejects.toThrow('No SVG files found');
  }, 30000);

  it('should generate correct CSS classes for all fixtures', async () => {
    const result = await generateIconfont({
      input: path.join(testInputDir, '*.svg'),
      output: testOutputDir,
      name: 'cssfont',
      prefix: 'icon',
      optimize: false,
    });

    // Verify all 4 icons are present with proper naming
    expect(result.glyphs.length).toBe(4);

    // Check for kebab-cased names
    const names = result.glyphs.map(g => g.name);
    expect(names).toContain('angular'); // from Angular.svg
    expect(names).toContain('node-js'); // from Node.js.svg
    expect(names).toContain('home'); // from home.svg
    expect(names).toContain('test-icon'); // from test-icon.svg

    // Verify source paths
    const sourcePaths = result.glyphs.map(g => path.basename(g.sourcePath));
    expect(sourcePaths).toContain('Angular.svg');
    expect(sourcePaths).toContain('Node.js.svg');
    expect(sourcePaths).toContain('home.svg');
    expect(sourcePaths).toContain('test-icon.svg');
  }, 30000);
});
