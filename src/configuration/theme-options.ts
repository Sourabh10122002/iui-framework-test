import { VariableUtils, setRootCssVariable } from "../utilities";
import { FRAMEWORK_PALETTE_CONTRACTS } from "../engine/tokens/color-contracts";
import {
  THEME_BRAND_DEFAULT_HEX,
  THEME_NEUTRAL_DEFAULT_HEX,
  THEME_SEMANTIC_DEFAULT_HEX,
} from "../engine/tokens/values";
import { getConfigLoader } from "../core/config-loader";
import { resolveThemePalettes } from "../core/palette-registry";
import {
  colors,
  fontSize,
  fontFamily,
  fontWeight,
  spacing,
  borderRadius,
  borderWidth,
  ringWidth,
  ringOffsetWidth,
} from "../engine/tokens/values";
import { setRootCssVariables } from "../utilities/css-variable-manager";
import { getDynamicTokenValue } from "../engine/tokens/dynamic";
import { mapRadius } from "../utilities/theme-utilities";
import { initializeGradients as initGradients } from "../utilities/gradient-utils";
import { configureCSSLogicalProperties } from "../engine/css/optimizers/logical-properties";
import { logger } from "../utilities/logger";
import { buildGlobalConfigStylesCSS } from "./theme-css-builders";
// Industry standard: Static imports for config loader (Chakra/Mantine/MUI pattern)
// Removes 3-4s Next.js delay caused by code splitting with dynamic imports
import {
  getModeDefault,
  getModeAllowSystem,
  getModeStorageKey,
  getRadiusSet,
  getSpacingSet,
  getPanelBackgroundSet,
  getTypographyProvider,
  getTypographySet,
  getTypographyExtend,
  getLocalFontUrls,
} from "../core/config-loader";

export let globalRadius = "md";
export let globalSpacing: "compact" | "standard" | "spacious" = "standard";
export let globalColor = "brand";
export let globalFont = "inter";
export let globalPanelBackground: "solid" | "translucent" = "solid";
export let typographyExtendTokens: Record<string, string | string[]> = {};

/**
 * Semantic color mapping that aligns with runtime design tokens
 * Maps semantic meanings to actual color palette names or hex values
 */
export let semanticColors: Record<string, string> | any = {
  ...THEME_SEMANTIC_DEFAULT_HEX,
};

/**
 * Neutral base hex — generates neutral-50…950 and theme gray-2…98 at runtime.
 */
export let neutralColor: string = THEME_NEUTRAL_DEFAULT_HEX;

/** @deprecated Use `neutralColor`. */
export let neutralColors: { set: string } = { set: THEME_NEUTRAL_DEFAULT_HEX };

/** User-defined accent palettes from iui.config — no framework defaults. */
export let accentColors: Record<string, string> = {};

// Brand color - user can name any colors
export let brandColor: string = THEME_BRAND_DEFAULT_HEX;
/* To inject customfonts in style element*/
/**
 * ⚠️ CRITICAL: injectGoogleFont() is NEVER CACHED
 * Font imports must always be fresh to ensure correct font loading
 */

export function injectGoogleFont(fontName: string): void {
  if (!fontName || typeof document === "undefined") return;

  const id = "iui-fonts";
  let style = document.getElementById(id) as HTMLStyleElement;

  if (!style) {
    style = document.createElement("style");
    style.id = id;
    document.head.appendChild(style);
  }

  const font = fontName.replace(/['"]/g, "").replace(/ /g, "+");
  // Font loading is handled silently - no console logs needed
  style.textContent += `
@import url("https://fonts.googleapis.com/css2?family=${font}&display=swap")\n;
`;
}

export function injectLocalFonts(urls: string | string[]): void {
  if (typeof document === "undefined") return;

  const id = "iui-fonts";
  let style = document.getElementById(id) as HTMLStyleElement | null;

  if (!style) {
    style = document.createElement("style");
    style.id = id;
    document.head.appendChild(style);
  }

  const urlList = Array.isArray(urls) ? urls : [urls];

  const existing = style.textContent ?? "";

  const imports = urlList
    .filter((url) => !existing.includes(url)) // prevent duplicates
    .map((url) => `@import url('${url}');`)
    .join("\n");

  if (imports) {
    style.textContent = existing ? `${existing}\n${imports}` : imports;
  }
}

/**
 * ⚠️ CRITICAL: injectGlobalStyles() is NEVER CACHED
 * This function always runs fresh to ensure fonts and styles are up-to-date
 * Font-family and injected styles must always be fresh on load
 */

export function injectGlobalStyles(): void {
  if (typeof document === "undefined") return;

  // ⚠️ ALWAYS FRESH
  const radiusValue = mapRadius(globalRadius);

  const spacingValueMap: Record<string, string> = {
    compact: spacing["1"],
    standard: spacing["2"],
    spacious: spacing["4"],
  };
  const spacingValue =
    spacingValueMap[globalSpacing] || spacingValueMap.standard;

  /* ---------------- TYPOGRAPHY (FIXED) ---------------- */

  // Merge base + extended fonts (ALWAYS FRESH)
  const resolvedFonts = {
    ...fontFamily,
    ...typographyExtendTokens,
  };

  const fontValue = resolvedFonts[globalFont as keyof typeof resolvedFonts];

  const fontFamilyValue = Array.isArray(fontValue)
    ? (fontValue as readonly string[]).join(", ")
    : String(fontValue || fontFamily.inter);

  /* --------------------------------------------------- */

  // Panel background value - solid = opaque, translucent = backdrop-filter
  const panelBackgroundValue =
    globalPanelBackground === "translucent" ? "translucent" : "solid";

  const globalVariables: Record<string, string> = {
    "--iui-global-radius": radiusValue,
    "--iui-global-spacing": spacingValue,
    "--iui-global-font": fontFamilyValue,
    "--iui-panel-background": panelBackgroundValue,
  };

  setRootCssVariables(globalVariables, "high");

  /* ---------------- STYLE INJECTION ---------------- */

  const styleId = "iui-global-config-styles";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = buildGlobalConfigStylesCSS();

  // Apply panel background attribute to root for global control
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute(
      "data-panel-background",
      panelBackgroundValue,
    );
  }
}

/**
 * Set new accent color names and their corresponding base colors
 * @param newAccentColors - Object mapping new accent names to base colors
 * Example: setAccentColors({ "primary": "blue", "secondary": "gray", "tertiary": "green" })
 */
export const setAccentColors = async (
  newAccentColors: Record<string, string>,
): Promise<void> => {
  accentColors = { ...newAccentColors };
  // Regenerate CSS variables when accent colors change
  await initializeAccentColors();
};
export const setBrandColor = async (color: string): Promise<void> => {
  brandColor = color;
  await initializeBrandColor();
};

export const setSemanticColors = async (
  overrides: Record<string, string> | any,
): Promise<void> => {
  semanticColors = { ...semanticColors, ...overrides };
  // Update CSS variables when semantic colors change using the new initialization
  await initializeSemanticColors();
};

export const setNeutralColor = async (color: string): Promise<void> => {
  neutralColor = color;
  neutralColors = { set: color };
  await initializeNeutralColors();
};

/** @deprecated Use `setNeutralColor`. */
export const setNeutralColors = setNeutralColor;

/**
 * Get all available color palettes from runtime design tokens
 * Includes base colors, semantic colors, accent colors, and neutral colors
 */
export const getAvailableColorPalettes = (): string[] => {
  const framework = [
    "white",
    "black",
    "brand",
    "neutral",
    ...FRAMEWORK_PALETTE_CONTRACTS.filter(
      (name) => name !== "brand" && name !== "neutral",
    ),
  ];

  try {
    const resolved = resolveThemePalettes(getConfigLoader().getConfig());
    return [...new Set([...framework, ...resolved.paletteKeys])];
  } catch {
    return framework;
  }
};

/**
 * Framework color contracts plus config-derived accent keys when config is loaded.
 */
export const availableColorPalettes = [
  "brand",
  "neutral",
  "danger",
  "warning",
  "success",
  "info",
  "white",
  "black",
] as const;

export type ColorPalette = (typeof availableColorPalettes)[number];

/**
 * Color shades available in each palette
 */
export const colorShades = [
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

export type ColorShade = (typeof colorShades)[number];

export let globalMode: "light" | "dark" = "light";

/**
 * Theme state interface for better type safety
 */
export interface ThemeState {
  color: string;
  radius: string;
  spacing: string;
  font: string;
  mode: "light" | "dark";
  panelBackground: "solid" | "translucent";
}


/**
 * Optimized batch update queue for performance
 */
class BatchUpdateQueue {
  private queue: Array<() => void> = [];
  private isProcessing = false;
  syncMode = false;

  add(update: () => void) {
    if (this.syncMode) {
      update();
      return;
    }
    this.queue.push(update);
    if (!this.isProcessing) {
      this.process();
    }
  }

  private async process() {
    this.isProcessing = true;

    await new Promise((resolve) => {
      if (typeof requestAnimationFrame !== "undefined") {
        requestAnimationFrame(resolve);
      } else {
        setTimeout(resolve, 16);
      }
    });

    const updates = [...this.queue];
    this.queue.length = 0;

    updates.forEach((update) => update());
    this.isProcessing = false;

    if (this.queue.length > 0) {
      this.process();
    }
  }
}

/**
 * Enhanced Theme state management class with performance optimizations
 * ⚠️ IMPORTANT: Theme JS state is NEVER cached across page loads
 * State is always fresh on initialization to ensure correct theme values
 */
class ThemeManager {
  private state: ThemeState;
  private listeners: Set<(state: ThemeState) => void> = new Set();
  private batchQueue = new BatchUpdateQueue();
  // ⚠️ cachedState is only for React render optimization within same session
  // NOT cached across page loads - always fresh on initialization
  private cachedState: ThemeState | null = null;
  private stateVersion = 0;

  // Memoized DOM operations (only for current session, not persisted)
  private memoizedDOMUpdates = new Map<string, string>();

  constructor() {
    // ⚠️ ALWAYS FRESH: Initialize state from current global values (never cached)
    this.state = {
      color: globalColor,
      radius: globalRadius,
      spacing: globalSpacing,
      font: globalFont, // ⚠️ Always fresh
      mode: globalMode,
      panelBackground: globalPanelBackground,
    };
  }

  /**
   * Get current theme state
   * ⚠️ NOTE: cachedState is only for React optimization within same render cycle
   * State is always fresh on page load - never cached across sessions
   */
  getState(): ThemeState {
    // Return cached state if unchanged (only for React optimization)
    if (
      this.cachedState &&
      this.stateVersion === (this.cachedState as any)._version
    ) {
      return this.cachedState;
    }

    // Create new cached state (only for current session)
    this.cachedState = {
      ...this.state,
      _version: this.stateVersion,
    } as ThemeState & { _version: number };

    return { ...this.state };
  }

  /**
   * ⚠️ CRITICAL: Reset theme state to ensure fresh values
   * Called on every page load to ensure state is never stale
   */
  resetState(): void {
    this.state = {
      color: globalColor,
      radius: globalRadius,
      spacing: globalSpacing,
      font: globalFont, // ⚠️ Always fresh
      mode: globalMode,
      panelBackground: globalPanelBackground,
    };
    this.cachedState = null;
    this.stateVersion++;
  }

  updateTheme(updates: Partial<ThemeState>) {
    // Check if updates actually change anything
    const hasChanges = Object.entries(updates).some(
      ([key, value]) => this.state[key as keyof ThemeState] !== value,
    );

    if (!hasChanges) return;

    const modeChanged =
      (updates.mode === "light" || updates.mode === "dark") &&
      updates.mode !== this.state.mode;

    const applyUpdate = () => {
      const oldState = { ...this.state };
      this.state = { ...oldState, ...updates };
      this.stateVersion++;
      this.cachedState = null; // Invalidate cache

      const layoutChanged =
        (updates.radius !== undefined && updates.radius !== oldState.radius) ||
        (updates.spacing !== undefined &&
          updates.spacing !== oldState.spacing) ||
        (updates.font !== undefined && updates.font !== oldState.font) ||
        (updates.color !== undefined && updates.color !== oldState.color);

      // Update global variables for backward compatibility
      globalColor = this.state.color;
      globalRadius = this.state.radius;
      if (
        this.state.spacing === "compact" ||
        this.state.spacing === "standard" ||
        this.state.spacing === "spacious"
      ) {
        globalSpacing = this.state.spacing;
      }
      globalFont = this.state.font;
      globalMode = this.state.mode;
      if (
        this.state.panelBackground === "solid" ||
        this.state.panelBackground === "translucent"
      ) {
        globalPanelBackground = this.state.panelBackground;
      }

      // Mode changes sync DOM immediately and exactly once here.
      // Persistence (setupThemeToggle) only writes localStorage — no second sync.
      if (modeChanged) {
        syncThemeToDOM(this.state.mode);
      }

      // Keep root CSS variables in sync when toolbar / config changes layout tokens.
      if (layoutChanged && typeof document !== "undefined") {
        injectGlobalStyles();
        if (
          updates.color !== undefined &&
          updates.color !== oldState.color
        ) {
          setRootCssVariable(
            "--global-color",
            `var(--color-${this.state.color})`,
            "high",
          );
        }
      }

      // Notify all listeners of the new state
      this.listeners.forEach((listener) => {
        try {
          listener({ ...this.state });
        } catch (e) {
          logger.error("Error in theme listener:", e);
          // Ignore listener errors
        }
      });
    };

    // Mode toggles must apply in the same click frame (industry: next-themes /
    // Chakra sync classList before paint). Non-mode updates keep rAF batching.
    if (modeChanged) {
      applyUpdate();
      return;
    }

    this.batchQueue.add(applyUpdate);
  }

  subscribe(listener: (state: ThemeState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setSyncMode(sync: boolean) {
    this.batchQueue.syncMode = sync;
  }
}

export const themeManager = new ThemeManager();

/**
 * Memoization utility for expensive computations
 */
const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

/**
 * Get available tokens for validation (memoized)
 */
export const getAvailableTokens = memoize(() => ({
  colors: [...availableColorPalettes],
  spacing: [
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl",
    "7xl",
  ],
  radius: ["none", "sm", "md", "lg", "full"],
  fonts: ["inter", "arial", "mono"],
}));

/**
 * Enhanced color validation with memoization
 */
export const validateColor = memoize((color: string): boolean => {
  // Now only validate against available color palettes (no more hex colors)
  return availableColorPalettes.includes(color as ColorPalette);
});

/**
 * Get color with fallback validation (memoized)
 */
export const getColorWithFallback = memoize((color: string): string => {
  return validateColor(color) ? color : semanticColors.success;
});

/**
 * Validate theme values by category (memoized)
 */
export const validateThemeValue = memoize(
  (category: string, value: string): boolean => {
    const tokens = getAvailableTokens();
    switch (category) {
      case "color":
        return validateColor(value);
      case "spacing":
        return tokens.spacing.includes(value);
      case "radius":
        return tokens.radius.includes(value);
      case "font":
        return tokens.fonts.includes(value);
      default:
        return false;
    }
  },
);

/**
 * Initialize semantic colors using centralized variable manager
 * Now includes eager hex color processing and proper neutral handling
 */
export const initializeSemanticColors = async (): Promise<void> => {
  if (typeof document === "undefined") return;

  const { generatePalette } = await import("../utilities/theme-utilities");
  const { resolveThemePalettes } = await import("../core/palette-registry");
  const { getConfigLoader } = await import("../core/config-loader");

  const allColorUpdates: Record<string, string> | any = {};
  const resolved = resolveThemePalettes(getConfigLoader().getConfig());
  const shades = [
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
  ];

  for (const [semanticName, baseHex] of Object.entries(resolved.semantic)) {
    const { palette } = generatePalette(baseHex, true);
    shades.forEach((shade) => {
      const semanticVar = VariableUtils.getColor(`${semanticName}-${shade}`);
      allColorUpdates[semanticVar] = palette[shade as keyof typeof palette];
    });
  }

  Object.entries(semanticColors as Record<string, string>).forEach(
    ([semantic, value]) => {
      if (resolved.semantic[semantic]) return;
      if (value.startsWith("#")) {
        const { palette } = generatePalette(value, true);
        shades.forEach((shade) => {
          const semanticVar = VariableUtils.getColor(`${semantic}-${shade}`);
          allColorUpdates[semanticVar] = palette[shade as keyof typeof palette];
        });
      }
    },
  );

  // Apply all color updates at once with high priority
  if (Object.keys(allColorUpdates).length > 0) {
    setRootCssVariables(allColorUpdates, "high");
    logger.log(
      `🎨 Eagerly initialized ${Object.keys(allColorUpdates).length} semantic color variables`,
    );
  }

  // Set global color variable using centralized system
  const globalColorVar = `var(--color-${globalColor})`;
  setRootCssVariable("--global-color", globalColorVar, "high");
};

/**
 * Initialize accent colors using centralized variable manager
 * Creates CSS variables for each accent color with its assigned base color palette
 */
export const initializeAccentColors = async (): Promise<void> => {
  if (typeof document === "undefined") return;

  const { generatePalette } = await import("../utilities/theme-utilities");
  const { buildAccentPaletteRegistry } = await import("../core/palette-registry");
  const { getConfigLoader } = await import("../core/config-loader");

  const allColorUpdates: Record<string, string> = {};
  const shades = [
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
  ];

  const configAccent = getConfigLoader().getAccentColors() ?? accentColors;
  const registry = buildAccentPaletteRegistry(configAccent);

  for (const [accentName, baseHex] of registry.entries()) {
    const { palette } = generatePalette(baseHex, true);
    shades.forEach((shade) => {
      const accentVar = VariableUtils.getColor(`${accentName}-${shade}`);
      allColorUpdates[accentVar] = palette[shade as keyof typeof palette];
    });
  }

  Object.entries(accentColors).forEach(([accentName, baseColor]) => {
    if (registry.has(accentName)) return;
    if (baseColor.startsWith("#")) {
      const { palette } = generatePalette(baseColor, true);
      shades.forEach((shade) => {
        const accentVar = VariableUtils.getColor(`${accentName}-${shade}`);
        allColorUpdates[accentVar] = palette[shade as keyof typeof palette];
      });
    }
  });

  // Apply all accent color updates at once with high priority
  if (Object.keys(allColorUpdates).length > 0) {
    setRootCssVariables(allColorUpdates, "high");
    logger.log(
      `🎨 Initialized ${Object.keys(allColorUpdates).length} accent color variables`,
    );
  }
};

// initialize brand colors
export const initializeBrandColor = async (): Promise<void> => {
  if (typeof document === "undefined") return;

  const { generatePalette } = await import("../utilities/theme-utilities");
  const { resolveThemePalettes } = await import("../core/palette-registry");
  const { getConfigLoader } = await import("../core/config-loader");

  const allColorUpdates: Record<string, string> = {};

  const shades = [
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
  ];

  const resolvedBrand =
    resolveThemePalettes(getConfigLoader().getConfig()).brand ??
    (brandColor.startsWith("#") ? brandColor : null);

  if (resolvedBrand) {
    const { palette } = generatePalette(resolvedBrand, true);
    shades.forEach((shade) => {
      const brandVar = VariableUtils.getColor(`brand-${shade}`);
      allColorUpdates[brandVar] = palette[shade as keyof typeof palette];
    });
  }

  setRootCssVariables(allColorUpdates, "high");

  logger.log("🎨 Initialized brand palette");
};

/**
 * Initialize neutral palette + theme gray from `theme.colors.neutral.set`.
 */
export const initializeNeutralColors = async (): Promise<void> => {
  if (typeof document === "undefined") return;

  const { generateNeutralPalette } =
    await import("../utilities/theme-utilities");
  const { resolveThemePalettes } = await import("../core/palette-registry");
  const { getConfigLoader } = await import("../core/config-loader");

  const allNeutralUpdates: Record<string, string> = {};
  const resolvedNeutralBase = resolveThemePalettes(
    getConfigLoader().getConfig(),
  ).neutralBase;

  let baseHex: string | null = resolvedNeutralBase;
  if (!baseHex && neutralColor.startsWith("#")) {
    baseHex = neutralColor;
  }

  if (!baseHex) {
    logger.warn(
      "⚠️ Neutral color requires hex or accent registry entry in theme.colors.neutral.set. Skipping neutral init.",
    );
    return;
  }

  neutralColor = baseHex;
  neutralColors = { set: baseHex };

  const { palette11, grayPalette } = generateNeutralPalette(baseHex);

  Object.entries(palette11).forEach(([shade, colorHex]) => {
    const neutralVar = VariableUtils.getColor(`neutral-${shade}`);
    allNeutralUpdates[neutralVar] = colorHex as string;
  });

  Object.entries(grayPalette).forEach(([shade, colorHex]) => {
    const grayVar = VariableUtils.getColor(`gray-${shade}`);
    allNeutralUpdates[grayVar] = colorHex as string;
  });

  if (Object.keys(allNeutralUpdates).length > 0) {
    setRootCssVariables(allNeutralUpdates, "high");
    logger.log(
      `🎨 Initialized ${Object.keys(allNeutralUpdates).length} neutral + theme gray variables from neutral.set`,
    );
  }
};

/**
 * Resolve initial theme mode following industry-standard priority:
 * 1. localStorage (user's saved preference)
 * 2. System preference (if allowSystem: true)
 * 3. Config default
 */
function resolveInitialMode(): "light" | "dark" {
  try {
    // Priority 1: Check localStorage (user's saved preference)
    if (typeof window !== "undefined" && window.localStorage) {
      const storageKey = getModeStorageKey();
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark") {
        logger.log(`📦 Theme restored from storage: ${stored}`);
        return stored;
      }
    }

    // Priority 2: System preference (if enabled)
    if (getModeAllowSystem()) {
      if (typeof window !== "undefined" && window.matchMedia) {
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        const mode = prefersDark ? "dark" : "light";
        logger.log(`🌐 Theme from system preference: ${mode}`);
        return mode;
      }
    }

    // Priority 3: Config default
    const defaultMode = getModeDefault();
    if (defaultMode && (defaultMode === "dark" || defaultMode === "light")) {
      logger.log(`⚙️ Theme from config default: ${defaultMode}`);
      return defaultMode;
    }

    // Fallback
    logger.log("📋 Using fallback theme: light");
    return "light";
  } catch (error) {
    logger.error("error resolving initial mode", error);
    return "light";
  }
}

/**
 * Sync theme mode to DOM (industry standard)
 * Adds/removes .dark class and sets color-scheme CSS property
 */
export function syncThemeToDOM(mode: "light" | "dark"): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  // Add/remove .dark class
  if (mode === "dark") {
    root.classList.add("dark");
    root.setAttribute("data-theme", "dark");
  } else {
    root.classList.remove("dark");
    root.setAttribute("data-theme", "light");
  }

  // Set color-scheme CSS property (browser native dark mode)
  root.style.colorScheme = mode;

  logger.debug(`🎨 Theme synced to DOM: ${mode}`);
}

/**
 * Setup theme toggle listener (compile-first runtime).
 * Persists mode to localStorage on user-driven changes.
 * DOM sync is owned exclusively by ThemeManager.updateTheme() for mode changes.
 */
let themeToggleInitialized = false;

export function setupThemeToggle(): void {
  if (themeToggleInitialized) return;
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  themeToggleInitialized = true;
  const storageKey = getModeStorageKey();

  themeManager.subscribe((state) => {
    try {
      if (state.mode === "light" || state.mode === "dark") {
        window.localStorage.setItem(storageKey, state.mode);
        logger.debug(`💾 Theme saved to storage: ${state.mode}`);
      }
    } catch (error) {
      logger.warn("[IUI] Failed to save theme to storage:", error);
    }
  });
}

/**
 * Bootstrap theme state from the blocking init script when present.
 * Falls back to resolveInitialMode() once when the script did not run.
 */
export function bootstrapThemeFromScript(): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;
  themeManager.setSyncMode(true);

  try {
    if (root.dataset.iuiThemeInit === "1") {
      const mode =
        root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      globalMode = mode;
      themeManager.updateTheme({ mode });
      setupThemeToggle();
      logger.log(`✅ Theme bootstrapped from blocking script: ${mode}`);
      return;
    }

    const mode = resolveInitialMode();
    globalMode = mode;
    // updateTheme({ mode }) syncs DOM once
    themeManager.updateTheme({ mode });
    root.dataset.iuiThemeInit = "1";
    setupThemeToggle();
    logger.log(`✅ Theme bootstrapped (fallback): ${mode}`);
  } finally {
    themeManager.setSyncMode(false);
  }
}

/** @deprecated Use setupThemeToggle — kept for runtime engine path */
function setupThemePersistence(): void {
  setupThemeToggle();
}

// Industry standard: Synchronous config application (Chakra UI/Mantine pattern)
export const applyMode = (): void => {
  try {
    // Resolve initial mode using priority: storage → system → default
    const mode = resolveInitialMode();
    globalMode = mode;

    // updateTheme({ mode }) syncs DOM once; persistence listener does not
    themeManager.updateTheme({ mode });
    setupThemeToggle();

    logger.log(`✅ Theme mode applied: ${mode}`);
  } catch (error) {
    logger.error("error applying mode", error);
  }
};

export const initializeRadius = (): void => {
  try {
    const radius = getRadiusSet();
    if (radius && typeof radius === "string") {
      globalRadius = radius;
      // Update theme manager so components react to radius changes
      themeManager.updateTheme({ radius });
    }
  } catch (e) {
    logger.log(`Using default radius:${globalRadius}`, e);
  }
};

/**
 * Set spacing value from config
 * @param spacingValue - The spacing value from config ('compact' | 'standard' | 'spacious')
 */
const VALID_RADIUS = ["none", "sm", "md", "lg", "full"] as const;
const VALID_SPACING = ["compact", "standard", "spacious"] as const;
const VALID_FONTS = ["inter", "arial", "mono"] as const;

export const setRadius = (radiusValue?: string): void => {
  if (!radiusValue || !VALID_RADIUS.includes(radiusValue as (typeof VALID_RADIUS)[number])) {
    return;
  }
  globalRadius = radiusValue;
  themeManager.updateTheme({ radius: radiusValue });
  logger.log(`✅ Radius set to: ${radiusValue}`);
};

export const setFont = (fontValue?: string): void => {
  if (!fontValue || !VALID_FONTS.includes(fontValue as (typeof VALID_FONTS)[number])) {
    return;
  }
  globalFont = fontValue;
  themeManager.updateTheme({ font: fontValue });
  logger.log(`✅ Font set to: ${fontValue}`);
};

export const setThemeColor = (colorValue?: string): void => {
  if (!colorValue) return;
  const validated = getColorWithFallback(colorValue);
  globalColor = validated;
  themeManager.updateTheme({ color: validated });
  logger.log(`✅ Theme color set to: ${validated}`);
};

export const setSpacing = (spacingValue?: string): void => {
  if (
    spacingValue &&
    VALID_SPACING.includes(spacingValue as (typeof VALID_SPACING)[number])
  ) {
    globalSpacing = spacingValue as (typeof VALID_SPACING)[number];
    themeManager.updateTheme({ spacing: spacingValue as (typeof VALID_SPACING)[number] });
    logger.log(`✅ Spacing set to: ${spacingValue}`);
  }
};

/**
 * Initialize spacing from config loader
 * Falls back to getting spacing from config-loader if not provided
 */
export const initializeSpacing = (spacingValue?: string): void => {
  try {
    // If spacing value is provided, validate and use it directly
    if (
      spacingValue &&
      (spacingValue === "compact" ||
        spacingValue === "standard" ||
        spacingValue === "spacious")
    ) {
      setSpacing(spacingValue);
      return;
    }

    // Otherwise, try to get from config loader
    const spacing = getSpacingSet();
    if (
      spacing &&
      (spacing === "compact" ||
        spacing === "standard" ||
        spacing === "spacious")
    ) {
      setSpacing(spacing);
    } else {
      logger.log(
        `⚠️ Invalid or missing spacing config (got: ${spacingValue || spacing}). Using default: ${globalSpacing}`,
      );
    }
  } catch (error) {
    logger.warn(
      `⚠️ Error initializing spacing. Using default: ${globalSpacing}`,
      error,
    );
  }
};

/**
 * Set panel background value from config
 * @param panelBackgroundValue - The panel background value from config ('solid' | 'translucent')
 */
export const setPanelBackground = (panelBackgroundValue?: string): void => {
  if (
    panelBackgroundValue &&
    (panelBackgroundValue === "solid" || panelBackgroundValue === "translucent")
  ) {
    globalPanelBackground = panelBackgroundValue;
    // Update CSS variable so components can consume it
    setRootCssVariable("--iui-panel-background", panelBackgroundValue, "high");
    // Update theme manager so components react to panel background changes
    themeManager.updateTheme({ panelBackground: panelBackgroundValue });
    // Apply data attribute to root for global control
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute(
        "data-panel-background",
        panelBackgroundValue,
      );
    }
    logger.log(`✅ Panel background set to: ${panelBackgroundValue}`);
  }
};

/**
 * Initialize panel background from config loader
 * Falls back to getting panel background from config-loader if not provided
 */
export const initializePanelBackground = (
  panelBackgroundValue?: string,
): void => {
  try {
    // If panel background value is provided, validate and use it directly
    if (
      panelBackgroundValue &&
      (panelBackgroundValue === "solid" ||
        panelBackgroundValue === "translucent")
    ) {
      setPanelBackground(panelBackgroundValue);
      return;
    }

    // Otherwise, try to get from config loader
    const panelBackground = getPanelBackgroundSet();
    if (
      panelBackground &&
      (panelBackground === "solid" || panelBackground === "translucent")
    ) {
      setPanelBackground(panelBackground);
    } else {
      logger.log(
        `⚠️ Invalid or missing panel background config (got: ${panelBackgroundValue || panelBackground}). Using default: ${globalPanelBackground}`,
      );
    }
  } catch (error) {
    logger.warn(
      `⚠️ Error initializing panel background. Using default: ${globalPanelBackground}`,
      error,
    );
  }
};

export const initializeTypography = (): void => {
  try {
    const provider = getTypographyProvider();
    const set = getTypographySet();
    const extend = getTypographyExtend();
    if (extend)
      typographyExtendTokens = extend as Record<string, string | string[]>;

    if (!provider) return;

    // Fonts are never cached — always re-evaluated from config

    if (provider === "system") {
      // Only built-in font tokens allowed
      if (set) globalFont = set;
    }

    if (provider === "google") {
      Object.entries(typographyExtendTokens).forEach(([, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          injectGoogleFont(value[0]);
        }
      });
      if (set) globalFont = set;
    }

    if (provider === "local") {
      const url = getLocalFontUrls();
      if (url) injectLocalFonts(url as string | string[]);
      if (set) globalFont = set;
    }

    // notify theme system
    themeManager.updateTheme({ font: globalFont });
  } catch (error) {
    logger.log(`Using default font: ${globalFont}`, error);
  }
};

export const initializeGradients = (): void => {
  if (typeof document === "undefined") return;
  try {
    initGradients();
  } catch (e) {
    logger.error("Error initializing gradients:", e);
  }
};

// Track initialization state to prevent redundant calls
// NOTE: Font variables are NOT cached - they must always be fresh
// This variable is set but intentionally not checked (always refresh fonts)
// Prefixed with _ to indicate intentionally unused (for future caching optimization)
// eslint-disable-next-line @typescript-eslint/no-unused-vars, customPlugin/enforce-naming
let _isGlobalDesignTokensInitialized = false;

/**
 * Initialize all core design tokens as CSS variables
 * IMPORTANT: Font variables (--iui-font-*) are ALWAYS refreshed, never cached
 * Other tokens can be cached for performance
 * @returns void
 */
export const initializeGlobalDesignTokens = (): void => {
  if (typeof document === "undefined") return;

  const variables: Record<string, string> = {};

  // Initialize spacing tokens (safe to cache)
  Object.entries(spacing).forEach(([key, value]) => {
    variables[`--iui-spacing-${key}`] = value;
    // Also create width and height specific variables for utilities
    variables[`--iui-width-${key}`] = value;
    variables[`--iui-height-${key}`] = value;
  });

  // ⚠️ FONT VARIABLES: ALWAYS FRESH - NEVER CACHED
  // These must be refreshed on every load to ensure correct font loading
  const FontsFamilyExtended = { ...fontFamily, ...typographyExtendTokens };
  Object.entries(FontsFamilyExtended).forEach(([key, value]) => {
    const fontValue = Array.isArray(value) ? value.join(", ") : String(value);
    variables[`--iui-font-family-${key}`] = fontValue;
  });

  // ⚠️ FONT SIZE VARIABLES: ALWAYS FRESH - NEVER CACHED
  Object.entries(fontSize).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const [sizeValue, config] = value;
      variables[`--iui-font-size-${key}`] = sizeValue;
      // Also create line-height CSS variables
      if (config && config.lineHeight) {
        variables[`--iui-line-height-${key}`] = config.lineHeight;
      }
    } else {
      variables[`--iui-font-size-${key}`] = String(value);
    }
  });

  // ⚠️ FONT WEIGHT VARIABLES: ALWAYS FRESH - NEVER CACHED
  Object.entries(fontWeight).forEach(([key, value]) => {
    variables[`--iui-font-weight-${key}`] = String(value);
  });

  // Initialize border radius tokens
  Object.entries(borderRadius).forEach(([key, value]) => {
    variables[`--iui-border-radius-${key}`] = value;
  });

  // Initialize border width tokens (static and dynamic)
  Object.entries(borderWidth).forEach(([key, value]) => {
    variables[`--iui-border-width-${key}`] = value;
  });

  // Initialize ring width tokens (static and dynamic)
  Object.entries(ringWidth).forEach(([key, value]) => {
    variables[`--iui-ring-width-${key}`] = value;
  });

  // Initialize ring offset width tokens (static and dynamic)
  Object.entries(ringOffsetWidth).forEach(([key, value]) => {
    variables[`--iui-ring-offset-width-${key}`] = value;
  });

  // Add common dynamic values for border widths (up to 20px for reasonable usage)
  for (let i = 9; i <= 20; i++) {
    const dynamicBorderValue = getDynamicTokenValue("border-width", String(i));
    if (dynamicBorderValue) {
      variables[`--iui-border-width-${i}`] = dynamicBorderValue;
    }
  }

  // Add common dynamic values for spacing (up to 100 for reasonable usage)
  for (let i = 60; i <= 100; i += 4) {
    const dynamicSpacingValue = getDynamicTokenValue("spacing", String(i));
    if (dynamicSpacingValue) {
      variables[`--iui-spacing-${i}`] = dynamicSpacingValue;
    }
  }

  // Initialize static color tokens (keywords + theme gray steps only).
  Object.entries(colors).forEach(([key, value]) => {
    if (typeof value === "string" && value.startsWith("var(")) return;
    variables[`--iui-color-${key}`] = value;
  });

  // Initialize container query utilities
  variables["--iui-container-type-normal"] = "normal";
  variables["--iui-container-type-inline-size"] = "inline-size";
  variables["--iui-container-type-size"] = "size";

  // Initialize scroll snap utilities
  variables["--iui-scroll-snap-type-none"] = "none";
  variables["--iui-scroll-snap-type-x"] = "x";
  variables["--iui-scroll-snap-type-y"] = "y";
  variables["--iui-scroll-snap-type-both"] = "both";
  variables["--iui-scroll-snap-type-mandatory"] = "mandatory";
  variables["--iui-scroll-snap-type-proximity"] = "proximity";
  variables["--iui-scroll-snap-align-start"] = "start";
  variables["--iui-scroll-snap-align-end"] = "end";
  variables["--iui-scroll-snap-align-center"] = "center";
  variables["--iui-scroll-snap-align-none"] = "none";
  variables["--iui-scroll-snap-stop-normal"] = "normal";
  variables["--iui-scroll-snap-stop-always"] = "always";

  // Initialize text wrap utilities
  variables["--iui-text-wrap-wrap"] = "wrap";
  variables["--iui-text-wrap-nowrap"] = "nowrap";
  variables["--iui-text-wrap-balance"] = "balance";
  variables["--iui-text-wrap-pretty"] = "pretty";

  // Initialize column utilities
  variables["--iui-columns-1"] = "1";
  variables["--iui-columns-2"] = "2";
  variables["--iui-columns-3"] = "3";
  variables["--iui-columns-auto"] = "auto";

  // Set all variables at once
  setRootCssVariables(variables, "high");

  // Mark as initialized ONLY for non-font tokens (font tokens always refresh)
  // Font variables are refreshed every time, so we only guard non-font initialization
  _isGlobalDesignTokensInitialized = true;

  logger.log(
    `🎨 Initialized ${Object.keys(variables).length} global design token CSS variables`,
  );
  logger.log(
    `⚠️ Font variables (--iui-font-*) are always fresh and never cached`,
  );
};

/**
 * Initialize font variables separately - ALWAYS FRESH, NEVER CACHED
 * This ensures fonts are always up-to-date on every load
 * @returns void
 */
export const initializeFontVariables = (): void => {
  if (typeof document === "undefined") return;

  const fontVariables: Record<string, string> = {};

  // ⚠️ ALWAYS REFRESH: Font family variables
  const FontsFamilyExtended = { ...fontFamily, ...typographyExtendTokens };
  Object.entries(FontsFamilyExtended).forEach(([key, value]) => {
    const fontValue = Array.isArray(value) ? value.join(", ") : String(value);
    fontVariables[`--iui-font-family-${key}`] = fontValue;
  });

  // ⚠️ ALWAYS REFRESH: Font size variables
  Object.entries(fontSize).forEach(([key, value]) => {
    const sizeValue = Array.isArray(value) ? value[0] : String(value);
    fontVariables[`--iui-font-size-${key}`] = sizeValue;
  });

  // ⚠️ ALWAYS REFRESH: Font weight variables
  Object.entries(fontWeight).forEach(([key, value]) => {
    fontVariables[`--iui-font-weight-${key}`] = String(value);
  });

  // Apply font variables with high priority (always fresh)
  setRootCssVariables(fontVariables, "high");
};

/**
 * Reset initialization state (useful for testing or hot reload)
 */
export const resetGlobalDesignTokens = (): void => {
  _isGlobalDesignTokensInitialized = false;
};

/**
 * Enhanced theme setter with better type safety and validation
 */
export const setGlobalTheme = async ({
  color,
  radius,
  spacing,
  font,
  mode = "light",
  direction,
}: {
  color: string;
  radius: string;
  spacing: "compact" | "standard" | "spacious";
  font: string;
  mode?: "light" | "dark";
  direction: "ltr" | "rtl";
}): Promise<void> => {
  // Validate inputs
  const validatedColor = getColorWithFallback(color);
  // const validatedRadius = validateThemeValue("radius", radius)
  //   ? radius
  //   : "full";
  // const validatedSpacing = validateThemeValue("spacing", spacing)
  //   ? spacing
  //   : "md";
  // const validatedFont = validateThemeValue("font", font) ? font : "inter";
  // await initializeRadius();
  // await initializeSpacing();
  // await initializeTypography();
  // await applyMode();

  // // Update via theme manager for consistency
  themeManager.updateTheme({
    color: validatedColor,
    radius: radius,
    spacing: spacing,
    font: font,
    mode: mode,
  });

  // Initialize all global design tokens as CSS variables
  initializeGlobalDesignTokens();

  // Initialize semantic colors using centralized system
  await initializeSemanticColors();

  // Initialize accent colors using centralized system
  await initializeAccentColors();
  //initialize brand colors
  await initializeBrandColor();
  // Initialize multiple neutral colors using centralized system
  await initializeNeutralColors();

  injectGlobalStyles();

  initializeGradients();

  // Apply direction (moved here to break circular dependency)
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("dir", direction);
    configureCSSLogicalProperties({
      enabled: true,
      enableRTL: direction === "rtl",
      enableLTR: direction === "ltr",
      enableLogicalSpacing: true,
      enableLogicalBorders: true,
      enableLogicalPositioning: true,
      enableLogicalSizing: true,
      enableLogicalTextAlign: true,
    });
  }
};
