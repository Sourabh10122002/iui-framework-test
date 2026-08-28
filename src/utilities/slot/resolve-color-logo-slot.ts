import type { LogoProps } from "@inventive-ui/logos";
import {
  getColorLogoFallback,
  getGlobalColorLogos,
  getColorLogoPlaceholderProps,
} from "../../core/config-loader";
import { resolveAssetAliasValue } from "./resolve-asset-alias-value";

export type ColorLogoSlotBase = {
  type: "color-logo";
} & LogoProps;

/**
 * Resolves color-logo slot `name`: `@placeholder`, `@alias` → assets.colorLogo, fallback on miss.
 */
export function resolveColorLogoSlot<T extends ColorLogoSlotBase>(slot: T): T {
  const name = (slot as { name?: unknown }).name;
  if (typeof name !== "string" || name.length === 0) {
    return slot;
  }
  if (!name.startsWith("@")) {
    return slot;
  }

  const resolved = resolveAssetAliasValue({
    rawValue: name,
    globalMap: getGlobalColorLogos() as Record<string, string>,
    placeholderProps: getColorLogoPlaceholderProps(),
    placeholderField: "name",
    fallback: getColorLogoFallback(),
    assetLabel: "colorLogo",
  });

  return { ...slot, name: resolved } as T;
}
