# 🎨 Inventive UI Framework

> **Production-ready compile-first design system** — Tailwind-like JIT utilities, semantic tokens, theme system, and **build-time CSS generation** for React (Vite, Webpack, Next.js). Mandatory plugin path via `inventive-ui` CLI (`iui init`); tiny runtime (Provider, theme, states, slots).

[![npm version](https://img.shields.io/npm/v/@inventive-ui/framework)](https://www.npmjs.com/package/@inventive-ui/framework)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18%2B%20%7C%2019%2B-blue)](https://react.dev/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**Inventive UI Framework** is a modern utility-first CSS framework that combines Tailwind-like utilities with semantic tokens, theming, and **compile-time CSS generation**. Built with TypeScript, optimized for performance, and **following industry-standard approaches** (next-themes, Chakra UI, MUI, Mantine) — single import, Provider-based init, optional config, automatic theme persistence.

---

## 📋 Table of Contents

- **Docs (start here):** [docs/01-compile-first-guide.md](docs/01-compile-first-guide.md) · [docs/02-integration-and-runtime.md](docs/02-integration-and-runtime.md)
- [Features](#-features)
- [Use Cases](#-use-cases)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Bundlers & Setup Summary](#-bundlers--setup-summary)
- [Setup Guide](#-setup-guide)
- [Usage](#-usage)
- [Configuration](#-configuration)
- [Interactive states (`states`)](docs/02-integration-and-runtime.md#states)
- [API Reference](#-api-reference)
- [Best Practices](#-best-practices)
- [Troubleshooting](#-troubleshooting)
- [Requirements](#-requirements)
- [Contributing](#-contributing)

---

## ✨ Features

| Category | Features |
|----------|----------|
| **Core** | Utility-first API, Tailwind-like classes, `cn` / `cva` / `iuimerge`, **compile-first CSS** (Node JIT) |
| **Build** | `iui init` (`inventive-ui` CLI), Vite/Webpack/Next plugins scan + auto-inject CSS (no PostCSS) |
| **Theme** | Semantic colors, brand/accent palettes, dark mode, system preference detection |
| **Layout** | Responsive breakpoints (sm/md/lg/xl), RTL support, spacing/radius scales |
| **Typography** | `defineTypography`, system/google/local fonts, font aliases |
| **Colors** | Semantic (success, warning, danger, info), gradients, arbitrary values |
| **Hooks** | `useTheme`, `useColorPalette` (no-op — palette CSS is build output), `useSlotRenderer` via `/slots` |
| **Slots** | `@inventive-ui/framework/slots` — Icon, Logo, Loader, Emoji, Flag, FileType |
| **Build engine** | Node-only parser/builder under `src/engine/` — used by compile plugin and `/server` |
| **Config** | `iui.config.ts` with `build.scanDirs` / `scanPackages` / `safelist` |
| **Integrations** | **Required for new apps:** `inventiveUiVite()`, `inventiveUiWebpack()`, `withIUI()` |

---

## 🎯 Use Cases

- **React apps (Vite/Webpack)** — Single import + IUIProvider, no config required
- **Design systems** — Semantic tokens, variants, theming
- **Dashboards** — Responsive layouts, dark mode, RTL
- **Component libraries** — Slots, cva variants, cn merging
- **Next.js** — App Router, Pages Router, SSR support

---

## 🚀 Quick Start

### Step 1: Install & init

```bash
npm install @inventive-ui/framework
npm install -D inventive-ui
iui init
```

`iui` is provided by **`inventive-ui`** (framework, components, assets, doctor, update).  
Framework-only scaffold (no full CLI): `npx iui-init --vite`.

This scaffolds `iui.config.ts` (with `build` scanner options) and `vite.config.ts` with `inventiveUiVite()` pre-wired.

### Step 2: Entry File (Vite or Webpack)

**Compile-first — Provider + plugin (no manual CSS imports):**

```tsx
// src/main.tsx
import { IUIProvider } from "@inventive-ui/framework";
import config from "../iui.config";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IUIProvider config={config}>
      <App />
    </IUIProvider>
  </React.StrictMode>
);
```

**Without config:**
```tsx
<IUIProvider>
  <App />
</IUIProvider>
```

**What happens automatically (IUIProvider handles everything):**
- ✅ **Config application** — `initFramework(config)` called internally
- ✅ **Theme resolution** — Reads from localStorage → system → default
- ✅ **DOM sync** — `.dark` class + `color-scheme` applied automatically
- ✅ **Auto-persistence** — Theme changes saved to localStorage automatically
- ✅ **Runtime CSS** — Engine initialized before first paint

**No manual code needed:**
- ❌ No `initFramework()` call
- ❌ No `localStorage.getItem/setItem`
- ❌ No `applyThemeToDOM()` calls
- ❌ No restore effects
- ❌ No manual DOM sync

**Just Provider + config** — framework owns everything (industry standard).

**Optional: Explicit initialization for zero FOUC**

For best FOUC prevention, you can call `initFramework()` before React renders:

```tsx
import { IUIProvider, initFramework } from "@inventive-ui/framework";
import config from "../iui.config";

// ✅ Optional: Call before React for zero FOUC (Provider also handles it)
initFramework(config);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IUIProvider config={config}>
      <App />
    </IUIProvider>
  </React.StrictMode>
);
```

**When to use explicit `initFramework()`:**
- ✅ Best FOUC prevention (runs before React mounts)
- ✅ When you want explicit control

**When Provider-only is fine:**
- ✅ Simpler code (just Provider + config)
- ✅ Still prevents FOUC (useLayoutEffect runs before paint)
- ✅ Recommended for most apps

### Step 3: Use Utilities

```tsx
import { cn } from "@inventive-ui/framework";

function Button() {
  return (
    <button className={cn("px-4 py-2 rounded-lg bg-primary-500 text-white")}>
      Click Me
    </button>
  );
}
```

### Optional: Create Config

```bash
npx iui-init
```

Creates `iui.config.ts` in project root. Config is **optional** — framework works with built-in defaults.

---

## 📦 Installation

### Requirements

- **Node.js**: >= 20.0.0
- **npm**: >= 8.0.0
- **React**: >= 18.0.0 or >= 19.0.0 (peer dependency)
- **TypeScript**: 5.8+ (recommended)

### Install Package

```bash
npm install @inventive-ui/framework
```

**TypeScript:** Types are included in the package — no manual `inventive-ui.d.ts` or extra setup needed.

### Supported Environments

✅ **React 18+** and **React 19+** projects  
✅ **Next.js 13+** (Pages Router & App Router)  
✅ **Vite**, **Create React App**, and other React setups  
✅ **Server Components** and **Client Components**  
✅ **SSR** (Server-Side Rendering)  
✅ **SSG** (Static Site Generation)

---

## 📦 Bundlers & Setup Summary

| Bundler | Plugin | Entry | Config |
|---------|--------|-------|--------|
| **Vite** | `@inventive-ui/framework/vite` (optional) | Same for all | Plugin auto-loads `iui.config.ts`; or import manually |
| **Webpack** | `@inventive-ui/framework/webpack` (optional) | Same for all | Plugin auto-loads `iui.config.ts`; or import manually |
| **Next.js** | `@inventive-ui/framework/next` | Providers in layout | Import config in providers or use plugin |
| **Other** (Parcel, Rollup, etc.) | None | Same entry | Import `iui.config` manually; pass to `IUIProvider` |

**Entry file is identical** for Vite, Webpack, CRA, and any React bundler — just wrap with `IUIProvider`. Plugins are optional; without them, import config manually and pass to `IUIProvider`.

**Package subpaths:**
- `@inventive-ui/framework` — main API
- `@inventive-ui/framework/config` — types & `defineTypography` (for `iui.config.ts`)
- `@inventive-ui/framework/vite` — Vite plugin
- `@inventive-ui/framework/webpack` — Webpack plugin
- `@inventive-ui/framework/next` — Next.js plugin

---

## ⚙️ Setup Guide

### Vite Setup

**Best for:** New React projects, fast dev, modern tooling

#### Step 1: Vite config

Use `inventiveUiVite()` for compile-first CSS, theme injection, and correct `optimizeDeps` handling. Scaffold with `iui init -f vite` or `npx iui-init --vite`.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {
  inventiveUiVite,
  IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE,
} from "@inventive-ui/framework/vite";

export default defineConfig({
  plugins: [...inventiveUiVite({ root: import.meta.dirname }), react()],
  optimizeDeps: {
    // Lazy-loaded asset packages — import the constant; do not hand-list packages.
    exclude: [...IUI_ASSET_OPTIMIZE_DEPS_EXCLUDE],
  },
});
```

**`optimizeDeps` split:** `inventiveUiVite()` excludes `@inventive-ui/framework` automatically (singleton config / slot registry). Your config only needs the asset spread above. Never add `@inventive-ui/framework` to `optimizeDeps.include`.

#### Step 2: Entry File

```tsx
// src/main.tsx
import { IUIProvider } from "@inventive-ui/framework";
import config from "../iui.config"; // Optional
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IUIProvider config={config}>
      <App />
    </IUIProvider>
  </React.StrictMode>
);
```

**Vite plugin optional** — works without it; import config manually if needed.

---

### Webpack Setup

**Best for:** Create React App, custom Webpack

#### Step 1: Add Plugin (Optional — auto-loads iui.config)

```js
// webpack.config.js
const { IUIWebpackPlugin } = require("@inventive-ui/framework/webpack");

module.exports = {
  plugins: [new IUIWebpackPlugin()],
};
```

#### Step 2: Entry File

```tsx
// src/index.tsx
import { IUIProvider } from "@inventive-ui/framework";
import config from "../iui.config"; // Optional
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <IUIProvider config={config}>
      <App />
    </IUIProvider>
  </React.StrictMode>
);
```

**Webpack plugin optional** — works without it; import config manually if needed.

---

### Next.js Setup

**Best for:** Next.js App Router or Pages Router

```tsx
// app/providers.tsx or _app.tsx
"use client";

import { IUIProvider } from "@inventive-ui/framework";
import config from "../../iui.config"; // Optional

export default function Providers({ children }) {
  return <IUIProvider config={config}>{children}</IUIProvider>;
}
```

> 📘 See [NEXT-DELAY-REPORT-FOR-REVIEW.md](docs/NEXT-DELAY-REPORT-FOR-REVIEW.md) for full Next.js setup with IUIRegistry and SSR critical CSS.

---

## 📖 Usage

### 1. Class Merging — `cn`, `iuimerge`, `cx`

```tsx
import { cn, iuimerge, cx } from "@inventive-ui/framework";

// cn — merge classes (clsx + tailwind-merge style)
<button className={cn("px-4 py-2", disabled && "opacity-50")} />

// iuimerge — dedupe conflicting utilities (last wins)
<div className={iuimerge("px-4", "px-6")} /> // → px-6

// cx — conditional classes
<div className={cx("base", { active: isActive, disabled })} />
```

### 2. Variants — `cva`, `VariantProps`

```tsx
import { cn, cva, type VariantProps } from "@inventive-ui/framework";

const buttonVariants = cva("px-4 py-2 rounded-lg", {
  variants: {
    variant: { primary: "bg-primary-500", secondary: "bg-gray-200" },
    size: { sm: "text-sm", md: "text-base" },
  },
  defaultVariants: { variant: "primary", size: "md" },
});

function Button({ variant, size, className, ...props }: VariantProps<typeof buttonVariants> & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
```

### 3. Theme — `useTheme`

```tsx
import { useTheme } from "@inventive-ui/framework";

function ThemeToggle() {
  const { themeState, updateTheme, isDark } = useTheme();
  
  const handleToggle = () => {
    const next = isDark ? "light" : "dark";
    updateTheme({ mode: next });
    // ✅ Framework automatically:
    // - Syncs DOM (.dark class + color-scheme)
    // - Saves to localStorage
    // - Updates all components
  };
  
  return (
    <button onClick={handleToggle} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-800">
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
```

**No manual code needed:**
- ❌ No `localStorage.setItem()` — framework auto-saves
- ❌ No `applyThemeToDOM()` — framework auto-syncs
- ❌ No restore effects — framework reads from storage on init

### 4. Color Palette — `useColorPalette`

```tsx
import { useColorPalette } from "@inventive-ui/framework";

function ThemedCard() {
  useColorPalette(); // Initialize palette
  return <div className="bg-success-500 text-white p-4 rounded-lg">Success</div>;
}
```

### 5. Arbitrary Values — `useArbitraryValues`

```tsx
import { useArbitraryValues } from "@inventive-ui/framework";

function CustomBox() {
  useArbitraryValues();
  return <div className="w-[100px] h-[200px] bg-[#ff0000] p-[calc(1rem+2px)]" />;
}
```

### 6. Runtime CSS — `useRuntimeCSS`, `useConditionalCSS`

```tsx
import { useRuntimeCSS, useConditionalCSS } from "@inventive-ui/framework";

function DynamicCard() {
  useRuntimeCSS(["p-4", "rounded-lg", "bg-primary-500"]);
  useConditionalCSS(isActive, ["ring-2", "ring-primary-500"]);
  return <div>Content</div>;
}
```

### 7. Slots — `SlotRenderer`, `registerSlot`, `useSlotRenderer`

```tsx
import { SlotRenderer, registerSlot, useSlotRenderer } from "@inventive-ui/framework";

// Render a slot (icon, logo, etc.)
<SlotRenderer type="icon" name="Check" className="w-5 h-5" />

// Register custom slot
registerSlot("badge", (props) => <span className="badge">{props.label}</span>);

// Use in component
const renderBadge = useSlotRenderer("badge");
{renderBadge && renderBadge({ label: "New" })}
```

### 8. Semantic Colors & Gradients

```tsx
// Semantic (success, warning, danger, info)
<div className="bg-success-500 text-danger-600" />

// Custom gradients (from iui.config)
<div className="bg-glass bg-bot" />

// Responsive
<div className="w-full md:w-1/2 lg:w-1/3 p-4 md:p-6" />
```

### 9. Validation — `validateIUIClass`, `getTokenCategory`

```tsx
import { validateIUIClass, getTokenCategory } from "@inventive-ui/framework";

const valid = validateIUIClass("px-4"); // true
const category = getTokenCategory("bg-primary-500"); // "color"
```

### 10. Config & Theme API (Advanced)

```tsx
import {
  applyLoadedConfig,
  initFramework,
  getToken,
  setSemanticColors,
  themeManager,
} from "@inventive-ui/framework";

// Apply config programmatically
applyLoadedConfig(myConfig, { force: true });

// Get token value
const spacing = getToken("theme.spacing.set");

// Set colors at runtime
setSemanticColors({ success: "green", danger: "red" });
```

---

## ⚙️ Configuration

Focus ring, disabled, loading, and global loader defaults are configured under **`states`**. See **[docs/02-integration-and-runtime.md](docs/02-integration-and-runtime.md#states)** for tables, presets, and `assets.loader` merge behavior.

Create `iui.config.ts` in project root (or run `npx iui-init`):

```ts
// iui.config.ts — use /config subpath to avoid circular deps
import { type IUIConfig, defineTypography } from "@inventive-ui/framework/config";

const config: IUIConfig = {
  theme: {
    mode: { 
      default: "light", 
      allowSystem: true,
      storageKey: "iui-theme" // Optional — default provided
    },
    direction: "ltr",
    colors: {
      semantic: { success: "green", warning: "amber", danger: "red", info: "blue" },
      neutral: { set: "slate" },
      brand: { set: "indigo" },
      accent: { "accent-1": "fuchsia", "accent-2": "purple" },
      gradients: {
        glass: { from: "white", to: "transparent", direction: "45deg" },
      },
    },
    typography: defineTypography({ provider: "system", set: "inter" }),
    spacing: { set: "standard" },
    radius: { set: "md" },
  },
  icon: { library: "lucide", defaults: { style: "outlined", filled: true } },
};

export default config;
```

| Option | Description |
|--------|-------------|
| `theme.mode.default` | `'light' \| 'dark'` — Default theme mode |
| `theme.mode.allowSystem` | `boolean` — Detect system preference (dark/light mode) |
| `theme.mode.storageKey` | `string` — localStorage key for persistence (default: `"iui-theme"`) |
| `theme.direction` | `'ltr' \| 'rtl'` |
| `theme.colors` | semantic, brand, accent, gradients |
| `theme.spacing.set` | `'compact' \| 'standard' \| 'spacious'` |
| `theme.radius.set` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` |
| `icon.library` | `'lucide' \| 'material' \| 'phosphor'` |

### Theme Persistence & Initialization (Industry Standard)

**Inventive UI Framework** follows the same patterns as **next-themes**, **Chakra UI**, and other industry-standard frameworks:

#### ✅ Automatic Theme Persistence

The framework automatically handles theme persistence — **no manual `localStorage` code needed**:

```tsx
// ✅ Framework owns persistence — app never touches localStorage
<IUIProvider config={config}>
  <App />
</IUIProvider>

// Theme changes are automatically saved and restored
```

#### ✅ Priority Resolution (Storage → System → Default)

Theme mode is resolved in this order:

1. **localStorage** (user's saved preference) — highest priority
2. **System preference** (if `allowSystem: true`)
3. **Config default** (`theme.mode.default`)

```ts
// Example resolution:
// 1. Check localStorage.getItem("iui-theme") → "dark" ✅ Uses this
// 2. If not found, check system preference → "light"
// 3. If allowSystem: false, use config default → "light"
```

#### ✅ Configurable Storage Key

Customize the localStorage key (useful for multi-app scenarios):

```ts
theme: {
  mode: {
    default: "light",
    allowSystem: true,
    storageKey: "my-app-theme" // Custom key (default: "iui-theme")
  }
}
```

#### ✅ Unified Initialization

The framework provides a single `initFramework()` function that handles:

- Runtime CSS initialization (synchronous, before paint)
- Config application
- Theme resolution (storage → system → default)
- Theme state update
- DOM sync before first paint (zero FOUC)
- Persistence management (auto-saves theme changes)

**This matches the pattern used by:**
- ✅ **next-themes** — Configurable `storageKey`, priority resolution, auto-persistence
- ✅ **Chakra UI** — Priority resolution, auto-persistence (storageKey hardcoded)
- ✅ **MUI/Mantine** — Similar internal patterns

**App code stays simple:**
```tsx
// Just Provider + config — framework handles everything
<IUIProvider config={config}>
  <App />
</IUIProvider>
```

---

## 📚 API Reference

### Utilities

| Export | Description |
|--------|-------------|
| `cn`, `iuimerge`, `cn2`, `cx` | Class merging |
| `conditionalClasses` | Conditional class object |
| `cva`, `VariantProps` | Variant factory (class-variance-authority) |
| `validateIUIClass`, `getConflictingClasses`, `extractDesignTokens`, `getTokenCategory` | Validation |
| `withStateVariants`, `withResponsiveVariants`, `withThemeVariants`, `createComponentClasses`, `createIUIVariants` | Variant helpers |

### Hooks

| Hook | Description |
|------|-------------|
| `useTheme` | Theme state, setTheme, isDark, isLight |
| `useArbitraryValues` | Enable arbitrary value syntax |
| `useColorPalette` | Color palette init |
| `useRuntimeCSS`, `useConditionalCSS`, `useResponsiveCSS`, `useThemeAwareCSS`, `useArbitraryCSS` | Runtime CSS injection |
| `useSlotRenderer` | Get slot renderer function |
| `useIUIContext` | Access IUI context |

### Config & Theme

| Export | Description |
|--------|-------------|
| `IUIProvider`, `IUIProviderProps` | Provider component |
| `applyLoadedConfig`, `initFramework` | Config application |
| `getToken`, `getSemanticColors`, `getGradientColors`, `getRadiusSet`, `getSpacingSet` | Config access |
| `setSemanticColors`, `setAccentColors`, `setNeutralColors` | Runtime theme updates |
| `themeManager` | Theme state manager |
| `defineTypography` | Typography config helper |

### Slots

| Export | Description |
|--------|-------------|
| `SlotRenderer` | Render slot by type |
| `registerSlot` | Register custom slot |
| `registerIconLibrary`, `getIconLibraryRenderer` | Icon library registration |

### Engine (Advanced)

| Export | Description |
|--------|-------------|
| `utilityBuilder`, `cssRootManager` | CSS generation |
| `initializeEngineCSS`, `initializeThemeSync` | Init helpers |
| `processClasses` | Manual class processing |
| `IUIEngine`, `IUIRuntime` | Lazy engine API |
| `treeShakeUtilities`, `extractCriticalCSS`, `purgeCSS`, `compressCSS` | Optimizers |

### SSR Utilities

| Export | Description |
|--------|-------------|
| `isBrowser`, `isNode`, `isNextJS` | Environment checks |
| `getWindow`, `getDocument` | Safe DOM access |
| `browserOnly`, `serverOnly` | Conditional execution |

---

## 🎯 Best Practices

### 1. Use `cn()` for Class Merging

✅ **Good:**
```tsx
className={cn('base-class', condition && 'conditional-class')}
```

❌ **Bad:**
```tsx
className={`base-class ${condition ? 'conditional-class' : ''}`}
```

### 2. Extract Variants to Constants

✅ **Good:**
```tsx
const buttonVariants = cva('base-class', { variants: {...} });
```

❌ **Bad:**
```tsx
className={cn('base-class', variant === 'primary' && '...', variant === 'secondary' && '...')}
```

### 3. Use Semantic Colors

✅ **Good:**
```tsx
className="bg-success-500 text-danger-600"
```

❌ **Bad:**
```tsx
className="bg-green-500 text-red-600"
```

### 4. Enable Arbitrary Values Only When Needed

✅ **Good:**
```tsx
// Only in components that need arbitrary values
useArbitraryValues();
```

❌ **Bad:**
```tsx
// Don't call in every component
```

### 5. Use Theme Hook for Dynamic Theming

✅ **Good:**
```tsx
const { theme, setTheme } = useTheme();
```

❌ **Bad:**
```tsx
// Don't manually toggle classes
```

---

## 🐛 Troubleshooting

### Config Not Found

**Problem:** Framework can't find `iui.config.ts`

**Solutions:**
- ✅ **With plugin:** Ensure `iui.config.ts` exists in project root; check `iuiPlugin()` (Vite) or `IUIWebpackPlugin` (Webpack) is in config
- ✅ **Without plugin:** Import config manually: `import config from "../iui.config"` and pass to `<IUIProvider config={config}>`
- ✅ Config is **optional** — use `<IUIProvider>` with no config for built-in defaults

### TypeScript Errors

**Problem:** TypeScript reports "Could not find a declaration file"

**Solutions:**
- ✅ The package ships TypeScript declarations — ensure you're on the latest version
- ✅ Restart TypeScript server in your IDE (Ctrl+Shift+P → "TypeScript: Restart TS Server")
- ✅ Remove any manual `inventive-ui.d.ts` workaround — it's no longer needed

### Styles Not Applying

**Problem:** Classes not generating CSS

**Solutions:**
- ✅ Ensure framework is imported in entry file
- ✅ Check `IUIProvider` wraps your app (Next.js)
- ✅ Verify config is loaded correctly
- ✅ Check browser console for errors

### Hydration Warnings (Next.js)

**Problem:** Hydration mismatch warnings

**Solution:**
- ✅ Add `suppressHydrationWarning` to `<html>` tag (required)
- ✅ This is expected behavior due to theme classes

### Build Errors

**Problem:** Build fails with module errors

**Solutions:**
- ✅ Check Node.js version (>= 20.0.0)
- ✅ Clear `node_modules` and reinstall
- ✅ Check bundler configuration
- ✅ Verify all peer dependencies are installed

---

## 📋 Requirements

- **Node.js**: >= 20.0.0
- **npm**: >= 8.0.0
- **React**: >= 18.0.0 or >= 19.0.0 (peer dependency)
- **Next.js**: >= 13.0.0 (optional, for Next.js projects)
- **TypeScript**: 5.8+ (recommended)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Inventive-UI/Framework.git

# Install dependencies
npm install

# Run development mode
npm run dev

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint
```

---

## ✅ Industry Standard

| Pattern | Implementation |
|---------|----------------|
| **Single import** | `import { IUIProvider }` — Provider handles init (Chakra/MUI/Mantine) |
| **Optional config** | Works with or without `iui.config.ts` — built-in defaults |
| **Optional plugins** | Vite/Webpack plugins optional — manual config import works |
| **useLayoutEffect** | Config applied before paint — zero FOUC |
| **SSR guards** | `typeof window`, `isBrowser()` throughout |
| **Static config** | No dynamic import delay — config available immediately |
| **Theme persistence** | Framework owns localStorage — auto-saves/restores (next-themes/Chakra pattern) |
| **Priority resolution** | Storage → System → Default (industry-standard order) |
| **Configurable storageKey** | Custom localStorage key support (like next-themes) |
| **Unified init** | Single `initFramework()` handles everything (exposed API) |

---

## 📚 Additional Resources

- 📘 [Next.js Usage & Delay Report](./docs/NEXT-DELAY-REPORT-FOR-REVIEW.md) - Full setup, usage, and architecture
- 📘 [Compatibility Guide](./COMPATIBILITY.md) - Works with React & Next.js
- 📘 [Compile-first guide](./docs/01-compile-first-guide.md) — integration & concepts
- 📘 [Integration & runtime](./docs/02-integration-and-runtime.md) — bundlers and thin runtime
- 📘 [Contributing Guide](./CONTRIBUTING.md) - How to contribute
- 🎨 [Figma Design System](https://www.figma.com/design/hoQqz9Wvm1rpNp7TOHLE1k/IUI-Design-System?node-id=605-9&m=dev)
- 🧾 [Figma Documentation](https://www.figma.com/design/0TGkT8hjRb2ODAcaxmYzZa/Documentation?node-id=97-30326&m=dev)
- 💻 [Coding Guidelines](https://celestial-butterfly-172.notion.site/Code-Structuring-Guidelines-28ab5fb47f69807790f0f9c9fb34aa07)

---

## 📦 Package Information

- **Package Name**: `@inventive-ui/framework`
- **Bundle Size** (measured): `dist/index.esm.js` ~181KB minified (~42KB gzip); `dist/slots.esm.js` ~17KB minified (~5KB gzip) — separate entry; compile-first CSS, not zero-runtime
- **Module Formats**: CommonJS & ES Modules
- **Type Definitions**: Included
- **SSR Support**: ✅ Full server-side rendering with critical CSS injection
- **Next.js Support**: ✅ Pages Router & App Router (13+), industry-standard IUIRegistry + Providers pattern
- **React Support**: ✅ React 18+ & 19+
- **Architecture**: ✅ Industry-standard (Chakra/MUI/Emotion patterns)

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- 📖 **Documentation**: [docs.inventive-ui.com](https://docs.inventive-ui.com)
- 💬 **Issues**: [GitHub Issues](https://github.com/Inventive-UI/Framework/issues)
- 💡 **Discussions**: [GitHub Discussions](https://github.com/Inventive-UI/Framework/discussions)

---

<div align="center">

**Made with ❤️ by the Inventive UI Team**

Well-furnished • Production-ready • Industry-standard architecture

[Get Started](#-quick-start) • [Usage](#-usage) • [Setup](#-setup-guide) • [Contribute](#-contributing)

</div>
