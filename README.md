# svg2font-cli

> 🎨 Convert SVG icon sets into complete iconfont bundles (SVG/TTF/WOFF/WOFF2/EOT) with CSS, demos, and sprites

[![npm version](https://img.shields.io/npm/v/svg2font-cli.svg)](https://www.npmjs.com/package/svg2font-cli)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/node/v/svg2font-cli.svg)](https://nodejs.org/)

A modern, zero-native-dependency CLI and Node.js library that transforms a folder of SVG icons into a professional iconfont bundle, similar to [iconfont.cn](https://www.iconfont.cn/). Built with TypeScript, featuring pure-JS TTF generation without native bindings.

## ✨ Features

- 🚀 **Zero Native Dependencies** - Pure TypeScript/JavaScript implementation
- 📦 **Complete Bundle** - Generates SVG, TTF, WOFF, WOFF2, and EOT formats
- 🎯 **Three Usage Modes** - Unicode, Font Class, and SVG Symbol
- 🎨 **Beautiful Demos** - Auto-generated HTML demos with live examples
- ⚡ **Modern Tooling** - Built with Vite, oxlint, and TypeScript
- 🔧 **CLI & API** - Use as command-line tool or Node.js library
- 🎭 **Smart Optimization** - Built-in SVGO optimization (optional)
- 📝 **Full TypeScript** - Complete type definitions included

## 📋 Requirements

- **Node.js** 18.0.0 or higher
- **pnpm** (optional, but recommended)

## 🚀 Quick Start

### Installation

```bash
# Using npm
npm install -g svg2font-cli

# Using pnpm
pnpm add -g svg2font-cli

# Using yarn
yarn global add svg2font-cli
```

### Basic Usage

```bash
# Simple command
svg2font --input ./icons --output ./dist --name myicons

# With all options
svg2font -i ./icons -o ./dist -n myicons -p icon --no-optimize
```

## 📖 CLI Options

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--input` | `-i` | `assets` | Directory or glob pattern for SVG files |
| `--output` | `-o` | `dist` | Output directory for the generated zip |
| `--name` | `-n` | `iconfont` | Font family name (used for files and CSS) |
| `--prefix` | `-p` | `icon` | CSS class prefix (e.g., `icon-home`) |
| `--no-optimize` | - | `false` | Skip SVGO optimization |

## 📦 Output Structure

Running the CLI produces a zip file `<name>.zip` containing:

```
myicons/
├── myicons.svg          # SVG font
├── myicons.ttf          # TrueType font
├── myicons.woff         # WOFF font
├── myicons.woff2        # WOFF2 font
├── myicons.eot          # EOT font (IE support)
├── myicons.css          # Iconfont stylesheet
├── myicons.js           # Auto-injecting sprite loader
├── myicons.symbol.svg   # SVG sprite
├── myicons.json         # Glyph metadata manifest
├── demo.css             # Demo page styles
├── demo.html            # Interactive demo page
└── demo_index.html      # Demo page (alternate)
```

## 🎯 Usage Modes

### 1. Unicode Mode

Direct Unicode character references with minimal CSS:

```html
<link rel="stylesheet" href="myicons.css">
<span class="iconfont">&#xe001;</span>
```

### 2. Font Class Mode

Semantic class names for better readability:

```html
<link rel="stylesheet" href="myicons.css">
<span class="iconfont icon-home"></span>
```

### 3. SVG Symbol Mode

Modern SVG sprites with `<use>` elements:

```html
<script src="myicons.js" data-injectcss="true"></script>
<svg class="icon" aria-hidden="true">
  <use href="#icon-home"></use>
</svg>
```

**Disable auto-injection:**

```html
<script src="myicons.js" data-disable-injectsvg="true"></script>
<svg class="icon">
  <use href="myicons.symbol.svg#icon-home"></use>
</svg>
```

## 💻 Programmatic Usage

Use as a Node.js library with full TypeScript support:

```typescript
import { generateIconfont } from 'svg2font-cli';

const result = await generateIconfont({
  input: 'icons/**/*.svg',
  output: 'dist',
  name: 'myicons',
  prefix: 'icon',
  optimize: true,
  codepointStart: 0xe001, // Optional: custom starting codepoint
});

console.log(`Generated: ${result.zipPath}`);
console.log(`Total glyphs: ${result.glyphs.length}`);
```

### API Types

```typescript
interface GenerateOptions {
  input: string;           // Glob pattern or directory
  output: string;          // Output directory
  name: string;            // Font family name
  prefix?: string;         // CSS class prefix (default: 'icon')
  optimize?: boolean;      // Run SVGO optimization (default: true)
  codepointStart?: number; // Starting Unicode codepoint (default: 0xe001)
}

interface GenerateResult {
  zipPath: string;         // Path to generated zip file
  zipBuffer: Buffer;       // Zip file contents
  glyphs: GlyphMeta[];     // Array of glyph metadata
}
```

## 🏗️ Project Structure

```
svg2font-cli/
├── src/
│   ├── cli/                 # CLI interface
│   │   └── run.ts          # Command setup
│   ├── core/                # Business logic
│   │   ├── generate.ts      # Main orchestrator
│   │   ├── icons.ts         # SVG loading with SVGO
│   │   ├── glyphs.ts        # Codepoint assignment
│   │   ├── names.ts         # CSS class name generation
│   │   ├── sprite.ts        # SVG sprite creation
│   │   ├── svg-font-generator.ts
│   │   ├── svg-sprite-store.ts
│   │   └── zip.ts           # ZIP archive generation
│   ├── utils/               # Shared utilities
│   │   ├── svg-helpers.ts   # SVG parsing
│   │   └── font/            # Font generation modules
│   │       ├── ttf-converter.ts    # TTF/WOFF/EOT generation
│   │       ├── woff2-converter.ts  # WOFF2 generation
│   │       ├── svg-path-parser.ts  # SVG path parsing
│   │       ├── svg-to-ttf-path.ts  # Path conversion
│   │       ├── binary-writer.ts    # Binary utilities
│   │       └── ttf-builder.ts      # TTF table building
│   ├── templates/           # CSS/HTML/JS generators
│   │   ├── css.ts           # Font CSS
│   │   ├── demo.ts          # Demo HTML
│   │   ├── demo-css.ts      # Demo styles
│   │   ├── iconfont.ts      # Sprite loader
│   │   ├── manifest.ts      # JSON metadata
│   │   └── shared.ts        # Template helpers
│   ├── types.ts             # TypeScript interfaces
│   ├── defaults.ts          # Configuration defaults
│   └── index.ts             # Main exports
├── lib/                     # Built output (gitignored)
├── test/                    # Test files
└── package.json
```

## 🎨 File Naming Conventions

- SVG filenames are automatically converted to kebab-case
- Example: `Node.js.svg` → `.icon-node-js`
- Special characters are removed or replaced with hyphens
- All class names are lowercase for consistency

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/jaysonwu991/svg2font-cli.git
cd svg2font-cli

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run linting
pnpm lint

# Format code
pnpm format

# Run the CLI locally
node lib/cli.js --input ./assets --output ./dist
```

### Available Scripts

- `pnpm build` - Clean, build JS bundles, and generate type definitions
- `pnpm clean` - Remove the `lib/` directory
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Generate coverage report
- `pnpm lint` - Run oxlint on source files
- `pnpm lint:fix` - Auto-fix linting issues
- `pnpm format` - Format code with oxfmt
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking

## 🔧 Technical Details

### Pure TypeScript Implementation

- **No Native Dependencies** - Everything runs in pure JavaScript/TypeScript
- **Custom TTF Generation** - Hand-coded TrueType font table generation (10 SFNT tables)
- **Cubic-to-Quadratic** - Recursive Bézier curve conversion with tolerance-based subdivision
- **Path Optimization** - Contour simplification, interpolation, and even-odd fill rule
- **WOFF/WOFF2 Conversion** - Pure JS implementations using zlib deflate and brotli
- **EOT Support** - IE compatibility format with proper metadata encoding
- **Binary Protocol Mastery** - Custom implementations of ZIP, TTF, WOFF, WOFF2, and EOT formats

### Font Generation Pipeline

1. **Load & Sanitize** - Read SVG files and clean paths
2. **Assign Codepoints** - Map icons to Unicode Private Use Area
3. **Generate SVG Font** - Create SVG font with proper metrics
4. **Convert to TTF** - Build TrueType tables and binary format
5. **Generate WOFF/WOFF2/EOT** - Convert TTF to web formats
6. **Build Templates** - Generate CSS, demos, and sprites
7. **Package** - Create organized zip bundle

## 📄 License

ISC © [Jayson Wu](https://github.com/jaysonwu991)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Issues

Found a bug? Have a feature request? Please [open an issue](https://github.com/jaysonwu991/svg2font-cli/issues).

## 🙏 Acknowledgments

- Inspired by [iconfont.cn](https://www.iconfont.cn/)
- Built with modern tooling: Vite, oxlint, oxfmt
- Uses SVGO for SVG optimization

---

**Made with ❤️ by [Jayson Wu](https://github.com/jaysonwu991)**
