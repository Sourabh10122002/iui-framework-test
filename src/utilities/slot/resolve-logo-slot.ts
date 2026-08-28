import type { LogoProps } from "@inventive-ui/logos";
import {
  getGlobalLogos,
  getLogoFallback,
  getLogoPlaceholderProps,
} from "../../core/config-loader";
import { resolveAssetAliasValue } from "./resolve-asset-alias-value";

export type LogoSlotBase = {
  type: "logo";
} & LogoProps;

/**
 * Resolves logo slot `name`: `@placeholder`, `@alias` → assets.logo, fallback on miss.
 */
export function resolveLogoSlot<T extends LogoSlotBase>(slot: T): T {
  const name = (slot as { name?: unknown }).name;
  if (typeof name !== "string" || name.length === 0) {
    return slot;
  }
  if (!name.startsWith("@")) {
    return slot;
  }

  const resolved = resolveAssetAliasValue({
    rawValue: name,
    globalMap: getGlobalLogos() as Record<string, string>,
    placeholderProps: getLogoPlaceholderProps(),
    placeholderField: "name",
    fallback: getLogoFallback(),
    assetLabel: "logo",
  });

  return { ...slot, name: resolved } as T;
}
