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
- `-p, --prefix` CSS class prefix (default: `icon`)
- `--no-optimize` Skip SVGO optimization if you already clean your icons

## Output

Running the CLI produces a zip named `<fontName>.zip` with:

- `<fontName>.svg/.ttf/.woff/.woff2/.eot`
- `<fontName>.css` ready to drop into your app
- `<fontName>.js` with an inline SVG sprite (iconfont-style loader)
- `<fontName>.symbol.svg` raw sprite file
- `demo.html` quick preview page showing all glyphs

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
