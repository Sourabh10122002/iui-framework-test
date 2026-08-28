# 02 — Integration & Runtime

**Package:** `@inventive-ui/framework`  
Companion to [01 — Compile-First Guide](./01-compile-first-guide.md) (read **Before vs after** there first). This file is how to wire apps and use the **thin runtime** that remains after compile CSS.

---

## Bundler wiring (mandatory now — was optional under runtime FW)

### Shared head contract (all bundlers)

| Concern | Contract |
|---------|----------|
| Theme before paint | Blocking `#iui-theme-init` script in `<head>` / SSR insert |
| Styles before paint | `<style data-iui-build>` **or** `<link data-iui-build>` in head **before** app JS |
| Compile flag | Entry / bootstrap imports `iui-build-manifest` → `globalThis.__IUI_BUILD__` |
| JS CSS injector | Fallback only (`build-styles.generated.js`); not the primary delivery path |

Do **not** import style-map `.generated` files into the browser graph — keep them on the scanner path (Framework defaults `scanDirs: ["src", ".iui"]`, or set `build.scanDirs`). Full `build` option table: [01 — Compile-First Guide](./01-compile-first-guide.md#all-build-options).

### Vite

```ts
import {
  inventiveUiVite,
  IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE,
} from "@inventive-ui/framework/vite";

export default defineConfig({
  plugins: [inventiveUiVite({ root: process.cwd() }), react()],
  optimizeDeps: {
    // Asset packages only — the plugin excludes @inventive-ui/framework automatically.
    exclude: [...IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE],
  },
});
```

`iui init -f vite` scaffolds the same pattern. Do **not** add `@inventive-ui/framework` to `optimizeDeps.include`.

Dev: blocking `<style data-iui-build>` in HTML. Prod: extracted linked stylesheet via entry import. Entry auto-imports build manifest (`__IUI_BUILD__`).

### Webpack / Storybook

```js
const { inventiveUiWebpack } = require("@inventive-ui/framework/webpack");
module.exports = { plugins: [...inventiveUiWebpack()] };
```

Writes disk CSS; **HtmlWebpackPlugin** injects theme + `<style data-iui-build>` into HTML (same zero-FOUC contract as Vite). Entry loader prepends **manifest only** (set `IUI_ENTRY_INJECT_STYLES=1` only if HTML injection is unavailable). Watch ignores `.iui/` to avoid rebuild loops.

### Next.js (App Router)

```ts
import { withIUI } from "@inventive-ui/framework/next";
export default withIUI({ /* next config */ });
```

Use `IUIRegistry` from `@inventive-ui/framework/next/registry` in the root layout. Prefer `--webpack` on Next 16+ until Turbopack is supported for this path.

SSR inserts `#iui-theme-init` and a **`<link data-iui-build href="/iui/{hash}.css">`** (plugin writes `public/iui/{hash}.css`). Client bootstrap imports manifest only — not an 850KB CSS string. Same #iui-theme-init boot paint as Vite/Webpack.

### Hard-reload spinner (expected vs fixable)

| App | Typical hard-reload feel | Why |
|-----|--------------------------|-----|
| Vite (`:5173`) | Fast | No SSR; native ESM; one compiler |
| Webpack SPA (`:3001`) | Medium | One webpack compile + client hydrate |
| Next webpack (`:3002`) | **Often 2–4s** in this monorepo | SSR + **two** webpack compilers + hydrate; aliases components to TypeScript **source** |

That Next tab spinner is **normal Next.js webpack `dev` behavior** for a large source-linked package graph. It is **not** FOUC / missing CSS. Soft navigations stay fast.

What helps Next (industry):

1. Prefer built **`dist/`** when available (not `src/index.ts`) — biggest win.
2. Keep CSS **linked** (`/iui/{hash}.css`) — already done.
3. Do not import style-map files into the client graph (`scanDirs` only).
4. Production `next start` feels much closer to the other apps.

Reload **speed** will not match Vite in `dev`; the **head contract** (theme + `data-iui-build` before paint) is what stays consistent.

### Integration test apps (monorepo)

| App | Port | Command (from Framework) |
|-----|------|---------------------------|
| `test-app` (Vite) | 5173 | `npm run dev:test-app` |
| `test-app-webpack` | 3001 | `npm run dev:test-app-webpack` |
| `test-app-next` | 3002 | `npm run dev:test-app-next` |

Build framework `dist/` before running consumers that link via `file:`.

---

## Theme hooks (component authors)

After compile-first, colors use **`dark:` utilities**, not `theme.isDark` class rebuilding. Prefer narrow hooks:

| Need | Hook |
|------|------|
| Radius / spacing / font / globalColor | `useThemeMode()` **no** — use **`useThemeLayout()`** |
| Mode toggle UI / knowing light|dark in JS | **`useThemeMode()`** |
| Full legacy theme object | `useTheme()` — avoid in leaf components |

```
ThemeToggle → updateTheme({ mode })
  → sync html.dark once
  → useThemeMode() re-renders
  → useThemeLayout() does NOT re-render
```

Mode updates apply **synchronously** in the click frame. `setupThemeToggle` persists to `localStorage` only (DOM sync lives in `ThemeManager`).

Blocking script `#iui-theme-init` in `<head>` prevents light flash before React.

---

## Color token contract (framework → components)

1. **Framework owns values** — `--iui-color-*` from `iui.config.ts` at build.
2. **Components emit class names** — `bg-brand-500`, not raw hex in style maps.
3. **Canonical tokens** — resolve props with the components helper (`resolvePaletteToken`): `brand`, `success`, `accent-1`…, base palettes (`red`, …), `white`/`black`. Do not reverse-map base names to accents.
4. **Grammar** — `{property}-{palette}-{shade}` plus variants (`hover:`, `dark:`, …).

Optional shade API for semantic matrices:

```ts
import { compose } from "@inventive-ui/framework";
compose({ pattern: "interactive", variant: "solid", appearance: "strong", palette: "brand", … });
```

Expand full matrix only with `build.includeShadeMatrix: true`.

---

## States

| Layer | Responsibility |
|-------|----------------|
| Build | CSS for focus rings, disabled, loading via `collectStateUtilityClasses()` |
| Runtime | `useStates()` → `stateClasses`, data attrs, ARIA |

```ts
import { defineStates } from "@inventive-ui/framework/config";

states: defineStates({
  focused: { color: "brand", shades: { light: "500", dark: "400" }, ringWidth: 2, ringOffset: 2 },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
  loading: { style: "spinner", spinner: true },
}),
```

```tsx
const { stateClasses, dataAttrs, ariaProps } = useStates({ disabled, loading });
```

Hook API unchanged under compile-first.

---

## Slots

Always runtime. Import from the **slots** entry:

```ts
import { registerSlot, SlotRenderer } from "@inventive-ui/framework/slots";
```

Do **not** expect `registerSlot` on the main framework export.

**Component-as-slot registrations** in consumer apps are produced by `inventive-ui` from the published **`public-slot-contract.json`** on `@inventive-ui/components` (see CLI [Consumer Codegen](../../IUI-CLI/docs/CONSUMER-CODEGEN.md) and the components [developer guide](../../components-updated/docs/COMPONENT-DEVELOPER-GUIDE.md#8-slots)). Framework owns the registry API and asset/runtime slots; it does not invent component prop contracts.

Asset warmup: `warmSlotAssets()`.

Runtime env bridge (additive):

- Renderer callbacks can optionally accept a second arg: `(slot, env) => ...`
- `env` shape: `SlotEnvironment<TScope = never>` with optional `scope`
- Precedence is deterministic: explicit slot props override `env.scope` defaults
- Existing one-arg renderers remain valid

---

## Logical utilities

Prefer logical inline/block APIs:

| Prefer | Avoid / alias |
|--------|----------------|
| `ps` / `pe`, `ms` / `me` | `pl` / `pr` |
| `start` / `end`, `border-s` / `border-e` | `left` / `right`, `border-l` / `border-r` |
| `text-start` / `text-end` | `text-left` / `text-right` |

Arbitrary CSS generation maps many physical names to logical properties for RTL.

---

## Monorepo / TypeScript with `test-app`

When a Vite gallery imports **component showcase stories** for HMR:

- **Vite** may load `components-updated` **source**.
- **TypeScript** for `test-app` should **not** typecheck that whole source tree under the app’s `tsconfig` (duplicate `@types/react`, missing `@/` paths → hundreds of false errors).

Working pattern used in `test-app`:

1. Load showcases with `import.meta.glob(...)` (Vite bundles; TS does not expand the glob into the program).
2. Import published APIs from `@inventive-ui/components` (types from `dist/*.d.ts`).
3. Vite alias `@inventive-ui/components` → `components-updated/src` for HMR.
4. Align TypeScript / `@types/react` versions with the components package.
5. Restart TS server after `tsconfig` changes.

Package-local checks remain the source of truth:

```bash
cd Framework-updated && npx tsc --noEmit
cd components-updated && npx tsc --noEmit
```

---

## Troubleshooting checklist

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| ~250 classes after wipe | Incomplete HMR cache | Restart dev; ensure cache `complete: true` after full scan |
| Class on DOM, no style | Filter pollution broke later CSS, or uncovered token | Check token filter + validation; run scanner-only verify |
| Brand OK, success missing | Same — first invalid rule aborts rest of sheet | Never “fix” by reordering; reject bad tokens |
| Theme flash / white first paint | Styles arrive after app JS / hash 404 on CSS URL | Blocking head inject (`data-iui-build`) before paint; Vite never 404s middleware CSS on hash drift |
| Unstyled SSR (Next) | Missing link/inline build CSS | `IUIRegistry` + bootstrap href + client `emitStaticAsset` |
| Slow Next hard reload | Dual 850KB CSS-in-JS + style-map side-effect imports | Linked static CSS + manifest-only client bootstrap + `scanDirs` (no map imports) |
| Webpack rebuild loop | Writing `.iui/` retriggers watch | Ignore `.iui/` in watchOptions |
| `registerSlot` missing | Wrong import path | Use `@inventive-ui/framework/slots` |
| Problems panel noise in monorepo | App tsc following component source | Glob + dist types pattern above |

### DevTools

- [ ] `__IUI_BUILD__.mode === "compile"`
- [ ] One primary `data-iui-build` stylesheet
- [ ] `:root` has real hex for `--iui-color-brand-500`, gray-*, etc.
- [ ] No duplicate `#iui-global-config-styles` in compile mode

---

## Key source map

```
integrations/shared/   scan, filter, cache, generate-build-css, validate, inject
integrations/vite|webpack|next/
src/server/            generateBuildCSS, theme CSS, arbitrary CSS, state utilities
src/engine/            parser + builder (Node / server only)
src/core/build-mode.ts isCompilePipelineActive()
src/slots.ts           @inventive-ui/framework/slots entry
```
