import type { SlotPlaceholderProps } from "../../core/assets-config";
import { SLOT_PLACEHOLDER_SENTINEL } from "../../core/config-loader";
import { resolveGlobalAlias } from "./resolve-global-alias";
import { createScopedLogger } from "../logger";

const aliasLogger = createScopedLogger("AssetAlias");

export type ResolveAssetAliasValueOptions = {
  /** Raw slot field value (e.g. `@menu`, `@placeholder`, literal id). */
  rawValue: string;
  /** Semantic `@alias` map from assets.config.json. */
  globalMap: Record<string, string>;
  /** Showcase defaults from `assets.*.placeholder`. */
  placeholderProps: SlotPlaceholderProps;
  /** Placeholder map key (`name`, `code`, `extension`, …). */
  placeholderField?: string;
  /** Fallback when `@placeholder` or unmapped `@alias`. */
  fallback: string;
  /** Human-readable asset kind for warnings. */
  assetLabel: string;
};

/**
 * Icon-style resolution for any string asset field:
 * - `@placeholder` → `placeholder[field]` or fallback
 * - `@alias` → global map or fallback (+ dev warning)
 * - literal → unchanged
 */
export function resolveAssetAliasValue(
  options: ResolveAssetAliasValueOptions,
): string {
  const {
    rawValue,
    globalMap,
    placeholderProps,
    placeholderField = "name",
    fallback,
    assetLabel,
  } = options;

  if (!rawValue.startsWith("@")) {
    return rawValue;
  }

  if (rawValue === SLOT_PLACEHOLDER_SENTINEL) {
    const placeholder = placeholderProps[placeholderField];
    if (typeof placeholder === "string" && placeholder.length > 0) {
      return placeholder;
    }
    aliasLogger.warn(
      `@placeholder used but assets.${assetLabel}.placeholder.${placeholderField} is not configured — using fallback "${fallback}"`,
    );
    return fallback;
  }

  const resolved = resolveGlobalAlias(rawValue, globalMap);
  if (resolved) {
    return resolved;
  }

  aliasLogger.warn(
    `Unmapped alias "${rawValue}" on ${assetLabel}, using fallback "${fallback}"`,
  );
  return fallback;
}
