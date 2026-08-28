# Changelog

All notable changes to the Inventive UI Framework will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.8] - 2026-02-06

### Features
- ✨ Complete utility-first CSS framework with 1000+ utilities
- ✨ Runtime CSS generation engine with DOM observer
- ✨ Semantic color system (success, warning, danger, info)
- ✨ Brand and accent color palettes
- ✨ Dark mode support with system preference detection
- ✨ Gradient system with custom gradient definitions
- ✨ Typography system (system, Google, local fonts)
- ✨ Spacing system (compact, standard, spacious)
- ✨ Border radius presets (none, sm, md, lg, xl, full)
- ✨ RTL (Right-to-Left) support
- ✨ Responsive breakpoints (sm, md, lg, xl, 2xl)
- ✨ Component slot system (icons, logos, loaders, flags, emojis, file types)
- ✨ Icon library support (Lucide, Material, Phosphor)

### React Integration
- ✨ IUIProvider for app initialization
- ✨ useTheme hook for theme management
- ✨ useColorPalette hook for color system
- ✨ useArbitraryValues hook for custom values
- ✨ useRuntimeCSS hook for dynamic CSS
- ✨ useSlotRenderer hook for component slots

### Utilities
- ✨ cn() - Class merging utility
- ✨ iuimerge() - Conflict resolution
- ✨ cx() - Conditional classes
- ✨ cva() - Variant factory
- ✨ Validation utilities (validateIUIClass, getConflictingClasses)
- ✨ CSS optimization engines (tree-shaking, purging, critical CSS)

### Bundler Support
- ✨ Vite plugin (optional)
- ✨ Webpack plugin (optional)
- ✨ Next.js plugin with SSR support (optional)
- ✨ Works with all React bundlers

### Developer Experience
- ✨ Full TypeScript support with comprehensive types
- ✨ Optional configuration (works with defaults)
- ✨ CLI tool (npx iui-init) for config generation
- ✨ Zero FOUC (Flash of Unstyled Content)
- ✨ Excellent IntelliSense support
- ✨ Comprehensive documentation

### Documentation
- 📚 Complete README with quick start
- 📚 Live documentation site
- 📚 Interactive playgrounds
- 📚 API reference
- 📚 Best practices guide
- 📚 Troubleshooting guide

### Package
- 📦 Dual format (CommonJS + ES Modules)
- 📦 Main ESM ~181KB minified (~42KB gzip); slots entry ~17KB minified (~5KB gzip)
- 📦 TypeScript declarations included
- 📦 MIT License
- 📦 Multiple entry points (main, /config, /vite, /webpack, /next)

### Requirements
- Node.js >= 20.0.0
- npm >= 8.0.0
- React >= 18.0.0 or >= 19.0.0
- TypeScript 5.8+ (recommended)

---

## [1.0.52] — Published integrations without `src/`

### Fixed
- **Storybook / Vite on registry installs** — `generate-theme-init-script.mjs` and `engine-parse-check.mjs` still jiti-loaded `src/server` / `src/engine`, which is not shipped in the npm tarball (≥1.0.50). They now prefer `dist/node/build-css-api` (jiti/`src` only as monorepo fallback).

### Changed
- `dist/node/build-css-api` also exports `generateThemeInitScript`, `hashThemeInitScript`, `injectThemeInitScriptIntoHtml`, `parseUtilityClass`, and `UtilityCache`.
- Integrations share `load-build-css-api.mjs` (`tryLoadBuiltBuildCssApi`) so Vite/Webpack/scan paths all prefer the published Node bundle.

## [1.0.50] — Packaging

### Changed
- Compile-first CSS API ships as `dist/node/build-css-api` (CJS/ESM); Vite/Webpack plugins load the prebuilt Node API instead of jiti'ing `src/server`.
- `./server` export points at compiled `dist/server/index.esm.js` (+ types).
- npm package no longer includes the `src/` tree (smaller publish surface; integrations + `dist` only).

### Added
- `npm run build:node` (`rollup.config.node.js`) — builds Node compile-time bundles.

### Fixed
- **Palette-pattern expansion pollution** — bare templates like `` `bg-${palette}-500` `` / `` `text-${color}-500` `` incorrectly got variant prefixes `b:` / `tex:` / `outlin:` (`scan-palette-patterns.mjs`), producing hundreds of uncovered fake utilities. Fix: empty variant prefix when no `hover:`/`dark:` (etc.) segment is present; also re-filter expanded tokens with `isStaticUtilityToken`.

## [Unreleased]

### Fixed
- **Compile-first CSS parse breaks from scan pollution** — tokens contaminated with TypeScript/JS string debris (trailing quotes/commas/semicolons, expression brackets like `Foo[bar]`, or JS concat debris such as `w-[" + width + "px]`) were accepted by the scanner, escaped into selectors, and interpolated into values like `var(--iui-color-transparent";)`. Browsers then discarded most of the stylesheet after the first fatal rule, which made Storybook show only early utilities (e.g. brand colors) while later palette utilities looked unstyled.
- Hardened `utility-token-filter.mjs` (`hasInvalidUtilitySyntax` / `isStaticUtilityToken`) to reject that debris while keeping valid utilities (`border-transparent`, `gap-1.5`, `w-[120px]`, `content-['']`).
- Defense in depth in the engine: `parseUtilityClass` rejects quoted junk; `createColorValueGetter` refuses non-ident color values before `var(--iui-color-…)` interpolation.
- Class cache aggregation/write paths re-filter with `isStaticUtilityToken` so stale `.iui/classes.cache.json` entries cannot reintroduce pollution.

### Added
- **`validate-build-css.mjs` + `assertValidGeneratedCss`** — `writeBuildCssFiles` refuses to write invalid generated CSS (polluted custom-property names/selectors, JS-concat debris in declarations, unbalanced braces, and `postcss.parse` when PostCSS is available). Fail loud; no silent partial stylesheets.
- `postcss` as a framework dependency for generated-CSS validation.

### Changed
- Storybook canvas preview vars use `#iui-storybook-canvas-vars` instead of `#iui-root-vars` so they do not collide with `CSSVariableManager`’s stylesheet id.
- **`bin.iui` removed** — the `iui` command is owned solely by `@inventive-ui/cli`. Framework keeps only `iui-init` for lightweight config/Vite scaffolding so the two packages no longer collide in `node_modules/.bin`.

### Planned Features
- Component library (buttons, cards, modals, etc.)
- Animation utilities
- Form utilities
- Additional icon libraries
- More gradient presets
- Component variants library

---

## Version History

- **1.0.8** (2026-02-06) - Initial public release
