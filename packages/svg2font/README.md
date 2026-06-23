# @jayson991/svg2font

> Generate icon fonts from SVG files — TypeScript/napi library

[![npm version](https://img.shields.io/npm/v/@jayson991/svg2font.svg)](https://www.npmjs.com/package/@jayson991/svg2font)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/node/v/@jayson991/svg2font.svg)](https://nodejs.org/)

A native Node.js addon (napi-rs) wrapping the same Rust core as the CLI. Provides full TypeScript types and `async/await` support. Zero JavaScript font dependencies — all font generation happens in native Rust code.

For the CLI tool, see [`@jayson991/svg2font-cli`](../svg2font-cli/README.md).

## Requirements

- Node.js 18 or higher
- One of: macOS (arm64/x64), Linux (arm64/x64), Windows (x64)

## Installation

```bash
npm install @jayson991/svg2font

# Or with pnpm
pnpm add @jayson991/svg2font

# Or with yarn
yarn add @jayson991/svg2font
```

## Quick Start

```typescript
import { generate } from '@jayson991/svg2font';

const result = await generate({
  src: 'icons/**/*.svg',
  dist: 'dist',
  fontName: 'myicons',
});

console.log(`Generated ${result.glyphs.length} icons`);
console.log(`Bundle: ${result.zipPath}`);
```

## API

### `generate(options): Promise<GenerateResult>`

```typescript
export function generate(options: GenerateOptions): Promise<GenerateResult>;
```

#### GenerateOptions

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `src` | `string` | Yes | — | Glob pattern for source SVG files (e.g. `"icons/**/*.svg"`) |
| `dist` | `string` | Yes | — | Output directory |
| `fontName` | `string` | Yes | — | Font family name used in file names and CSS |
| `prefix` | `string` | No | `"icon"` | CSS class prefix |
| `startCodepoint` | `number` | No | `57345` (0xe001) | Starting Unicode codepoint |

#### GenerateResult

| Field | Type | Description |
|-------|------|-------------|
| `glyphs` | `GlyphMeta[]` | Metadata for every generated icon |
| `zipPath` | `string` | Absolute path to the generated ZIP archive |

#### GlyphMeta

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Icon name in kebab-case (e.g. `"arrow-right"`) |
| `codepoint` | `number` | Assigned Unicode codepoint (e.g. `57345`) |
| `unicode` | `string` | HTML entity (e.g. `"&#xe001;"`) |
| `className` | `string` | Full CSS class name (e.g. `"icon-arrow-right"`) |

## Examples

### Basic usage

```typescript
import { generate } from '@jayson991/svg2font';

const result = await generate({
  src: 'src/assets/icons/**/*.svg',
  dist: 'public/fonts',
  fontName: 'myicons',
  prefix: 'icon',
});

for (const glyph of result.glyphs) {
  console.log(`${glyph.className}  →  ${glyph.unicode}`);
}
```

### Custom codepoint range

```typescript
import { generate } from '@jayson991/svg2font';
import { writeFileSync } from 'fs';

const result = await generate({
  src: 'icons/**/*.svg',
  dist: 'dist',
  fontName: 'design-system',
  prefix: 'ds',
  startCodepoint: 0xf000,
});

// Write a custom mapping file
const mapping = Object.fromEntries(
  result.glyphs.map(g => [g.name, { unicode: g.unicode, className: g.className }])
);
writeFileSync('icon-map.json', JSON.stringify(mapping, null, 2));
```

### Build script integration

```typescript
// scripts/build-icons.ts
import { generate } from '@jayson991/svg2font';

async function main() {
  const result = await generate({
    src: 'design/icons/**/*.svg',
    dist: 'src/assets/fonts',
    fontName: 'app-icons',
    prefix: 'icon',
  });
  console.log(`Built ${result.glyphs.length} icons → ${result.zipPath}`);
}

main().catch(console.error);
```

## Output

The `dist/{fontName}/` directory is created containing:

- `{name}.ttf` — TrueType font
- `{name}.woff` — WOFF (zlib)
- `{name}.woff2` — WOFF2 (brotli)
- `{name}.eot` — EOT (IE11)
- `{name}.svg` — SVG font
- `{name}.css` — Stylesheet with `@font-face`
- `{name}.js` — SVG sprite auto-injector
- `{name}.symbol.svg` — SVG sprite
- `{name}.json` — Glyph metadata
- `demo.html` / `demo.css` — Interactive preview

A ZIP archive is also written at `{dist}/{fontName}.zip`.

## Platform Support

| Platform | Architecture |
|----------|-------------|
| macOS | arm64 (Apple Silicon) |
| macOS | x64 (Intel) |
| Linux | x64 |
| Linux | arm64 |
| Windows | x64 |

## License

MIT © [Jayson Wu](https://github.com/jaysonwu991)
