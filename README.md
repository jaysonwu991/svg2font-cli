# svg2font-cli

> Convert a folder (or glob) of SVG icons into an iconfont bundle and zip it up, similar to [iconfont.cn](https://www.iconfont.cn/).

## Requirements

- Node.js 18+
- pnpm (enforced via `only-allow`)

## Quick start

```bash
$ pnpm install
$ pnpm build   # bundles with Vite and emits type declarations to ./lib
$ node lib/cli.js --input ./assets --output ./dist --name iconfont --prefix icon
# or after publishing/installing globally
$ svg2font --input ./assets --output ./dist --name iconfont --prefix icon
```

## Options

- `-i, --input` Directory or glob for `.svg` files (default: `assets`)
- `-o, --output` Output directory where the zip is written (default: `dist`)
- `-n, --name` Font family name used for files and CSS (default: `iconfont`)
- `-p, --prefix` CSS class prefix (default: `icon`, results in classes like `.icon-angular`)
- `--no-optimize` Skip SVGO optimization if you already clean your icons

## Output

Running the CLI produces a zip named `<fontName>.zip` with an `<fontName>/` folder inside:

- `<fontName>.svg/.ttf/.woff/.woff2/.eot` font files (cache-busted in the CSS)
- `<fontName>.css` iconfont-style stylesheet (supports `.iconfont` plus your prefix; icon classes are lowercased/kebab-cased, e.g. `.icon-node-js`)
- `<fontName>.js` auto-injecting SVG sprite loader (respects `data-disable-injectsvg`)
- `<fontName>.symbol.svg` raw sprite
- `<fontName>.json` iconfont-style manifest of glyph metadata
- `demo.css` and `demo_index.html` (plus `demo.html`) showcasing Unicode, font-class, and symbol usage

### Naming and classes

- SVG file names are sanitized to lowercase kebab-case. With the default prefix `icon`, an input `Node.js.svg` becomes the class `.icon-node-js`.
- The base class `.iconfont` is always available; your prefix is added as well (e.g. `.iconfont.icon-node-js`).

### Symbol usage

By default, `iconfont.js` injects the sprite into the page. A typical usage:

```html
<script src="iconfont.js" data-injectcss="true"></script>
<svg class="icon" aria-hidden="true">
  <use href="#icon-angular"></use>
</svg>
```

If you do not want auto-injection, add `data-disable-injectsvg="true"` and point to the standalone sprite:

```html
<script src="iconfont.js" data-disable-injectsvg="true"></script>
<svg class="icon" aria-hidden="true">
  <use href="iconfont.symbol.svg#icon-angular"></use>
</svg>
```

Implementation details:

- Pure TypeScript pipeline: custom cubic-to-quadratic conversion and TTF→WOFF/WOFF2/EOT generation (no native binaries).
- Arc and shorthand SVG commands are expanded before font generation to improve glyph consistency.

## Development

- `pnpm lint` / `pnpm lint:fix` uses `oxlint` with your `tsconfig.json`.
- `pnpm format` formats in place with `oxfmt`, and `pnpm format:check` runs `oxfmt --check` on `src`.
- `pnpm build` runs Vite for JS bundling then `tsc --emitDeclarationOnly` for `.d.ts`.

## Programmatic use

You can also call the generator directly in Node (the build emits type declarations):

```ts
import { generateIconfont } from "svg2font-cli";

await generateIconfont({
  input: "assets",
  output: "dist",
  name: "iconfont",
  prefix: "icon",
  optimize: true,
  // Optional: codepointStart: 0xe001,
});
```
