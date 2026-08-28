/**
 * Pre-expand framework theme gray utilities (gray-2 … gray-98, even steps).
 *
 * CSS variables come from generateNeutralPalette() → grayPalette.
 * Scan-first builds only emit utilities that appear in source unless we expand here.
 * Without this, bg-gray-24 / text-gray-96 work only when scanned — not as a full ramp.
 *
 * Do NOT confuse with accent `gray` (50–950 chromatic ramp from iui.config accent.gray).
 */

/** Even lightness steps emitted as --iui-color-gray-{N} (HSL 0,0,N%). */
export const THEME_GRAY_STEPS: readonly number[] = Array.from(
  { length: 49 },
  (_, i) => 2 + i * 2,
);

const THEME_GRAY_COLOR_PROPERTIES = [
  "bg",
  "text",
  "border",
  "outline",
  "ring",
  "fill",
  "stroke",
] as const;

/** Standard 11-step shades — only valid when accent.gray is configured. */
export const CHROMATIC_GRAY_SHADES = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
  "950",
] as const;

/** Chromatic-only shades (no overlap with theme gray even steps 2–98). Gray-50 overlaps both ramps. */
const CHROMATIC_GRAY_SHADES_WITHOUT_THEME_OVERLAP = CHROMATIC_GRAY_SHADES.filter(
  (shade) => !THEME_GRAY_STEPS.includes(Number(shade)),
);

const CHROMATIC_GRAY_FILTER_RE = new RegExp(
  `^(?:bg|text|border|outline|ring|fill|stroke)-gray-(?:${CHROMATIC_GRAY_SHADES_WITHOUT_THEME_OVERLAP.join("|")})$`,
);

/**
 * Emit bg/text/border/… utilities for every theme gray step so docs and apps
 * can use the predefined achromatic ramp without accent.gray in config.
 */
export function expandThemeGrayUtilityClasses(): Set<string> {
  const classes = new Set<string>();

  for (const step of THEME_GRAY_STEPS) {
    for (const property of THEME_GRAY_COLOR_PROPERTIES) {
      classes.add(`${property}-gray-${step}`);
    }
  }

  return classes;
}

export function accentPaletteIncludesGray(
  config?: { theme?: { colors?: { accent?: Record<string, unknown> } } } | null,
): boolean {
  const gray = config?.theme?.colors?.accent?.gray;
  return typeof gray === "string" && gray.trim().length > 0;
}

/**
 * Remove chromatic gray-50…950 utility tokens when accent.gray is not configured.
 * Prevents emitting .bg-gray-200 { … var(--iui-color-gray-200) } with a missing var.
 */
export function filterChromaticGrayUtilitiesWithoutAccent(
  classes: Set<string>,
  config?: { theme?: { colors?: { accent?: Record<string, unknown> } } } | null,
): void {
  if (accentPaletteIncludesGray(config)) return;

  for (const token of [...classes]) {
    const base = token.replace(/^!/, "").replace(/^(?:[\w-]+:)+/, "");
    if (CHROMATIC_GRAY_FILTER_RE.test(base)) {
      classes.delete(token);
    }
  }
}
