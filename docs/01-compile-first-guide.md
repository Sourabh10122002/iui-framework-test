# 01 — Compile-First Guide

**Package:** `@inventive-ui/framework`  
**Read this first.** Then [02 — Integration & Runtime](./02-integration-and-runtime.md).

---

## Before vs after (the whole point)

### Before — runtime Framework (old behavior)

CSS was generated **inside the browser** while the app ran.

```
Import @inventive-ui/framework
  → parser + builder + DOM / class observers live in the main JS bundle
  → when a class appears on an element (or cn() runs), engine builds CSS in the browser
  → inject into #iui-css-root (or similar) in document.head
  → theme / palette / gradients / arbitrary values also initialized at runtime
```

| What happened at runtime | Why it hurt |
|--------------------------|-------------|
| Parser + builder shipped to clients | Larger JS; CSS work on first paint / interaction |
| `useColorPalette()`, `useArbitraryValues()`, `processClasses()` ensured CSS existed in-browser | Dual source of truth; race-y with SSR/FOUC |
| Dynamic `` `bg-${x}-500` `` “worked” because the browser JIT could invent rules | Components relied on that; scanners could not see those strings later |
| Dark mode often rebuilt class strings via `theme.isDark` | Every leaf re-rendered on toggle |
| No mandatory bundler CSS plugin | Apps depended on browser JIT |

**Still existed then (and still does now):** `IUIProvider`, theme toggle APIs, `useStates()`, slots, `cn`/`cva` for merging strings.

### After — compile-first Framework (current)

CSS is generated **in Node** when you run Vite/Webpack/Next (dev or build). The browser only **applies** class names.

```
Source + iui.config.ts
  → scan (regex + AST + token filter)
  → optional expand (arbitrary / palette / theme presets / shade matrix)
  → generateBuildCSS (theme + utilities + states)
  → validate → write .iui/ artifacts
  → bundler injects <style|link data-iui-build> into <head>
  → browser: className matches rules already in the stylesheet
```

| Concern | Before (runtime FW) | After (compile CSS) |
|---------|---------------------|---------------------|
| When CSS is built | Browser, on use | Node, on save/build |
| Where CSS lives | `#iui-css-root` / runtime inject | `data-iui-build` stylesheet |
| Engine in main bundle | Yes | No — Node + `@inventive-ui/framework/server` |
| `useColorPalette` / arbitrary hooks | Generated / ensured CSS | **No-ops** when compile active |
| `cn()` | Could trigger CSS generation | Merges **strings only** |
| Theme colors / gray / gradients | Runtime init | `generateFullThemeCSS()` at build |
| First paint | Risk of FOUC / late rules | CSS present early; `#iui-theme-init` for dark mode |
| Missed class | Browser might invent it | Dev warning — fix scan/map/safelist |
| Plugin required | No | **Yes** (`inventiveUiVite` / Webpack / `withIUI`) |

Confirm compile mode in the console:

```js
globalThis.__IUI_BUILD__
// { mode: "compile", classCount, cssHash, … }
```

Without the plugin, utilities will not appear. The slim runtime is Provider, theme toggle, states **behavior**, slots, and `cn`/`cva` — **not** a CSS engine, and **not** “zero runtime.”

---

## Quick start

```bash
npm install @inventive-ui/framework
npm install -D inventive-ui
iui init
```

Use `inventive-ui` for `iui` (`init`, `doctor`, `update`, …). Framework ships only the legacy scaffold bin `iui-init`.

| Bundler | Wire-up |
|---------|---------|
| Vite | `plugins: [inventiveUiVite(), react()]` |
| Webpack / Storybook | `plugins: [...inventiveUiWebpack()]` |
| Next.js | `export default withIUI({ ... })` + wrap layout with `IUIRegistry` |

**No manual CSS import.** The plugin auto-injects build CSS.

### Package entries

| Import | Role |
|--------|------|
| `@inventive-ui/framework` | Provider, theme, `cn`, tokens |
| `@inventive-ui/framework/slots` | `SlotRenderer`, `registerSlot`, asset warmup |
| `@inventive-ui/framework/config` | Types for `iui.config.ts` (Next-safe) |
| `@inventive-ui/framework/server` | `generateBuildCSS`, SSR helpers (compiled `dist/server`) |
| `@inventive-ui/framework` (Node) | Publish ≥1.0.50 ships `dist/node/build-css-api` — no `src/` in the npm tarball |

In monorepo `file:` installs, run `npm run build` (includes `build:node`) so plugins load `dist/node/build-css-api`. `jiti` is still used to load consumer `iui.config.ts`.

---

## Pipeline (in order)

1. **Scan** — `scan-used-classes.mjs` (+ optional AST M4) finds class strings in app/`scanPackages` dist.
2. **Filter** — every token must pass `isStaticUtilityToken()` (`utility-token-filter.mjs`). Prose, TS debris (`border-transparent";`, `TextProps["size"]`, `w-[" + x + "px]`), and incomplete tokens are rejected so they cannot break the whole stylesheet.
3. **Optional expand** — arbitrary scan, palette templates (`bg-${palette}-500`), theme presets, shade matrix (`includeShadeMatrix`, **default off**).
4. **Generate** — `generateBuildCSS()` → theme vars + utility CSS + state utilities (same engine parser/builder as server). Prefer **logical** utilities: `ps`/`pe`, `start`/`end`, `text-start`/`text-end` (physical `l`/`r` / `left`/`right` are aliases or discouraged).
5. **Validate** — `assertValidGeneratedCss()` before write.
6. **Inject** — Vite/Webpack put CSS in `document.head` as blocking `<style data-iui-build>`; Next prefers `<link data-iui-build href="/iui/{hash}.css">` via `IUIRegistry` (same before-paint contract).

Classes must appear as **static strings** in scanned files (or safelist / generated maps). Fully dynamic `` `p-${n}` `` is unsupported without safelist or prop-based alternatives.

ESLint rule `customPlugin/no-dynamic-utility-class` (warn) flags these templates in app/component TSX. Style engines under `styles/` / `*.generated.*` are allowlisted; elsewhere use a static string, a map lookup, or:

```ts
// eslint-disable-next-line customPlugin/no-dynamic-utility-class -- intentional generator token
`bg-${palette}-500`
```

---

## Config defaults (`iui.config.ts`)

`build` is **optional**. If you omit `build`, or omit individual keys, the bundler plugin fills Framework defaults from `integrations/shared/resolve-build-scan.mjs`.

Minimal consumer config (plugins still scan `src` + `.iui` and `@inventive-ui/components`):

```ts
import type { IUIConfig } from "@inventive-ui/framework/config";

const config: IUIConfig = {
  theme: { /* colors, mode, … */ },
  // build: { /* optional overrides — see table below */ },
};

export default config;
```

### Explicit overrides (only when you need them)

```ts
import type { IUIConfig } from "@inventive-ui/framework/config";

const config: IUIConfig = {
  theme: { /* colors, mode, … */ },
  build: {
    // Override scan roots only if your app layout differs from defaults
    scanDirs: ["src", "app", ".iui"],
    scanPackages: ["@inventive-ui/components", "@acme/ui"],

    safelist: [],
    packageSafelist: false,      // keep false — empty package safelist
    includeShadeMatrix: false,   // opt in only if you need full compose() matrix
    includeThemePresets: true,
    includeThemeGrayScale: true, // pre-expand theme gray gray-2…98 (from neutral.set)
    resolvePalettePatterns: true,
    includeArbitraryScan: true,
    useAst: true,
    minify: true,                // production
    writeFiles: false,           // set true to dump .iui/utilities.css for debugging
  },
};

export default config;
```

### All `build` options

| Option | Default | Mandatory? | Meaning |
|--------|---------|------------|---------|
| `scanDirs` | `["src", ".iui"]` | No | App folders walked for class strings (relative to project root) |
| `scanPackages` | `["@inventive-ui/components"]` | No | Installed packages whose `dist` is scanned |
| `include` | _(none)_ | No | Extra glob includes layered on top of `scanDirs` |
| `exclude` | _(none)_ | No | Glob excludes for the walk |
| `safelist` | `[]` | No | Classes always emitted (Tailwind-style safelist) |
| `packageSafelist` | `false` | No | When `true`, merge each `scanPackages` manifest `compile.safelist` — keep `false` for scan-first |
| `includeShadeMatrix` | `false` | No | Pre-expand full semantic shade / compose matrix — opt in only; do not use to hide scan gaps |
| `includeThemePresets` | `true` | No | Pre-expand spacing / radius / font theme presets |
| `includeThemeGrayScale` | `true` | No | Pre-expand theme gray utilities (`gray-2` … `gray-98`) — CSS vars come from `neutral.set`; do not add `accent.gray` |
| `resolvePalettePatterns` | `true` | No | Resolve dynamic palette templates (`bg-${palette}-500`) against config palettes |
| `includeArbitraryScan` | `true` | No | Full-file regex pass for arbitrary utilities (`w-[120px]`, …) |
| `useAst` | `true` | No | Babel AST scanner in addition to regex |
| `minify` | `true` in production | No | Minify generated utility CSS |
| `writeFiles` | `false` | No | Write `.iui/utilities.css` to disk for debugging |

Do **not** import style-map `.generated` files into the browser graph. Prefer listing their folders under `scanDirs` (or rely on the default `.iui` / `src` roots) so the Node scanner picks them up.

---

## Build cache (`.iui/`) — important

```
.iui/
  classes.cache.json      # per-file class map
  build-manifest.json     # hash, classCount, mode: "compile"
  build-styles.generated.*
```

Safe to delete; regenerates on next dev/build.

### Complete vs incremental cache

The cache is marked **`complete: true` only after a full `scanDirs` scan**. Incremental HMR updates **never** promote an incomplete cache to complete (`isCompleteBuildClassCache` in `build-cache.mjs`). Vite/Webpack plugins run a **full rescan** when the on-disk cache is missing or incomplete, then write `complete: true` before allowing incremental updates.

**If you wipe `.iui/` mid-session:** restart the dev server anyway so in-memory CSS and the next full scan stay aligned. Expect SSR logs like `~17k classes (0 uncovered)` when healthy. A silent collapse to ~250 classes from an incomplete HMR-only rebuild is guarded against by the complete-cache gate.

---

## What still runs in the browser (after compile)

| Runtime (keep) | Build owns instead |
|----------------|--------------------|
| `IUIProvider` / `initFramework` (skips CSS engine boot) | Utility + theme stylesheet |
| `useThemeMode` / `useThemeLayout` / thin `applyMode` | Palette CSS vars |
| `useStates()` class strings + a11y attrs | Focus/disabled/loading **CSS rules** |
| `SlotRenderer` / `registerSlot` / warmup | — |
| `cn` / `cva` string merge | Scanning literals into CSS |
| Blocking `#iui-theme-init` already ran | — |

When `isCompilePipelineActive()` is true, Framework **skips**: `initializeRuntimeCSS`, runtime palette regeneration, `injectGlobalStyles` duplicate, gradient DOM reprocessing, and `cn()` → `generateCSS`.

---

## Theme colors that “build but don’t paint”

If DevTools shows the utility rule but color is wrong/empty:

1. Circular vars — palette hex must win; self-referential `var(--iui-color-brand-500)` placeholders are skipped.
2. Gray/neutral emitted at build via `appendNeutralPaletteAtBuild()`.
3. After framework source changes with `file:` links: rebuild framework `dist/`, restart consumers.

---

## Verification

```bash
npm run test:scan
npm run test:build-css
npm run test:compile
npm run test:integration-apps   # Vite + Webpack + Next
```

Dev warning when a scanned class produces no CSS:

```
[IUI Dev] Class "…" was scanned but produced no CSS.
```

Fix discovery (static string / map / safelist) — never reintroduce a browser CSS parser.

---

## Next

- [02 — Integration & Runtime](./02-integration-and-runtime.md) — plugins, theme hooks, states, colors, slots, troubleshooting
- Package usage notes: [`../USAGE.md`](../USAGE.md)
