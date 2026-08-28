import type { IUIConfig } from "../core/config";
import {
  COLOR_SHADE_STEPS,
  getConfigPalettes,
} from "./get-config-palettes";

export interface PalettePattern {
  variantPrefix: string;
  property: string;
  paletteVar: string;
  shade: string | null;
  dynamicShade: boolean;
  shadeVar?: string;
}

export interface FilePaletteSignals {
  paletteDefaults: Map<string, string>;
  paletteUnions: Map<string, Set<string>>;
  paletteMapKeys: Set<string>;
  dynamicPaletteVars: Set<string>;
  patterns: PalettePattern[];
}

const COLOR_PROPERTIES = new Set([
  "bg",
  "text",
  "border",
  "outline",
  "ring",
  "fill",
  "stroke",
]);

const SHADE_VAR_NAMES = new Set(["shade", "step", "shadeStep", "colorShade"]);

function resolvePalettesForPattern(
  pattern: PalettePattern,
  signals: FilePaletteSignals,
  configPalettes: string[],
): string[] {
  const narrowed = new Set<string>();

  if (signals.paletteMapKeys.size > 0) {
    signals.paletteMapKeys.forEach((key) => narrowed.add(key));
  }

  for (const union of signals.paletteUnions.values()) {
    union.forEach((value) => narrowed.add(value));
  }

  const defaultValue = signals.paletteDefaults.get(pattern.paletteVar);
  if (defaultValue) {
    narrowed.add(defaultValue);
  }

  if (signals.dynamicPaletteVars.has(pattern.paletteVar) || narrowed.size === 0) {
    configPalettes.forEach((palette) => narrowed.add(palette));
  }

  return Array.from(narrowed);
}

function resolveShadesForPattern(pattern: PalettePattern): string[] {
  if (pattern.shade) {
    return [pattern.shade];
  }

  if (
    pattern.dynamicShade &&
    pattern.shadeVar &&
    SHADE_VAR_NAMES.has(pattern.shadeVar)
  ) {
    return [...COLOR_SHADE_STEPS];
  }

  return [];
}

function emitUtilityClass(
  variantPrefix: string,
  property: string,
  palette: string,
  shade: string,
): string {
  const base = `${property}-${palette}-${shade}`;
  if (!variantPrefix) return base;

  const variants = variantPrefix
    .split(":")
    .filter(Boolean)
    .map((segment) => `${segment}:`)
    .join("");

  return `${variants}${base}`;
}

export function resolvePaletteUtilities(
  fileSignalsList: FilePaletteSignals[],
  config?: IUIConfig,
): Set<string> {
  const classes = new Set<string>();
  const configPalettes = getConfigPalettes(config);

  for (const signals of fileSignalsList) {
    for (const pattern of signals.patterns) {
      if (!COLOR_PROPERTIES.has(pattern.property)) continue;

      const palettes = resolvePalettesForPattern(pattern, signals, configPalettes);
      const shades = resolveShadesForPattern(pattern);
      if (shades.length === 0) continue;

      for (const palette of palettes) {
        for (const shade of shades) {
          classes.add(
            emitUtilityClass(pattern.variantPrefix, pattern.property, palette, shade),
          );
        }
      }
    }
  }

  return classes;
}

export function resolvePaletteUtilitiesFromPatterns(
  patterns: PalettePattern[],
  config?: IUIConfig,
  palettes?: string[],
): Set<string> {
  const classes = new Set<string>();
  const resolvedPalettes = palettes ?? getConfigPalettes(config);

  for (const pattern of patterns) {
    if (!COLOR_PROPERTIES.has(pattern.property)) continue;
    const shades = resolveShadesForPattern(pattern);
    if (shades.length === 0) continue;

    for (const palette of resolvedPalettes) {
      for (const shade of shades) {
        classes.add(
          emitUtilityClass(pattern.variantPrefix, pattern.property, palette, shade),
        );
      }
    }
  }

  return classes;
}
