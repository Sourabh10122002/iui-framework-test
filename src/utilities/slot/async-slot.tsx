import React, { useSyncExternalStore } from "react";
import type { IUIConfig } from "../../core/config";
import type { AssetPreloadTier } from "../../core/assets-config";

/**
 * Package ids used by optional slot renderers.
 * Imports resolve to thin `/react` entry points (Icon/Logo wrappers only),
 * never the package barrel that re-exports full manifests.
 */
export type OptionalSlotPackageId =
  | "@inventive-ui/icons-lucide"
  | "@inventive-ui/icons-phosphor"
  | "@inventive-ui/material-symbols"
  | "@inventive-ui/icons-material"
  | "@inventive-ui/logos"
  | "@inventive-ui/color-logos"
  | "@inventive-ui/flags"
  | "@inventive-ui/loaders"
  | "@inventive-ui/file-types"
  | "@inventive-ui/emoji"
  | "@inventive-ui/illustrations";

export type ModuleLoader =
  | OptionalSlotPackageId
  | (() => OptionalSlotPackageId | Promise<unknown>);

const moduleCache = new Map<string, Promise<unknown>>();

/** True for function components and forwardRef/memo objects. */
export function isReactComponentType(
  value: unknown,
): value is React.ComponentType<unknown> {
  if (typeof value === "function") {
    return true;
  }
  if (value && typeof value === "object") {
    return typeof (value as { $$typeof?: unknown }).$$typeof === "symbol";
  }
  return false;
}

/**
 * Strip invalid `default` interop objects that bundlers attach during SSR
 * (`default` = module namespace). Keeps real default component exports.
 */
export function normalizeSlotModule(mod: unknown): Record<string, unknown> {
  if (!mod || typeof mod !== "object") {
    return {};
  }
  const record = { ...(mod as Record<string, unknown>) };
  const def = record.default;
  if (def !== undefined && !isReactComponentType(def)) {
    delete record.default;
  }
  return record;
}

/**
 * Resolve a component export from a dynamic import, preferring the named export
 * when `default` is a bundler namespace object (common in Vite SSR).
 *
 * When `member` is set (e.g. `resolveComponentExport(mod, "Label", "Float")`),
 * resolves a compound namespace export without unsafe property access in codegen.
 */
export function resolveComponentExport<P = unknown>(
  mod: unknown,
  exportName: string,
  member?: string,
): React.ComponentType<P> | null {
  const record = normalizeSlotModule(mod);
  const named = record[exportName];

  if (member) {
    if (named !== undefined && named !== null && typeof named === "object") {
      const leaf = (named as Record<string, unknown>)[member];
      if (isReactComponentType(leaf)) {
        return leaf as React.ComponentType<P>;
      }
    }
    return null;
  }

  if (isReactComponentType(named)) {
    return named as React.ComponentType<P>;
  }
  // Compound namespace exports (Input, Drawer) are plain objects with sub-components.
  if (named !== undefined && named !== null && typeof named === "object") {
    return named as React.ComponentType<P>;
  }
  const def = record.default;
  if (isReactComponentType(def)) {
    return def as React.ComponentType<P>;
  }
  return null;
}

/**
 * Dynamic import of the thin React wrapper for each optional slot package.
 * String-literal branches let Vite/Webpack pre-bundle only the wrapper module.
 */
function importThinSlotModule(pkgId: string): Promise<unknown> {
  switch (pkgId) {
    case "@inventive-ui/icons-lucide":
      return import("@inventive-ui/icons-lucide/react");
    case "@inventive-ui/icons-phosphor":
      return import("@inventive-ui/icons-phosphor/react");
    case "@inventive-ui/material-symbols":
      return import("@inventive-ui/material-symbols/react");
    case "@inventive-ui/icons-material":
      return import("@inventive-ui/icons-material/react");
    case "@inventive-ui/logos":
      return import("@inventive-ui/logos/react");
    case "@inventive-ui/color-logos":
      return import("@inventive-ui/color-logos/react");
    case "@inventive-ui/flags":
      return import("@inventive-ui/flags/react");
    case "@inventive-ui/loaders":
      return import("@inventive-ui/loaders/react");
    case "@inventive-ui/file-types":
      return import("@inventive-ui/file-types/react");
    case "@inventive-ui/emoji":
      return import("@inventive-ui/emoji/react");
    case "@inventive-ui/illustrations":
      return import("@inventive-ui/illustrations/react");
    default:
      return Promise.reject(
        new Error(`[IUI Slot] Unknown optional module: ${pkgId}`),
      );
  }
}

function resolveModuleLoader(
  loader: ModuleLoader | Promise<unknown>,
): string | Promise<unknown> {
  if (loader instanceof Promise) {
    return loader;
  }
  return typeof loader === "function" ? loader() : loader;
}

/**
 * Loads an optional slot package (thin `/react` entry). Results are cached so
 * prefetch + first render share the same promise.
 */
export function loadOptionalModule(
  pkgNameOrLoader: ModuleLoader | Promise<unknown>,
): Promise<unknown> {
  const resolved = resolveModuleLoader(pkgNameOrLoader);

  if (typeof resolved !== "string") {
    return Promise.resolve(resolved);
  }

  const cached = moduleCache.get(resolved);
  if (cached) {
    return cached;
  }

  const promise = importThinSlotModule(resolved).catch((error) => {
    moduleCache.delete(resolved);
    throw error;
  });
  moduleCache.set(resolved, promise);
  return promise;
}

/** Warm the module cache without rendering a slot (e.g. after config init). */
export function prefetchOptionalModule(pkgId: OptionalSlotPackageId): void {
  void loadOptionalModule(pkgId).catch(() => {
    // Optional packages may be absent in consumer apps.
  });
}

const ICON_LIBRARY_PACKAGES: Record<string, OptionalSlotPackageId> = {
  lucide: "@inventive-ui/icons-lucide",
  phosphor: "@inventive-ui/icons-phosphor",
  "material-symbols": "@inventive-ui/material-symbols",
  "material-icons": "@inventive-ui/icons-material",
};

const ILLUSTRATION_LIBRARY_PACKAGES: Record<string, OptionalSlotPackageId> = {
  storyset: "@inventive-ui/illustrations",
};

const FLAG_LIBRARY_PACKAGES: Record<string, OptionalSlotPackageId> = {
  flagpack: "@inventive-ui/flags",
};

const FILE_TYPE_LIBRARY_PACKAGES: Record<string, OptionalSlotPackageId> = {
  vscode: "@inventive-ui/file-types",
};

const LOADER_LIBRARY_PACKAGES: Record<string, OptionalSlotPackageId> = {
  ldrs: "@inventive-ui/loaders",
};

/** React wrappers warmed when `preload: "scanned"` (Storybook / full DS showcases). */
const SCANNED_SLOT_ECOSYSTEM_PACKAGES: OptionalSlotPackageId[] = [
  "@inventive-ui/icons-lucide",
  "@inventive-ui/icons-phosphor",
  "@inventive-ui/icons-material",
  "@inventive-ui/material-symbols",
  "@inventive-ui/logos",
  "@inventive-ui/color-logos",
  "@inventive-ui/flags",
  "@inventive-ui/file-types",
  "@inventive-ui/loaders",
  "@inventive-ui/emoji",
];

function scheduleIdleTask(task: () => void): void {
  if (typeof window === "undefined") {
    return;
  }
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(task, { timeout: 2000 });
    return;
  }
  queueMicrotask(task);
}

/**
 * Prefetch only the slot packages referenced by config defaults — not all 11
 * asset ecosystems. Safe to call after `initConfig` / `applyLoadedConfig`.
 * Uses idle scheduling (legacy); prefer {@link warmSlotAssets} for visible UI.
 */
export function prefetchConfiguredSlotModules(config: IUIConfig | null): void {
  if (typeof window === "undefined") {
    return;
  }

  scheduleIdleTask(() => {
    prefetchConfiguredSlotModulesEager(config);
  });
}

/**
 * Eagerly warm configured slot library `/react` wrappers.
 * Used by {@link warmSlotAssets} — not idle-delayed.
 * Resolves when all configured package imports settle (success or absent).
 */
export function prefetchConfiguredSlotModulesEager(
  config: IUIConfig | null,
  preloadTier: AssetPreloadTier = "configured",
): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const assets = config?.assets;
  if (!assets) {
    return Promise.resolve();
  }

  const packages = new Set<OptionalSlotPackageId>();

  const iconPkg = ICON_LIBRARY_PACKAGES[assets.icon?.library ?? ""];
  if (iconPkg) {
    packages.add(iconPkg);
  }

  const illustrationPkg =
    ILLUSTRATION_LIBRARY_PACKAGES[assets.illustration?.library ?? ""];
  if (illustrationPkg) {
    packages.add(illustrationPkg);
  }

  const flagPkg = FLAG_LIBRARY_PACKAGES[assets.flag?.library ?? ""];
  if (flagPkg) {
    packages.add(flagPkg);
  }

  const fileTypePkg =
    FILE_TYPE_LIBRARY_PACKAGES[assets.fileType?.library ?? ""];
  if (fileTypePkg) {
    packages.add(fileTypePkg);
  }

  const loaderPkg = LOADER_LIBRARY_PACKAGES[assets.loader?.library ?? ""];
  if (loaderPkg) {
    packages.add(loaderPkg);
  }

  if (assets.emoji) {
    packages.add("@inventive-ui/emoji");
  }

  if (assets.logo) {
    packages.add("@inventive-ui/logos");
  }

  if (assets.colorLogo) {
    packages.add("@inventive-ui/color-logos");
  }

  if (preloadTier === "scanned") {
    SCANNED_SLOT_ECOSYSTEM_PACKAGES.forEach((pkgId) => packages.add(pkgId));
  }

  if (packages.size === 0) {
    return Promise.resolve();
  }

  return Promise.all(
    [...packages].map((pkgId) =>
      loadOptionalModule(pkgId).catch(() => {
        // Optional packages may be absent in consumer apps.
      }),
    ),
  ).then(() => undefined);
}

/**
 * Deferred slot component: starts loading on first render (or subscribe), then
 * re-renders via `useSyncExternalStore` when the module resolves.
 *
 * Prefer this over `React.lazy` + `Suspense` for slots — Suspense fallbacks
 * ("Loading...") flash on every boundary and fight code-split caches.
 * Returns `null` until ready (no fallback text). Prefer {@link warmSlotAssets}
 * / prefetch so the first paint already has `Resolved`.
 *
 * Accepts an optional package id, a promise, or `() => import(...)` so
 * consumer DS packages can load local components the same way as Framework
 * asset wrappers.
 *
 * Pass `{ prefetch: true }` to start the dynamic import as soon as the slot
 * module registers (still async — does not create a static import cycle).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createEagerComponent<P extends object = Record<string, unknown>>(
  moduleLoader: ModuleLoader | Promise<unknown>,
  getComponent: (mod: any) => React.ComponentType<P> | undefined | null,
  options?: { prefetch?: boolean },
): React.ComponentType<P> {
  let Resolved: React.ComponentType<P> | null = null;
  let loadPromise: Promise<void> | null = null;
  let settled = false;
  let readyEpoch = 0;
  const listeners = new Set<() => void>();

  function getReadyEpoch(): number {
    return readyEpoch;
  }

  function subscribeReady(onStoreChange: () => void): () => void {
    ensureLoadStarted();
    listeners.add(onStoreChange);
    return () => {
      listeners.delete(onStoreChange);
    };
  }

  function ensureLoadStarted(): void {
    if (loadPromise) {
      return;
    }

    loadPromise = Promise.resolve(loadOptionalModule(moduleLoader))
      .then((mod) => {
        Resolved =
          (getComponent(normalizeSlotModule(mod)) as React.ComponentType<P>) ??
          null;
      })
      .catch((error) => {
        if (
          typeof process !== "undefined" &&
          process.env?.NODE_ENV !== "production"
        ) {
          console.warn("[IUI Slot] Optional module load failed", error);
        }
      })
      .finally(() => {
        settled = true;
        if (Resolved) {
          readyEpoch += 1;
        }
        listeners.forEach((fn) => fn());
        listeners.clear();
      });
  }

  function LazySlot(props: P) {
    ensureLoadStarted();
    useSyncExternalStore(subscribeReady, getReadyEpoch, () => 0);

    return Resolved ? React.createElement(Resolved, props) : null;
  }

  LazySlot.displayName = "LazySlot";

  if (options?.prefetch) {
    ensureLoadStarted();
  }

  return LazySlot;
}
