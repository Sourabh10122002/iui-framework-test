import type { IUIConfig } from "./config";
import { THEME_SEMANTIC_DEFAULT_HEX } from "../engine/tokens/values";

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3,8})$/;

export function isHexColor(value: string): boolean {
  return HEX_COLOR_RE.test(value.trim());
}

function isPaletteName(token: string): boolean {
  if (!token) return false;
  if (token.startsWith("#") || token.includes("(") || /\s/.test(token)) {
    return false;
  }
  return /^[a-zA-Z][\w-]*$/.test(token);
}

/**
 * Resolve accent map entries to canonical base hex per palette key.
 * Supports chained references (`accent-3: "#f59e0b"` when `accent-3` resolves from another key's hex).
 */
export function buildAccentPaletteRegistry(
  accent: Record<string, string> | undefined,
): Map<string, string> {
  const registry = new Map<string, string>();
  if (!accent) return registry;

  const pending = new Map<string, string>();
  for (const [key, rawValue] of Object.entries(accent)) {
    if (typeof rawValue !== "string") continue;
    pending.set(key, rawValue.trim());
  }

  let progressed = true;
  while (progressed && pending.size > 0) {
    progressed = false;
    for (const [key, value] of [...pending.entries()]) {
      if (isHexColor(value)) {
        registry.set(key, value);
        pending.delete(key);
        progressed = true;
        continue;
      }

      if (registry.has(value)) {
        registry.set(key, registry.get(value)!);
        pending.delete(key);
        progressed = true;
      }
    }
  }

  return registry;
}

/**
 * Resolve a named palette reference to base hex using the accent registry only.
 */
export function resolvePaletteBaseHex(
  name: string,
  registry: Map<string, string>,
): string | null {
  const token = name.trim();
  if (!token) return null;
  if (isHexColor(token)) return token;
  if (!isPaletteName(token)) return null;
  return registry.get(token) ?? null;
}

export interface ResolvedThemePalettes {
  accent: Map<string, string>;
  semantic: Record<string, string>;
  brand: string | null;
  neutralBase: string | null;
  paletteKeys: string[];
}

/**
 * Build the unified palette registry used by compile + runtime paths.
 */
export function resolveThemePalettes(
  config?: IUIConfig | null,
): ResolvedThemePalettes {
  const themeColors = config?.theme?.colors;
  const accentRegistry = buildAccentPaletteRegistry(themeColors?.accent);

  const semanticEntries: Record<string, string> = {};
  const semantic = themeColors?.semantic ?? {};
  for (const [name, ref] of Object.entries(semantic)) {
    if (typeof ref !== "string") continue;
    const baseHex = isHexColor(ref)
      ? ref
      : resolvePaletteBaseHex(ref, accentRegistry);
    if (baseHex) semanticEntries[name] = baseHex;
  }

  const brandSet = themeColors?.brand?.set;
  const brand =
    typeof brandSet === "string"
      ? isHexColor(brandSet)
        ? brandSet
        : resolvePaletteBaseHex(brandSet, accentRegistry)
      : null;

  const neutralConfig = themeColors?.neutral;
  const neutralBaseRaw =
    neutralConfig && typeof neutralConfig === "object"
      ? neutralConfig.set ??
        ("base" in neutralConfig
          ? (neutralConfig as { base?: string }).base
          : undefined)
      : undefined;
  const neutralBase =
    typeof neutralBaseRaw === "string"
      ? isHexColor(neutralBaseRaw)
        ? neutralBaseRaw
        : resolvePaletteBaseHex(neutralBaseRaw, accentRegistry)
      : null;

  const paletteKeys = new Set<string>([
    ...accentRegistry.keys(),
    ...Object.keys(semanticEntries),
    ...(brand ? ["brand"] : []),
    ...(neutralBase ? ["neutral"] : []),
    "white",
    "black",
  ]);

  return {
    accent: accentRegistry,
    semantic: semanticEntries,
    brand,
    neutralBase,
    paletteKeys: Array.from(paletteKeys),
  };
}

/** Framework-owned semantic names (fixed contract). */
export const FRAMEWORK_SEMANTIC_PALETTE_NAMES = [
  "success",
  "warning",
  "danger",
  "info",
] as const;
