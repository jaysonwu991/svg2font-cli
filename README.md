# svg2font-cli

> 🎨 Convert SVG icon sets into complete iconfont bundles (SVG/TTF/WOFF/WOFF2/EOT) with CSS, demos, and sprites

[![npm version](https://img.shields.io/npm/v/svg2font-cli.svg)](https://www.npmjs.com/package/svg2font-cli)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/node/v/svg2font-cli.svg)](https://nodejs.org/)

Transform a folder of SVG icons into a professional, production-ready iconfont bundle — just like [iconfont.cn](https://www.iconfont.cn/), but as a CLI tool and Node.js library. Built with TypeScript, zero native dependencies.

## 🎯 Why Use This?

**Problem:** You have a folder of SVG icons and need to use them as an iconfont in your web project.

**Solution:** This tool automatically generates:
- ✅ Font files in all formats (SVG, TTF, WOFF, WOFF2, EOT)
- ✅ Ready-to-use CSS with three different usage methods
- ✅ Beautiful HTML demo pages to preview your icons
- ✅ SVG sprites for modern web apps
- ✅ Complete bundle packaged in a single zip file

**Perfect for:**
- Design systems needing consistent icon sets
- Converting custom SVG icons to web fonts
- Projects requiring IE11 support (EOT format)
- Teams wanting iconfont.cn-style output locally

## 📋 Requirements

- **Node.js** 18.0.0 or higher

## 🚀 Quick Start

### Installation

```bash
# Using npm (recommended for global CLI)
npm install -g svg2font-cli

# Or with pnpm
pnpm add -g svg2font-cli

# Or with yarn
yarn global add svg2font-cli
```

### Basic Usage

**Step 1:** Create a folder with your SVG icons
```
icons/
├── home.svg
├── user.svg
└── settings.svg
```

**Step 2:** Run the command
```bash
svg2font --input ./icons --output ./dist --name myicons
```

**Step 3:** Use the generated files
```
dist/
└── myicons.zip  ← Extract this to your project
```

That's it! Open `demo.html` inside the zip to see all three usage methods.

### Advanced Options

```bash
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

## 📦 What You Get

The CLI generates a complete iconfont bundle in a zip file:

```
myicons.zip
└── myicons/
    ├── 🔤 Font Files
    │   ├── myicons.svg          # SVG font
    │   ├── myicons.ttf          # TrueType font
    │   ├── myicons.woff         # WOFF font (modern browsers)
    │   ├── myicons.woff2        # WOFF2 font (best compression)
    │   └── myicons.eot          # EOT font (IE11 support)
    │
    ├── 🎨 Stylesheets & Assets
    │   ├── myicons.css          # Main stylesheet with @font-face
    │   ├── myicons.js           # SVG sprite auto-injector
    │   └── myicons.symbol.svg   # SVG sprite definitions
    │
    ├── 📄 Documentation
    │   ├── demo.html            # Live preview of all icons
    │   ├── demo.css             # Demo page styles
    │   └── myicons.json         # Glyph metadata (names, unicode points)
```

**Key benefits:**
- All font formats for maximum browser compatibility
- Three different usage methods (see below)
- Interactive demo to copy-paste code snippets
- JSON manifest for programmatic access

## 🎯 Three Ways to Use Your Icons

The generated CSS supports three different methods. Choose based on your needs:

### 1. 📝 Unicode Mode (Simplest)

**When to use:** Simple projects, minimal CSS

Direct Unicode character references:

```html
<link rel="stylesheet" href="myicons.css">
<span class="iconfont">&#xe001;</span>
```

✅ Smallest CSS footprint
❌ Hard to remember unicode values

### 2. 🏷️ Font Class Mode (Recommended)

**When to use:** Most projects, readable code

Semantic class names:

```html
<link rel="stylesheet" href="myicons.css">
<i class="iconfont icon-home"></i>
<i class="iconfont icon-user"></i>
<i class="iconfont icon-settings"></i>
```

✅ Easy to read and maintain
✅ Works in all browsers
❌ Slightly larger CSS file

### 3. 🎨 SVG Symbol Mode (Modern)

**When to use:** Modern apps, multicolor icons, better accessibility

SVG sprites with `<use>` elements:

```html
<!-- Auto-inject SVG sprite -->
<script src="myicons.js"></script>
<svg class="icon" aria-hidden="true">
  <use href="#icon-home"></use>
</svg>
```

✅ Multicolor support
✅ Better accessibility
✅ CSS animations work better
❌ No IE11 support

**Advanced: Manual sprite loading**
```html
<script src="myicons.js" data-disable-injectsvg="true"></script>
<svg class="icon">
  <use href="myicons.symbol.svg#icon-home"></use>
</svg>
```

### Styling Your Icons

All modes support standard CSS styling:

```css
.icon {
  width: 1em;
  height: 1em;
  font-size: 32px;  /* Control size */
  color: #333;      /* Control color */
}
```

## 💻 Use as a Node.js Library

Install as a project dependency and use programmatically:

```bash
npm install svg2font-cli
# or
pnpm add svg2font-cli
```

### Basic Example

```typescript
import { generateIconfont } from 'svg2font-cli';

const result = await generateIconfont({
  input: 'icons/**/*.svg',
  output: 'dist',
  name: 'myicons',
  prefix: 'icon',
  optimize: true,
});

console.log(`✅ Generated: ${result.zipPath}`);
console.log(`📊 Total icons: ${result.glyphs.length}`);
```

### API Reference

```typescript
interface GenerateOptions {
  input: string;           // Glob pattern or directory (e.g., "icons/*.svg")
  output: string;          // Output directory (e.g., "dist")
  name: string;            // Font family name (e.g., "myicons")
  prefix?: string;         // CSS class prefix (default: "icon")
  optimize?: boolean;      // Run SVGO optimization (default: true)
  codepointStart?: number; // Starting Unicode point (default: 0xe001)
}

interface GenerateResult {
  zipPath: string;         // Full path to generated zip file
  zipBuffer: Buffer;       // Zip file contents in memory
  glyphs: GlyphMeta[];     // Array of icon metadata
}

interface GlyphMeta {
  name: string;            // Icon name (e.g., "home")
  unicode: string;         // Unicode character (e.g., "&#xe001;")
  className: string;       // CSS class name (e.g., "icon-home")
}
```

### Advanced Example

```typescript
import { generateIconfont } from 'svg2font-cli';
import { writeFileSync } from 'fs';

// Generate with custom options
const result = await generateIconfont({
  input: 'src/assets/icons/**/*.svg',
  output: 'dist/fonts',
  name: 'my-design-system',
  prefix: 'ds-icon',
  optimize: true,
  codepointStart: 0xf000, // Custom unicode range
});

// Access the zip buffer directly
writeFileSync('custom-path/fonts.zip', result.zipBuffer);

// Generate a custom mapping file
const mapping = result.glyphs.reduce((acc, glyph) => {
  acc[glyph.name] = {
    unicode: glyph.unicode,
    className: glyph.className,
  };
  return acc;
}, {});

writeFileSync('icon-mapping.json', JSON.stringify(mapping, null, 2));
```

## ❓ Common Questions

### How do I name my SVG files?

Filenames are automatically converted to kebab-case CSS classes:
- `home.svg` → `.icon-home`
- `User Profile.svg` → `.icon-user-profile`
- `Node.js.svg` → `.icon-node-js`

**Best practices:**
- Use descriptive names (e.g., `arrow-right.svg` not `icon1.svg`)
- Avoid special characters
- Lowercase is recommended

### What if my icons don't display correctly?

Common issues and fixes:

1. **Icon is the wrong size**
   ```css
   .iconfont { font-size: 24px; } /* Adjust this */
   ```

2. **Icon colors don't work**
   - Font icons are monochrome by default
   - Use SVG Symbol mode for multicolor support
   - Set color with CSS: `color: #ff0000;`

3. **Icons show as squares/missing glyphs**
   - Check that your SVG files are valid
   - Ensure the CSS file is loaded before HTML
   - Verify font files are accessible (check browser console)

### Can I use this in production?

Yes! This tool generates production-ready assets:
- All major font formats for cross-browser support
- Optimized SVG paths (via SVGO)
- IE11 support included (EOT format)
- Used in projects similar to iconfont.cn

### How is this different from iconfont.cn?

| Feature | svg2font-cli | iconfont.cn |
|---------|--------------|-------------|
| **Privacy** | ✅ All local, no upload | ❌ Must upload icons |
| **Offline** | ✅ Works offline | ❌ Requires internet |
| **Automation** | ✅ CI/CD friendly | ❌ Manual process |
| **Customization** | ✅ Full control | Limited |
| **Open Source** | ✅ ISC License | ❌ Closed |

## 🎨 SVG File Requirements

Your SVG files should:
- ✅ Be valid SVG format
- ✅ Contain `<path>` elements
- ✅ Have viewBox attribute (or width/height)
- ✅ Use single color (for font mode) or multiple colors (for symbol mode)
- ❌ Avoid external dependencies (linked images, external CSS)
- ❌ Avoid filters or effects that don't translate to fonts

**Tip:** The tool automatically optimizes SVGs with SVGO. Use `--no-optimize` only if you've already optimized them.

## 🛠️ Development

Want to contribute or customize the tool?

```bash
# Clone and setup
git clone https://github.com/jaysonwu991/svg2font-cli.git
cd svg2font-cli
pnpm install

# Development commands
pnpm build              # Build the project
pnpm test               # Run tests
pnpm test:coverage      # Generate coverage report
pnpm lint               # Check code quality
pnpm lint:fix           # Fix linting issues
pnpm format             # Format code
pnpm format:check       # Check code formatting
pnpm type-check         # TypeScript validation

# Test the CLI locally
node lib/cli.js -i ./assets -o ./dist
```

### Project Architecture

```
src/
├── cli/                    # Command-line interface
├── core/                   # Core business logic
│   ├── generate.ts         # Main orchestrator
│   ├── icons.ts            # SVG loading with SVGO
│   ├── glyphs.ts           # Unicode codepoint assignment
│   └── sprite.ts           # SVG sprite generation
├── utils/font/             # Font generation engine
│   ├── ttf-converter.ts    # TTF generation orchestration
│   ├── ttf-builder.ts      # TTF table construction
│   ├── binary-writer.ts    # Binary data writing utilities
│   ├── svg-to-ttf-path.ts  # Path conversion algorithms
│   ├── woff2-converter.ts  # WOFF2 generation
│   └── svg-path-parser.ts  # SVG path parsing
├── templates/              # CSS/HTML/JS generators
└── types.ts                # TypeScript definitions
```

**Key features of the codebase:**
- 🚀 Pure TypeScript - zero native dependencies
- ✅ Full test coverage with Vitest
- 📝 Comprehensive JSDoc documentation
- 🎨 Modern build system with Vite
- 🔍 Strict linting with oxlint
- ⚡ Performance-optimized with parallel processing

## 🔬 Technical Deep Dive

For those interested in the implementation details:

### Performance Optimizations

**Version 1.0.2+ includes significant performance improvements:**
- **Parallel Font Conversion** - WOFF, WOFF2, and EOT formats are generated concurrently from TTF
- **Parallel Icon Loading** - All SVG files are loaded and processed simultaneously using `Promise.all()`
- **Regex Pattern Caching** - Pre-compiled regex patterns eliminate repeated compilation overhead
- **Efficient Memory Usage** - Modular architecture reduces memory footprint

These optimizations can reduce total generation time by 30-50% for large icon sets.

### Zero Native Dependencies

Unlike similar tools that rely on native bindings (node-gyp, Python scripts), this project is **100% pure TypeScript/JavaScript**:

- **Custom TTF Generator** - Hand-coded TrueType font table builder (10 SFNT tables)
- **Cubic-to-Quadratic Bezier** - Recursive curve conversion with adaptive subdivision
- **Pure JS WOFF/WOFF2** - Native compression using Node.js zlib and brotli
- **Binary Protocol Implementation** - Custom ZIP, TTF, WOFF, WOFF2, and EOT format writers

### Font Generation Pipeline

```
SVG Files
    ↓
1. Load & Optimize (SVGO)
    ↓
2. Assign Unicode Codepoints (0xe001+)
    ↓
3. Generate SVG Font
    ↓
4. Parse SVG Paths → Convert to TTF Contours
    ↓
5. Build TTF Binary (head, hhea, maxp, post, name, cmap, glyf, loca, hmtx, OS/2)
    ↓
6. Convert TTF → WOFF (zlib), WOFF2 (brotli), EOT
    ↓
7. Generate Templates (CSS, HTML, JS)
    ↓
8. Package ZIP Bundle
```

This approach ensures:
- ✅ No installation issues across platforms
- ✅ Predictable behavior everywhere
- ✅ Easy to audit and modify
- ✅ No binary dependencies breaking with Node.js updates

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
