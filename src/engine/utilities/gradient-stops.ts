/**
 * Shared gradient stop composition (Tailwind v4–aligned).
 * Used by utility builder and arbitrary CSS generation.
 */

/** Default stop positions when position utilities are omitted */
export const GRADIENT_STOP_DEFAULTS = {
  from: "0%",
  via: "50%",
  to: "100%",
} as const;

const GRADIENT_FROM_STOP =
  "var(--iui-gradient-from) var(--iui-gradient-from-position, 0%)";
const GRADIENT_VIA_STOP =
  "var(--iui-gradient-via) var(--iui-gradient-via-position, 50%)";
/** Transparent fallback when `to-*` is omitted — must not be set by from/via (CSS order can put via after to). */
const GRADIENT_TO_STOP =
  "var(--iui-gradient-to, rgb(0 0 0 / 0)) var(--iui-gradient-to-position, 100%)";

/** Compose --iui-gradient-stops for two-color gradients */
export function buildTwoColorGradientStops(): string {
  return `${GRADIENT_FROM_STOP}, ${GRADIENT_TO_STOP}`;
}

/** Compose --iui-gradient-stops for three-color gradients */
export function buildThreeColorGradientStops(): string {
  return `${GRADIENT_FROM_STOP}, ${GRADIENT_VIA_STOP}, ${GRADIENT_TO_STOP}`;
}

export function isGradientStopPosition(value: string): boolean {
  return /^\d+(\.\d+)?%$/.test(value.trim());
}

/**
 * Map logical start/end keywords in radial `at` positions to physical left/right
 * (same convention as background-position in this framework).
 */
const RADIAL_POSITION_KEYWORDS: Record<string, string> = {
  start: "left",
  end: "right",
  "top-start": "top left",
  "top-end": "top right",
  "bottom-start": "bottom left",
  "bottom-end": "bottom right",
  ts: "top left",
  te: "top right",
  bs: "bottom left",
  be: "bottom right",
  "start-top": "left top",
  "start-bottom": "left bottom",
  "end-top": "right top",
  "end-bottom": "right bottom",
};

function normalizeRadialPositionTokens(value: string): string {
  return value
    .split(/\s+/)
    .map((part) => RADIAL_POSITION_KEYWORDS[part] ?? part)
    .join(" ");
}

export function normalizeRadialGradientPosition(value: string): string {
  const v = value.trim();
  if (!v) return v;

  // Tailwind: bg-radial-[at_50%_75%] or bg-radial-[at_top_start]
  if (v.startsWith("at ")) {
    const rest = normalizeRadialPositionTokens(v.slice(3).trim());
    return rest ? `at ${rest}` : "at center";
  }

  if (RADIAL_POSITION_KEYWORDS[v]) return RADIAL_POSITION_KEYWORDS[v];

  return normalizeRadialPositionTokens(v);
}

/** Build background-image for named gradient utilities (linear / radial / conic) */
export function buildBackgroundGradientImage(value: string): string | null {
  const linearMap: Record<string, string> = {
    none: "none",
    "gradient-to-t": `linear-gradient(to top, var(--iui-gradient-stops))`,
    "gradient-to-b": `linear-gradient(to bottom, var(--iui-gradient-stops))`,
    "gradient-to-s": `linear-gradient(to left, var(--iui-gradient-stops))`,
    "gradient-to-e": `linear-gradient(to right, var(--iui-gradient-stops))`,
    // Tailwind L/R aliases (same physical directions as s/e)
    "gradient-to-l": `linear-gradient(to left, var(--iui-gradient-stops))`,
    "gradient-to-r": `linear-gradient(to right, var(--iui-gradient-stops))`,
    "gradient-to-ts": `linear-gradient(to top left, var(--iui-gradient-stops))`,
    "gradient-to-te": `linear-gradient(to top right, var(--iui-gradient-stops))`,
    "gradient-to-bs": `linear-gradient(to bottom left, var(--iui-gradient-stops))`,
    "gradient-to-be": `linear-gradient(to bottom right, var(--iui-gradient-stops))`,
    "gradient-to-tl": `linear-gradient(to top left, var(--iui-gradient-stops))`,
    "gradient-to-tr": `linear-gradient(to top right, var(--iui-gradient-stops))`,
    "gradient-to-bl": `linear-gradient(to bottom left, var(--iui-gradient-stops))`,
    "gradient-to-br": `linear-gradient(to bottom right, var(--iui-gradient-stops))`,
    radial: `radial-gradient(var(--iui-gradient-stops))`,
    conic: `conic-gradient(var(--iui-gradient-stops))`,
  };

  if (linearMap[value]) return linearMap[value];

  const conicAngleMatch = value.match(/^conic-(\d+(?:\.\d+)?)(?:deg)?$/);
  if (conicAngleMatch) {
    return `conic-gradient(from ${conicAngleMatch[1]}deg, var(--iui-gradient-stops))`;
  }

  return null;
}

/** Build background-image for arbitrary bg-radial-[…] / bg-conic-[…] utilities */
export function buildArbitraryGradientImage(
  property: "bg-radial" | "bg-conic",
  rawValue: string,
): string {
  const value = normalizeRadialGradientPosition(rawValue.trim());
  if (property === "bg-radial") {
    if (value) {
      return `background-image: radial-gradient(${value}, var(--iui-gradient-stops))`;
    }
    return `background-image: radial-gradient(var(--iui-gradient-stops))`;
  }

  if (value) {
    return `background-image: conic-gradient(${value}, var(--iui-gradient-stops))`;
  }
  return `background-image: conic-gradient(var(--iui-gradient-stops))`;
}

export type GradientStopKind = "from" | "via" | "to";

export function gradientStopPositionProperty(
  kind: GradientStopKind,
): `--iui-gradient-${GradientStopKind}-position` {
  return `--iui-gradient-${kind}-position`;
}

/** Properties emitted when a gradient color stop is set */
export function buildGradientColorStopProperties(
  kind: GradientStopKind,
  cssColor: string,
): Record<string, string> {
  const properties: Record<string, string> = {};

  if (kind === "from") {
    properties["--iui-gradient-from"] = cssColor;
    properties["--iui-gradient-stops"] = buildTwoColorGradientStops();
  } else if (kind === "via") {
    properties["--iui-gradient-via"] = cssColor;
    properties["--iui-gradient-stops"] = buildThreeColorGradientStops();
  } else {
    properties["--iui-gradient-to"] = cssColor;
  }

  return properties;
}

/** Properties emitted when a gradient stop position (e.g. from-40%) is set */
export function buildGradientPositionStopProperties(
  kind: GradientStopKind,
  position: string,
): Record<string, string> {
  return {
    [gradientStopPositionProperty(kind)]: position,
  };
}
