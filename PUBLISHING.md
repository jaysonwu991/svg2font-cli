# NPM Publishing Guide

This document outlines the steps to publish `svg2font-cli` to NPM.

## ✅ Pre-Publish Checklist

### 1. Project Status
- [x] All code refactored and modularized
- [x] Build succeeds without errors
- [x] All TypeScript types generated
- [x] Package size is reasonable (~60 KB)

### 2. Documentation
- [x] README.md updated with comprehensive docs
- [x] CHANGELOG.md created with v1.0.0 entry
- [x] LICENSE file created (ISC)
- [x] package.json metadata is complete

### 3. Package Configuration
- [x] `package.json` has correct metadata
- [x] `main`, `types`, and `bin` fields are correct
- [x] `exports` field configured for proper module resolution
- [x] `files` field includes only necessary files
- [x] `.npmignore` created to exclude dev files
- [x] `prepublishOnly` script configured

### 4. Quality Checks
- [x] No sensitive data in code
- [x] No hardcoded credentials or API keys
- [x] All dependencies are necessary
- [x] Dev dependencies separated correctly

## 📦 Package Contents

The published package will include:

```
svg2font-cli-1.0.0.tgz
├── lib/                    # Built JavaScript and type definitions
│   ├── cli.js             # CLI entry point
│   ├── cli.d.ts           # CLI types
│   ├── index.js           # Library entry point
│   ├── index.d.ts         # Library types
│   ├── cli/               # CLI modules
│   ├── core/              # Core modules (generate, icons, glyphs, names, sprite, zip, etc.)
│   ├── utils/             # Utilities (svg-helpers, font/)
│   ├── templates/         # Template generators (css, demo, iconfont, manifest, etc.)
│   ├── types.d.ts         # Type definitions
│   ├── defaults.d.ts      # Default constants types
│   └── **/*.d.ts          # TypeScript definitions for all modules
├── README.md              # Documentation
├── CHANGELOG.md           # Version history
├── LICENSE                # ISC License
└── package.json           # Package manifest
```

**Package Size:** ~60 KB compressed, ~230 KB unpacked

## 🚀 Publishing Steps

### First Time Setup

1. **Create NPM Account** (if you don't have one)
   ```bash
   npm adduser
   ```

2. **Verify Account**
   ```bash
   npm whoami
   ```

### Publishing Process

1. **Ensure you're on the main branch**
   ```bash
   git checkout main
   git pull origin main
   ```

2. **Verify everything is committed**
   ```bash
   git status
   ```

3. **Run a clean build**
   ```bash
   pnpm build
   ```

4. **Test the package locally** (optional but recommended)
   ```bash
   pnpm pack
   # This creates svg2font-cli-1.0.0.tgz
   # You can test it in another project:
   # npm install /path/to/svg2font-cli-1.0.0.tgz
   # Or: pnpm add /path/to/svg2font-cli-1.0.0.tgz
   ```

5. **Dry run to see what will be published**
   ```bash
   pnpm publish --dry-run
   ```

6. **Publish to NPM**
   ```bash
   pnpm publish
   ```

   Note: This will automatically run `pnpm build && pnpm test` via the `prepublishOnly` hook.

### After Publishing

1. **Verify the package**
   ```bash
   npm view svg2font-cli
   ```

2. **Test installation**
   ```bash
   npm install -g svg2font-cli
   svg2font --help
   ```

3. **Create a Git tag**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Create a GitHub Release**
   - Go to: https://github.com/jaysonwu991/svg2font-cli/releases/new
   - Tag: v1.0.0
   - Title: v1.0.0 - Initial Release
   - Description: Copy from CHANGELOG.md

## 🔄 Version Updates

For future releases, follow semantic versioning:

### Patch Release (1.0.x) - Bug fixes
```bash
npm version patch
npm publish
git push && git push --tags
```

### Minor Release (1.x.0) - New features (backwards compatible)
```bash
npm version minor
npm publish
git push && git push --tags
```

### Major Release (x.0.0) - Breaking changes
```bash
npm version major
npm publish
git push && git push --tags
```

## 📝 Post-Publish Checklist

- [ ] Package appears on npmjs.com
- [ ] README renders correctly on NPM
- [ ] Installation works: `npm install -g svg2font-cli`
- [ ] CLI command works: `svg2font --help`
- [ ] Git tag created and pushed
- [ ] GitHub release created
- [ ] Update project status to "published"

## 🔐 Security Best Practices

- ✅ Never commit `.env` files
- ✅ Never include credentials in code
- ✅ Use `.npmignore` to exclude sensitive files
- ✅ Audit dependencies regularly: `npm audit`
- ✅ Keep dependencies updated
- ✅ Use `npm publish --otp` if 2FA is enabled

## 🆘 Troubleshooting

### "You do not have permission to publish"
- Verify you're logged in: `npm whoami`
- Check package name isn't taken: `npm view svg2font-cli`
- Ensure you have publish rights

### "Version already exists"
- Update version in package.json
- Or use: `npm version patch/minor/major`

### "Package size too large"
- Check what's being included: `npm pack --dry-run`
- Update `.npmignore` to exclude unnecessary files
- Review `files` field in package.json

## 📊 Package Stats

Current package configuration:
- **Name:** svg2font-cli
- **Version:** 1.0.0
- **Size:** ~60 KB (compressed)
- **Files:** ~40+ files (lib directory with JS + type definitions)
- **Dependencies:** 3 (commander, fast-glob, svgo)
- **Dev Dependencies:** 8 (typescript, vite, vitest, oxlint, oxfmt, etc.)
- **Node Version:** >=18.0.0
- **License:** ISC

## 🎉 Ready to Publish!

Your package is ready for NPM publishing. Follow the steps above to make it available to the world!

---

**Good luck with your first publish! 🚀**
