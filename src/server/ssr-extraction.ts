/**
 * SSR Style Extraction for Next.js
 * Industry standard approach (Chakra UI/MUI pattern)
 *
 * Generates critical CSS during server render to prevent FOUC.
 * Uses a per-request registry for automatic class collection (no hardcoding).
 * Fix A: Injects theme CSS vars so first paint has correct colors, rtl, typography.
 */

import { utilityBuilder } from "../engine/core/builder";
import { logger } from "../utilities/logger";
import { initConfig } from "../core/config-loader";
import { generateArbitraryCSSValue } from "./generate-arbitrary-css";
import {
  generateFullThemeCSS,
  generateThemeCSSVars,
} from "./generate-theme-css";
import {
  initializeGradients,
  getRegisteredGradientNames,
} from "../utilities/gradient-utils";
import { collectStateUtilityClasses } from "./generate-state-utilities";
import { buildListCounterStyleFoundationCSS } from "../engine/css/root-manager";
import { withIuiPreflight } from "../engine/css/iui-preflight";

export { generateThemeCSSVars } from "./generate-theme-css";

function collectGradientUtilityClasses(): string[] {
  return getRegisteredGradientNames().flatMap((name) => [
    `bg-${name}`,
    `text-${name}`,
  ]);
}

/**
 * Extract all IUI classes from JSX/HTML content (server-safe)
 * Used during SSR to collect classes before they're rendered
 */
export function extractClassesFromContent(content: string): string[] {
  const classRegex = /className=["'`]([^"'`]+)["'`]/g;
  const classes = new Set<string>();
  
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    const classNames = match[1].split(/\s+/).filter(Boolean);
    classNames.forEach(cls => classes.add(cls));
  }
  
  return Array.from(classes);
}

export interface CriticalCSSResult {
  css: string;
  builtClasses: string[];
  uncoveredClasses: string[];
}

/**
 * Generate CSS for a list of class names (server-safe, no DOM access).
 * Returns generator truth for coverage diagnostics (built vs uncovered).
 */
export function generateCriticalCSSWithMeta(
  classNames: string[],
  config?: any,
  options?: { quiet?: boolean },
): CriticalCSSResult {
  const empty: CriticalCSSResult = {
    css: "",
    builtClasses: [],
    uncoveredClasses: [],
  };

  if (!classNames || classNames.length === 0) {
    return empty;
  }

  try {
    if (config) {
      try {
        initConfig(config);
      } catch {
        // Config might already be initialized, ignore
      }
    }

    const unique = [
      ...new Set(classNames.filter((c) => typeof c === "string" && c.trim())),
    ];

    const utilities = utilityBuilder.buildUtilities(unique);
    let css = utilities.length > 0 ? utilityBuilder.generateCSS(utilities) : "";

    const builtClassSet = new Set(utilities.map((u) => u.className));

    for (const className of unique) {
      if (builtClassSet.has(className)) continue;
      const arbitraryCss = generateArbitraryCSSValue(className);
      if (arbitraryCss) {
        css = css ? `${css}\n${arbitraryCss}` : arbitraryCss;
        builtClassSet.add(className);
      }
    }

    const builtClasses = [...builtClassSet];
    const uncoveredClasses = unique.filter((c) => !builtClassSet.has(c));

    if (!css) {
      return { css: "", builtClasses, uncoveredClasses: unique };
    }

    css = withIuiPreflight(css);

    if (!options?.quiet) {
      logger.log(
        `[SSR] Generated ${css.length} bytes of critical CSS for ${builtClasses.length} classes (${builtClasses.length} built, ${uncoveredClasses.length} uncovered)`,
      );
    }

    return { css, builtClasses, uncoveredClasses };
  } catch (error) {
    logger.warn("[SSR] Failed to generate critical CSS:", error);
    return empty;
  }
}

/**
 * Generate CSS for a list of class names (server-safe, no DOM access)
 * Industry standard: Used in Next.js SSR to inject critical CSS
 */
export function generateCriticalCSS(classNames: string[], config?: any): string {
  return generateCriticalCSSWithMeta(classNames, config).css;
}

/**
 * SSR Registry for tracking classes during render
 * Industry standard: Chakra UI/MUI pattern for SSR
 */
export class SSRRegistry {
  private classes = new Set<string>();
  private css: string | null = null;

  /**
   * Add class names to the registry
   */
  add(...classNames: string[]): void {
    classNames.forEach(cls => {
      if (cls && typeof cls === "string") {
        cls.split(/\s+/).forEach(c => {
          if (c) this.classes.add(c);
        });
      }
    });
  }

  /**
   * Get all collected classes
   */
  getClasses(): string[] {
    return Array.from(this.classes);
  }

  /**
   * Generate CSS for all collected classes (optionally with config for theme tokens)
   */
  getCSS(config?: any): string {
    if (this.css !== null) {
      return this.css;
    }

    const classNames = this.getClasses();
    this.css = generateCriticalCSS(classNames, config);
    return this.css;
  }

  /**
   * Clear the registry (for new requests)
   */
  clear(): void {
    this.classes.clear();
    this.css = null;
  }

  /**
   * Get stats for debugging
   */
  getStats() {
    return {
      classCount: this.classes.size,
      cssLength: this.css?.length ?? 0,
    };
  }
}

/**
 * Create a new SSR registry (one per request in Next.js)
 */
export function createSSRRegistry(): SSRRegistry {
  return new SSRRegistry();
}

/**
 * Generate critical CSS from a registry (industry standard)
 * Used by IUIRegistry in useServerInsertedHTML – no hardcoded class lists.
 */
export function generateCriticalCSSFromRegistry(
  registry: SSRRegistry,
  config?: any
): string {
  return registry.getCSS(config);
}

/**
 * Generate critical CSS for a React tree (server-side)
 * Used in Next.js App Router with useServerInsertedHTML
 */
export function generateSSRStyles(children: React.ReactNode): string {
  const registry = createSSRRegistry();
  return registry.getCSS();
}

export interface BuildCSSResult {
  themeCSS: string;
  utilitiesCSS: string;
  combinedCSS: string;
  builtClasses: string[];
  uncoveredClasses: string[];
  stats: {
    classCount: number;
    builtClassCount: number;
    uncoveredClassCount: number;
    themeBytes: number;
    utilityBytes: number;
    combinedBytes: number;
  };
}

/**
 * Compile-time CSS bundle: theme variables + scanned utility classes.
 * Used by build plugins (Vite/Webpack/Next) — same engine path as SSR critical CSS.
 */
export function generateBuildCSS(
  classNames: string[],
  config?: any,
  options?: { quiet?: boolean },
): BuildCSSResult {
  if (config) {
    try {
      initConfig(config);
    } catch {
      // Config might already be initialized
    }
    initializeGradients();
  }

  const gradientClasses = config ? collectGradientUtilityClasses() : [];
  const stateClasses = config ? collectStateUtilityClasses(config) : [];
  const unique = [
    ...new Set(
      [...classNames, ...gradientClasses, ...stateClasses].filter(
        (c) => typeof c === "string" && c.trim(),
      ),
    ),
  ];

  const fullTheme = config ? generateFullThemeCSS(config) : { css: "" };
  const themeCSS = fullTheme.css;
  const listFoundationCSS = buildListCounterStyleFoundationCSS();
  const critical = generateCriticalCSSWithMeta(unique, config, options);
  const combinedCSS = withIuiPreflight(
    [themeCSS, listFoundationCSS, critical.css].filter(Boolean).join("\n"),
  );

  return {
    themeCSS,
    utilitiesCSS: critical.css,
    combinedCSS,
    builtClasses: critical.builtClasses,
    uncoveredClasses: critical.uncoveredClasses,
    stats: {
      classCount: unique.length,
      builtClassCount: critical.builtClasses.length,
      uncoveredClassCount: critical.uncoveredClasses.length,
      themeBytes: themeCSS.length,
      utilityBytes: critical.css.length,
      combinedBytes: combinedCSS.length,
    },
  };
}
