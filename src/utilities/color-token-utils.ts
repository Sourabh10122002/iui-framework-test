/**
 * Shared color token utilities for parser/classification/state paths.
 * Goal: avoid hardcoded accent slot ranges (accent-1..12) and support
 * config-driven palette keys like `accent-15` or `brand-accent`.
 */

export const COLOR_SHADE_STEPS = [
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

export const COLOR_SHADE_SOURCE = `(?:${COLOR_SHADE_STEPS.join("|")})`;

export const LEGACY_GRAY_STEP_SOURCE =
  "(?:2|4|6|8|10|12|14|16|18|20|22|24|26|28|30|32|34|36|38|40|42|44|46|48|50|52|54|56|58|60|62|64|66|68|70|72|74|76|78|80|82|84|86|88|90|92|94|96|98)";

export const COLOR_KEYWORD_SOURCE = "(?:white|black|transparent|current|inherit)";

/**
 * Any palette-like token ending in a valid shade step.
 * Examples: brand-600, accent-11-500, bros-400, warm-neutral-700.
 */
export const SHADED_COLOR_TOKEN_SOURCE =
  `(?:[a-zA-Z][\\w-]*-${COLOR_SHADE_SOURCE})`;

export const LEGACY_GRAY_TOKEN_SOURCE = `(?:gray-${LEGACY_GRAY_STEP_SOURCE})`;

export const COLOR_TOKEN_SOURCE =
  `(?:${COLOR_KEYWORD_SOURCE}|${LEGACY_GRAY_TOKEN_SOURCE}|${SHADED_COLOR_TOKEN_SOURCE})`;

export const COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE =
  `${COLOR_TOKEN_SOURCE}(?:\\/(\\d+(?:\\.\\d+)?))?`;

/**
 * Gradient stop tokens: percentage positions, config-driven palette colors, or arbitrary values.
 * Examples: from-40%, from-red-500/30, from-bros-600, from-[#abc]
 */
export const GRADIENT_STOP_TOKEN_SOURCE =
  `(?:\\d+(?:\\.\\d+)?%|${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}|\\[[^\\]]+\\])`;

export const GRADIENT_STOP_TOKEN_RE = new RegExp(
  `^${GRADIENT_STOP_TOKEN_SOURCE}$`,
);

export const SHADED_COLOR_TOKEN_RE = new RegExp(`^${SHADED_COLOR_TOKEN_SOURCE}$`);
export const COLOR_TOKEN_WITH_OPTIONAL_OPACITY_RE = new RegExp(
  `^${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`,
);

export function isShadedColorToken(value: string): boolean {
  return SHADED_COLOR_TOKEN_RE.test(value);
}

export function isColorTokenWithOptionalOpacity(value: string): boolean {
  return COLOR_TOKEN_WITH_OPTIONAL_OPACITY_RE.test(value);
}
