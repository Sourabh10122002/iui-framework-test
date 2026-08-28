/**
 * IUI Design System - State Resolver
 * Normalizes state config (fill defaults) and maps to tokenized classes.
 * Resolved types use the same property names as user config (no custom/adaptive/strategy/overlay).
 */

import type {
  StatesConfig,
  ResolvedStatesConfig,
  ResolvedFocusedConfig,
  ResolvedDisabledStateConfig,
  ResolvedLoadingStateConfig,
  FocusedConfig,
  DisabledStateConfig,
  LoadingStateConfig,
  FocusedShade,
  LoaderSlotConfig,
} from "./types";
import { isShadedColorToken } from "../../utilities/color-token-utils";

/* =============================================================================
   DEFAULTS
============================================================================= */

const DEFAULT_FOCUSED_SHADES = { light: "600" as FocusedShade, dark: "400" as FocusedShade };

const DEFAULT_FOCUSED_OFFSET_COLOR = { light: "white", dark: "neutral-900" };

const DEFAULT_FOCUSED_CONFIG: ResolvedFocusedConfig = {
  mode: "custom",
  color: "brand",
  shades: DEFAULT_FOCUSED_SHADES,
  style: {
    width: "2px",
    offset: "2px",
    offsetColor: DEFAULT_FOCUSED_OFFSET_COLOR,
    radius: "inherit",
  },
  accessibility: { minContrast: 3, highContrastSupport: true },
};

const DEFAULT_DISABLED_CONFIG: ResolvedDisabledStateConfig = {
  style: "fade",
  opacity: 0.5,
  color: "neutral",
  cursor: "not-allowed",
};

const DEFAULT_LOADER: LoaderSlotConfig = {
  name: "ring",
  color: "currentColor",
};

const DEFAULT_LOADING_CONFIG: ResolvedLoadingStateConfig = {
  style: "fade",
  opacity: 1,
  color: "neutral",
  spinner: true,
  cursor: "wait",
  loader: DEFAULT_LOADER,
  label: "Loading",
};

/* =============================================================================
   RESOLVERS
============================================================================= */

function resolveFocused(cfg?: FocusedConfig): ResolvedFocusedConfig {
  if (!cfg) return DEFAULT_FOCUSED_CONFIG;
  return {
    mode: cfg.mode ?? DEFAULT_FOCUSED_CONFIG.mode,
    color: cfg.color ?? DEFAULT_FOCUSED_CONFIG.color,
    shades: {
      light: cfg.shades?.light ?? DEFAULT_FOCUSED_SHADES.light,
      dark: cfg.shades?.dark ?? DEFAULT_FOCUSED_SHADES.dark,
    },
    style: {
      ...DEFAULT_FOCUSED_CONFIG.style,
      ...cfg.style,
      offsetColor: {
        ...DEFAULT_FOCUSED_OFFSET_COLOR,
        ...cfg.style?.offsetColor,
      },
    },
    accessibility: {
      ...DEFAULT_FOCUSED_CONFIG.accessibility,
      ...cfg.accessibility,
    },
  };
}

function resolveDisabled(
  cfg?: DisabledStateConfig,
): ResolvedDisabledStateConfig {
  if (!cfg) return DEFAULT_DISABLED_CONFIG;
  return {
    style: cfg.style ?? "fade",
    opacity: cfg.opacity ?? 0.5,
    color: cfg.color ?? "neutral",
    cursor: cfg.cursor ?? "not-allowed",
  };
}

function resolveLoading(cfg?: LoadingStateConfig): ResolvedLoadingStateConfig {
  if (!cfg) return DEFAULT_LOADING_CONFIG;
  return {
    style: cfg.style ?? "fade",
    opacity: cfg.opacity ?? 1,
    color: cfg.color ?? "neutral",
    spinner: cfg.spinner ?? true,
    cursor: cfg.cursor ?? "wait",
    loader: { ...DEFAULT_LOADER, ...cfg.loader },
    label: cfg.label ?? DEFAULT_LOADING_CONFIG.label,
  };
}

export function resolveStatesConfig(cfg?: StatesConfig): ResolvedStatesConfig {
  return {
    focused: resolveFocused(cfg?.focused),
    disabled: resolveDisabled(cfg?.disabled),
    loading: resolveLoading(cfg?.loading),
    // Forward any optional hover/active/selected config so the overall
    // resolved shape remains stable. These keys are forwarded for
    // compatibility but are not currently used by the class generators
    // (the runtime only consumes focused, disabled and loading).
    hover: cfg?.hover,
    active: cfg?.active,
    selected: cfg?.selected,
  };
}

/* =============================================================================
   CLASS GENERATORS
============================================================================= */

export interface StateCSS {
  classNames: string[];
  dataAttributes: Record<string, string | boolean>;
}

export interface StateContext {
  componentColor?: string;
  /** Reserved for focused state when loading is non-blocking (currently always blocked) */
  loadingColor?: string;
  isLoadingAndFocusable?: boolean;
}

/**
 * Extract numeric value from CSSSize for Tailwind class generation.
 * Tailwind classes like `ring-2` need just the number, not "2px".
 */
function extractNumericValue(cssSize: string | number | undefined, fallback: number): number {
  if (cssSize === undefined) return fallback;
  if (typeof cssSize === "number") return cssSize;
  // Extract number from strings like "2px", "2rem", "2em"
  const match = cssSize.match(/^(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : fallback;
}

/**
 * True when `token` is already a full palette+shade utility name (e.g. `neutral-500`,
 * `accent-11-600`). Accent **slot** names like `accent-11` are not shaded tokens.
 */
function tokenAlreadyIncludesShade(token: string): boolean {
  if (token === "white" || token === "black") return true;
  return isShadedColorToken(token);
}

/**
 * Build ring color class for a token and shade. When token is "white" or "black",
 * or when token already includes a shade (e.g. "neutral-500", "accent-11-600"),
 * no shade is appended.
 */
function getRingColorClass(
  token: string,
  shade: string,
): string {
  if (token === "white" || token === "black") {
    return `ring-${token}`;
  }
  if (tokenAlreadyIncludesShade(token)) {
    return `ring-${token}`;
  }
  return `ring-${token}-${shade}`;
}

/**
 * Append a shade to palette tokens while preserving already-shaded or structural tokens.
 * Examples:
 * - brand + 600 => brand-600
 * - accent-11 + 500 => accent-11-500
 * - accent-11-600 + 500 => accent-11-600
 * - white + 500 => white
 */
function tokenWithShade(token: string, shade: string): string {
  if (tokenAlreadyIncludesShade(token)) return token;
  return `${token}-${shade}`;
}

export function generateFocusedCSS(
  config: ResolvedFocusedConfig,
  context: StateContext = {},
): StateCSS {
  const classNames: string[] = [];
  const dataAttributes: Record<string, string | boolean> = {};

  // Mode: none - remove all focused styles
  if (config.mode === "none") {
    classNames.push("focus:outline-none");
    return { classNames, dataAttributes };
  }
  const width = extractNumericValue(config.style.width, 2);
  const offset = extractNumericValue(config.style.offset, 2);

  // Mode: native - black in light, white in dark
  let lightRingClass: string;
  let darkRingClass: string;
  if (config.mode === "native") {
    lightRingClass = "ring-black";
    darkRingClass = "ring-white";
  } else {
    // Mode: adaptive (component color) or ring (static color)
    const token =
      config.mode === "adaptive" && context.componentColor
        ? context.componentColor
        : (config.color ?? "brand");
    lightRingClass = getRingColorClass(token as string, config.shades.light);
    darkRingClass = getRingColorClass(token as string, config.shades.dark);
    if (token === "white") darkRingClass = "ring-black";
    else if (token === "black") darkRingClass = "ring-white";
  }

  const offsetColor = config.style.offsetColor ?? DEFAULT_FOCUSED_OFFSET_COLOR;
  const lightOffsetClass = `ring-offset-${offsetColor.light}`;
  const darkOffsetClass = `ring-offset-${offsetColor.dark}`;

  // Base ring classes - light mode and dark mode
  classNames.push(
    "focus-visible:ring",
    `focus-visible:ring-${width}`,
    `focus-visible:ring-offset-${offset}`,
    `focus-visible:${lightOffsetClass}`,
    `focus-visible:${lightRingClass}`,
    `dark:focus-visible:${darkOffsetClass}`,
    `dark:focus-visible:${darkRingClass}`,
  );

  // When loading is non-blocking (optional future use): ring adapts to loading color
  if (context.isLoadingAndFocusable && context.loadingColor) {
    const loadingToken = context.loadingColor;
    let loadingLightRingClass = getRingColorClass(loadingToken, config.shades.light);
    let loadingDarkRingClass = getRingColorClass(loadingToken, config.shades.dark);
    if (loadingToken === "white") loadingDarkRingClass = "ring-black";
    else if (loadingToken === "black") loadingDarkRingClass = "ring-white";
    classNames.push(
      `data-loading:focus-visible:ring`,
      `data-loading:focus-visible:ring-${width}`,
      `data-loading:focus-visible:ring-offset-${offset}`,
      `data-loading:focus-visible:${lightOffsetClass}`,
      `data-loading:focus-visible:${loadingLightRingClass}`,
      `dark:data-loading:focus-visible:${darkOffsetClass}`,
      `dark:data-loading:focus-visible:${loadingDarkRingClass}`,
    );
  }

  // Apply radius styling
  if (config.style.radius === "none") {
    classNames.push("focus-visible:rounded-none");
  } else if (config.style.radius && config.style.radius !== "inherit") {
    const radiusValue = extractNumericValue(config.style.radius, 0);
    if (radiusValue > 0) {
      classNames.push(`focus-visible:rounded-[${radiusValue}px]`);
    }
  }

  // High contrast mode support (only if enabled)
  if (config.accessibility.highContrastSupport) {
    const token =
      config.mode === "native"
        ? "black"
        : (config.mode === "adaptive" && context.componentColor
            ? context.componentColor
            : config.color ?? "brand") as string;
    const highContrastShade = config.shades.light === "500" ? "600" : config.shades.light;
    const highContrastRingClass = getRingColorClass(token, highContrastShade);
    classNames.push(
      "high-contrast:focus-visible:ring-4",
      `high-contrast:focus-visible:${highContrastRingClass}`,
      "forced-colors:focus-visible:outline",
      "forced-colors:focus-visible:outline-2",
      "forced-colors:focus-visible:outline-offset-2",
    );
  }

  return { classNames, dataAttributes };
}

export function generateDisabledCSS(
  config: ResolvedDisabledStateConfig,
): StateCSS {
  const classNames: string[] = [];
  const dataAttributes: Record<string, string | boolean> = {};

  classNames.push(`disabled:cursor-${config.cursor}`);

  if (config.style === "fade" || config.style === "mute") {
    classNames.push(
      `disabled:opacity-${Math.round(config.opacity * 100)}`,
    );
  }

  if (config.style === "mute") {
    const token = config.color;
    classNames.push(
      `disabled:bg-${tokenWithShade(token, "100")}`,
      `disabled:text-${tokenWithShade(token, "500")}`,
      `disabled:fill-${tokenWithShade(token, "500")}`,
      `disabled:stroke-${tokenWithShade(token, "500")}`,
    );
  }

  return { classNames, dataAttributes };
}

export function generateLoadingCSS(config: ResolvedLoadingStateConfig): {
  classNames: string[];
  dataAttributes: Record<string, string | boolean>;
} {
  const classNames: string[] = [];
  const dataAttributes: Record<string, string | boolean> = {};

  classNames.push(`data-loading:cursor-${config.cursor}`);

  if (config.style === "fade" || config.style === "mute") {
    classNames.push(
      `data-loading:opacity-${Math.round(config.opacity * 100)}`,
    );
  }

  if (config.style === "mute") {
    const token = config.color;
    classNames.push(
      `data-loading:bg-${tokenWithShade(token, "100")}`,
      `data-loading:text-${tokenWithShade(token, "600")}`,
      `data-loading:fill-${tokenWithShade(token, "600")}`,
      `data-loading:stroke-${tokenWithShade(token, "600")}`,
    );
  }
  if (config.spinner) {
    dataAttributes["data-show-spinner"] = true;
  }
  dataAttributes["data-loading-style"] = config.style;

  return { classNames, dataAttributes };
}

export function generateStateCSS(
  states: ResolvedStatesConfig,
  context: StateContext = {},
): {
  focused: {
    classNames: string[];
    dataAttributes: Record<string, string | boolean>;
  };
  disabled: {
    classNames: string[];
    dataAttributes: Record<string, string | boolean>;
  };
  loading: {
    classNames: string[];
    dataAttributes: Record<string, string | boolean>;
  };
  combined: { classNames: string[] };
} {
  const focused = generateFocusedCSS(states.focused, context);
  const disabled = generateDisabledCSS(states.disabled);
  const loading = generateLoadingCSS(states.loading);

  return {
    focused,
    disabled,
    loading,
    combined: {
      classNames: [
        ...focused.classNames,
        ...disabled.classNames,
        ...loading.classNames,
      ],
    },
  };
}

export {
  DEFAULT_DISABLED_CONFIG,
  DEFAULT_FOCUSED_CONFIG,
  DEFAULT_LOADING_CONFIG,
};
