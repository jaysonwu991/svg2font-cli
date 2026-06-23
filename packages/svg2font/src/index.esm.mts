type PlatformTargets = {
  [platform: string]: {
    [arch: string]: string;
  };
};

const TARGETS: PlatformTargets = {
  darwin: {
    arm64: "@jayson991/svg2font-darwin-arm64",
    x64: "@jayson991/svg2font-darwin-x64",
  },
  linux: {
    arm64: "@jayson991/svg2font-linux-arm64",
    x64: "@jayson991/svg2font-linux-x64",
  },
  win32: {
    x64: "@jayson991/svg2font-win32-x64",
  },
};

const { platform, arch } = process;
const pkg: string | undefined = TARGETS[platform]?.[arch];

if (!pkg) {
  throw new Error(
    `@jayson991/svg2font: unsupported platform ${platform}/${arch}\n` +
      `  Supported: darwin/arm64, darwin/x64, linux/arm64, linux/x64, win32/x64`,
  );
}

const addon = await import(pkg);

export default addon.default ?? addon;
