import type {
  StatesConfig,
  FocusedConfig,
  DisabledStateConfig,
  LoadingStateConfig,
  HoverStateConfig,
  ActiveStateConfig,
  SelectedStateConfig,
  TokenPath,
  OpacityScale,
  FocusedShade,
  FocusedColor,
} from "./types";

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

const TOKEN_REGEX = /^[a-zA-Z][a-zA-Z0-9-]*(?:-\d{1,3})?$/;

const VALID_FOCUSED_SHADES: readonly FocusedShade[] = [
  "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950",
];

function validateFocusedShade(
  value: string,
  context: string,
): asserts value is FocusedShade {
  if (!VALID_FOCUSED_SHADES.includes(value as FocusedShade)) {
    throw new Error(
      `[IUI States Config Error] Invalid focused state shade "${value}" in ${context}.\n` +
        `Allowed values: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950`,
    );
  }
}

function validateTokenPath(
  token: string,
  context: string,
): asserts token is TokenPath {
  if (!TOKEN_REGEX.test(token)) {
    throw new Error(
      `[IUI States Config Error] Invalid token "${token}" in ${context}.\n` +
        `Expected formats:\n` +
        `  • "success"\n` +
        `  • "success-500"\n` +
        `  • "accent-9"\n` +
        `  • "accent-9-500"\n`,
    );
  }

  // Extra safety: if numbers exist, they must be the last segment
  const parts = token.split("-");
  const last = parts[parts.length - 1];

  if (/\d/.test(token) && !/^\d{1,3}$/.test(last)) {
    throw new Error(
      `[IUI States Config Error] Invalid token "${token}" in ${context}.\n` +
        `If a number is present, it must be the final shade segment (e.g., success-500, accent-9-500).`,
    );
  }
}

/**
 * Validates opacity scale is within valid range.
 */
function validateOpacityScale(
  value: number,
  context: string,
): asserts value is OpacityScale {
  if (value < 0 || value > 1) {
    throw new Error(
      `[IUI States Config Error] Invalid opacity scale ${value} in ${context}. ` +
        `Value must be between 0 and 1.`,
    );
  }
}

/**
 * Validates the entire states configuration.
 */
const FOCUSED_COLOR_SPECIAL = ["black", "white", "brand"];

function validateFocusedColor(value: string, context: string): void {
  if (FOCUSED_COLOR_SPECIAL.includes(value)) return;
  validateTokenPath(value, context);
}

function validateStatesConfig(config: StatesConfig): void {
  if (config.focused?.color) {
    validateFocusedColor(config.focused.color as string, "focused.color");
  }
  if (config.focused?.shades?.light) {
    validateFocusedShade(
      config.focused.shades.light,
      "focused.shades.light",
    );
  }
  if (config.focused?.shades?.dark) {
    validateFocusedShade(
      config.focused.shades.dark,
      "focused.shades.dark",
    );
  }
  if (config.focused?.style?.offsetColor?.light) {
    validateTokenPath(
      config.focused.style.offsetColor.light,
      "focused.style.offsetColor.light",
    );
  }
  if (config.focused?.style?.offsetColor?.dark) {
    validateTokenPath(
      config.focused.style.offsetColor.dark,
      "focused.style.offsetColor.dark",
    );
  }
  if (config.disabled?.color) {
    validateTokenPath(config.disabled.color, "disabled.color");
  }
  if (config.disabled?.opacity !== undefined) {
    validateOpacityScale(config.disabled.opacity, "disabled.opacity");
  }
  if (config.loading?.color) {
    validateTokenPath(config.loading.color, "loading.color");
  }
  if (config.loading?.opacity !== undefined) {
    validateOpacityScale(config.loading.opacity, "loading.opacity");
  }
  if (config.selected?.backgroundToken) {
    validateTokenPath(
      config.selected.backgroundToken,
      "selected.backgroundToken",
    );
  }
  if (config.selected?.indicatorToken) {
    validateTokenPath(
      config.selected.indicatorToken,
      "selected.indicatorToken",
    );
  }
}

// =============================================================================
// HELPERS
// =============================================================================

export function defineStates(config: StatesConfig): StatesConfig {
  if (process.env.NODE_ENV !== "production") {
    validateStatesConfig(config);
  }
  return config;
}

export function defineFocused(config: FocusedConfig): FocusedConfig {
  if (process.env.NODE_ENV !== "production") {
    if (config.color)
      validateFocusedColor(config.color as string, "focused.color");
    if (config.shades?.light)
      validateFocusedShade(config.shades.light, "focused.shades.light");
    if (config.shades?.dark)
      validateFocusedShade(config.shades.dark, "focused.shades.dark");
  }
  return config;
}

export function defineDisabledState(
  config: DisabledStateConfig,
): DisabledStateConfig {
  if (process.env.NODE_ENV !== "production") {
    if (config.color) validateTokenPath(config.color, "disabled.color");
    if (config.opacity !== undefined)
      validateOpacityScale(config.opacity, "disabled.opacity");
  }
  return config;
}

export function defineLoadingState(
  config: LoadingStateConfig,
): LoadingStateConfig {
  if (process.env.NODE_ENV !== "production") {
    if (config.color) validateTokenPath(config.color, "loading.color");
    if (config.opacity !== undefined)
      validateOpacityScale(config.opacity, "loading.opacity");
  }
  return config;
}

export function defineHoverState(config: HoverStateConfig): HoverStateConfig {
  // Reserved: This function exists to provide a stable API for theme
  // authors who may include a `hover` key in their config. The design system
  // currently does not generate hover-specific runtime classes; this is a
  // placeholder for future implementations.
  return config;
}

export function defineActiveState(
  config: ActiveStateConfig,
): ActiveStateConfig {
  // Reserved: See comment in `defineHoverState` — active/pressed behavior is
  // intentionally left as a future extension point. Keeping the helper
  // function avoids breaking consumer code if they include `active` config.
  return config;
}

export function defineSelectedState(
  config: SelectedStateConfig,
): SelectedStateConfig {
  if (process.env.NODE_ENV !== "production") {
    if (config.backgroundToken)
      validateTokenPath(config.backgroundToken, "selected.backgroundToken");

    if (config.indicatorToken)
      validateTokenPath(config.indicatorToken, "selected.indicatorToken");
  }
  // Reserved: `selected` is validated for forward-compatibility but not
  // emitted into runtime classes by the resolver. It remains available so
  // component libraries can opt into selected behaviors later without a
  // breaking change to config shape.
  return config;
}

// =============================================================================
// PRESETS (FIXED TOKENS)
// =============================================================================

export const accessibilityFirstPreset: StatesConfig = {
  focused: { mode: "native" },
  disabled: { style: "mute", color: "neutral-400" },
  loading: { style: "mute", color: "neutral-300", spinner: true },
};

export const modernAdaptivePreset: StatesConfig = {
  focused: {
    mode: "adaptive",
    color: "brand",
    style: { width: "2px", offset: "2px", radius: "inherit" },
    accessibility: { minContrast: 3, highContrastSupport: true },
  },
  disabled: { style: "fade", opacity: 0.45 },
  loading: { style: "fade", opacity: 0.6, spinner: true },
};

export const minimalPreset: StatesConfig = {
  focused: {
    mode: "custom",
    color: "neutral-500",
    style: { width: "1px", offset: "1px", radius: "inherit" },
  },
  disabled: { style: "fade", opacity: 0.4 },
  loading: { style: "fade", opacity: 0.5, spinner: true },
};
