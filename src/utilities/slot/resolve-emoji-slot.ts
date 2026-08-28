import {
  getEmojiDefaults,
  getEmojiFallback,
  getEmojiPlaceholderProps,
  getGlobalEmojis,
} from "../../core/config-loader";
import { resolveAssetAliasValue } from "./resolve-asset-alias-value";

/** Minimal emoji slot shape for resolution. */
export interface EmojiSlotBase {
  type: "emoji";
  family?: string;
  skinTone?: string;
  name?: string;
}

/**
 * Resolves an emoji slot: merge global defaults, `@placeholder`, `@alias`, fallback.
 */
export function resolveEmojiSlot<T extends EmojiSlotBase>(slot: T): T {
  const defaults = getEmojiDefaults();
  const merged = {
    ...defaults,
    ...slot,
  } as T;

  const name = (merged as { name?: unknown }).name;
  if (typeof name !== "string" || name.length === 0) {
    return merged;
  }
  if (!name.startsWith("@")) {
    return merged;
  }

  const resolved = resolveAssetAliasValue({
    rawValue: name,
    globalMap: getGlobalEmojis() as Record<string, string>,
    placeholderProps: getEmojiPlaceholderProps(),
    placeholderField: "name",
    fallback: getEmojiFallback(),
    assetLabel: "emoji",
  });

  return { ...merged, name: resolved } as T;
}
