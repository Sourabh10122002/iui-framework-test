import type { IUIConfig } from "../../core/config";
import type { AssetPreloadTier } from "../../core/assets-config";
import { prefetchConfiguredSlotModulesEager } from "./async-slot";

export type { AssetPreloadTier };

/**
 * Resolves the effective slot preload tier from config.
 * Icon-level `preload` overrides root `assets.preload`.
 */
export function resolveAssetPreloadTier(
  config: IUIConfig | null,
): AssetPreloadTier {
  const tier =
    config?.assets?.icon?.preload ??
    config?.assets?.preload ??
    "configured";
  if (tier === "none" || tier === "configured" || tier === "scanned") {
    return tier;
  }
  return "configured";
}

let warmStarted = false;

let warmupEpoch = 0;
const warmupSubscribers = new Set<() => void>();

/** Subscribe to scanned-slot warmup completion (re-render slots when glyphs are prefetched). */
export function subscribeSlotWarmup(callback: () => void): () => void {
  warmupSubscribers.add(callback);
  return () => {
    warmupSubscribers.delete(callback);
  };
}

/** Snapshot for {@link subscribeSlotWarmup} — increments when warmup finishes. */
export function getSlotWarmupEpoch(): number {
  return warmupEpoch;
}

function bumpWarmupEpoch(): void {
  warmupEpoch += 1;
  warmupSubscribers.forEach((cb) => cb());
}

function logWarmupFailure(error: unknown): void {
  if (
    typeof process !== "undefined" &&
    process.env?.NODE_ENV !== "production"
  ) {
    console.warn("[IUI Slot] Slot asset warmup failed", error);
  }
}

function finishWarmup(error?: unknown): void {
  if (error) {
    logWarmupFailure(error);
  }
  bumpWarmupEpoch();
}

/**
 * Warms slot asset modules based on config tier — no per-icon consumer lists.
 * - configured: default library `/react` wrappers (starts immediately, not deferred)
 * - scanned: configured + bundler-generated `iui-slot-warmup` glyph imports
 */
export function warmSlotAssets(config: IUIConfig | null): void {
  if (typeof window === "undefined") {
    return;
  }

  const tier = resolveAssetPreloadTier(config);
  if (tier === "none") {
    return;
  }

  const wrapperWarm = prefetchConfiguredSlotModulesEager(config, tier);

  if (tier === "scanned" && !warmStarted) {
    warmStarted = true;
    void Promise.all([
      wrapperWarm,
      import("iui-slot-warmup").then(
        (mod) => mod.warmScannedSlotAssets?.() ?? mod.default?.(),
      ),
    ])
      .then(() => {
        finishWarmup();
      })
      .catch((error) => {
        warmStarted = false;
        finishWarmup(error);
      });
    return;
  }

  if (tier === "configured" || tier === "scanned") {
    void wrapperWarm
      .then(() => {
        finishWarmup();
      })
      .catch((error) => {
        finishWarmup(error);
      });
  }
}
