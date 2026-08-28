import type { FlagLibrary } from "../../core/config";
import {
  getFlagDefaults,
  getFlagFallback,
  getFlagLibrary,
  getFlagPlaceholderProps,
  getGlobalFlags,
} from "../../core/config-loader";
import { resolveAssetAliasValue } from "./resolve-asset-alias-value";

/** Minimal flag slot shape for resolution. */
export interface FlagSlotBase {
  type: "flag";
  code: string;
  library?: FlagLibrary;
  size?: "sm" | "md" | "lg";
  [key: string]: unknown;
}

/**
 * Resolves a flag slot: library defaults, `@placeholder`, `@alias`, fallback.
 */
export function resolveFlagSlot<T extends FlagSlotBase>(slot: T): T {
  const configLibrary = getFlagLibrary();
  const library = slot.library ?? configLibrary;
  const useDefaults = library === configLibrary ? getFlagDefaults() : null;

  const merged = {
    ...(useDefaults || {}),
    library,
    ...slot,
  } as T;

  const code = (merged as FlagSlotBase).code;
  if (typeof code !== "string" || code.length === 0) {
    return merged;
  }
  if (!code.startsWith("@")) {
    return merged;
  }

  const resolved = resolveAssetAliasValue({
    rawValue: code,
    globalMap: getGlobalFlags(),
    placeholderProps: getFlagPlaceholderProps(),
    placeholderField: "code",
    fallback: getFlagFallback(),
    assetLabel: "flag",
  });

  return { ...merged, code: resolved.toUpperCase() } as T;
}
