/**
 * IUI Design System - Utility Builder (Optimized)
 * Runtime utility class builder that generates CSS utilities for predefined tokens only
 * Features: Smart batching, root-level connection, zero DOM manipulation, advanced deduplication
 *
 * NOTE: Arbitrary values (e.g., w-[100px], bg-[#ff0000]) are handled by separate hooks
 * This utility builder focuses on predefined design tokens for optimal performance
 */

import { TokenCategory } from "../../utilities/class-utilities";
import { getDynamicTokenValue } from "../tokens/dynamic";
import { logger } from "../../utilities/logger";

// Imported types, constants, helpers, and value getters from split modules
import {
  CSSUtility,
  CSSRule,
  OptimizationStats,
} from "../types/utility-types";
import { parseNegativeValue } from "../utilities/helpers";

import { appendPseudoToSelector, buildSelector } from "../parsing/variant";

// Import constants and value getters from split modules
import { CSS_PROPERTY_MAP } from "../utilities/constants";
import { VALUE_GETTERS } from "../utilities/value-getters";
import { UtilityCache } from "./cache";
import { parseUtilityClass, type ParserContext } from "./parser";
import { optimizeUtilities, generateOptimizedCSS } from "./optimizer";
import { UtilityPurging } from "../utilities/purging";
import {
  AnimationKeyframesManager,
  cssNeedsAnimationKeyframes,
  getAnimationKeyframesCSS,
} from "../utilities/animations";
// CSSRootManager and cssRootManager imported but not used in this file
import {
  buildTruncateUtility,
  buildSrOnlyUtility,
  buildNotSrOnlyUtility,
  buildDivideWidthUtility,
  buildDivideReverseUtility,
  DIVIDE_BETWEEN_CHILDREN_SUFFIX,
  buildSpaceBetweenUtility,
  buildSpaceReverseUtility,
  buildInsetUtility,
  buildFontSizeUtility,
  buildRingUtility,
  buildRingColorUtility,
  buildRingOffsetUtility,
  buildRingOffsetColorUtility,
  buildDirectionalRingUtility,
  buildShadowUtility,
  buildGradientUtility,
  buildBgGradientUtility,
  buildTextGradientUtility,
  type BuilderContext,
} from "../utilities/builders";
import { getGradientValue, getRegisteredGradientNames } from "../../utilities/gradient-utils";
import type { CSSRootManager } from "../css/root-manager";

/**
 * Utility Builder - Builds CSS utilities for predefined tokens only (Optimized)
 * 
 * Performance optimizations:
 * - Focuses only on predefined design tokens for maximum speed
 * - Arbitrary values handled by separate hooks to avoid complexity
 * - Enhanced caching with LRU eviction
 * - Optimized CSS generation with better deduplication
 */
export class UtilityBuilder {
  private utilities = new Map<string, CSSUtility>();
  /** Classes whose CSS has already been appended to the root stylesheet. */
  private injectedClasses = new Set<string>();
  private cssRuleCache = new Map<string, CSSRule>(); // Cache for CSS rules by property signature
  private optimizationStats: OptimizationStats = {
    totalRules: 0,
    duplicatesFound: 0,
    rulesOptimized: 0,
    bytesReduced: 0,
  };
  private static instance: UtilityBuilder | null = null;
  private animationKeyframesInjected = false;
  private parserCache = new UtilityCache();
  private parserContext: ParserContext = { cache: this.parserCache };
  private purging = new UtilityPurging();
  private builderContext: BuilderContext;

  constructor() {
    this.builderContext = {
      buildSelector: this.buildSelector.bind(this),
      utilities: this.utilities,
    };
  }

  static getInstance(): UtilityBuilder {
    if (!UtilityBuilder.instance) {
      UtilityBuilder.instance = new UtilityBuilder();
    }
    return UtilityBuilder.instance;
  }

  /**
   * Invalidate parser cache for potential gradient classes
   * Called when gradients are initialized to ensure correct parsing
   * Industry standard: cache invalidation on dependency changes
   */
  invalidateGradientCache(): void {
    // Clear parser cache - bg-glass etc. may have been parsed as bg-color before gradients loaded
    this.parserCache.clear();

    // Clear utilities cache for gradient classes - they may have been built as bg-color (wrong)
    // when gradients weren't registered yet (Vite async config load)
    const names = getRegisteredGradientNames();
    names.forEach((name) => {
      this.utilities.delete(`bg-${name}`);
      this.utilities.delete(`text-${name}`);
      this.injectedClasses.delete(`bg-${name}`);
      this.injectedClasses.delete(`text-${name}`);
    });

    logger.debug("Parser + gradient utilities cache invalidated after gradient initialization");
  }

  /**
   * Build a utility class from className
   */
  buildUtility(className: string): CSSUtility | null {
    // Track usage for purging optimization
    this.purging.trackUsage(className);

    // Check cache first
    const cached = this.utilities.get(className);
    if (cached) {
      return cached;
    }

    // Parse the className to extract category and value using shared parser
    const parsed = parseUtilityClass(className, this.parserContext);
    if (!parsed) return null;

    const {
      category,
      value,
      variants,
      baseClass: parsedBaseClass,
      properties: parsedProperties,
      important: parsedImportant,
      opacity: parsedOpacity,
    } = parsed;

    // Special handling for ring utilities (ring, ring-2, ring-0, …).
    // Bare `ring` is the default 2px width (Tailwind standard). ring-inset / inset-ring use parsedProperties only.
    if (category === "ring") {
      return buildRingUtility(className, "2", variants, this.builderContext);
    }
    if (category === "ring-width" && !parsedProperties) {
      return buildRingUtility(className, value, variants, this.builderContext);
    }
    if (category === "ring-color") {
      return buildRingColorUtility(
        className,
        value,
        variants,
        this.builderContext,
      );
    }
    if (category === "ring-offset-width") {
      return buildRingOffsetUtility(
        className,
        value,
        variants,
        this.builderContext,
      );
    }
    if (category === "ring-offset-color") {
      return buildRingOffsetColorUtility(
        className,
        value,
        variants,
        this.builderContext,
      );
    }

    // Special handling for directional / axis / logical ring utilities
    if (
      category === "ring-t" ||
      category === "ring-b" ||
      category === "ring-s" ||
      category === "ring-e" ||
      category === "ring-bs" ||
      category === "ring-be" ||
      category === "ring-x" ||
      category === "ring-y"
    ) {
      return buildDirectionalRingUtility(
        className,
        value,
        variants,
        category,
        this.builderContext,
      );
    }

    if (category === "box-shadow") {
      return buildShadowUtility(
        className,
        value,
        variants,
        this.builderContext,
      );
    }
    if (
      category === "shadow-t" ||
      category === "shadow-e" ||
      category === "shadow-b" ||
      category === "shadow-s"
    ) {
      return buildShadowUtility(
        className,
        value,
        variants,
        this.builderContext,
        category,
      );
    }

    // Special handling for gradient utilities
    if (
      category === "gradient-from" ||
      category === "gradient-via" ||
      category === "gradient-to"
    ) {
      return buildGradientUtility(
        className,
        value,
        variants,
        category,
        this.builderContext,
        parsedOpacity,
      );
    }

    if (category === "bg-gradient") {
      return buildBgGradientUtility(
        className,
        value,
        variants,
        this.builderContext,
      );
    }
    if (category === "text-gradient") {
      return buildTextGradientUtility(
        className,
        value,
        variants,
        this.builderContext,
      );
    }

    // Special handling for truncate utility (Tailwind standard: overflow + text-overflow + white-space)
    if (category === "text-overflow" && parsedBaseClass === "truncate") {
      return buildTruncateUtility(className, variants, this.builderContext);
    }

    // Special handling for sr-only and not-sr-only utilities
    if (category === "sr-only") {
      return buildSrOnlyUtility(className, variants, this.builderContext);
    }
    if (category === "not-sr-only") {
      return buildNotSrOnlyUtility(className, variants, this.builderContext);
    }

    // Special handling for multi-property utilities
    if (category === "divide-width") {
      return buildDivideWidthUtility(
        className,
        value,
        variants,
        this.builderContext,
        parsedBaseClass,
        parsedImportant,
      );
    }
    if (category === "divide-x-reverse" || category === "divide-y-reverse") {
      return buildDivideReverseUtility(
        className,
        category,
        variants,
        this.builderContext,
        parsedBaseClass,
        parsedImportant,
      );
    }
    if (category === "space-x-reverse" || category === "space-y-reverse") {
      return buildSpaceReverseUtility(
        className,
        category,
        variants,
        this.builderContext,
        parsedBaseClass,
        parsedImportant,
      );
    }
    if (category === "space-x" || category === "space-y") {
      return buildSpaceBetweenUtility(
        className,
        value,
        category,
        variants,
        this.builderContext,
        parsedBaseClass,
        parsedImportant,
      );
    }
    if (category === "inset-x" || category === "inset-y") {
      return buildInsetUtility(
        className,
        value,
        category,
        variants,
        this.builderContext,
      );
    }

    // Special handling for font-size utilities to include line-height
    if (category === "font-size") {
      return buildFontSizeUtility(
        className,
        value,
        variants,
        this.builderContext,
      );
    }

    // Special handling for border-spacing-x / border-spacing-y (table cell spacing)
    if (category === "border-spacing-x" || category === "border-spacing-y") {
      const spacingValue =
        VALUE_GETTERS[category as TokenCategory]?.(value as string);
      if (!spacingValue) return null;

      const properties: Record<string, string> = {};

      if (category === "border-spacing-x") {
        properties["--iui-border-spacing-x"] = spacingValue;
        properties["border-spacing"] =
          `${spacingValue} var(--iui-border-spacing-y, 0)`;
      } else {
        properties["--iui-border-spacing-y"] = spacingValue;
        properties["border-spacing"] =
          `var(--iui-border-spacing-x, 0) ${spacingValue}`;
      }

      const utility: CSSUtility = {
        className,
        selector: this.buildSelector(className, variants),
        properties,
        variants,
        baseClass: parsedBaseClass,
        specificity: variants.length,
        important: parsedImportant,
      };

      this.utilities.set(className, utility);
      return utility;
    }

    // Sentence case: lowercase on element + uppercase on ::first-letter (CSS-only approximation)
    if (category === "text-transform" && value === "text-transform-sentencecase") {
      const selector = this.buildSelector(className, variants);
      const utility: CSSUtility = {
        className,
        selector,
        properties: { "text-transform": "lowercase" },
        companionRule: {
          selector: appendPseudoToSelector(selector, "::first-letter"),
          properties: { "text-transform": "uppercase" },
        },
        variants,
        baseClass: parsedBaseClass,
        specificity: variants.length,
        important: parsedImportant,
      };
      this.utilities.set(className, utility);
      if (this.purging.isTrackingEnabled()) {
        this.autoPurgeIfNeeded();
      }
      return utility;
    }

    // If parsedProperties are provided, use them directly (e.g., outline, border utilities with explicit properties)
    // This allows utilities to set multiple CSS properties without needing VALUE_GETTERS or CSS_PROPERTY_MAP
    if (parsedProperties) {
      const needsDivideChildren =
        category === "divide-color" || category === "divide-style";
      const utility: CSSUtility = {
        className,
        selector: needsDivideChildren
          ? this.buildSelector(className, variants) +
            DIVIDE_BETWEEN_CHILDREN_SUFFIX
          : this.buildSelector(className, variants),
        properties: parsedProperties,
        variants,
        baseClass: parsedBaseClass,
        specificity: variants.length,
        important: parsedImportant,
      };

      // Cache the utility
      this.utilities.set(className, utility);

      return utility;
    }

    // Get the CSS value
    const cssValue = VALUE_GETTERS[category]?.(value);
    if (!cssValue) {
      return null;
    }

    // Get CSS properties for this token category
    const cssProperties = CSS_PROPERTY_MAP[category];
    if (!cssProperties || cssProperties.length === 0) {
      return null;
    }

    // Build declarations from CSS property map
    const properties: Record<string, string> = {};
    cssProperties.forEach((prop) => {
      properties[prop] = cssValue;
    });

    // Create utility
    const utility: CSSUtility = {
      className,
      selector: this.buildSelector(className, variants),
      properties,
      variants,
      baseClass: parsedBaseClass,
      specificity: variants.length,
      important: parsedImportant,
    };

    // Cache the utility
    this.utilities.set(className, utility);

    // Auto-purge unused utilities if threshold exceeded (production optimization)
    if (this.purging.isTrackingEnabled()) {
      this.autoPurgeIfNeeded();
    }

    return utility;
  }

  /**
   * Build ring color utility
   */
  private buildRingColorUtility(
    className: string,
    value: string,
    variants: string[],
  ): CSSUtility | null {
    const cssValue = VALUE_GETTERS["ring-color"]?.(value);
    if (!cssValue) return null;

    const properties: Record<string, string> = {
      "--iui-ring-color": cssValue,
    };

    const utility: CSSUtility = {
      className,
      selector: this.buildSelector(className, variants),
      properties,
      variants,
      baseClass: className.split(":").pop() || className,
      specificity: variants.length,
    };

    this.utilities.set(className, utility);
    return utility;
  }

  /**
   * Build ring offset width utility with dynamic calculation and negative value support
   * Tailwind CSS standard: ring-offset-{width} sets --tw-ring-offset-width and box-shadow
   */
  private buildRingOffsetUtility(
    className: string,
    value: string,
    variants: string[],
  ): CSSUtility | null {
    // Handle negative values (e.g., -2, -4)
    const { isNegative, absoluteValue } = parseNegativeValue(value);

    // Get the offset value (supports both static tokens and dynamic calculation)
    let offsetVal = getDynamicTokenValue("ring-offset-width", absoluteValue);
    if (!offsetVal) return null;

    // Apply negative sign if needed
    const finalOffsetVal = isNegative ? `-${offsetVal}` : offsetVal;

    // Tailwind CSS standard implementation:
    // ring-offset-{width} sets:
    // - --tw-ring-offset-width: {width}
    // - box-shadow: 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color), var(--tw-ring-shadow)
    const properties: Record<string, string> = {
      "--iui-ring-offset-width": finalOffsetVal,
      "--iui-ring-offset-shadow": `var(--iui-ring-inset) 0 0 0 var(--iui-ring-offset-width) var(--iui-ring-offset-color)`,
    };

    const utility: CSSUtility = {
      className,
      selector: this.buildSelector(className, variants),
      properties,
      variants,
      baseClass: className.split(":").pop() || className,
      specificity: variants.length,
    };

    this.utilities.set(className, utility);
    return utility;
  }

  /**
   * Build ring offset color utility
   */
  private buildRingOffsetColorUtility(
    className: string,
    value: string,
    variants: string[],
  ): CSSUtility | null {
    const cssValue = VALUE_GETTERS["ring-offset-color"]?.(value);
    if (!cssValue) return null;

    const properties: Record<string, string> = {
      "--iui-ring-offset-color": cssValue,
    };

    const utility: CSSUtility = {
      className,
      selector: this.buildSelector(className, variants),
      properties,
      variants,
      baseClass: className.split(":").pop() || className,
      specificity: variants.length,
    };

    this.utilities.set(className, utility);
    return utility;
  }

  /**
   * Build directional ring utility (ring-t, ring-b, ring-s, ring-e, …)
   */
  private buildDirectionalRingUtility(
    className: string,
    value: string,
    variants: string[],
    category: TokenCategory,
  ): CSSUtility | null {
    const cssValue = VALUE_GETTERS[category]?.(value);
    if (!cssValue) return null;

    const properties: Record<string, string> = {
      "--iui-ring-shadow": cssValue,
      "box-shadow":
        "var(--iui-ring-offset-shadow, 0 0 transparent), var(--iui-ring-shadow, 0 0 transparent), var(--iui-shadow, 0 0 transparent)",
    };

    const utility: CSSUtility = {
      className,
      selector: this.buildSelector(className, variants),
      properties,
      variants,
      baseClass: className.split(":").pop() || className,
      specificity: variants.length,
    };

    this.utilities.set(className, utility);
    return utility;
  }

  /**
   * Build background gradient utility from config (bg-sunset, bg-ocean)
   * Generates lazy, cached CSS from iui.config.ts gradients
   * Sets CSS variable for compatibility with text gradients
   *
   * IMPORTANT: We set --iui-bg-gradient variable AND use it for background-image.
   * Text gradients reference this variable in their second layer, allowing both to work together.
   * The background-image here uses a LOWER specificity approach by using the variable,
   * which text gradients can override while still accessing the variable value.
   */
  private buildBgGradientUtility(
    className: string,
    value: string,
    variants: string[],
  ): CSSUtility | null {
    const gradientCSS = getGradientValue(value);

    if (!gradientCSS) {
      logger.warn(`Gradient '${value}' not found in config`);
      return null;
    }

    const properties: Record<string, string> = {
      // Set CSS variable - this is the SOURCE OF TRUTH for the gradient value
      // Text gradients reference this variable in their background-image
      "--iui-bg-gradient": gradientCSS,
      // Use the variable for background-image (standalone usage)
      // When combined with text gradients, the text gradient's background-image wins
      // but it can still access --iui-bg-gradient for its second layer
      "background-image": `var(--iui-bg-gradient)`,
      // Set background-clip to border-box to ensure proper rendering
      // This will be overridden by text gradients which set their own background-clip
      "background-clip": "border-box",
      "-webkit-background-clip": "border-box",
    };

    const utility: CSSUtility = {
      className,
      selector: this.buildSelector(className, variants),
      properties,
      variants,
      baseClass: className.split(":").pop() || className,
      specificity: variants.length,
    };

    this.utilities.set(className, utility);
    return utility;
  }

  /**
   * Build multiple utilities at once
   */
  buildUtilities(classNames: string[]): CSSUtility[] {
    const utilities: CSSUtility[] = [];

    classNames.forEach((className) => {
      if (className && className.trim()) {
        const utility = this.buildUtility(className.trim());
        if (utility) {
          utilities.push(utility);
        }
      }
    });

    return utilities;
  }

  /** Whether CSS for this utility class has already been injected. */
  isClassInjected(className: string): boolean {
    return this.injectedClasses.has(className.trim());
  }

  /** Clear injected tracking so a class can be regenerated (e.g. after gradient init). */
  clearInjectedClass(className: string): void {
    this.injectedClasses.delete(className.trim());
  }

  /**
   * Build, generate, and inject CSS only for classes not yet injected.
   * Returns the number of utilities newly injected.
   */
  processAndInjectClassNames(
    classNames: string[],
    rootManager: CSSRootManager,
  ): number {
    const pending = [
      ...new Set(
        classNames
          .map((c) => c.trim())
          .filter((c) => c.length > 0 && !this.injectedClasses.has(c)),
      ),
    ];

    if (pending.length === 0) {
      return 0;
    }

    const utilities: CSSUtility[] = [];

    for (const className of pending) {
      const utility = this.buildUtility(className);
      if (utility) {
        utilities.push(utility);
        this.injectedClasses.add(className);
      }
    }

    if (utilities.length === 0) {
      return 0;
    }

    const css = this.generateCSS(utilities);
    if (css.trim()) {
      rootManager.appendCSS(css);
    }

    return utilities.length;
  }

  /**
   * Configure usage tracking for purging
   */
  setUsageTracking(enabled: boolean): void {
    this.purging.setUsageTracking(enabled);
  }

  /**
   * Purge unused utilities (production optimization)
   * Removes utilities that were never used, reducing memory footprint
   */
  purgeUnusedUtilities(): number {
    const purged = this.purging.purgeUnusedUtilities(
      this.utilities as Map<string, unknown>,
    );
    if (purged > 0) {
      this.parserCache.clear(); // Reset parser cache to avoid stale entries
    }
    return purged;
  }

  /**
   * Auto-purge unused utilities when threshold is reached
   */
  private autoPurgeIfNeeded(): void {
    const purged = this.purging.autoPurgeIfNeeded(
      this.utilities as Map<string, unknown>,
    );
    if (purged) {
      this.parserCache.clear();
    }
  }

  /**
   * Set purge threshold
   */
  setPurgeThreshold(threshold: number): void {
    this.purging.setPurgeThreshold(threshold);
  }

  /**
   * Get purge statistics
   */
  getPurgeStats(): {
    totalUtilities: number;
    usedUtilities: number;
    unusedUtilities: number;
    purgeThreshold: number;
    canPurge: boolean;
  } {
    return this.purging.getPurgeStats(this.utilities.size);
  }

  /**
   * Reset optimization statistics
   */
  resetOptimizationStats(): void {
    this.optimizationStats = {
      totalRules: 0,
      duplicatesFound: 0,
      rulesOptimized: 0,
      bytesReduced: 0,
    };
  }

  /**
   * Check if utility exists
   */
  hasUtility(className: string): boolean {
    return this.utilities.has(className);
  }

  /**
   * Get cached utility
   */
  getUtility(className: string): CSSUtility | undefined {
    return this.utilities.get(className);
  }

  /**
   * Generate CSS string from utilities with optimization.
   * Includes @keyframes when utilities reference named animations (compile-first / SSR).
   */
  generateCSS(utilities: CSSUtility[]): string {
    // Runtime path (browser): also inject into CSSRootManager when available.
    AnimationKeyframesManager.ensureKeyframes();
    const optimizedUtilities = optimizeUtilities(
      utilities,
      this.optimizationStats,
    );
    const css = generateOptimizedCSS(optimizedUtilities);
    if (
      cssNeedsAnimationKeyframes(css) &&
      !css.includes("/*__iui-animation-keyframes__*/")
    ) {
      return `${getAnimationKeyframesCSS()}\n${css}`;
    }
    return css;
  }

  /**
   * Get all built utilities as CSS string
   */
  getAllCSS(): string {
    return this.generateCSS(Array.from(this.utilities.values()));
  }

  /**
   * Clear all utilities and caches for memory management
   */
  clear(): void {
    this.utilities.clear();
    this.injectedClasses.clear();
    this.cssRuleCache.clear();
    this.parserCache.clear();
    this.purging.clear();
    this.resetOptimizationStats();
  }

  /**
   * Get utility count
   */
  size(): number {
    return this.utilities.size;
  }

  /**
   * Get usage counts
   */
  getUsedUtilitiesCount(): number {
    return this.purging.getUsedUtilitiesCount();
  }

  getUnusedUtilitiesCount(): number {
    return this.purging.getUnusedUtilitiesCount(this.utilities.size);
  }

  /**
   * Build CSS selector with variants using the new variant parser
   */
  private buildSelector(className: string, variants: string[]): string {
    return buildSelector(className, variants);
  }
}

// Export singleton instances
export const utilityBuilder = UtilityBuilder.getInstance();
export { cssRootManager, CSSRootManager } from "../css/root-manager";
