import type { IconLibrary } from "../../core/assets-config";
import { normalizeIconLibraryId } from "./normalize-icon-library";

/** Library-native neutral glyph when config omits `assets.icon.fallback`. */
export const LIBRARY_NATIVE_ICON_FALLBACK: Record<IconLibrary, string> = {
  "material-symbols": "help",
  "material-icons": "help",
  lucide: "circle-help",
  phosphor: "question",
};

/** Framework defaults when `assets.*.fallback` is omitted. */
export const ASSET_NATIVE_FALLBACK = {
  icon: "help",
  loader: "ring",
  illustration: "amico-1212-sale-hidden",
  flag: "US",
  fileType: "pdf",
  emoji: "waving_hand",
  logo: "apple",
  colorLogo: "google-gmail",
} as const;

export type AssetSlotKind = keyof typeof ASSET_NATIVE_FALLBACK;

/** Resolve effective fallback glyph for an icon library (config override or native default). */
export function resolveIconFallbackGlyph(
  library: IconLibrary | string,
  configuredFallback?: string,
): string {
  const id = normalizeIconLibraryId(library) as IconLibrary;
  const trimmed =
    typeof configuredFallback === "string" ? configuredFallback.trim() : "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return LIBRARY_NATIVE_ICON_FALLBACK[id] ?? LIBRARY_NATIVE_ICON_FALLBACK["material-symbols"];
}

/** Resolve effective fallback id for a non-icon asset slot. */
export function resolveAssetFallback(
  kind: AssetSlotKind,
  configuredFallback?: string,
): string {
  const trimmed =
    typeof configuredFallback === "string" ? configuredFallback.trim() : "";
  if (trimmed.length > 0) {
    return trimmed;
  }
  return ASSET_NATIVE_FALLBACK[kind];
}
