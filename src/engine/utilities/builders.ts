/**
 * IUI Design System - Utility Builders
 * Pure builder functions for creating CSS utilities
 *
 * Following Tailwind CSS patterns: pure functions with dependency injection
 * Industry standard: separation of concerns, testable, reusable
 */

import { TokenCategory } from "../../utilities/class-utilities";
import { CSSUtility } from "../types/utility-types";
import { buildSelector } from "../parsing/variant";
import { VALUE_GETTERS } from "./value-getters";
import {
  buildGradientColorStopProperties,
  buildGradientPositionStopProperties,
  isGradientStopPosition,
  type GradientStopKind,
} from "./gradient-stops";
import { parseNegativeValue } from "./helpers";
import { logger } from "../../utilities/logger";
import {
  getRingWidthValue,
  getFontSizeValue,
  getDynamicTokenValue,
} from "../tokens/dynamic";
import * as tokenValues from "../tokens/values";
import {
  getGradientValue,
  getTextGradientProperties,
} from "../../utilities/gradient-utils";

/**
 * Builder context - dependencies for builder functions
 * Following dependency injection pattern (Tailwind CSS style)
 */
export interface BuilderContext {
  buildSelector: (className: string, variants: string[]) => string;
  utilities?: Map<string, CSSUtility>; // Optional: for caching
  onUtilityBuilt?: (utility: CSSUtility) => void; // Optional: callback
}

/** Tailwind: ring + drop-shadow share one `box-shadow` stack via custom properties. */
export const COMPOSED_BOX_SHADOW =
  "var(--iui-ring-offset-shadow, 0 0 transparent), var(--iui-ring-shadow, 0 0 transparent), var(--iui-shadow, 0 0 transparent)";

/** Tailwind-style: borders between adjacent direct children only (no outer edge, no last-child tail). */
export const DIVIDE_BETWEEN_CHILDREN_SUFFIX = " > * + *" as const;
/** Tailwind-style: spacing applies between adjacent direct children only. */
export const SPACE_BETWEEN_CHILDREN_SUFFIX = " > * + *" as const;

/**
 * Default builder context using standard functions
 */
export function createDefaultBuilderContext(): BuilderContext {
  return {
    buildSelector,
  };
}

/**
 * Build truncate utility
 */
export function buildTruncateUtility(
  className: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility {
  const properties: Record<string, string> = {
    overflow: "hidden",
    "text-overflow": "ellipsis",
    "white-space": "nowrap",
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: "truncate",
    specificity: variants.length,
  };

  // Cache if utilities map provided
  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build sr-only utility for screen reader only content
 */
export function buildSrOnlyUtility(
  className: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility {
  const properties: Record<string, string> = {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    "white-space": "nowrap",
    border: "0",
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build not-sr-only utility to override sr-only
 */
export function buildNotSrOnlyUtility(
  className: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility {
  const properties: Record<string, string> = {
    position: "static",
    width: "auto",
    height: "auto",
    padding: "0",
    margin: "0",
    overflow: "visible",
    clip: "auto",
    "white-space": "normal",
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build divide width utility with proper multi-property handling
 * Handles divide-x-4, divide-y-2, etc. like Tailwind CSS
 */
export function buildDivideWidthUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
  parsedBaseClass: string,
  parsedImportant?: boolean,
): CSSUtility | null {
  const cssValue = VALUE_GETTERS["divide-width"]?.(value);
  if (!cssValue) return null;

  const properties: Record<string, string> = {};

  // Handle different divide directions and widths.
  // Tailwind behavior:
  // - divide-x/divide-y set --*-divide-*-reverse to 0 by default (prevents inherited stale reverse values)
  // - default divide-x applies start side (left in LTR), reverse flips to end side
  // - default divide-y applies top side, reverse flips to bottom side
  //
  // Tailwind v4: width utilities do NOT hardcode border-style: solid.
  // They use border-*-style: var(--*-border-style) so divide-dashed / divide-dotted
  // compose correctly regardless of CSS emission order (see TW utilities.ts divide-x/y).
  const borderStyleVar = "var(--iui-border-style, solid)";
  if (value.startsWith("x-")) {
    properties["--iui-divide-x-width"] = cssValue;
    properties["--iui-divide-x-reverse"] = "0";
    properties["border-top-width"] = "0";
    properties["border-bottom-width"] = "0";
    properties["border-left-style"] = borderStyleVar;
    properties["border-right-style"] = borderStyleVar;
    properties["border-right-width"] =
      "calc(var(--iui-divide-x-width) * var(--iui-divide-x-reverse, 0))";
    properties["border-left-width"] =
      "calc(var(--iui-divide-x-width) * calc(1 - var(--iui-divide-x-reverse, 0)))";
  } else if (value.startsWith("y-")) {
    properties["--iui-divide-y-width"] = cssValue;
    properties["--iui-divide-y-reverse"] = "0";
    properties["border-left-width"] = "0";
    properties["border-right-width"] = "0";
    properties["border-top-style"] = borderStyleVar;
    properties["border-bottom-style"] = borderStyleVar;
    properties["border-top-width"] =
      "calc(var(--iui-divide-y-width) * calc(1 - var(--iui-divide-y-reverse, 0)))";
    properties["border-bottom-width"] =
      "calc(var(--iui-divide-y-width) * var(--iui-divide-y-reverse, 0))";
  } else if (value === "x") {
    properties["--iui-divide-x-width"] = cssValue;
    properties["--iui-divide-x-reverse"] = "0";
    properties["border-top-width"] = "0";
    properties["border-bottom-width"] = "0";
    properties["border-left-style"] = borderStyleVar;
    properties["border-right-style"] = borderStyleVar;
    properties["border-right-width"] =
      "calc(var(--iui-divide-x-width) * var(--iui-divide-x-reverse, 0))";
    properties["border-left-width"] =
      "calc(var(--iui-divide-x-width) * calc(1 - var(--iui-divide-x-reverse, 0)))";
  } else if (value === "y") {
    properties["--iui-divide-y-width"] = cssValue;
    properties["--iui-divide-y-reverse"] = "0";
    properties["border-left-width"] = "0";
    properties["border-right-width"] = "0";
    properties["border-top-style"] = borderStyleVar;
    properties["border-bottom-style"] = borderStyleVar;
    properties["border-top-width"] =
      "calc(var(--iui-divide-y-width) * calc(1 - var(--iui-divide-y-reverse, 0)))";
    properties["border-bottom-width"] =
      "calc(var(--iui-divide-y-width) * var(--iui-divide-y-reverse, 0))";
  }

  const utility: CSSUtility = {
    className,
    selector:
      context.buildSelector(className, variants) + DIVIDE_BETWEEN_CHILDREN_SUFFIX,
    properties,
    variants,
    baseClass: parsedBaseClass,
    specificity: variants.length,
    important: parsedImportant,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * divide-x-reverse / divide-y-reverse — sets flag used by divide-width utilities (Tailwind-style).
 */
export function buildDivideReverseUtility(
  className: string,
  category: "divide-x-reverse" | "divide-y-reverse",
  variants: string[],
  context: BuilderContext,
  parsedBaseClass: string,
  parsedImportant?: boolean,
): CSSUtility {
  const properties: Record<string, string> = {};

  if (category === "divide-x-reverse") {
    properties["--iui-divide-x-reverse"] = "1";
  } else {
    properties["--iui-divide-y-reverse"] = "1";
  }

  const utility: CSSUtility = {
    className,
    selector:
      context.buildSelector(className, variants) + DIVIDE_BETWEEN_CHILDREN_SUFFIX,
    properties,
    variants,
    baseClass: parsedBaseClass,
    specificity: variants.length,
    important: parsedImportant,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build space reverse utility with CSS custom properties
 * Handles space-x-reverse, space-y-reverse like Tailwind CSS
 */
export function buildSpaceReverseUtility(
  className: string,
  category: "space-x-reverse" | "space-y-reverse",
  variants: string[],
  context: BuilderContext,
  parsedBaseClass: string,
  parsedImportant?: boolean,
): CSSUtility {
  const properties: Record<string, string> = {};

  if (category === "space-x-reverse") {
    properties["--iui-space-x-reverse"] = "1";
  } else if (category === "space-y-reverse") {
    properties["--iui-space-y-reverse"] = "1";
  }

  const utility: CSSUtility = {
    className,
    selector:
      context.buildSelector(className, variants) + SPACE_BETWEEN_CHILDREN_SUFFIX,
    properties,
    variants,
    baseClass: parsedBaseClass,
    specificity: variants.length,
    important: parsedImportant,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build space-x/space-y utility to match Tailwind "between siblings" behavior.
 */
export function buildSpaceBetweenUtility(
  className: string,
  value: string,
  category: "space-x" | "space-y",
  variants: string[],
  context: BuilderContext,
  parsedBaseClass: string,
  parsedImportant?: boolean,
): CSSUtility | null {
  const cssValue = VALUE_GETTERS[category]?.(value);
  if (!cssValue) return null;

  const properties: Record<string, string> = {};

  if (category === "space-x") {
    properties["--iui-space-x-reverse"] = "0";
    properties["margin-right"] =
      "calc(var(--iui-space-x) * var(--iui-space-x-reverse, 0))";
    properties["margin-left"] =
      "calc(var(--iui-space-x) * calc(1 - var(--iui-space-x-reverse, 0)))";
    properties["--iui-space-x"] = cssValue;
  } else {
    properties["--iui-space-y-reverse"] = "0";
    properties["margin-top"] =
      "calc(var(--iui-space-y) * calc(1 - var(--iui-space-y-reverse, 0)))";
    properties["margin-bottom"] =
      "calc(var(--iui-space-y) * var(--iui-space-y-reverse, 0))";
    properties["--iui-space-y"] = cssValue;
  }

  const utility: CSSUtility = {
    className,
    selector:
      context.buildSelector(className, variants) + SPACE_BETWEEN_CHILDREN_SUFFIX,
    properties,
    variants,
    baseClass: parsedBaseClass,
    specificity: variants.length,
    important: parsedImportant,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build inset utility with proper multi-property handling
 * Handles inset-x-4, inset-y-4 like Tailwind CSS
 */
export function buildInsetUtility(
  className: string,
  value: string,
  category: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility | null {
  const cssValue = VALUE_GETTERS[category as TokenCategory]?.(value);
  if (!cssValue) return null;

  const properties: Record<string, string> = {};

  if (category === "inset-x") {
    properties["inset-inline-start"] = cssValue;
    properties["inset-inline-end"] = cssValue;
  } else if (category === "inset-y") {
    properties["top"] = cssValue;
    properties["bottom"] = cssValue;
  }

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build font-size utility with line-height
 * Handles text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, etc.
 * Generates both font-size and line-height properties from fontSize tokens
 */
export function buildFontSizeUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility | null {
  const properties: Record<string, string> = {};

  // Check if this is a predefined font size token (xs, sm, base, lg, xl, 2xl, etc.)
  const sizeToken =
    tokenValues.fontSize[value as keyof typeof tokenValues.fontSize];

  if (sizeToken && Array.isArray(sizeToken)) {
    // Extract font-size and line-height from the token array
    const [fontSize, config] = sizeToken;
    const lineHeight = config?.lineHeight;

    // Generate font-size with CSS variable
    properties["font-size"] = `var(--iui-font-size-${value}, ${fontSize})`;

    // Generate line-height if available
    if (lineHeight) {
      properties["line-height"] =
        `var(--iui-line-height-${value}, ${lineHeight})`;
    }
  } else {
    // Fallback to dynamic font-size for numeric values (e.g., text-16, text-20)
    const dynamicFontSize = getFontSizeValue(value);
    if (dynamicFontSize) {
      properties["font-size"] = dynamicFontSize;
    } else {
      return null;
    }
  }

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build ring utility with complete box-shadow support and dynamic calculation
 */
export function buildRingUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility | null {
  const ringVal = getRingWidthValue(value);
  if (!ringVal) return null;

  const properties: Record<string, string> = {};

  if (value === "0") {
    properties["box-shadow"] = COMPOSED_BOX_SHADOW;
  } else {
    // Generate complete ring with CSS custom properties using dynamic value.
    // Do NOT set --iui-ring-color here: the ring-color utility (from resolver output) sets it per element.
    // Fallback only in the shadow for standalone ring-2 (no ring-color class).
    properties["--iui-ring-offset-shadow"] =
      "var(--iui-ring-inset) 0 0 0 var(--iui-ring-offset-width) var(--iui-ring-offset-color)";
    const ringColorVar = "var(--iui-ring-color, rgb(0 0 0))";
    properties["--iui-ring-shadow"] =
      `var(--iui-ring-inset) 0 0 0 calc(${ringVal} + var(--iui-ring-offset-width)) ${ringColorVar}`;
    properties["box-shadow"] = COMPOSED_BOX_SHADOW;

    properties["--iui-ring-offset-width"] = "0px";
    properties["--iui-ring-offset-color"] = "#fff";
    properties["--iui-ring-inset"] = " ";
  }

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build ring color utility
 */
export function buildRingColorUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility | null {
  const opacityMatch = value.match(/^(.+)\/(\d+(?:\.\d+)?)$/);
  const colorName = opacityMatch ? opacityMatch[1] : value;
  const opacity = opacityMatch ? opacityMatch[2] : undefined;
  const cssValue = (
    VALUE_GETTERS["ring-color"] as (
      v: string,
      o?: string,
    ) => string | null
  )?.(colorName, opacity);
  if (!cssValue) return null;

  const properties: Record<string, string> = {
    "--iui-ring-color": cssValue,
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build ring offset width utility with dynamic calculation and negative value support
 * Tailwind CSS standard: ring-offset-{width} sets --tw-ring-offset-width and box-shadow
 */
export function buildRingOffsetUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
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
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build ring offset color utility
 */
export function buildRingOffsetColorUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility | null {
  const cssValue = VALUE_GETTERS["ring-offset-color"]?.(value);
  if (!cssValue) return null;

  const properties: Record<string, string> = {
    "--iui-ring-offset-color": cssValue,
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build directional ring utility (ring-t, ring-b, ring-s, ring-e, …)
 */
export function buildDirectionalRingUtility(
  className: string,
  value: string,
  variants: string[],
  category: TokenCategory,
  context: BuilderContext,
): CSSUtility | null {
  const cssValue = VALUE_GETTERS[category]?.(value);
  if (!cssValue) return null;

  const properties: Record<string, string> = {
    "--iui-ring-shadow": cssValue,
    "box-shadow": COMPOSED_BOX_SHADOW,
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build drop-shadow utilities (shadow-sm, shadow-lg, shadow-t-md, …).
 * Sets --iui-shadow and the shared ring+shadow box-shadow stack (Tailwind parity).
 */
export function buildShadowUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
  category: TokenCategory = "box-shadow",
): CSSUtility | null {
  const cssValue = VALUE_GETTERS[category]?.(value);
  if (!cssValue) return null;

  const properties: Record<string, string> = {
    "--iui-shadow": cssValue,
    "box-shadow": COMPOSED_BOX_SHADOW,
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build gradient utility (from-, via-, to-)
 */
export function buildGradientUtility(
  className: string,
  value: string,
  variants: string[],
  category: TokenCategory,
  context: BuilderContext,
  opacity?: string,
): CSSUtility | null {
  const kind = category.replace("gradient-", "") as GradientStopKind;

  if (isGradientStopPosition(value)) {
    const properties = buildGradientPositionStopProperties(kind, value);

    const utility: CSSUtility = {
      className,
      selector: context.buildSelector(className, variants),
      properties,
      variants,
      baseClass: className.split(":").pop() || className,
      specificity: variants.length,
    };

    if (context.utilities) {
      context.utilities.set(className, utility);
    }
    if (context.onUtilityBuilt) {
      context.onUtilityBuilt(utility);
    }
    return utility;
  }

  const colorGetter = VALUE_GETTERS[category] as (
    v: string,
    o?: string,
  ) => string | null;
  const cssValue = colorGetter?.(value, opacity);
  if (!cssValue) return null;

  const properties = buildGradientColorStopProperties(kind, cssValue);

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build background gradient utility from config (bg-sunset, bg-ocean)
 * Generates lazy, cached CSS from iui.config.ts gradients
 */
export function buildBgGradientUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility | null {
  // Gradients should be initialized at framework level before building utilities
  // Industry standard: dependencies ready before dependent systems start
  const gradientCSS = getGradientValue(value);

  if (!gradientCSS) {
    logger.warn(
      `Gradient '${value}' not found. Ensure gradients are initialized before building utilities.`,
    );
    return null;
  }

  // When bg-gradient is used with text-gradient, we only set the CSS variable
  // The text-gradient will handle the background-image with both layers
  // When bg-gradient is used alone, we set both the variable and background-image
  const properties: Record<string, string> = {
    "--iui-bg-gradient": gradientCSS,
    // Only set background-image if text-gradient is not present
    // We use a CSS selector that checks for text-gradient classes
    // This allows bg-gradient to work alone, but defer to text-gradient when both are present
    "background-image": `var(--iui-bg-gradient)`,
    "background-clip": "border-box",
    "-webkit-background-clip": "border-box",
  };

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}

/**
 * Build text gradient utility from config (text-sunset, text-ocean)
 * Generates lazy, cached CSS from iui.config.ts gradients with text clipping
 */
export function buildTextGradientUtility(
  className: string,
  value: string,
  variants: string[],
  context: BuilderContext,
): CSSUtility | null {
  // Gradients should be initialized at framework level before building utilities
  // Industry standard: dependencies ready before dependent systems start
  const properties = getTextGradientProperties(value);

  if (!properties) {
    logger.warn(
      `Gradient '${value}' not found. Ensure gradients are initialized before building utilities.`,
    );
    return null;
  }

  const utility: CSSUtility = {
    className,
    selector: context.buildSelector(className, variants),
    properties,
    variants,
    baseClass: className.split(":").pop() || className,
    specificity: variants.length,
  };

  if (context.utilities) {
    context.utilities.set(className, utility);
  }
  if (context.onUtilityBuilt) {
    context.onUtilityBuilt(utility);
  }

  return utility;
}
