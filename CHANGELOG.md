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
  - `src/lib/` - Low-level font generation
  - `src/lib/font/` - Focused font modules (buffer, builder, path-conversion)
  - `src/core/` - Business logic
  - `src/templates/` - Output generators
  - `src/utils/` - Shared utilities

- **Code Quality**
  - Eliminated code duplication
  - Clear, descriptive file names
  - Well-organized imports
  - Comprehensive inline documentation

### Technical Details

#### Pure TypeScript Implementation
- No native bindings or external font tools
- Custom implementation of:
  - TTF binary format generation
  - WOFF/WOFF2 conversion
  - SVG path parsing and transformation
  - Glyph contour processing

#### Optimizations
- Efficient path simplification algorithms
- Smart contour orientation detection
- Minimal file sizes through optimization
- Fast build times with Vite

### Dependencies

#### Production
- `commander` (^14.0.2) - CLI argument parsing
- `fast-glob` (^3.3.3) - Fast file pattern matching
- `svgo` (^4.0.0) - SVG optimization

#### Development
- `typescript` (^5.9.3) - Type checking
- `vite` (^7.2.6) - Build tool
- `oxlint` (^1.31.0) - Fast linting
- `oxfmt` (^0.16.0) - Code formatting

### Requirements
- Node.js 18.0.0 or higher

### License
MIT

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
