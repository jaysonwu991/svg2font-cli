#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const { platform, arch } = process;

const TARGETS = {
  darwin: {
    arm64: "@jaysonwu991/svg2font-cli-darwin-arm64/svg2font",
    x64: "@jaysonwu991/svg2font-cli-darwin-x64/svg2font",
  },
  linux: {
    arm64: "@jaysonwu991/svg2font-cli-linux-arm64/svg2font",
    x64: "@jaysonwu991/svg2font-cli-linux-x64/svg2font",
  },
  win32: {
    x64: "@jaysonwu991/svg2font-cli-win32-x64/svg2font.exe",
  },
};

const pkgBin = process.env.SVG2FONT_BINARY || TARGETS?.[platform]?.[arch];

if (!pkgBin) {
  console.error(
    `svg2font-cli: unsupported platform ${platform}/${arch}\n` +
    `  Supported: darwin/arm64, darwin/x64, linux/arm64, linux/x64, win32/x64\n` +
    `  You can set SVG2FONT_BINARY to a binary path to override.`
  );
  process.exit(1);
}

let binPath;
try {
  binPath = require.resolve(pkgBin);
} catch {
  console.error(
    `svg2font-cli: could not find the binary for ${platform}/${arch}.\n` +
    `  Try reinstalling: npm install svg2font-cli\n` +
    `  If using --no-optional, remove that flag so platform packages are installed.`
  );
  process.exit(1);
}

const result = spawnSync(binPath, process.argv.slice(2), {
  stdio: "inherit",
  shell: false,
});

process.exitCode = result.status ?? 1;
