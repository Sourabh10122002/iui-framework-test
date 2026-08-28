import type { IUIConfig } from "../core/config";
import { resolveThemePalettes } from "../core/palette-registry";
import { COLOR_SHADE_STEPS } from "../utilities/color-token-utils";

export { COLOR_SHADE_STEPS };

function isPaletteName(token: string): boolean {
  if (!token) return false;
  if (token.startsWith("#") || token.includes("(") || /\s/.test(token)) {
    return false;
  }
  return /^[a-zA-Z][\w-]*$/.test(token);
}

function addPaletteEntry(value: unknown, target: Set<string>): void {
  if (typeof value !== "string") return;
  const token = value.trim();
  if (!isPaletteName(token)) return;
  target.add(token);
}

/** Collect palette names from iui.config theme colors (config-first). */
export function getConfigPalettes(config?: IUIConfig): string[] {
  const palettes = new Set<string>(["black", "white"]);
  const resolved = resolveThemePalettes(config);

  for (const key of resolved.paletteKeys) {
    palettes.add(key);
  }

  const themeColors = config?.theme?.colors;

  if (themeColors?.brand) {
    addPaletteEntry(themeColors.brand.set, palettes);
  }

  if (themeColors?.neutral) {
    palettes.add("neutral");
    addPaletteEntry(themeColors.neutral.set, palettes);
    if (
      themeColors.neutral &&
      typeof themeColors.neutral === "object" &&
      "base" in themeColors.neutral
    ) {
      addPaletteEntry(
        (themeColors.neutral as { base?: string }).base,
        palettes,
      );
    }
  }

  const accent = themeColors?.accent;
  if (accent) {
    Object.entries(accent).forEach(([key, value]) => {
      palettes.add(key);
      addPaletteEntry(value, palettes);
    });
  }

  const semantic = themeColors?.semantic;
  if (semantic) {
    Object.entries(semantic).forEach(([key, value]) => {
      palettes.add(key);
      addPaletteEntry(value, palettes);
    });
  }

  return Array.from(palettes);
}
