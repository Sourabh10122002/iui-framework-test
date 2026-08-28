import type { IllustrationLibrary } from "../../core/config";
import {
  getGlobalIllustrations,
  getIllustrationDefaults,
  getIllustrationFallback,
  getIllustrationLibrary,
  getIllustrationPlaceholderProps,
  resolvePlaceholderValuesInObject,
} from "../../core/config-loader";
import { resolveAssetAliasValue } from "./resolve-asset-alias-value";

/** Minimal slot shape for resolution (avoids circular import from registration). */
export interface IllustrationSlotBase {
  type: "illustration";
  name: string;
  library?: IllustrationLibrary;
  style?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  [key: string]: unknown;
}

/**
 * Resolves an illustration slot: library defaults, `@placeholder`, `@alias`, fallback.
 */
export function resolveIllustrationSlot<T extends IllustrationSlotBase>(slot: T): T {
  const configLibrary = getIllustrationLibrary();
  const library = slot.library ?? configLibrary;
  const useDefaults =
    library === configLibrary ? getIllustrationDefaults() : null;

  let merged = {
    ...(useDefaults || {}),
    library,
    ...slot,
  } as T;

  merged = resolvePlaceholderValuesInObject(
    merged,
    getIllustrationPlaceholderProps(),
  );

  const name = (merged as IllustrationSlotBase).name;
  if (typeof name !== "string" || name.length === 0) {
    return merged;
  }
  if (!name.startsWith("@")) {
    return merged;
  }

  const resolved = resolveAssetAliasValue({
    rawValue: name,
    globalMap: getGlobalIllustrations(),
    placeholderProps: getIllustrationPlaceholderProps(),
    placeholderField: "name",
    fallback: getIllustrationFallback(),
    assetLabel: "illustration",
  });

  return { ...merged, name: resolved } as T;
}
