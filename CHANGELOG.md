# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-14

### 🎉 Initial Release

#### Added
- ✨ Complete iconfont generation from SVG files
- 📦 Multiple font format support (SVG, TTF, WOFF, WOFF2, EOT)
- 🎯 Three usage modes: Unicode, Font Class, and SVG Symbol
- 🎨 Auto-generated demo pages with live examples
- 💻 CLI tool with intuitive options
- 📚 Programmatic Node.js API with TypeScript support
- ⚡ Built-in SVGO optimization (optional)
- 🚀 Zero native dependencies - pure TypeScript implementation

#### Features
- **Font Generation**
  - Custom TTF table generation
  - Cubic-to-quadratic Bézier conversion
  - Path optimization and simplification
  - Proper font metrics and kerning

- **Output Bundle**
  - CSS stylesheets with cache-busting
  - Interactive demo pages
  - SVG sprite with auto-injection
  - JSON manifest with glyph metadata
  - Organized ZIP archive

- **Developer Experience**
  - Full TypeScript support with type definitions
  - Modern tooling (Vite, oxlint, oxfmt)
  - Clean, modular code structure
  - Comprehensive documentation

#### Project Structure
- **Modular Architecture**
  - `src/cli/` - CLI command setup
  - `src/core/` - Business logic (generate, icons, glyphs, names, sprite, svg-font-generator, svg-sprite-store, zip)
  - `src/utils/` - Shared utilities
  - `src/utils/font/` - Font generation modules (ttf-converter, woff2-converter, svg-path-parser, svg-to-ttf-path, binary-writer, ttf-builder)
  - `src/templates/` - Output generators (css, demo, demo-css, iconfont, manifest, shared)
  - `src/types.ts` - TypeScript interfaces
  - `src/defaults.ts` - Configuration constants

- **Code Quality**
  - Eliminated code duplication
  - Clear, descriptive file names
  - Well-organized imports
  - Comprehensive inline documentation
  - Full test coverage with Vitest

### Technical Details

#### Pure TypeScript Implementation
- No native bindings or external font tools
- Custom implementation of:
  - TTF binary format generation (10 SFNT tables: OS/2, cmap, glyf, head, hhea, hmtx, loca, maxp, name, post)
  - WOFF/WOFF2 conversion with compression
  - EOT format for IE support
  - SVG path parsing and transformation
  - Glyph contour processing with even-odd fill rule
  - ZIP archive generation

#### Optimizations
- Recursive cubic-to-quadratic Bézier curve conversion with tolerance-based subdivision
- Efficient path simplification algorithms
- Smart contour orientation detection
- Collinear point removal
- Interpolated point optimization
- Minimal file sizes through compression
- Fast build times with Vite

### Dependencies

#### Production
- `commander` (^14.0.2) - CLI argument parsing
- `fast-glob` (^3.3.3) - Fast file pattern matching
- `svgo` (^4.0.0) - SVG optimization

#### Development
- `typescript` (^5.9.3) - Type checking
- `vite` (^7.2.6) - Build tool
- `vitest` (^4.0.15) - Test runner with coverage
- `@vitest/coverage-v8` (4.0.15) - Code coverage
- `@vitest/ui` (^4.0.15) - Test UI
- `happy-dom` (^20.0.11) - DOM simulation for tests
- `oxlint` (^1.31.0) - Fast linting
- `oxfmt` (^0.16.0) - Code formatting
- `@types/node` (^24.10.1) - Node.js type definitions

### Requirements
- Node.js 18.0.0 or higher

### License
ISC

---

## [Unreleased]

### Planned Features
- [ ] Additional font formats (OTF)
- [ ] Custom templates support
- [ ] Incremental builds
- [ ] Watch mode for development
- [ ] Integration with popular build tools

---

[1.0.0]: https://github.com/jaysonwu991/svg2font-cli/releases/tag/v1.0.0
