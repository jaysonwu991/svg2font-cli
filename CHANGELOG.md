# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-06-23

### Breaking Changes

- **Renamed packages** — `svg2font-cli` → `@jayson991/svg2font-cli`
- **Monorepo restructure** — packages now live under `packages/svg2font-cli/` and `packages/svg2font/`

### Added

- **`@jayson991/svg2font`** — new TypeScript/napi library package for programmatic use
  - Native Node.js addon built with napi-rs (no child_process spawning)
  - Full TypeScript type definitions (`index.d.ts`)
  - Async `generate()` function returning `Promise<GenerateResult>`
  - Platform-specific prebuilt addons: macOS (arm64/x64), Linux (arm64/x64), Windows (x64)
- **napi feature flag** — `cargo build --features napi` builds the `.node` addon

### Changed

- Root `package.json` is now a private workspace manifest (not published)
- CI workflow updated: separate build jobs for CLI binaries and napi addons
- All documentation rewritten to reflect the actual Rust implementation

---

## [1.0.2] - 2025-12-26

### ✨ Improvements

#### Performance Optimizations
- **Parallel Processing** - Font format conversions (WOFF, WOFF2, EOT) now run in parallel
- **Parallel Icon Loading** - SVG files are now loaded and processed concurrently
- **Cached Regex Patterns** - Pre-compiled regex patterns for SVG path parsing

#### Code Quality & Documentation
- **Enhanced JSDoc Comments** - Comprehensive documentation added to core functions:
  - `generateIconfont()` - Complete API documentation with examples
  - `sanitizeName()` - Filename sanitization documentation
  - `toAbsolutePattern()` - Path resolution documentation
  - `loadIcons()` - Icon loading documentation
- **Code Refactoring** - Better modularization of font generation code:
  - Split `ttf-converter.ts` into focused modules (`binary-writer.ts`, `ttf-builder.ts`, `svg-to-ttf-path.ts`)
  - Improved separation of concerns for better maintainability

#### Documentation Updates
- **README.md** - Updated with performance improvements and new npm scripts
- **Removed Planned Features** - Cleaned up unreleased features section

### 🐛 Bug Fixes
- Fixed regex lastIndex issue in global pattern matching

---

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

[2.0.0]: https://github.com/jaysonwu991/svg2font/releases/tag/v2.0.0
[1.0.2]: https://github.com/jaysonwu991/svg2font/releases/tag/v1.0.2
[1.0.0]: https://github.com/jaysonwu991/svg2font/releases/tag/v1.0.0
