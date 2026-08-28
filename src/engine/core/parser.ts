/**
 * IUI Design System - Utility Parser
 * Pure parser function for parsing utility class names
 *
 * Following Tailwind CSS patterns: pure function with dependency injection
 * Industry standard: separation of concerns, testable, reusable
 */

import {
  TokenCategory,
  LIST_ORDERED_REST_RE,
  LIST_UNORDERED_REST_RE,
} from "../../utilities/class-utilities";
import {
  LIST_ORDERED_SUFFIX_RE,
  LIST_ORDERED_SYSTEM_RE,
  buildOrderedSuffixListProperties,
  buildOrderedSystemListProperties,
  type OrderedListSuffix,
  type OrderedListSystem,
} from "../utilities/list-style-contract";
import { parseVariants } from "../parsing/variant";
import { VALUE_GETTERS } from "../utilities/value-getters";
import { animationShorthandToLonghands } from "../utilities/helpers";
import {
  COMPILED_PATTERNS,
  IUI_TRANSFORM_VAR_TEMPLATE,
} from "../utilities/constants";
import { UtilityCache } from "./cache";
import { getBorderWidthValue, getRingWidthValue } from "../tokens/dynamic";
import { isTailwindFontWeightNumeric } from "../tokens/values";
import { isGradientRegistered } from "../../utilities/gradient-utils";
import { isColorTokenWithOptionalOpacity } from "../../utilities/color-token-utils";

/**
 * text-transform-* utilities (must parse before generic `text-*` color/size).
 * Allowed suffixes: MDN keywords (none, uppercase, lowercase, capitalize) plus sentencecase
 * (lowercase + ::first-letter in UtilityBuilder). Unknown text-transform-* is rejected.
 */
const TEXT_TRANSFORM_PREFIX = "text-transform-";
const TEXT_TRANSFORM_SUFFIXES = new Set([
  "none",
  "uppercase",
  "lowercase",
  "capitalize",
  "sentencecase",
]);

/**
 * Extra `font-feature-settings` for some `font-variant-numeric` utils. Browsers and fonts
 * often apply ordinals, slashed zero, and fractions more reliably via OpenType tags than
 * through the shorthand alone (same tags as `font-feature-ordn`, `font-feature-zero`, etc.).
 */
const FONT_VARIANT_NUMERIC_FEATURE_SETTINGS: Record<string, string> = {
  ordinal: '"ordn" 1',
  "slashed-zero": '"zero" 1',
  "stacked-fractions": '"afrc" 1',
  "diagonal-fractions": '"frac" 1',
  "lining-nums": '"lnum" 1',
  "oldstyle-nums": '"onum" 1',
  "proportional-nums": '"pnum" 1',
  "tabular-nums": '"tnum" 1',
  "normal-nums": '"lnum" 0, "onum" 0, "pnum" 0, "tnum" 0, "frac" 0, "afrc" 0, "ordn" 0, "zero" 0',
};

function isTextTransformUtilityClass(baseClass: string): boolean {
  if (!baseClass.startsWith(TEXT_TRANSFORM_PREFIX)) return false;
  return TEXT_TRANSFORM_SUFFIXES.has(
    baseClass.slice(TEXT_TRANSFORM_PREFIX.length),
  );
}

function parseDirectionalRingWithOptionalColor(
  baseClass: string,
  prefix: string,
  widthCategory: TokenCategory,
  variants: string[],
): ParsedUtilityResult | null {
  if (!baseClass.startsWith(prefix)) return null;
  const suffix = baseClass.slice(prefix.length);
  if (!suffix) return null;
  if (getRingWidthValue(suffix) != null) {
    return {
      category: widthCategory,
      value: suffix,
      variants,
      baseClass,
    };
  }
  if (isColorTokenWithOptionalOpacity(suffix)) {
    return {
      category: "ring-color" as TokenCategory,
      value: suffix,
      variants,
      baseClass,
    };
  }
  return null;
}

/**
 * Parser context - dependencies for parser function
 * Following dependency injection pattern (Tailwind CSS style)
 */
export interface ParserContext {
  cache: UtilityCache;
}

/**
 * Parsed utility result
 */
export type ParsedUtilityResult = {
  category: TokenCategory;
  value: string;
  variants: string[];
  baseClass: string;
  properties?: Record<string, string>;
  important?: boolean;
  opacity?: string;
} | null;

/**
 * Parse utility class name to extract category, value, and variants
 * Optimized with memoization and pre-compiled patterns
 *
 * NOTE: This method only handles predefined design tokens.
 * Arbitrary values (e.g., w-[100px], bg-[#ff0000]) are handled by separate hooks.
 *
 * Following Tailwind CSS patterns: pure function with dependency injection
 */
export function parseUtilityClass(
  className: string,
  context: ParserContext,
): ParsedUtilityResult {
  // REJECT ARBITRARY VALUES - Utility builder only handles predefined tokens.
  // Exception: content-[...] is a canonical utility and is parsed below.
  if (
    className.includes("[") &&
    className.includes("]") &&
    !className.includes("content-[")
  ) {
    return null;
  }

  // Reject JS/TS string debris that would emit invalid CSS
  // (e.g. border-transparent"; → var(--iui-color-transparent";)).
  if (/["'`;,]/.test(className)) {
    return null;
  }

  // Check LRU cache first for better performance
  const cached = context.cache.get(className);
  if (cached !== undefined) {
    return cached;
  }

  // Use the new variant parser to handle complex combinations
  const parsedVariants = parseVariants(className);
  const { baseClass, variants, important } = parsedVariants;

  // Helper function to cache and return result using LRU cache
  const cacheAndReturn = (result: ParsedUtilityResult): ParsedUtilityResult => {
    if (result && important) {
      // Add important flag to result if present
      result.important = important;
    }
    context.cache.set(className, result);
    return result;
  };

  // Parse different class patterns

  // Text wrap utilities: text-wrap, text-nowrap, etc. (check before text-color)
  if (
    baseClass === "text-wrap" ||
    baseClass === "text-nowrap" ||
    baseClass === "text-balance" ||
    baseClass === "text-pretty"
  ) {
    return cacheAndReturn({
      category: "text-wrap" as TokenCategory,
      value: baseClass.replace("text-", ""),
      variants,
      baseClass,
    });
  }

  // Font smoothing (Tailwind: antialiased, subpixel-antialiased)
  if (baseClass === "antialiased") {
    return cacheAndReturn({
      category: "font-smoothing" as TokenCategory,
      value: "antialiased",
      variants,
      baseClass,
      properties: {
        "-webkit-font-smoothing": "antialiased",
        "-moz-osx-font-smoothing": "grayscale",
      },
    });
  }
  if (baseClass === "subpixel-antialiased") {
    return cacheAndReturn({
      category: "font-smoothing" as TokenCategory,
      value: "subpixel-antialiased",
      variants,
      baseClass,
      properties: {
        "-webkit-font-smoothing": "auto",
        "-moz-osx-font-smoothing": "auto",
      },
    });
  }

  // Text decoration: underline, line-through, no-underline, overline
  if (
    baseClass === "underline" ||
    baseClass === "line-through" ||
    baseClass === "no-underline" ||
    baseClass === "overline"
  ) {
    return cacheAndReturn({
      category: "text-decoration" as TokenCategory,
      value: baseClass,
      variants,
      baseClass,
    });
  }

  // text-decoration-color-* — alias for decoration colors (Tailwind uses decoration-*; this matches common expectations)
  if (baseClass.startsWith("text-decoration-color-")) {
    const rest = baseClass.replace("text-decoration-color-", "");
    const opacityMatch = rest.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : rest;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    const decorCss = (
      VALUE_GETTERS["decoration-color"] as (
        v: string,
        o?: string,
      ) => string | null
    )?.(colorName, opacity);
    if (!decorCss) {
      context.cache.set(className, null);
      return null;
    }
    return cacheAndReturn({
      category: "decoration-color" as TokenCategory,
      value: colorName,
      variants,
      baseClass,
      properties: { "text-decoration-color": decorCss },
    });
  }

  // text-transform-* (MDN keywords + sentencecase; bare `none` elsewhere is display:none).
  if (isTextTransformUtilityClass(baseClass)) {
    return cacheAndReturn({
      category: "text-transform" as TokenCategory,
      value: baseClass,
      variants,
      baseClass,
    });
  }
  // Tailwind bare aliases: uppercase → text-transform-uppercase, etc.
  if (
    baseClass === "uppercase" ||
    baseClass === "lowercase" ||
    baseClass === "capitalize" ||
    baseClass === "normal-case"
  ) {
    const value =
      baseClass === "normal-case" ? "text-transform-none" : `text-transform-${baseClass}`;
    return cacheAndReturn({
      category: "text-transform" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        "text-transform":
          baseClass === "normal-case" ? "none" : baseClass,
      },
    });
  }
  // Do not let unknown text-transform-* fall through to text-{color} (e.g. text-transform-camel-case).
  if (baseClass.startsWith(TEXT_TRANSFORM_PREFIX)) {
    context.cache.set(className, null);
    return null;
  }

  // Text underline offset: underline-offset-0, underline-offset-1, etc.
  if (baseClass.startsWith("underline-offset-")) {
    return cacheAndReturn({
      category: "text-underline-offset" as TokenCategory,
      value: baseClass.replace("underline-offset-", ""),
      variants,
      baseClass,
    });
  }

  // decoration-* routing: box-decoration-break (slice|clone) | style | thickness | color
  if (baseClass.startsWith("decoration-")) {
    const decorVal = baseClass.replace("decoration-", "");
    if (decorVal === "slice" || decorVal === "clone") {
      return cacheAndReturn({
        category: "box-decoration-break" as TokenCategory,
        value: decorVal,
        variants,
        baseClass,
      });
    }
    const decorStyleValues = ["solid", "double", "dotted", "dashed", "wavy", "none"];
    const decorThicknessKeywords = ["auto", "from-font", "0", "1", "2", "4", "8"];
    const isThicknessNumeric = /^\d+(\.\d+)?$/.test(decorVal);
    if (decorStyleValues.includes(decorVal)) {
      return cacheAndReturn({
        category: "text-decoration-style" as TokenCategory,
        value: decorVal,
        variants,
        baseClass,
      });
    }
    if (decorThicknessKeywords.includes(decorVal) || isThicknessNumeric) {
      return cacheAndReturn({
        category: "text-decoration-thickness" as TokenCategory,
        value: decorVal,
        variants,
        baseClass,
      });
    }
    // Otherwise treat as decoration-color (e.g. decoration-red-500/50, decoration-white)
    const decorOpacityMatch = decorVal.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const decorColorName = decorOpacityMatch ? decorOpacityMatch[1] : decorVal;
    const decorOpacity = decorOpacityMatch ? decorOpacityMatch[2] : undefined;
    const decorCss = (
      VALUE_GETTERS["decoration-color"] as (
        v: string,
        o?: string,
      ) => string | null
    )?.(decorColorName, decorOpacity);
    return cacheAndReturn({
      category: "decoration-color" as TokenCategory,
      value: decorColorName,
      variants,
      baseClass,
      properties: decorCss ? { "text-decoration-color": decorCss } : undefined,
    });
  }

  // Text overflow: truncate, text-ellipsis, text-clip
  if (
    baseClass === "truncate" ||
    baseClass === "text-ellipsis" ||
    baseClass === "text-clip"
  ) {
    return cacheAndReturn({
      category: "text-overflow" as TokenCategory,
      value:
        baseClass === "truncate" ? "ellipsis" : baseClass.replace("text-", ""),
      variants,
      baseClass,
    });
  }

  // Line clamp: line-clamp-none + line-clamp-{n} for positive integers (CSS / Tailwind arbitrary-style counts)
  if (baseClass === "line-clamp-none") {
    return cacheAndReturn({
      category: "line-clamp" as TokenCategory,
      value: "none",
      variants,
      baseClass,
      properties: {
        overflow: "visible",
        display: "block",
        "-webkit-box-orient": "horizontal",
        "-webkit-line-clamp": "unset",
        "line-clamp": "unset",
      },
    });
  }
  const lineClampMatch = baseClass.match(/^line-clamp-(\d+)$/);
  if (lineClampMatch) {
    const n = parseInt(lineClampMatch[1], 10);
    if (n >= 1 && n <= 999) {
      return cacheAndReturn({
        category: "line-clamp" as TokenCategory,
        value: String(n),
        variants,
        baseClass,
        properties: {
          overflow: "hidden",
          display: "-webkit-box",
          "-webkit-box-orient": "vertical",
          "-webkit-line-clamp": String(n),
          "line-clamp": String(n),
        },
      });
    }
  }

  // Text indent: indent-4, -indent-4 (Tailwind negative indent)
  const indentMatch = baseClass.match(/^(-?)indent-(.+)$/);
  if (indentMatch) {
    const value = indentMatch[1] + indentMatch[2];
    return cacheAndReturn({
      category: "text-indent" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Vertical align (Tailwind): align-baseline, align-top, … → vertical-align (inline/table-cell)
  if (
    baseClass.startsWith("align-") &&
    !baseClass.startsWith("align-items-") &&
    !baseClass.startsWith("align-content-") &&
    !baseClass.startsWith("align-self-")
  ) {
    return cacheAndReturn({
      category: "vertical-align" as TokenCategory,
      value: baseClass.replace("align-", ""),
      variants,
      baseClass,
    });
  }

  // Whitespace: whitespace-normal, whitespace-nowrap, whitespace-pre, etc.
  if (baseClass.startsWith("whitespace-")) {
    return cacheAndReturn({
      category: "whitespace" as TokenCategory,
      value: baseClass.replace("whitespace-", ""),
      variants,
      baseClass,
    });
  }

  // Hyphens: hyphens-none, hyphens-manual, hyphens-auto
  if (baseClass.startsWith("hyphens-")) {
    return cacheAndReturn({
      category: "hyphens" as TokenCategory,
      value: baseClass.replace("hyphens-", ""),
      variants,
      baseClass,
    });
  }

  // Word break: break-keep (value matches VALUE_GETTERS word-break)
  if (baseClass === "break-keep") {
    return cacheAndReturn({
      category: "word-break" as TokenCategory,
      value: "keep-all",
      variants,
      baseClass,
    });
  }

  // Overflow wrap (Tailwind canonical utility: break-words)
  if (baseClass === "break-words") {
    return cacheAndReturn({
      category: "overflow-wrap" as TokenCategory,
      value: "break-word",
      variants,
      baseClass,
    });
  }
  if (baseClass === "wrap-anywhere") {
    return cacheAndReturn({
      category: "overflow-wrap" as TokenCategory,
      value: "anywhere",
      variants,
      baseClass,
    });
  }
  if (baseClass === "wrap-normal") {
    return cacheAndReturn({
      category: "overflow-wrap" as TokenCategory,
      value: "normal",
      variants,
      baseClass,
    });
  }

  // Text alignment: logical + Tailwind physical (text-left / text-right)
  if (
    baseClass === "text-center" ||
    baseClass === "text-justify" ||
    baseClass === "text-start" ||
    baseClass === "text-end" ||
    baseClass === "text-left" ||
    baseClass === "text-right"
  ) {
    const value = baseClass.replace("text-", "");
    const cssValue = VALUE_GETTERS["text-align"]?.(value);
    return cacheAndReturn({
      category: "text-align" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "text-align": cssValue } : undefined,
    });
  }

  // Text orientation: text-orientation-mixed, text-orientation-upright, text-orientation-sideways
  if (baseClass.startsWith("text-orientation-")) {
    const value = baseClass.replace("text-orientation-", "");
    const cssValue = VALUE_GETTERS["text-orientation"]?.(value);
    return cacheAndReturn({
      category: "text-orientation" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "text-orientation": cssValue } : undefined,
    });
  }

  // Text colors: text-red-500, text-black/30 (with opacity modifier)
  // NOTE: exclude text-shadow-* and plain text-shadow here; those are handled later
  if (
    baseClass.startsWith("text-") &&
    !baseClass.startsWith("text-align-") &&
    !baseClass.startsWith("text-decoration-") &&
    !baseClass.startsWith("text-shadow-") &&
    baseClass !== "text-shadow"
  ) {
    // Check if it's a font size first using pre-compiled pattern
    if (COMPILED_PATTERNS.TEXT_SIZE.test(baseClass)) {
      return cacheAndReturn({
        category: "font-size" as TokenCategory,
        value: baseClass.replace("text-", ""),
        variants,
        baseClass,
      });
    }
    // Numeric fallback: treat as font-size (e.g. text-3, text-10)
    if (/^-?\d+(\.\d+)?$/.test(baseClass.replace("text-", ""))) {
      return cacheAndReturn({
        category: "font-size" as TokenCategory,
        value: baseClass.replace("text-", ""),
        variants,
        baseClass,
      });
    }
    const textSuffix = baseClass.replace("text-", "");
    // Check for text gradients BEFORE text-color
    const textGradientName = baseClass.replace("text-", "");
    // Check if this is a registered gradient (gradients should be initialized before parsing)
    if (isGradientRegistered(textGradientName)) {
      return cacheAndReturn({
        category: "text-gradient" as TokenCategory,
        value: textGradientName,
        variants,
        baseClass,
      });
    }
    // Otherwise it's a color - extract opacity if present (e.g., text-black/30)
    const colorValue = baseClass.replace("text-", "");
    const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : colorValue;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    const cssValue = VALUE_GETTERS["text-color"]?.(colorName, opacity);
    return cacheAndReturn({
      category: "text-color" as TokenCategory,
      value: colorName,
      variants,
      baseClass,
      properties: cssValue ? { color: cssValue } : undefined,
    });
  }

  // Typography utilities: leading-6, tracking-wide, etc.
  if (baseClass.startsWith("leading-")) {
    const value = baseClass.replace("leading-", "");
    const cssValue = VALUE_GETTERS["line-height"]?.(value);
    return cacheAndReturn({
      category: "line-height" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "line-height": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("tracking-")) {
    const value = baseClass.replace("tracking-", "");
    const cssValue = VALUE_GETTERS["letter-spacing"]?.(value);
    return cacheAndReturn({
      category: "letter-spacing" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "letter-spacing": cssValue } : undefined,
    });
  }

  // Background gradients: bg-gradient-to-e, bg-gradient-to-be, bg-gradient-to-s, etc.
  if (COMPILED_PATTERNS.BACKGROUND_GRADIENT.test(baseClass)) {
    return cacheAndReturn({
      category: "background-image" as TokenCategory,
      value: baseClass.replace("bg-", ""),
      variants,
      baseClass,
    });
  }

  // Background properties - MUST be checked BEFORE bg-color to avoid conflicts
  // bg-fixed, bg-local, bg-scroll
  if (
    baseClass === "bg-fixed" ||
    baseClass === "bg-local" ||
    baseClass === "bg-scroll"
  ) {
    return cacheAndReturn({
      category: "background-attachment" as TokenCategory,
      value: baseClass.replace("bg-", ""),
      variants,
      baseClass,
    });
  }
  // bg-clip-*
  if (baseClass.startsWith("bg-clip-")) {
    return cacheAndReturn({
      category: "background-clip" as TokenCategory,
      value: baseClass.replace("bg-clip-", ""),
      variants,
      baseClass,
    });
  }
  // bg-origin-*
  if (baseClass.startsWith("bg-origin-")) {
    return cacheAndReturn({
      category: "background-origin" as TokenCategory,
      value: baseClass.replace("bg-origin-", ""),
      variants,
      baseClass,
    });
  }
  // bg-bottom, bg-center, bg-start/end, etc.
  if (
    baseClass === "bg-bottom" ||
    baseClass === "bg-center" ||
    baseClass === "bg-start" ||
    baseClass === "bg-start-bottom" ||
    baseClass === "bg-start-top" ||
    baseClass === "bg-end" ||
    baseClass === "bg-end-bottom" ||
    baseClass === "bg-end-top" ||
    baseClass === "bg-top-start" ||
    baseClass === "bg-top-end" ||
    baseClass === "bg-bottom-start" ||
    baseClass === "bg-bottom-end" ||
    baseClass === "bg-ts" ||
    baseClass === "bg-te" ||
    baseClass === "bg-bs" ||
    baseClass === "bg-be" ||
    baseClass === "bg-top"
  ) {
    return cacheAndReturn({
      category: "background-position" as TokenCategory,
      value: baseClass.replace("bg-", ""),
      variants,
      baseClass,
    });
  }
  // bg-repeat, bg-no-repeat, bg-repeat-round, bg-repeat-space, etc.
  // (Tailwind parity: https://tailwindcss.com/docs/background-repeat )
  if (baseClass === "bg-repeat") {
    return cacheAndReturn({
      category: "background-repeat" as TokenCategory,
      value: "repeat",
      variants,
      baseClass,
      properties: { "background-repeat": "repeat" },
    });
  }
  if (baseClass === "bg-no-repeat") {
    return cacheAndReturn({
      category: "background-repeat" as TokenCategory,
      value: "no-repeat",
      variants,
      baseClass,
      properties: { "background-repeat": "no-repeat" },
    });
  }
  if (baseClass === "bg-repeat-x") {
    return cacheAndReturn({
      category: "background-repeat" as TokenCategory,
      value: "repeat-x",
      variants,
      baseClass,
      properties: { "background-repeat": "repeat-x" },
    });
  }
  if (baseClass === "bg-repeat-y") {
    return cacheAndReturn({
      category: "background-repeat" as TokenCategory,
      value: "repeat-y",
      variants,
      baseClass,
      properties: { "background-repeat": "repeat-y" },
    });
  }
  if (baseClass === "bg-repeat-round") {
    return cacheAndReturn({
      category: "background-repeat" as TokenCategory,
      value: "round",
      variants,
      baseClass,
      properties: { "background-repeat": "round" },
    });
  }
  if (baseClass === "bg-repeat-space") {
    return cacheAndReturn({
      category: "background-repeat" as TokenCategory,
      value: "space",
      variants,
      baseClass,
      properties: { "background-repeat": "space" },
    });
  }
  // bg-auto, bg-cover, bg-contain
  if (
    baseClass === "bg-auto" ||
    baseClass === "bg-cover" ||
    baseClass === "bg-contain"
  ) {
    return cacheAndReturn({
      category: "background-size" as TokenCategory,
      value: baseClass.replace("bg-", ""),
      variants,
      baseClass,
    });
  }

  // Gradient stops (Tailwind): from-/via-/to- accept theme colors OR stop positions (from-40%)
  if (baseClass.startsWith("from-")) {
    const rest = baseClass.slice(5);
    if (/^\d+(\.\d+)?%$/.test(rest)) {
      return cacheAndReturn({
        category: "gradient-from" as TokenCategory,
        value: rest,
        variants,
        baseClass,
      });
    }
    const opacityMatch = rest.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : rest;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    return cacheAndReturn({
      category: "gradient-from" as TokenCategory,
      value: colorName,
      opacity,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("via-")) {
    const rest = baseClass.slice(4);
    if (/^\d+(\.\d+)?%$/.test(rest)) {
      return cacheAndReturn({
        category: "gradient-via" as TokenCategory,
        value: rest,
        variants,
        baseClass,
      });
    }
    const opacityMatch = rest.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : rest;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    return cacheAndReturn({
      category: "gradient-via" as TokenCategory,
      value: colorName,
      opacity,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("to-")) {
    const rest = baseClass.slice(3);
    if (/^\d+(\.\d+)?%$/.test(rest)) {
      return cacheAndReturn({
        category: "gradient-to" as TokenCategory,
        value: rest,
        variants,
        baseClass,
      });
    }
    const opacityMatch = rest.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : rest;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    return cacheAndReturn({
      category: "gradient-to" as TokenCategory,
      value: colorName,
      opacity,
      variants,
      baseClass,
    });
  }

  // Background colors: bg-blue-500, bg-black/30 (with opacity modifier)
  // This must come AFTER all other bg- property checks
  // Check for config gradients BEFORE checking bg-color
  if (baseClass.startsWith("bg-")) {
    const gradientName = baseClass.replace("bg-", "");
    // Check if this is a registered gradient (gradients should be initialized before parsing)
    if (isGradientRegistered(gradientName)) {
      return cacheAndReturn({
        category: "bg-gradient" as TokenCategory,
        value: gradientName,
        variants,
        baseClass,
      });
    }
    // Otherwise it's a color - extract opacity if present (e.g., bg-black/30)
    const colorValue = baseClass.replace("bg-", "");
    const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : colorValue;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    const cssValue = (
      VALUE_GETTERS["bg-color"] as (
        value: string,
        opacity?: string,
      ) => string | null
    )?.(colorName, opacity);
    return cacheAndReturn({
      category: "bg-color" as TokenCategory,
      value: colorName,
      variants,
      baseClass,
      properties: cssValue ? { "background-color": cssValue } : undefined,
    });
  }

  // Border width: border, border-0, border-1, border-2, border-10, border-20, etc. (MOVED BEFORE border color to avoid conflicts)
  // Supports any numeric value (0, 1, 2, ..., 10, 20, 100, etc.)
  if (baseClass === "border" || baseClass.match(/^border-(\d+)$/)) {
    const value =
      baseClass === "border" ? "default" : baseClass.replace("border-", "");
    // Special case for 'border' class to match Tailwind CSS behavior
    if (baseClass === "border") {
      return cacheAndReturn({
        category: "border-width" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: {
          "border-width": "1px",
        },
      });
    }
    // For border-2, border-4, etc., also include properties
    const borderWidthValue = getBorderWidthValue(value) || `${value}px`;
    return cacheAndReturn({
      category: "border-width" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        "border-width": borderWidthValue,
      },
    });
  }

  // Tailwind v4 block logical (1px width): border-bs, border-be
  if (baseClass === "border-bs") {
    return cacheAndReturn({
      category: "border-bs-width" as TokenCategory,
      value: "default",
      variants,
      baseClass,
      properties: {
        "border-block-start-width": "1px",
      },
    });
  }
  if (baseClass === "border-be") {
    return cacheAndReturn({
      category: "border-be-width" as TokenCategory,
      value: "default",
      variants,
      baseClass,
      properties: {
        "border-block-end-width": "1px",
      },
    });
  }

  // Basic directional borders: border-t, border-b, border-x, border-y, border-s, border-e (logical — no l/r)
  if (baseClass.match(/^border-[tbxyse]$/)) {
    const direction = baseClass.replace("border-", "");
    const category = `border-${direction}-width` as TokenCategory;

    if (direction === "s") {
      return cacheAndReturn({
        category: "border-s-width" as TokenCategory,
        value: "default",
        variants,
        baseClass,
        properties: {
          "border-inline-start-width": "1px",
        },
      });
    }
    if (direction === "e") {
      return cacheAndReturn({
        category: "border-e-width" as TokenCategory,
        value: "default",
        variants,
        baseClass,
        properties: {
          "border-inline-end-width": "1px",
        },
      });
    }

    // For x and y directions, we need to handle both sides
    if (direction === "x") {
      return cacheAndReturn({
        category,
        value: "default",
        variants,
        baseClass,
        properties: {
          "border-inline-width": "1px",
        },
      });
    } else if (direction === "y") {
      return cacheAndReturn({
        category,
        value: "default",
        variants,
        baseClass,
        properties: {
          "border-block-width": "1px",
        },
      });
    } else {
      const edgeMap: Record<string, string> = { t: "top", b: "bottom" };
      const edge = edgeMap[direction];
      return cacheAndReturn({
        category,
        value: "default",
        variants,
        baseClass,
        properties: {
          [`border-${edge}-width`]: "1px",
        },
      });
    }
  }

  // Border style: border-solid, border-dashed, etc. (MOVED BEFORE border color to avoid conflicts)
  if (
    baseClass.match(
      /^border-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
    )
  ) {
    const value = baseClass.replace("border-", "");
    return cacheAndReturn({
      category: "border-style" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        "border-style": value,
      },
    });
  }

  // Per-side border style: border-t-solid, border-b-dashed, border-s-solid, border-e-dashed (no r/l)
  const borderSideStyleMatch = baseClass.match(
    /^border-([tbs])-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  );
  if (borderSideStyleMatch) {
    const side = borderSideStyleMatch[1];
    const value = borderSideStyleMatch[2];
    if (side === "s") {
      return cacheAndReturn({
        category: "border-s-style" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: { "border-inline-start-style": value },
      });
    }
    const edge = side === "t" ? "top" : "bottom";
    return cacheAndReturn({
      category: `border-${side}-style` as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        [`border-${edge}-style`]: value,
      },
    });
  }
  // Axis border style: border-x-solid, border-y-dashed
  const borderAxisStyleMatch = baseClass.match(
    /^border-(x|y)-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  );
  if (borderAxisStyleMatch) {
    const axis = borderAxisStyleMatch[1];
    const value = borderAxisStyleMatch[2];
    if (axis === "x") {
      return cacheAndReturn({
        category: "border-x-style" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: {
          "border-inline-style": value,
        },
      });
    }
    return cacheAndReturn({
      category: "border-y-style" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        "border-block-style": value,
      },
    });
  }

  // Logical inline border style (Tailwind): border-s-*, border-e-*
  const borderLogicalInlineStyleMatch = baseClass.match(
    /^border-(s|e)-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  );
  if (borderLogicalInlineStyleMatch) {
    const side = borderLogicalInlineStyleMatch[1];
    const value = borderLogicalInlineStyleMatch[2];
    if (side === "s") {
      return cacheAndReturn({
        category: "border-s-style" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: {
          "border-inline-start-style": value,
        },
      });
    }
    return cacheAndReturn({
      category: "border-e-style" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        "border-inline-end-style": value,
      },
    });
  }

  // Block logical border style (Tailwind v4): border-bs-*, border-be-*
  const borderLogicalBlockStyleMatch = baseClass.match(
    /^border-(bs|be)-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  );
  if (borderLogicalBlockStyleMatch) {
    const side = borderLogicalBlockStyleMatch[1];
    const value = borderLogicalBlockStyleMatch[2];
    if (side === "bs") {
      return cacheAndReturn({
        category: "border-bs-style" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: {
          "border-block-start-style": value,
        },
      });
    }
    return cacheAndReturn({
      category: "border-be-style" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        "border-block-end-style": value,
      },
    });
  }

  // Logical border colors (Tailwind): border-s-*, border-e-* → border-inline-*-color
  const borderLogicalStart = baseClass.match(/^border-s-(.+)$/);
  if (borderLogicalStart) {
    const colorValue = borderLogicalStart[1];
    // Width utilities border-s-2 must not be parsed as colors
    if (/^\d+(\.\d+)?$/.test(colorValue)) {
      // fall through to border width handler
    } else {
    const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : colorValue;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    const cssValue = (
      VALUE_GETTERS["border-inline-start-color"] as (
        value: string,
        opacity?: string,
      ) => string | null
    )?.(colorName, opacity);
    if (cssValue) {
      return cacheAndReturn({
        category: "border-inline-start-color" as TokenCategory,
        value: colorName,
        variants,
        baseClass,
        properties: { "border-inline-start-color": cssValue },
      });
    }
    }
  }
  const borderLogicalEnd = baseClass.match(/^border-e-(.+)$/);
  if (borderLogicalEnd) {
    const colorValue = borderLogicalEnd[1];
    if (/^\d+(\.\d+)?$/.test(colorValue)) {
      // fall through to border width handler
    } else {
    const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : colorValue;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    const cssValue = (
      VALUE_GETTERS["border-inline-end-color"] as (
        value: string,
        opacity?: string,
      ) => string | null
    )?.(colorName, opacity);
    if (cssValue) {
      return cacheAndReturn({
        category: "border-inline-end-color" as TokenCategory,
        value: colorName,
        variants,
        baseClass,
        properties: { "border-inline-end-color": cssValue },
      });
    }
    }
  }

  const borderBlockStart = baseClass.match(/^border-bs-(.+)$/);
  if (borderBlockStart) {
    const colorValue = borderBlockStart[1];
    if (!/^\d+(\.\d+)?$/.test(colorValue)) {
      const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
      const colorName = opacityMatch ? opacityMatch[1] : colorValue;
      const opacity = opacityMatch ? opacityMatch[2] : undefined;
      const cssValue = (
        VALUE_GETTERS["border-block-start-color"] as (
          value: string,
          opacity?: string,
        ) => string | null
      )?.(colorName, opacity);
      if (cssValue) {
        return cacheAndReturn({
          category: "border-block-start-color" as TokenCategory,
          value: colorName,
          variants,
          baseClass,
          properties: { "border-block-start-color": cssValue },
        });
      }
    }
  }
  const borderBlockEnd = baseClass.match(/^border-be-(.+)$/);
  if (borderBlockEnd) {
    const colorValue = borderBlockEnd[1];
    if (!/^\d+(\.\d+)?$/.test(colorValue)) {
      const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
      const colorName = opacityMatch ? opacityMatch[1] : colorValue;
      const opacity = opacityMatch ? opacityMatch[2] : undefined;
      const cssValue = (
        VALUE_GETTERS["border-block-end-color"] as (
          value: string,
          opacity?: string,
        ) => string | null
      )?.(colorName, opacity);
      if (cssValue) {
        return cacheAndReturn({
          category: "border-block-end-color" as TokenCategory,
          value: colorName,
          variants,
          baseClass,
          properties: { "border-block-end-color": cssValue },
        });
      }
    }
  }

  // Border colors: border-blue-500, border-black/30 (with opacity modifier)
  if (
    baseClass.startsWith("border-") &&
    !baseClass.startsWith("border-t-") &&
    !baseClass.startsWith("border-b-") &&
    !baseClass.startsWith("border-x-") &&
    !baseClass.startsWith("border-y-") &&
    !baseClass.startsWith("border-s-") &&
    !baseClass.startsWith("border-e-") &&
    !baseClass.startsWith("border-l-") &&
    !baseClass.startsWith("border-r-") &&
    !baseClass.startsWith("border-bs-") &&
    !baseClass.startsWith("border-be-") &&
    // Reject non-Tailwind long-form aliases (do not invent fake border-color tokens)
    !baseClass.startsWith("border-inline-") &&
    !baseClass.startsWith("border-block-") &&
    !baseClass.startsWith("border-spacing-") &&
    !baseClass.match(/^border-(\d+)$/) && // Exclude numeric border widths (border-0, border-1, border-10, etc.)
    !baseClass.match(/^border-(collapse|separate)$/) && // Exclude table border-collapse/border-separate
    !baseClass.match(
      /^border-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
    ) &&
    !baseClass.match(/^border-[lr]$/) // Physical l/r unsupported — use logical border-s / border-e
  ) {
    const colorValue = baseClass.replace("border-", "");
    const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : colorValue;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    if (isColorTokenWithOptionalOpacity(colorName)) {
      const cssValue = (
        VALUE_GETTERS["border-color"] as (
          value: string,
          opacity?: string,
        ) => string | null
      )?.(colorName, opacity);
      return cacheAndReturn({
        category: "border-color" as TokenCategory,
        value: colorName,
        variants,
        baseClass,
        properties: cssValue ? { "border-color": cssValue } : undefined,
      });
    }
  }

  // Directional border width: border-t-2, border-x-4, border-s-2, … (numeric / decimal)
  const borderWidthMatch = baseClass.match(
    /^border-([tbxyse])-(\d+(?:\.\d+)?)$/,
  );
  if (borderWidthMatch) {
    const direction = borderWidthMatch[1];
    const value = borderWidthMatch[2];
    const category = `border-${direction}-width` as TokenCategory;

    const borderWidthValue = getBorderWidthValue(value) || `${value}px`;

    if (direction === "s") {
      return cacheAndReturn({
        category: "border-s-width" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: {
          "border-inline-start-width": borderWidthValue,
        },
      });
    }
    if (direction === "e") {
      return cacheAndReturn({
        category: "border-e-width" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: {
          "border-inline-end-width": borderWidthValue,
        },
      });
    }

    // For x and y directions, we need to handle both sides
    if (direction === "x") {
      return cacheAndReturn({
        category,
        value,
        variants,
        baseClass,
        properties: {
          "border-inline-width": borderWidthValue,
        },
      });
    } else if (direction === "y") {
      return cacheAndReturn({
        category,
        value,
        variants,
        baseClass,
        properties: {
          "border-block-width": borderWidthValue,
        },
      });
    } else {
      const edgeMap: Record<string, string> = { t: "top", b: "bottom" };
      const edge = edgeMap[direction];
      return cacheAndReturn({
        category,
        value,
        variants,
        baseClass,
        properties: {
          [`border-${edge}-width`]: borderWidthValue,
        },
      });
    }
  }

  const borderBsBeWidth = baseClass.match(/^border-(bs|be)-(\d+(?:\.\d+)?)$/);
  if (borderBsBeWidth) {
    const side = borderBsBeWidth[1];
    const value = borderBsBeWidth[2];
    const borderWidthValue = getBorderWidthValue(value) || `${value}px`;
    if (side === "bs") {
      return cacheAndReturn({
        category: "border-bs-width" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: {
          "border-block-start-width": borderWidthValue,
        },
      });
    }
    return cacheAndReturn({
      category: "border-be-width" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: {
        "border-block-end-width": borderWidthValue,
      },
    });
  }

  // Directional border colors: border-t-*, border-b-*, border-x-*, border-s-*, border-e-* (logical — no l/r)
  const borderColorMatch = baseClass.match(/^border-([tbxyse])-(.+)$/);
  if (borderColorMatch) {
    const direction = borderColorMatch[1];
    const colorValue = borderColorMatch[2];
    const opacityMatch = colorValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : colorValue;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    if (isColorTokenWithOptionalOpacity(colorName)) {
    const category = `border-${direction}-color` as TokenCategory;
    const cssValue = (
      VALUE_GETTERS[category] as (
        value: string,
        opacity?: string,
      ) => string | null
    )?.(colorName, opacity);

    if (direction === "s") {
      const v = (
        VALUE_GETTERS["border-inline-start-color"] as (
          value: string,
          opacity?: string,
        ) => string | null
      )?.(colorName, opacity);
      return cacheAndReturn({
        category: "border-inline-start-color" as TokenCategory,
        value: colorName,
        variants,
        baseClass,
        properties: v ? { "border-inline-start-color": v } : undefined,
      });
    }
    if (direction === "e") {
      const v = (
        VALUE_GETTERS["border-inline-end-color"] as (
          value: string,
          opacity?: string,
        ) => string | null
      )?.(colorName, opacity);
      return cacheAndReturn({
        category: "border-inline-end-color" as TokenCategory,
        value: colorName,
        variants,
        baseClass,
        properties: v ? { "border-inline-end-color": v } : undefined,
      });
    }

    if (direction === "x") {
      return cacheAndReturn({
        category,
        value: colorName,
        variants,
        baseClass,
        properties: cssValue
          ? {
              "border-inline-color": cssValue,
            }
          : undefined,
      });
    } else if (direction === "y") {
      return cacheAndReturn({
        category,
        value: colorName,
        variants,
        baseClass,
        properties: cssValue
          ? {
              "border-block-color": cssValue,
            }
          : undefined,
      });
    } else {
      const edge = direction === "t" ? "top" : "bottom";
      return cacheAndReturn({
        category,
        value: colorName,
        variants,
        baseClass,
        properties: cssValue
          ? {
              [`border-${edge}-color`]: cssValue,
            }
          : undefined,
      });
    }
    }
  }

  // Corner border radius with sizes (logical): rounded-ts-*, rounded-te-*, rounded-bs-*, rounded-be-*
  if (baseClass.startsWith("rounded-ts-")) {
    const value = baseClass.replace("rounded-ts-", "");
    return cacheAndReturn({
      category: "border-radius-ts" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("rounded-te-")) {
    const value = baseClass.replace("rounded-te-", "");
    return cacheAndReturn({
      category: "border-radius-te" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("rounded-be-")) {
    const value = baseClass.replace("rounded-be-", "");
    return cacheAndReturn({
      category: "border-radius-be" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("rounded-bs-")) {
    const value = baseClass.replace("rounded-bs-", "");
    return cacheAndReturn({
      category: "border-radius-bs" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Logical corner border radius with sizes (Tailwind v4): rounded-ss-*, rounded-se-*, rounded-es-*, rounded-ee-*
  // Also support your shorthand aliases: rounded-ts-* (top-start) and rounded-te-*, rounded-bs-*, rounded-be-*
  const roundedLogicalCornerSized = baseClass.match(
    /^rounded-(ss|se|es|ee|ts|te|bs|be)-(.+)$/,
  );
  if (roundedLogicalCornerSized) {
    const corner = roundedLogicalCornerSized[1];
    const value = roundedLogicalCornerSized[2];
    const category =
      corner === "ss" || corner === "ts"
        ? ("border-radius-ss" as TokenCategory)
        : corner === "se" || corner === "te"
          ? ("border-radius-se" as TokenCategory)
          : corner === "es" || corner === "bs"
            ? ("border-radius-es" as TokenCategory)
            : ("border-radius-ee" as TokenCategory);
    return cacheAndReturn({
      category,
      value,
      variants,
      baseClass,
    });
  }

  // Corner border radius (logical): rounded-ts, rounded-te, rounded-bs, rounded-be (check AFTER size variants)
  if (baseClass === "rounded-ts") {
    const value = "default";
    return cacheAndReturn({
      category: "border-radius-ts" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass === "rounded-te") {
    const value = "default";
    return cacheAndReturn({
      category: "border-radius-te" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass === "rounded-be") {
    const value = "default";
    return cacheAndReturn({
      category: "border-radius-be" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass === "rounded-bs") {
    const value = "default";
    return cacheAndReturn({
      category: "border-radius-bs" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Logical corner border radius (Tailwind v4): rounded-ss, rounded-se, rounded-es, rounded-ee
  // Also support your shorthand aliases: rounded-ts, rounded-te, rounded-bs, rounded-be
  const roundedLogicalCorner = baseClass.match(
    /^rounded-(ss|se|es|ee|ts|te|bs|be)$/,
  );
  if (roundedLogicalCorner) {
    const corner = roundedLogicalCorner[1];
    const value = "default";
    const category =
      corner === "ss" || corner === "ts"
        ? ("border-radius-ss" as TokenCategory)
        : corner === "se" || corner === "te"
          ? ("border-radius-se" as TokenCategory)
          : corner === "es" || corner === "bs"
            ? ("border-radius-es" as TokenCategory)
            : ("border-radius-ee" as TokenCategory);
    return cacheAndReturn({
      category,
      value,
      variants,
      baseClass,
    });
  }

  // Directional border radius with sizes: rounded-t-sm, rounded-t-md, rounded-t-lg, etc.
  if (baseClass.startsWith("rounded-t-")) {
    const value = baseClass.replace("rounded-t-", "");
    return cacheAndReturn({
      category: "border-radius-t" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("rounded-b-")) {
    const value = baseClass.replace("rounded-b-", "");
    return cacheAndReturn({
      category: "border-radius-b" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("rounded-s-")) {
    const value = baseClass.replace("rounded-s-", "");
    return cacheAndReturn({
      category: "border-radius-s" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("rounded-e-")) {
    const value = baseClass.replace("rounded-e-", "");
    return cacheAndReturn({
      category: "border-radius-e" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  // Physical Tailwind aliases → logical start/end (IUI uses s/e, not l/r)
  if (baseClass.startsWith("rounded-l-")) {
    const value = baseClass.replace("rounded-l-", "");
    return cacheAndReturn({
      category: "border-radius-s" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("rounded-r-")) {
    const value = baseClass.replace("rounded-r-", "");
    return cacheAndReturn({
      category: "border-radius-e" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Directional border radius: rounded-t, rounded-b, rounded-s, rounded-e (check AFTER size variants)
  if (baseClass === "rounded-t") {
    const value = "default"; // Use default radius value
    return cacheAndReturn({
      category: "border-radius-t" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass === "rounded-b") {
    const value = "default"; // Use default radius value
    return cacheAndReturn({
      category: "border-radius-b" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass === "rounded-s") {
    const value = "default";
    return cacheAndReturn({
      category: "border-radius-s" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass === "rounded-e") {
    const value = "default";
    return cacheAndReturn({
      category: "border-radius-e" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  // Physical aliases → logical start/end
  if (baseClass === "rounded-l") {
    return cacheAndReturn({
      category: "border-radius-s" as TokenCategory,
      value: "default",
      variants,
      baseClass,
    });
  }
  if (baseClass === "rounded-r") {
    return cacheAndReturn({
      category: "border-radius-e" as TokenCategory,
      value: "default",
      variants,
      baseClass,
    });
  }

  // Border radius: rounded, rounded-lg, rounded-full, etc.
  if (baseClass.startsWith("rounded")) {
    const value =
      baseClass === "rounded" ? "default" : baseClass.replace("rounded-", "");
    return cacheAndReturn({
      category: "border-radius" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Margin: m-4, mt-2, ms-4, mbs-4, mbe-4, mx-auto, … (inline: ms/me; block: mbs/mbe; no ml/mr)
  const marginMatch = baseClass.match(/^(-?)m((?:bs|be|t|b|e|s|x|y)?)-(.+)$/);
  if (marginMatch) {
    const negative = marginMatch[1];
    const direction = marginMatch[2];
    const value = negative + marginMatch[3]; // Preserve negative sign in value
    const category = direction
      ? (`m${direction}` as TokenCategory)
      : ("m" as TokenCategory);
    return { category, value, variants, baseClass };
  }

  // Padding: p-4, pt-2, ps-4, pbs-4, pbe-4, … (no pl/pr)
  const paddingMatch = baseClass.match(/^(-?)p((?:bs|be|t|b|e|s|x|y)?)-(.+)$/);
  if (paddingMatch) {
    const negative = paddingMatch[1];
    const direction = paddingMatch[2];
    const value = negative + paddingMatch[3]; // Preserve negative sign in value
    const category = direction
      ? (`p${direction}` as TokenCategory)
      : ("p" as TokenCategory);
    return { category, value, variants, baseClass };
  }

  // Width and height: w-full, h-screen, size-16, etc.
  if (baseClass.startsWith("size-")) {
    return {
      category: "size" as TokenCategory,
      value: baseClass.replace("size-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("w-")) {
    return {
      category: "width" as TokenCategory,
      value: baseClass.replace("w-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("h-")) {
    return {
      category: "height" as TokenCategory,
      value: baseClass.replace("h-", ""),
      variants,
      baseClass,
    };
  }

  // Logical sizing (Tailwind v4 naming): inline-*, min-inline-*, max-inline-*, block-*, min-block-*, max-block-*
  // Exclude display values: inline-block, inline-flex, inline-table, inline-grid
  if (baseClass.startsWith("inline-") && !["inline-block", "inline-flex", "inline-table", "inline-grid"].includes(baseClass)) {
    return { category: "inline-size" as TokenCategory, value: baseClass.replace("inline-", ""), variants, baseClass };
  }
  if (baseClass.startsWith("min-inline-")) {
    return { category: "min-inline-size" as TokenCategory, value: baseClass.replace("min-inline-", ""), variants, baseClass };
  }
  if (baseClass.startsWith("max-inline-")) {
    return { category: "max-inline-size" as TokenCategory, value: baseClass.replace("max-inline-", ""), variants, baseClass };
  }
  // Exclude display "block" (no suffix) - block-* has a value suffix
  if (baseClass.startsWith("block-")) {
    return { category: "block-size" as TokenCategory, value: baseClass.replace("block-", ""), variants, baseClass };
  }
  if (baseClass.startsWith("min-block-")) {
    return { category: "min-block-size" as TokenCategory, value: baseClass.replace("min-block-", ""), variants, baseClass };
  }
  if (baseClass.startsWith("max-block-")) {
    return { category: "max-block-size" as TokenCategory, value: baseClass.replace("max-block-", ""), variants, baseClass };
  }

  // Special max-width values: max-w-none, max-w-screen-* (check BEFORE general max-w- pattern)
  if (baseClass === "max-w-none") {
    return cacheAndReturn({
      category: "max-width" as TokenCategory,
      value: "none",
      variants,
      baseClass,
    });
  }
  if (baseClass === "max-w-screen-sm") {
    return cacheAndReturn({
      category: "max-width" as TokenCategory,
      value: "screen-sm",
      variants,
      baseClass,
      properties: { "max-width": "640px" },
    });
  }
  if (baseClass === "max-w-screen-md") {
    return cacheAndReturn({
      category: "max-width" as TokenCategory,
      value: "screen-md",
      variants,
      baseClass,
      properties: { "max-width": "768px" },
    });
  }
  if (baseClass === "max-w-screen-lg") {
    return cacheAndReturn({
      category: "max-width" as TokenCategory,
      value: "screen-lg",
      variants,
      baseClass,
      properties: { "max-width": "1024px" },
    });
  }
  if (baseClass === "max-w-screen-xl") {
    return cacheAndReturn({
      category: "max-width" as TokenCategory,
      value: "screen-xl",
      variants,
      baseClass,
      properties: { "max-width": "1280px" },
    });
  }
  if (baseClass === "max-w-screen-2xl") {
    return cacheAndReturn({
      category: "max-width" as TokenCategory,
      value: "screen-2xl",
      variants,
      baseClass,
      properties: { "max-width": "1536px" },
    });
  }

  // Min-width and max-width: min-w-0, max-w-sm, etc.
  if (baseClass.startsWith("min-w-")) {
    const value = baseClass.replace("min-w-", "");
    const cssValue = VALUE_GETTERS["min-width"]?.(value);
    return cacheAndReturn({
      category: "min-width" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "min-width": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("max-w-")) {
    const value = baseClass.replace("max-w-", "");
    const cssValue = VALUE_GETTERS["max-width"]?.(value);
    return cacheAndReturn({
      category: "max-width" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "max-width": cssValue } : undefined,
    });
  }

  // Min-height and max-height: min-h-0, max-h-sm, etc.
  if (baseClass.startsWith("min-h-")) {
    const value = baseClass.replace("min-h-", "");
    const cssValue = VALUE_GETTERS["min-height"]?.(value);
    return cacheAndReturn({
      category: "min-height" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "min-height": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("max-h-")) {
    const value = baseClass.replace("max-h-", "");
    const cssValue = VALUE_GETTERS["max-height"]?.(value);
    return cacheAndReturn({
      category: "max-height" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "max-height": cssValue } : undefined,
    });
  }

  // Space reverse utilities: space-x-reverse, space-y-reverse (MUST be before general space-x- rule)
  if (baseClass === "space-x-reverse") {
    return {
      category: "space-x-reverse" as TokenCategory,
      value: "",
      variants,
      baseClass,
    };
  }
  if (baseClass === "space-y-reverse") {
    return {
      category: "space-y-reverse" as TokenCategory,
      value: "",
      variants,
      baseClass,
    };
  }

  // Spacing between children: space-x-4, -space-x-4, space-y-2, -space-y-2
  const spaceXMatch = baseClass.match(/^(-?)space-x-(.+)$/);
  if (spaceXMatch) {
    return {
      category: "space-x" as TokenCategory,
      value: spaceXMatch[1] + spaceXMatch[2],
      variants,
      baseClass,
    };
  }
  const spaceYMatch = baseClass.match(/^(-?)space-y-(.+)$/);
  if (spaceYMatch) {
    return {
      category: "space-y" as TokenCategory,
      value: spaceYMatch[1] + spaceYMatch[2],
      variants,
      baseClass,
    };
  }

  // Aspect ratio: aspect-square, aspect-video, etc.
  if (baseClass.startsWith("aspect-")) {
    return {
      category: "aspect-ratio" as TokenCategory,
      value: baseClass.replace("aspect-", ""),
      variants,
      baseClass,
    };
  }

  // content-* routing: CSS content property (`content-none`) first, then align-content values.
  // Tailwind reference:
  // - `content-none`  -> content: none
  // - `content-normal`, `content-center`, ... -> align-content: <value>
  // - `content-[...]` -> content: <arbitrary>
  if (baseClass.startsWith("content-") && !baseClass.startsWith("content-[")) {
    const contentVal = baseClass.replace("content-", "");
    if (contentVal === "none") {
      return cacheAndReturn({
        category: "content" as TokenCategory,
        value: contentVal,
        variants,
        baseClass,
      });
    }
    const alignContentValues = [
      "normal", "start", "end", "center",
      "between", "around", "evenly", "baseline", "stretch",
    ];
    if (alignContentValues.includes(contentVal)) {
      const cssValue = VALUE_GETTERS["align-content"]?.(contentVal);
      return cacheAndReturn({
        category: "align-content" as TokenCategory,
        value: contentVal,
        variants,
        baseClass,
        properties: cssValue ? { "align-content": cssValue } : undefined,
      });
    }
    // Other CSS content property values
    return cacheAndReturn({
      category: "content" as TokenCategory,
      value: contentVal,
      variants,
      baseClass,
    });
  }
  // Arbitrary content: content-['text']
  if (baseClass.startsWith("content-[")) {
    return cacheAndReturn({
      category: "content" as TokenCategory,
      value: baseClass.replace("content-", ""),
      variants,
      baseClass,
    });
  }

  // Interactivity utilities
  if (baseClass.startsWith("pointer-events-")) {
    return {
      category: "pointer-events" as TokenCategory,
      value: baseClass.replace("pointer-events-", ""),
      variants,
      baseClass,
    };
  }
  // Specific resize utilities: resize, resize-x, resize-y (check BEFORE general resize- pattern)
  if (baseClass === "resize") {
    return cacheAndReturn({
      category: "resize" as TokenCategory,
      value: "both",
      variants,
      baseClass,
    });
  }
  if (baseClass === "resize-x") {
    return cacheAndReturn({
      category: "resize" as TokenCategory,
      value: "horizontal",
      variants,
      baseClass,
    });
  }
  if (baseClass === "resize-y") {
    return cacheAndReturn({
      category: "resize" as TokenCategory,
      value: "vertical",
      variants,
      baseClass,
    });
  }

  if (baseClass.startsWith("resize-")) {
    return {
      category: "resize" as TokenCategory,
      value: baseClass.replace("resize-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("select-")) {
    return {
      category: "select" as TokenCategory,
      value: baseClass.replace("select-", ""),
      variants,
      baseClass,
    };
  }
  // Touch action: touch-auto, touch-none, touch-pan-x, touch-pan-y, touch-pan-up, touch-pan-down,
  // touch-pan-left, touch-pan-right, touch-pinch-zoom, touch-manipulation
  if (baseClass.startsWith("touch-")) {
    const touchValue = baseClass.replace("touch-", "");
    const validTouchValues = ["auto", "none", "pan-x", "pan-left", "pan-right", "pan-y", "pan-up", "pan-down", "pinch-zoom", "manipulation"];
    if (validTouchValues.includes(touchValue)) {
      return {
        category: "touch-action" as TokenCategory,
        value: touchValue,
        variants,
        baseClass,
      };
    }
  }
  if (baseClass.startsWith("user-select-")) {
    return {
      category: "user-select" as TokenCategory,
      value: baseClass.replace("user-select-", ""),
      variants,
      baseClass,
    };
  }

  // Special utilities
  if (baseClass === "sr-only") {
    return {
      category: "sr-only" as TokenCategory,
      value: "",
      variants,
      baseClass,
    };
  }
  if (baseClass === "not-sr-only") {
    return {
      category: "not-sr-only" as TokenCategory,
      value: "",
      variants,
      baseClass,
    };
  }

  // Filter utilities
  if (baseClass.startsWith("blur-")) {
    const value = baseClass.replace("blur-", "");
    const cssValue = VALUE_GETTERS["blur"]?.(value);
    return cacheAndReturn({
      category: "blur" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("brightness-")) {
    const value = baseClass.replace("brightness-", "");
    const cssValue = VALUE_GETTERS["brightness"]?.(value);
    return cacheAndReturn({
      category: "brightness" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("contrast-")) {
    const value = baseClass.replace("contrast-", "");
    const cssValue = VALUE_GETTERS["contrast"]?.(value);
    return cacheAndReturn({
      category: "contrast" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("grayscale-")) {
    const value = baseClass.replace("grayscale-", "");
    const cssValue = VALUE_GETTERS["grayscale"]?.(value);
    return cacheAndReturn({
      category: "grayscale" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  // Handle negative hue-rotate utilities: -hue-rotate-15, -hue-rotate-30, etc.
  if (baseClass.startsWith("-hue-rotate-")) {
    const value = baseClass.replace("-hue-rotate-", "");
    const cssValue = VALUE_GETTERS["hue-rotate"]?.(value);
    return cacheAndReturn({
      category: "hue-rotate" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("hue-rotate-")) {
    const value = baseClass.replace("hue-rotate-", "");
    const cssValue = VALUE_GETTERS["hue-rotate"]?.(value);
    return cacheAndReturn({
      category: "hue-rotate" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("invert-")) {
    const value = baseClass.replace("invert-", "");
    const cssValue = VALUE_GETTERS["invert"]?.(value);
    return cacheAndReturn({
      category: "invert" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("saturate-")) {
    const value = baseClass.replace("saturate-", "");
    const cssValue = VALUE_GETTERS["saturate"]?.(value);
    return cacheAndReturn({
      category: "saturate" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("sepia-")) {
    const value = baseClass.replace("sepia-", "");
    const cssValue = VALUE_GETTERS["sepia"]?.(value);
    return cacheAndReturn({
      category: "sepia" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }

  // Standalone filter utilities: invert, sepia, grayscale, blur
  if (baseClass === "invert") {
    const cssValue = VALUE_GETTERS["invert"]?.("invert");
    return cacheAndReturn({
      category: "invert" as TokenCategory,
      value: "invert",
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass === "sepia") {
    const cssValue = VALUE_GETTERS["sepia"]?.("sepia");
    return cacheAndReturn({
      category: "sepia" as TokenCategory,
      value: "sepia",
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("drop-shadow-")) {
    const value = baseClass.replace("drop-shadow-", "");
    const cssValue = VALUE_GETTERS["drop-shadow"]?.(value);
    return cacheAndReturn({
      category: "drop-shadow" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }

  // Standalone drop-shadow utility
  if (baseClass === "drop-shadow") {
    const cssValue = VALUE_GETTERS["drop-shadow"]?.("drop-shadow");
    return cacheAndReturn({
      category: "drop-shadow" as TokenCategory,
      value: "drop-shadow",
      variants,
      baseClass,
      properties: cssValue ? { filter: cssValue } : undefined,
    });
  }

  // Backdrop filter utilities
  if (baseClass.startsWith("backdrop-blur-")) {
    const value = baseClass.replace("backdrop-blur-", "");
    const cssValue = VALUE_GETTERS["backdrop-blur"]?.(value);
    return cacheAndReturn({
      category: "backdrop-blur" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-brightness-")) {
    const value = baseClass.replace("backdrop-brightness-", "");
    const cssValue = VALUE_GETTERS["backdrop-brightness"]?.(value);
    return cacheAndReturn({
      category: "backdrop-brightness" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-contrast-")) {
    const value = baseClass.replace("backdrop-contrast-", "");
    const cssValue = VALUE_GETTERS["backdrop-contrast"]?.(value);
    return cacheAndReturn({
      category: "backdrop-contrast" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass === "backdrop-grayscale") {
    const cssValue = VALUE_GETTERS["backdrop-grayscale"]?.("100");
    return cacheAndReturn({
      category: "backdrop-grayscale" as TokenCategory,
      value: "100",
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-grayscale-")) {
    const value = baseClass.replace("backdrop-grayscale-", "");
    const cssValue = VALUE_GETTERS["backdrop-grayscale"]?.(value);
    return cacheAndReturn({
      category: "backdrop-grayscale" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  // Handle negative backdrop-hue-rotate utilities: -backdrop-hue-rotate-15, -backdrop-hue-rotate-30, etc.
  if (baseClass.startsWith("-backdrop-hue-rotate-")) {
    const value = baseClass.replace("-backdrop-hue-rotate-", "");
    const cssValue = VALUE_GETTERS["backdrop-hue-rotate"]?.(value);
    return cacheAndReturn({
      category: "backdrop-hue-rotate" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-hue-rotate-")) {
    const value = baseClass.replace("backdrop-hue-rotate-", "");
    const cssValue = VALUE_GETTERS["backdrop-hue-rotate"]?.(value);
    return cacheAndReturn({
      category: "backdrop-hue-rotate" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-invert-")) {
    const value = baseClass.replace("backdrop-invert-", "");
    const cssValue = VALUE_GETTERS["backdrop-invert"]?.(value);
    return cacheAndReturn({
      category: "backdrop-invert" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-opacity-")) {
    const value = baseClass.replace("backdrop-opacity-", "");
    const cssValue = VALUE_GETTERS["backdrop-opacity"]?.(value);
    return cacheAndReturn({
      category: "backdrop-opacity" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-saturate-")) {
    const value = baseClass.replace("backdrop-saturate-", "");
    const cssValue = VALUE_GETTERS["backdrop-saturate"]?.(value);
    return cacheAndReturn({
      category: "backdrop-saturate" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("backdrop-sepia-")) {
    const value = baseClass.replace("backdrop-sepia-", "");
    const cssValue = VALUE_GETTERS["backdrop-sepia"]?.(value);
    return cacheAndReturn({
      category: "backdrop-sepia" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }

  // Standalone backdrop filter utilities: backdrop-invert, backdrop-sepia
  if (baseClass === "backdrop-invert") {
    const cssValue = VALUE_GETTERS["backdrop-invert"]?.("backdrop-invert");
    return cacheAndReturn({
      category: "backdrop-invert" as TokenCategory,
      value: "backdrop-invert",
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }
  if (baseClass === "backdrop-sepia") {
    const cssValue = VALUE_GETTERS["backdrop-sepia"]?.("backdrop-sepia");
    return cacheAndReturn({
      category: "backdrop-sepia" as TokenCategory,
      value: "backdrop-sepia",
      variants,
      baseClass,
      properties: cssValue ? { "backdrop-filter": cssValue } : undefined,
    });
  }

  // Scroll properties - Tailwind standard naming
  if (baseClass === "scroll-auto" || baseClass === "scroll-smooth") {
    return {
      category: "scroll-behavior" as TokenCategory,
      value: baseClass.replace("scroll-", ""),
      variants,
      baseClass,
    };
  }
  if (
    baseClass === "snap-none" ||
    baseClass === "snap-x" ||
    baseClass === "snap-y" ||
    baseClass === "snap-both" ||
    baseClass === "snap-x-proximity" ||
    baseClass === "snap-y-proximity" ||
    baseClass === "snap-both-proximity"
  ) {
    return {
      category: "scroll-snap-type" as TokenCategory,
      value: baseClass.replace("snap-", ""),
      variants,
      baseClass,
    };
  }
  if (
    baseClass === "snap-start" ||
    baseClass === "snap-end" ||
    baseClass === "snap-center" ||
    baseClass === "snap-align-none"
  ) {
    return {
      category: "scroll-snap-align" as TokenCategory,
      value: baseClass.replace("snap-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass === "snap-normal" || baseClass === "snap-always") {
    return {
      category: "scroll-snap-stop" as TokenCategory,
      value: baseClass.replace("snap-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scrollbar-gutter-")) {
    return {
      category: "scrollbar-gutter" as TokenCategory,
      value: baseClass.replace("scrollbar-gutter-", ""),
      variants,
      baseClass,
    };
  }
  if (
    baseClass === "scrollbar-thin" ||
    baseClass === "scrollbar-none" ||
    baseClass === "scrollbar-auto"
  ) {
    return {
      category: "scrollbar-width" as TokenCategory,
      value: baseClass.replace("scrollbar-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scrollbar-color-")) {
    return {
      category: "scrollbar-color" as TokenCategory,
      value: baseClass.replace("scrollbar-color-", ""),
      variants,
      baseClass,
    };
  }

  // Scroll spacing utilities
  // Scroll margin: scroll-m-4, -scroll-m-4, scroll-mt-4, -scroll-mt-4, …
  const scrollMarginMatch = baseClass.match(
    /^(-?)scroll-(mt|me|mb|ms|mx|my|m)-(.+)$/,
  );
  if (scrollMarginMatch) {
    const value = scrollMarginMatch[1] + scrollMarginMatch[3];
    const category = `scroll-${scrollMarginMatch[2]}` as TokenCategory;
    return {
      category,
      value,
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scroll-pt-")) {
    return {
      category: "scroll-pt" as TokenCategory,
      value: baseClass.replace("scroll-pt-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scroll-pe-")) {
    return {
      category: "scroll-pe" as TokenCategory,
      value: baseClass.replace("scroll-pe-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scroll-pb-")) {
    return {
      category: "scroll-pb" as TokenCategory,
      value: baseClass.replace("scroll-pb-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scroll-ps-")) {
    return {
      category: "scroll-ps" as TokenCategory,
      value: baseClass.replace("scroll-ps-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scroll-px-")) {
    return {
      category: "scroll-px" as TokenCategory,
      value: baseClass.replace("scroll-px-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scroll-py-")) {
    return {
      category: "scroll-py" as TokenCategory,
      value: baseClass.replace("scroll-py-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("scroll-p-")) {
    return {
      category: "scroll-p" as TokenCategory,
      value: baseClass.replace("scroll-p-", ""),
      variants,
      baseClass,
    };
  }

  // SVG properties
  if (baseClass.startsWith("stroke-width-")) {
    return {
      category: "stroke-width" as TokenCategory,
      value: baseClass.replace("stroke-width-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("stroke-linecap-")) {
    return {
      category: "stroke-linecap" as TokenCategory,
      value: baseClass.replace("stroke-linecap-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("stroke-linejoin-")) {
    return {
      category: "stroke-linejoin" as TokenCategory,
      value: baseClass.replace("stroke-linejoin-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("stroke-dasharray-")) {
    return {
      category: "stroke-dasharray" as TokenCategory,
      value: baseClass.replace("stroke-dasharray-", ""),
      variants,
      baseClass,
    };
  }

  // Table properties: border-collapse, border-separate
  if (baseClass === "border-collapse" || baseClass === "border-separate") {
    return {
      category: "border-collapse" as TokenCategory,
      value: baseClass.replace("border-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("border-spacing-")) {
    // border-spacing-x-*, border-spacing-y-* and border-spacing-* shorthand
    if (baseClass.startsWith("border-spacing-x-")) {
      return cacheAndReturn({
        category: "border-spacing-x" as TokenCategory,
        value: baseClass.replace("border-spacing-x-", ""),
        variants,
        baseClass,
      });
    }
    if (baseClass.startsWith("border-spacing-y-")) {
      return cacheAndReturn({
        category: "border-spacing-y" as TokenCategory,
        value: baseClass.replace("border-spacing-y-", ""),
        variants,
        baseClass,
      });
    }
    return cacheAndReturn({
      category: "border-spacing" as TokenCategory,
      value: baseClass.replace("border-spacing-", ""),
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("table-layout-")) {
    return {
      category: "table-layout" as TokenCategory,
      value: baseClass.replace("table-layout-", ""),
      variants,
      baseClass,
    };
  }
  // Also support table-auto, table-fixed as standalone utilities
  if (baseClass === "table-auto") {
    return cacheAndReturn({
      category: "table-layout" as TokenCategory,
      value: "auto",
      variants,
      baseClass,
    });
  }
  if (baseClass === "table-fixed") {
    return cacheAndReturn({
      category: "table-layout" as TokenCategory,
      value: "fixed",
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("caption-")) {
    const value = baseClass.replace("caption-", "");
    return cacheAndReturn({
      category: "caption-side" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // List properties
  if (baseClass.startsWith("list-style-type-")) {
    return cacheAndReturn({
      category: "list-style-type" as TokenCategory,
      value: baseClass.replace("list-style-type-", ""),
      variants,
      baseClass,
    });
  }

  // List style position: list-inside, list-outside
  if (baseClass === "list-inside" || baseClass === "list-outside") {
    return cacheAndReturn({
      category: "list-style-position" as TokenCategory,
      value: baseClass,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("list-style-position-")) {
    return cacheAndReturn({
      category: "list-style-position" as TokenCategory,
      value: baseClass.replace("list-style-position-", ""),
      variants,
      baseClass,
    });
  }

  // list-style-image (Tailwind: list-image-none; arbitrary list-image-[…] via useArbitraryValues)
  if (baseClass === "list-image-none") {
    return cacheAndReturn({
      category: "list-style-image" as TokenCategory,
      value: "none",
      variants,
      baseClass,
      properties: { "list-style-image": "none" },
    });
  }

  // List style shorthand — Tailwind core + IUI composable ordered suffix tokens.
  if (baseClass.startsWith("list-")) {
    const listRest = baseClass.slice("list-".length);

    if (LIST_ORDERED_SUFFIX_RE.test(listRest)) {
      return cacheAndReturn({
        category: "list-marker-suffix" as TokenCategory,
        value: listRest,
        variants,
        baseClass,
        properties: buildOrderedSuffixListProperties(
          listRest as OrderedListSuffix,
        ),
      });
    }

    if (LIST_ORDERED_SYSTEM_RE.test(listRest)) {
      return cacheAndReturn({
        category: "list-style-type-ordered" as TokenCategory,
        value: listRest,
        variants,
        baseClass,
        properties: buildOrderedSystemListProperties(
          listRest as OrderedListSystem,
        ),
      });
    }

    if (LIST_ORDERED_REST_RE.test(listRest)) {
      return cacheAndReturn({
        category: "list-style-type-ordered" as TokenCategory,
        value: listRest,
        variants,
        baseClass,
      });
    }
    if (LIST_UNORDERED_REST_RE.test(listRest)) {
      return cacheAndReturn({
        category: "list-style-type-unordered" as TokenCategory,
        value: listRest,
        variants,
        baseClass,
      });
    }
  }

  // Container queries (check before container sizing)
  if (baseClass.startsWith("container-type-")) {
    return {
      category: "container-type" as TokenCategory,
      value: baseClass.replace("container-type-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("container-name-")) {
    return {
      category: "container-name" as TokenCategory,
      value: baseClass.replace("container-name-", ""),
      variants,
      baseClass,
    };
  }

  // Sizing & Aspect Ratio
  if (baseClass.startsWith("container-")) {
    return {
      category: "container" as TokenCategory,
      value: baseClass.replace("container-", ""),
      variants,
      baseClass,
    };
  }
  // Also support standalone container
  if (baseClass === "container") {
    return {
      category: "container" as TokenCategory,
      value: "default",
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("object-fit-")) {
    return {
      category: "object-fit" as TokenCategory,
      value: baseClass.replace("object-fit-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("object-position-")) {
    return {
      category: "object-position" as TokenCategory,
      value: baseClass.replace("object-position-", ""),
      variants,
      baseClass,
    };
  }
  // Also support object utilities as standalone utilities
  if (baseClass === "object-cover") {
    return cacheAndReturn({
      category: "object-fit" as TokenCategory,
      value: "object-cover",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-contain") {
    return cacheAndReturn({
      category: "object-fit" as TokenCategory,
      value: "object-contain",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-fill") {
    return cacheAndReturn({
      category: "object-fit" as TokenCategory,
      value: "object-fill",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-none") {
    return cacheAndReturn({
      category: "object-fit" as TokenCategory,
      value: "object-none",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-scale-down") {
    return cacheAndReturn({
      category: "object-fit" as TokenCategory,
      value: "object-scale-down",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-center") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-center",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-bottom") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-bottom",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-start-top") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-start-top",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-start-bottom") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-start-bottom",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-end-top") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-end-top",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-end-bottom") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-end-bottom",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-start") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-start",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-end") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-end",
      variants,
      baseClass,
    });
  }
  if (baseClass === "object-top") {
    return cacheAndReturn({
      category: "object-position" as TokenCategory,
      value: "object-top",
      variants,
      baseClass,
    });
  }

  // Layout Break
  if (baseClass.startsWith("break-before-")) {
    return {
      category: "break-before" as TokenCategory,
      value: baseClass.replace("break-before-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("break-after-")) {
    return {
      category: "break-after" as TokenCategory,
      value: baseClass.replace("break-after-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("break-inside-")) {
    return {
      category: "break-inside" as TokenCategory,
      value: baseClass.replace("break-inside-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass === "break-all") {
    return cacheAndReturn({
      category: "word-break" as TokenCategory,
      value: "break-all",
      variants,
      baseClass,
    });
  }
  if (baseClass === "break-normal") {
    return cacheAndReturn({
      category: "word-break" as TokenCategory,
      value: "break-normal",
      variants,
      baseClass,
    });
  }

  // Columns
  if (baseClass.startsWith("columns-")) {
    return {
      category: "columns" as TokenCategory,
      value: baseClass.replace("columns-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("column-width-")) {
    return {
      category: "column-width" as TokenCategory,
      value: baseClass.replace("column-width-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("column-fill-")) {
    return {
      category: "column-fill" as TokenCategory,
      value: baseClass.replace("column-fill-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("column-gap-")) {
    return {
      category: "column-gap" as TokenCategory,
      value: baseClass.replace("column-gap-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("column-rule-type-")) {
    const value = baseClass.replace("column-rule-type-", "");
    const cssVal = (
      VALUE_GETTERS["column-rule-type"] as (v: string) => string | null
    )?.(value);
    return cacheAndReturn({
      category: "column-rule-type" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssVal ? { "column-rule-style": cssVal } : undefined,
    });
  }
  if (baseClass.startsWith("column-rule-color-")) {
    const colorTail = baseClass.replace("column-rule-color-", "");
    const opacityMatch = colorTail.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : colorTail;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    const cssValue = (
      VALUE_GETTERS["column-rule-color"] as (
        value: string,
        opacity?: string,
      ) => string | null
    )?.(colorName, opacity);
    return cacheAndReturn({
      category: "column-rule-color" as TokenCategory,
      value: colorName,
      variants,
      baseClass,
      properties: cssValue ? { "column-rule-color": cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("column-rule-")) {
    return {
      category: "column-rule" as TokenCategory,
      value: baseClass.replace("column-rule-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("column-span-")) {
    return {
      category: "column-span" as TokenCategory,
      value: baseClass.replace("column-span-", ""),
      variants,
      baseClass,
    };
  }

  // Box decoration break
  if (baseClass.startsWith("box-decoration-break-")) {
    return {
      category: "box-decoration-break" as TokenCategory,
      value: baseClass.replace("box-decoration-break-", ""),
      variants,
      baseClass,
    };
  }

  // Stacking / isolation (Tailwind: isolate, isolation-auto)
  if (baseClass === "isolate" || baseClass === "isolation-auto") {
    return cacheAndReturn({
      category: "isolation" as TokenCategory,
      value: baseClass === "isolate" ? "isolate" : "isolation-auto",
      variants,
      baseClass,
    });
  }

  // Will change
  if (baseClass.startsWith("will-change-")) {
    return {
      category: "will-change" as TokenCategory,
      value: baseClass.replace("will-change-", ""),
      variants,
      baseClass,
    };
  }

  // Forced colors
  if (baseClass.startsWith("forced-color-adjust-")) {
    return {
      category: "forced-color-adjust" as TokenCategory,
      value: baseClass.replace("forced-color-adjust-", ""),
      variants,
      baseClass,
    };
  }

  // inset-ring (Tailwind v4) — must run before inset-* positioning match captures "inset-ring"
  if (baseClass === "inset-ring") {
    return cacheAndReturn({
      category: "ring-width" as TokenCategory,
      value: "inset",
      variants,
      baseClass,
      properties: { "--iui-ring-inset": "inset" },
    });
  }

  // Inset utilities: inset-x-4, -inset-x-4, inset-y-4, -inset-y-4 (MUST be before general positioning rule)
  const insetXMatch = baseClass.match(/^(-?)inset-x-(.+)$/);
  if (insetXMatch) {
    return {
      category: "inset-x" as TokenCategory,
      value: insetXMatch[1] + insetXMatch[2],
      variants,
      baseClass,
    };
  }
  const insetYMatch = baseClass.match(/^(-?)inset-y-(.+)$/);
  if (insetYMatch) {
    return {
      category: "inset-y" as TokenCategory,
      value: insetYMatch[1] + insetYMatch[2],
      variants,
      baseClass,
    };
  }

  // Positioning utilities: top-4, -top-4, start-2, -start-2, inset-4, -inset-4, etc.
  const positionMatch = baseClass.match(
    /^(-?)(top|end|bottom|start|inset)-(.+)$/,
  );
  if (positionMatch) {
    const negative = positionMatch[1];
    const side = positionMatch[2];
    const rest = positionMatch[3];

    // Safety: inset-x / inset-y should be handled above; route if reached with a leading -
    if (side === "inset" && (rest.startsWith("x-") || rest.startsWith("y-"))) {
      const axis = rest.startsWith("x-") ? "inset-x" : "inset-y";
      return {
        category: axis as TokenCategory,
        value: negative + rest.replace(/^[xy]-/, ""),
        variants,
        baseClass,
      };
    }

    const value = negative + rest; // Preserve negative sign
    const category = side as TokenCategory;
    return { category, value, variants, baseClass };
  }

  // Z-index: z-10, -z-10, z-auto, etc.
  const zIndexMatch = baseClass.match(/^(-?)z-(.+)$/);
  if (zIndexMatch) {
    const negative = zIndexMatch[1];
    const value = negative + zIndexMatch[2]; // Preserve negative sign
    return { category: "z-index" as TokenCategory, value, variants, baseClass };
  }

  // Font stretch (Tailwind naming): font-stretch-ultra-condensed, font-stretch-50%, etc.
  if (baseClass.startsWith("font-stretch-")) {
    const value = baseClass.replace("font-stretch-", "");
    const cssValue = VALUE_GETTERS["font-stretch"]?.(value);
    if (!cssValue) {
      context.cache.set(className, null);
      return null;
    }
    return cacheAndReturn({
      category: "font-stretch" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: { "font-stretch": cssValue },
    });
  }

  // font-feature-* → font-feature-settings (before font-weight / font-family, which also use "font-")
  if (baseClass.startsWith("font-feature-")) {
    const value = baseClass.replace("font-feature-", "");
    const cssValue = VALUE_GETTERS["font-feature-settings"]?.(value);
    if (!cssValue) {
      context.cache.set(className, null);
      return null;
    }
    return cacheAndReturn({
      category: "font-feature-settings" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: { "font-feature-settings": cssValue },
    });
  }

  // Font weight and family: font-medium, font-bold, font-sans, etc.
  if (baseClass.startsWith("font-")) {
    const value = baseClass.replace("font-", "");
    // Tailwind-compatible inherit shorthand: reset font cascade from parent
    if (value === "inherit") {
      return cacheAndReturn({
        category: "font-family" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: { font: "inherit" },
      });
    }
    const weightNames = [
      "thin",
      "extralight",
      "light",
      "regular",
      "normal", // Tailwind alias for 400 (IUI semantic name is `regular`)
      "medium",
      "semibold",
      "bold",
      "extrabold",
      "black",
    ];
    if (weightNames.includes(value) || isTailwindFontWeightNumeric(value)) {
      const weightKey = value === "normal" ? "regular" : value;
      const cssValue = VALUE_GETTERS["font-weight"]?.(weightKey);
      return cacheAndReturn({
        category: "font-weight" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: cssValue ? { "font-weight": cssValue } : undefined,
      });
    }
    const cssValue = VALUE_GETTERS["font-family"]?.(value);
    return cacheAndReturn({
      category: "font-family" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "font-family": cssValue } : undefined,
    });
  }

  // Box sizing utilities: box-border, box-content
  if (baseClass === "box-border" || baseClass === "box-content") {
    const value = baseClass.replace("box-", "");
    return {
      category: "box-sizing" as TokenCategory,
      value,
      variants,
      baseClass,
    };
  }

  // Overflow utilities: overflow-hidden, overflow-x-auto, overflow-y-scroll, etc.
  // Axis-specific forms must resolve to overflow-x / overflow-y (same pattern as overscroll-*).
  if (baseClass.startsWith("overflow-")) {
    if (baseClass.startsWith("overflow-x-")) {
      return {
        category: "overflow-x" as TokenCategory,
        value: baseClass.replace("overflow-x-", ""),
        variants,
        baseClass,
      };
    }
    if (baseClass.startsWith("overflow-y-")) {
      return {
        category: "overflow-y" as TokenCategory,
        value: baseClass.replace("overflow-y-", ""),
        variants,
        baseClass,
      };
    }
    return {
      category: "overflow" as TokenCategory,
      value: baseClass.replace("overflow-", ""),
      variants,
      baseClass,
    };
  }

  // Special display value: none (check BEFORE general display pattern)
  if (baseClass === "none") {
    return cacheAndReturn({
      category: "none" as TokenCategory,
      value: "none",
      variants,
      baseClass,
    });
  }

  // Display utilities
  const displayValues = [
    "block",
    "inline-block",
    "inline",
    "flex",
    "inline-flex",
    "table",
    "inline-table",
    "table-caption",
    "table-cell",
    "table-column",
    "table-column-group",
    "table-footer-group",
    "table-header-group",
    "table-row-group",
    "table-row",
    "flow-root",
    "grid",
    "inline-grid",
    "contents",
    "list-item",
    "hidden",
  ];
  if (displayValues.includes(baseClass)) {
    const cssValue = VALUE_GETTERS["display"]?.(baseClass);
    return cacheAndReturn({
      category: "display" as TokenCategory,
      value: baseClass,
      variants,
      baseClass,
      properties: cssValue ? { display: cssValue } : undefined,
    });
  }

  // Position utilities: static, relative, absolute, fixed, sticky
  const positionValues = ["static", "relative", "absolute", "fixed", "sticky"];
  if (positionValues.includes(baseClass)) {
    const cssValue = VALUE_GETTERS["position"]?.(baseClass);
    return cacheAndReturn({
      category: "position" as TokenCategory,
      value: baseClass,
      variants,
      baseClass,
      properties: cssValue ? { position: cssValue } : undefined,
    });
  }

  // Float utilities (logical: float-start, float-end)
  if (baseClass.startsWith("float-")) {
    const value = baseClass.replace("float-", "");
    if (["start", "end", "none"].includes(value)) {
      const cssValue = VALUE_GETTERS["float"]?.(value);
      return cacheAndReturn({
        category: "float" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: cssValue ? { float: cssValue } : undefined,
      });
    }
  }

  // Clear utilities (logical: clear-start, clear-end)
  if (baseClass.startsWith("clear-")) {
    const value = baseClass.replace("clear-", "");
    if (["start", "end", "both", "none"].includes(value)) {
      const cssValue = VALUE_GETTERS["clear"]?.(value);
      return cacheAndReturn({
        category: "clear" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: cssValue ? { clear: cssValue } : undefined,
      });
    }
  }

  // Visibility utilities: visible, invisible, collapse
  if (
    baseClass === "visible" ||
    baseClass === "invisible" ||
    baseClass === "collapse"
  ) {
    const cssValue = VALUE_GETTERS["visibility"]?.(baseClass);
    return cacheAndReturn({
      category: "visibility" as TokenCategory,
      value: baseClass,
      variants,
      baseClass,
      properties: cssValue ? { visibility: cssValue } : undefined,
    });
  }

  // Flexbox utilities
  if (baseClass.startsWith("items-")) {
    const value = baseClass.replace("items-", "");
    const cssValue = VALUE_GETTERS["align-items"]?.(value);
    return cacheAndReturn({
      category: "align-items" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "align-items": cssValue } : undefined,
    });
  }

  // Flex grow/shrink utilities: grow, grow-0, shrink, shrink-0 (+ Tailwind flex-* aliases)
  if (baseClass === "grow" || baseClass === "grow-0" || baseClass === "flex-grow" || baseClass === "flex-grow-0") {
    const key =
      baseClass === "flex-grow"
        ? "grow"
        : baseClass === "flex-grow-0"
          ? "grow-0"
          : baseClass;
    const cssValue = VALUE_GETTERS["flex-grow"]?.(key);
    return cacheAndReturn({
      category: "flex-grow" as TokenCategory,
      value: key,
      variants,
      baseClass,
      properties: cssValue ? { "flex-grow": cssValue } : undefined,
    });
  }
  if (baseClass === "shrink" || baseClass === "shrink-0" || baseClass === "flex-shrink" || baseClass === "flex-shrink-0") {
    const key =
      baseClass === "flex-shrink"
        ? "shrink"
        : baseClass === "flex-shrink-0"
          ? "shrink-0"
          : baseClass;
    const cssValue = VALUE_GETTERS["flex-shrink"]?.(key);
    return cacheAndReturn({
      category: "flex-shrink" as TokenCategory,
      value: key,
      variants,
      baseClass,
      properties: cssValue ? { "flex-shrink": cssValue } : undefined,
    });
  }

  // Order utilities: order-1, order-2, order-first, order-last, order-none, -order-1, -order-2
  if (baseClass.startsWith("order-")) {
    const value = baseClass.replace("order-", "");
    const cssValue = VALUE_GETTERS["order"]?.(value);
    return cacheAndReturn({
      category: "order" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { order: cssValue } : undefined,
    });
  }
  if (baseClass.startsWith("-order-")) {
    const value = "-" + baseClass.replace("-order-", "");
    const cssValue = VALUE_GETTERS["order"]?.(value);
    return cacheAndReturn({
      category: "order" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { order: cssValue } : undefined,
    });
  }

  // Align self utilities: self-auto, self-start, self-end, self-center, self-stretch
  if (baseClass.startsWith("self-")) {
    const value = baseClass.replace("self-", "");
    const cssValue = VALUE_GETTERS["align-self"]?.(value);
    return cacheAndReturn({
      category: "align-self" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "align-self": cssValue } : undefined,
    });
  }

  // Justify items (grid): justify-items-start, justify-items-center, justify-items-end, justify-items-stretch
  if (baseClass.startsWith("justify-items-")) {
    const value = baseClass.replace("justify-items-", "");
    const cssValue = VALUE_GETTERS["justify-items"]?.(value);
    if (!cssValue) {
      return cacheAndReturn(null);
    }
    return cacheAndReturn({
      category: "justify-items" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: { "justify-items": cssValue },
    });
  }
  // Justify self: justify-self-auto, justify-self-start, justify-self-center, justify-self-end, justify-self-stretch
  if (baseClass.startsWith("justify-self-")) {
    const value = baseClass.replace("justify-self-", "");
    const cssValue = VALUE_GETTERS["justify-self"]?.(value);
    if (!cssValue) {
      return cacheAndReturn(null);
    }
    return cacheAndReturn({
      category: "justify-self" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: { "justify-self": cssValue },
    });
  }
  // Justify content (flex/grid): justify-start, justify-center, …
  if (baseClass.startsWith("justify-")) {
    const value = baseClass.replace("justify-", "");
    const cssValue = VALUE_GETTERS["justify-content"]?.(value);
    if (!cssValue) {
      return cacheAndReturn(null);
    }
    return cacheAndReturn({
      category: "justify-content" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: { "justify-content": cssValue },
    });
  }

  // content-* is fully handled earlier in the parser (align-content + CSS content)

  // Place content utilities: place-content-start, place-content-end, place-content-center, place-content-between, place-content-around, place-content-evenly
  if (baseClass.startsWith("place-content-")) {
    const value = baseClass.replace("place-content-", "");
    const cssValue = VALUE_GETTERS["place-content"]?.(value);
    return cacheAndReturn({
      category: "place-content" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "place-content": cssValue } : undefined,
    });
  }

  // Place items utilities: place-items-start, place-items-end, place-items-center, place-items-stretch
  if (baseClass.startsWith("place-items-")) {
    const value = baseClass.replace("place-items-", "");
    const cssValue = VALUE_GETTERS["place-items"]?.(value);
    return cacheAndReturn({
      category: "place-items" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "place-items": cssValue } : undefined,
    });
  }

  // Place self utilities: place-self-auto, place-self-start, place-self-end, place-self-center, place-self-stretch
  if (baseClass.startsWith("place-self-")) {
    const value = baseClass.replace("place-self-", "");
    const cssValue = VALUE_GETTERS["place-self"]?.(value);
    return cacheAndReturn({
      category: "place-self" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "place-self": cssValue } : undefined,
    });
  }

  // Gap utilities: gap, gap-x, gap-y
  if (baseClass.startsWith("gap-")) {
    if (baseClass.startsWith("gap-x-")) {
      const value = baseClass.replace("gap-x-", "");
      const cssValue = VALUE_GETTERS["gap-x"]?.(value);
      return cacheAndReturn({
        category: "gap-x" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: cssValue ? { "column-gap": cssValue } : undefined,
      });
    } else if (baseClass.startsWith("gap-y-")) {
      const value = baseClass.replace("gap-y-", "");
      const cssValue = VALUE_GETTERS["gap-y"]?.(value);
      return cacheAndReturn({
        category: "gap-y" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: cssValue ? { "row-gap": cssValue } : undefined,
      });
    } else {
      const value = baseClass.replace("gap-", "");
      const cssValue = VALUE_GETTERS["gap"]?.(value);
      return cacheAndReturn({
        category: "gap" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: cssValue ? { gap: cssValue } : undefined,
      });
    }
  }

  // Single gap
  if (baseClass === "gap") {
    const cssValue = VALUE_GETTERS["gap"]?.("1");
    return cacheAndReturn({
      category: "gap" as TokenCategory,
      value: "1",
      variants,
      baseClass,
      properties: cssValue ? { gap: cssValue } : undefined,
    });
  }

  // Grid utilities: grid-cols-3, grid-rows-2, col-span-2, row-span-2, etc.
  if (baseClass.startsWith("grid-cols-")) {
    return {
      category: "grid-template-columns" as TokenCategory,
      value: baseClass.replace("grid-cols-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("grid-rows-")) {
    return {
      category: "grid-template-rows" as TokenCategory,
      value: baseClass.replace("grid-rows-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("col-span-")) {
    return {
      category: "grid-column" as TokenCategory,
      value: baseClass.replace("col-span-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("row-span-")) {
    return {
      category: "grid-row" as TokenCategory,
      value: baseClass.replace("row-span-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("col-start-")) {
    return {
      category: "grid-column-start" as TokenCategory,
      value: baseClass.replace("col-start-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("col-end-")) {
    return {
      category: "grid-column-end" as TokenCategory,
      value: baseClass.replace("col-end-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("row-start-")) {
    return {
      category: "grid-row-start" as TokenCategory,
      value: baseClass.replace("row-start-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("row-end-")) {
    return {
      category: "grid-row-end" as TokenCategory,
      value: baseClass.replace("row-end-", ""),
      variants,
      baseClass,
    };
  }
  if (baseClass.startsWith("grid-flow-")) {
    const value = baseClass.replace("grid-flow-", "");
    return cacheAndReturn({
      category: "grid-auto-flow" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("auto-cols-")) {
    const value = baseClass.replace("auto-cols-", "");
    return cacheAndReturn({
      category: "grid-auto-columns" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("auto-rows-")) {
    const value = baseClass.replace("auto-rows-", "");
    return cacheAndReturn({
      category: "grid-auto-rows" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  // Tailwind-style basis-* (e.g. basis-auto, basis-full, basis-1/2, basis-4, basis-sm)
  if (baseClass.startsWith("basis-")) {
    const value = baseClass.replace("basis-", "");
    const cssValue = VALUE_GETTERS["flex-basis"]?.(value);
    return cacheAndReturn({
      category: "flex-basis" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "flex-basis": cssValue } : undefined,
    });
  }

  if (baseClass.startsWith("flex-")) {
    if (COMPILED_PATTERNS.FLEX_DIRECTION.test(baseClass)) {
      return cacheAndReturn({
        category: "flex-direction" as TokenCategory,
        value: baseClass.replace("flex-", ""),
        variants,
        baseClass,
      });
    }
    if (COMPILED_PATTERNS.FLEX_WRAP.test(baseClass)) {
      return cacheAndReturn({
        category: "flex-wrap" as TokenCategory,
        value: baseClass.replace("flex-", ""),
        variants,
        baseClass,
      });
    }
    if (COMPILED_PATTERNS.FLEX_VALUE.test(baseClass)) {
      return cacheAndReturn({
        category: "flex" as TokenCategory,
        value: baseClass.replace("flex-", ""),
        variants,
        baseClass,
      });
    }
  }

  // Handle grow/shrink
  if (COMPILED_PATTERNS.FLEX_GROW.test(baseClass)) {
    return cacheAndReturn({
      category: "grow" as TokenCategory,
      value: baseClass.replace("grow-", ""),
      variants,
      baseClass,
    });
  }
  if (COMPILED_PATTERNS.FLEX_SHRINK.test(baseClass)) {
    return cacheAndReturn({
      category: "shrink" as TokenCategory,
      value: baseClass.replace("shrink-", ""),
      variants,
      baseClass,
    });
  }

  // Transitions
  // Transition behavior (Tailwind v4): transition-normal, transition-discrete — must precede generic `transition*`.
  if (baseClass === "transition-normal" || baseClass === "transition-discrete") {
    const value = baseClass === "transition-normal" ? "normal" : "allow-discrete";
    return cacheAndReturn({
      category: "transition-behavior" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("transition")) {
    const value =
      baseClass === "transition"
        ? "default"
        : baseClass.replace("transition-", "");
    return cacheAndReturn({
      category: "transition-property" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Transition delay: delay-75, delay-100, etc.
  if (baseClass.startsWith("delay-")) {
    return cacheAndReturn({
      category: "transition-delay" as TokenCategory,
      value: baseClass.replace("delay-", ""),
      variants,
      baseClass,
    });
  }

  // Animations: animate-none, animate-spin, animate-ping, etc.
  if (baseClass.startsWith("animate-")) {
    const value = baseClass.replace("animate-", "");

    // Animation duration: animate-duration-75, animate-duration-100, etc.
    if (value.startsWith("duration-")) {
      const durationValue = value.replace("duration-", "");
      const cssValue = VALUE_GETTERS["animation-duration"]?.(durationValue);
      return cacheAndReturn({
        category: "animation-duration" as TokenCategory,
        value: durationValue,
        variants,
        baseClass,
        properties: cssValue ? { "animation-duration": cssValue } : undefined,
      });
    }

    // Animation delay: animate-delay-75, animate-delay-100, etc.
    if (value.startsWith("delay-")) {
      const delayValue = value.replace("delay-", "");
      const cssValue = VALUE_GETTERS["animation-delay"]?.(delayValue);
      return cacheAndReturn({
        category: "animation-delay" as TokenCategory,
        value: delayValue,
        variants,
        baseClass,
        properties: cssValue ? { "animation-delay": cssValue } : undefined,
      });
    }

    // Animation iteration: animate-iteration-2, animate-iteration-infinite, etc.
    if (value.startsWith("iteration-")) {
      const iterationValue = value.replace("iteration-", "");
      return cacheAndReturn({
        category: "animation-iteration-count" as TokenCategory,
        value: iterationValue,
        variants,
        baseClass,
        properties: {
          "animation-iteration-count":
            iterationValue === "infinite" ? "infinite" : iterationValue,
        },
      });
    }

    // Animation direction: animate-direction-reverse, animate-direction-alternate, etc.
    if (value.startsWith("direction-")) {
      const directionValue = value.replace("direction-", "");
      return cacheAndReturn({
        category: "animation-direction" as TokenCategory,
        value: directionValue,
        variants,
        baseClass,
        properties: { "animation-direction": directionValue },
      });
    }

    // Animation fill mode: animate-fill-forwards, animate-fill-backwards, etc.
    if (value.startsWith("fill-")) {
      const fillValue = value.replace("fill-", "");
      return cacheAndReturn({
        category: "animation-fill-mode" as TokenCategory,
        value: fillValue,
        variants,
        baseClass,
        properties: { "animation-fill-mode": fillValue },
      });
    }

    // Animation play state: animate-play-paused, animate-play-running, etc.
    if (value.startsWith("play-")) {
      const playValue = value.replace("play-", "");
      return cacheAndReturn({
        category: "animation-play-state" as TokenCategory,
        value: playValue,
        variants,
        baseClass,
        properties: { "animation-play-state": playValue },
      });
    }

    // Animation timing: animate-ease-linear, animate-ease-in, etc.
    if (value.startsWith("ease-")) {
      const easeValue = value.replace("ease-", "");
      const cssVal =
        VALUE_GETTERS["animation-timing-function"]?.(easeValue) ?? easeValue;
      return cacheAndReturn({
        category: "animation-timing-function" as TokenCategory,
        value: easeValue,
        variants,
        baseClass,
        properties: {
          "animation-timing-function": cssVal,
        },
      });
    }

    // Basic animations: animate-none, animate-spin, animate-ping, etc.
    // Note: Animation keyframes are injected by AnimationKeyframesManager
    if (value === "none") {
      return cacheAndReturn({
        category: "animation" as TokenCategory,
        value,
        variants,
        baseClass,
        properties: { animation: "none" },
      });
    }

    const cssValue = VALUE_GETTERS["animation"]?.(value);
    return cacheAndReturn({
      category: "animation" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue
        ? animationShorthandToLonghands(cssValue)
        : undefined,
    });
  }

  // Background blend mode (Tailwind: bg-blend-normal, bg-blend-multiply, etc.)
  if (baseClass.startsWith("bg-blend-")) {
    const value = baseClass.replace("bg-blend-", "");
    return cacheAndReturn({
      category: "background-blend-mode" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Text shadow: text-shadow (default), text-shadow-none, text-shadow-sm, text-shadow-md, text-shadow-lg
  if (baseClass === "text-shadow") {
    return cacheAndReturn({
      category: "text-shadow" as TokenCategory,
      value: "default",
      variants,
      baseClass,
    });
  }
  if (baseClass.startsWith("text-shadow-")) {
    const value = baseClass.replace("text-shadow-", "");
    return cacheAndReturn({
      category: "text-shadow" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  // Mask utilities (Tailwind naming)
  if (baseClass === "mask-no-clip") {
    return cacheAndReturn({ category: "mask-clip" as TokenCategory, value: "no-clip", variants, baseClass });
  }
  if (baseClass.startsWith("mask-clip-")) {
    return cacheAndReturn({ category: "mask-clip" as TokenCategory, value: baseClass.replace("mask-clip-", ""), variants, baseClass });
  }
  if (baseClass.startsWith("mask-composite-")) {
    return cacheAndReturn({ category: "mask-composite" as TokenCategory, value: baseClass.replace("mask-composite-", ""), variants, baseClass });
  }
  if (baseClass.startsWith("mask-image-")) {
    return cacheAndReturn({ category: "mask-image" as TokenCategory, value: baseClass.replace("mask-image-", ""), variants, baseClass });
  }
  if (baseClass.startsWith("mask-origin-")) {
    return cacheAndReturn({ category: "mask-origin" as TokenCategory, value: baseClass.replace("mask-origin-", ""), variants, baseClass });
  }
  // mask-position: Tailwind uses mask-top, mask-center, etc. and mask-position-[value]
  const maskPositionShortcuts: Record<string, string> = {
    "mask-top": "top",
    "mask-top-start": "top-start",
    "mask-top-end": "top-end",
    "mask-ts": "top-start",
    "mask-te": "top-end",
    "mask-start": "start",
    "mask-center": "center",
    "mask-end": "end",
    "mask-bottom": "bottom",
    "mask-bottom-start": "bottom-start",
    "mask-bottom-end": "bottom-end",
    "mask-bs": "bottom-start",
    "mask-be": "bottom-end",
  };
  if (maskPositionShortcuts[baseClass]) {
    return cacheAndReturn({ category: "mask-position" as TokenCategory, value: maskPositionShortcuts[baseClass], variants, baseClass });
  }
  if (baseClass.startsWith("mask-position-")) {
    return cacheAndReturn({ category: "mask-position" as TokenCategory, value: baseClass.replace("mask-position-", ""), variants, baseClass });
  }
  // mask-repeat: Tailwind uses mask-repeat, mask-no-repeat, mask-repeat-x, mask-repeat-y, mask-repeat-space, mask-repeat-round
  if (baseClass === "mask-repeat") {
    return cacheAndReturn({ category: "mask-repeat" as TokenCategory, value: "repeat", variants, baseClass });
  }
  if (baseClass === "mask-no-repeat") {
    return cacheAndReturn({ category: "mask-repeat" as TokenCategory, value: "no-repeat", variants, baseClass });
  }
  if (baseClass === "mask-repeat-x") {
    return cacheAndReturn({ category: "mask-repeat" as TokenCategory, value: "repeat-x", variants, baseClass });
  }
  if (baseClass === "mask-repeat-y") {
    return cacheAndReturn({ category: "mask-repeat" as TokenCategory, value: "repeat-y", variants, baseClass });
  }
  if (baseClass === "mask-repeat-space") {
    return cacheAndReturn({ category: "mask-repeat" as TokenCategory, value: "space", variants, baseClass });
  }
  if (baseClass === "mask-repeat-round") {
    return cacheAndReturn({ category: "mask-repeat" as TokenCategory, value: "round", variants, baseClass });
  }
  if (baseClass.startsWith("mask-repeat-")) {
    return cacheAndReturn({ category: "mask-repeat" as TokenCategory, value: baseClass.replace("mask-repeat-", ""), variants, baseClass });
  }
  if (baseClass.startsWith("mask-size-")) {
    return cacheAndReturn({ category: "mask-size" as TokenCategory, value: baseClass.replace("mask-size-", ""), variants, baseClass });
  }
  if (baseClass.startsWith("mask-type-")) {
    return cacheAndReturn({ category: "mask-type" as TokenCategory, value: baseClass.replace("mask-type-", ""), variants, baseClass });
  }
  if (baseClass === "mask-luminance" || baseClass === "mask-alpha") {
    return cacheAndReturn({ category: "mask-mode" as TokenCategory, value: baseClass.replace("mask-", ""), variants, baseClass });
  }
  // Mix blend mode: mix-blend-normal, mix-blend-multiply, etc. (value = part after mix-blend-)
  if (baseClass.startsWith("mix-blend-")) {
    return cacheAndReturn({
      category: "mix-blend-mode" as TokenCategory,
      value: baseClass.replace("mix-blend-", ""),
      variants,
      baseClass,
    });
  }

  // Default filter values: blur, grayscale, backdrop-blur
  if (baseClass === "blur") {
    return cacheAndReturn({
      category: "blur" as TokenCategory,
      value: "blur",
      variants,
      baseClass,
    });
  }
  if (baseClass === "grayscale") {
    return cacheAndReturn({
      category: "grayscale" as TokenCategory,
      value: "grayscale",
      variants,
      baseClass,
    });
  }
  if (baseClass === "backdrop-blur") {
    return cacheAndReturn({
      category: "backdrop-blur" as TokenCategory,
      value: "backdrop-blur",
      variants,
      baseClass,
    });
  }

  // Duration
  if (baseClass.startsWith("duration-")) {
    return {
      category: "transition-duration" as TokenCategory,
      value: baseClass.replace("duration-", ""),
      variants,
      baseClass,
    };
  }

  // Ease
  if (baseClass.startsWith("ease-")) {
    const timingValue = baseClass.replace("ease-", "");
    // Prevent accidental double-prefix classes like `ease-ease-in-out`
    if (timingValue.startsWith("ease-")) return null;
    return {
      category: "transition-timing" as TokenCategory,
      value: timingValue,
      variants,
      baseClass,
    };
  }

  // Transform utilities with negative support — scale uses shared --iui-* transform recipe
  const scaleMatch = baseClass.match(/^(-?)scale-(x-|y-)?(.+)$/);
  if (scaleMatch) {
    const negative = scaleMatch[1];
    const axis = scaleMatch[2];
    const value = negative + scaleMatch[3]; // Preserve negative sign

    if (axis === "x-") {
      const category = "scale-x" as TokenCategory;
      const cssValue = VALUE_GETTERS["scale-x"]?.(value as string);
      if (!cssValue || typeof cssValue !== "string") {
        return { category, value, variants, baseClass };
      }
      const innerMatch = cssValue.match(/^scaleX\((.+)\)$/);
      const axisVal = innerMatch ? innerMatch[1] : cssValue;
      return {
        category,
        value,
        variants,
        baseClass,
        properties: {
          "--iui-scale-x": axisVal,
          transform: IUI_TRANSFORM_VAR_TEMPLATE,
        },
      };
    }
    if (axis === "y-") {
      const category = "scale-y" as TokenCategory;
      const cssValue = VALUE_GETTERS["scale-y"]?.(value as string);
      if (!cssValue || typeof cssValue !== "string") {
        return { category, value, variants, baseClass };
      }
      const innerMatch = cssValue.match(/^scaleY\((.+)\)$/);
      const axisVal = innerMatch ? innerMatch[1] : cssValue;
      return {
        category,
        value,
        variants,
        baseClass,
        properties: {
          "--iui-scale-y": axisVal,
          transform: IUI_TRANSFORM_VAR_TEMPLATE,
        },
      };
    }
    const category = "scale" as TokenCategory;
    const cssValue = VALUE_GETTERS["scale"]?.(value as string);
    if (!cssValue || typeof cssValue !== "string") {
      return { category, value, variants, baseClass };
    }
    const innerMatch = cssValue.match(/^scale\((.+)\)$/);
    const uniform = innerMatch ? innerMatch[1] : cssValue;
    return {
      category,
      value,
      variants,
      baseClass,
      properties: {
        "--iui-scale-x": uniform,
        "--iui-scale-y": uniform,
        transform: IUI_TRANSFORM_VAR_TEMPLATE,
      },
    };
  }

  // Rotate X/Y (3D): compose via vars like translate-x/y so both classes apply together.
  const rotateXYMatch = baseClass.match(/^(-?)rotate-([xy])-(.+)$/);
  if (rotateXYMatch) {
    const negative = rotateXYMatch[1];
    const axis = rotateXYMatch[2] as "x" | "y";
    const value = negative + rotateXYMatch[3];
    const category = `rotate-${axis}` as TokenCategory;
    const cssValue = VALUE_GETTERS[category]?.(value as string);
    if (!cssValue || typeof cssValue !== "string") {
      return { category, value, variants, baseClass };
    }
    const innerMatch = cssValue.match(/^rotate([XY])\((.+)\)$/);
    const angle = innerMatch ? innerMatch[2] : cssValue;
    return {
      category,
      value,
      variants,
      baseClass,
      properties: {
        [`--iui-rotate-${axis}`]: angle,
        transform: IUI_TRANSFORM_VAR_TEMPLATE,
      },
    };
  }

  // Rotate (2D plane): rotateZ + shared transform recipe (not rotate-x- / rotate-y-)
  const rotateMatch = baseClass.match(/^(-?)rotate-(.+)$/);
  if (rotateMatch) {
    const negative = rotateMatch[1];
    const value = negative + rotateMatch[2]; // Preserve negative sign
    const category = "rotate" as TokenCategory;
    const cssValue = VALUE_GETTERS["rotate"]?.(value as string);
    if (!cssValue || typeof cssValue !== "string") {
      return { category, value, variants, baseClass };
    }
    const innerMatch = cssValue.match(/^rotate\((.+)\)$/);
    const angle = innerMatch ? innerMatch[1] : cssValue;
    return {
      category,
      value,
      variants,
      baseClass,
      properties: {
        "--iui-rotate-z": angle,
        transform: IUI_TRANSFORM_VAR_TEMPLATE,
      },
    };
  }

  // Translate transforms: translate-x-4, -translate-x-4
  const translateMatch = baseClass.match(/^(-?)translate-([xy])-(.+)$/);
  if (translateMatch) {
    const negative = translateMatch[1];
    const axis = translateMatch[2];
    const value = negative + translateMatch[3]; // Preserve negative sign
    const category = `translate-${axis}` as TokenCategory;
    const cssValue = VALUE_GETTERS[category]?.(value);
    if (!cssValue) return { category, value, variants, baseClass };

    // Compose translate-x + translate-y through vars so both utilities can
    // coexist without relying on optimizer-generated combination selectors.
    // Examples:
    // - translate-x-5 sets --iui-translate-x and emits transform using both vars
    // - -translate-y-0.5 sets --iui-translate-y and emits same transform expression
    // Since both utilities emit the same transform expression, whichever class
    // wins source order still reads BOTH vars from the cascade.
    const innerMatch = cssValue.match(/^translate[XY]\((.+)\)$/);
    const axisValue = innerMatch ? innerMatch[1] : cssValue;
    return {
      category,
      value,
      variants,
      baseClass,
      properties: {
        [`--iui-translate-${axis}`]: axisValue,
        transform: IUI_TRANSFORM_VAR_TEMPLATE,
      },
    };
  }

  // Skew transforms: skew-x-12, -skew-x-12 — shared --iui-* transform recipe
  const skewMatch = baseClass.match(/^(-?)skew-([xy])-(.+)$/);
  if (skewMatch) {
    const negative = skewMatch[1];
    const axis = skewMatch[2];
    const value = negative + skewMatch[3]; // Preserve negative sign
    const category = `skew-${axis}` as TokenCategory;
    const cssValue = VALUE_GETTERS[category]?.(value as string);
    if (!cssValue || typeof cssValue !== "string") {
      return { category, value, variants, baseClass };
    }
    const innerMatch = cssValue.match(/^skew([XY])\((.+)\)$/);
    const angle = innerMatch ? innerMatch[2] : cssValue;
    return {
      category,
      value,
      variants,
      baseClass,
      properties: {
        [`--iui-skew-${axis}`]: angle,
        transform: IUI_TRANSFORM_VAR_TEMPLATE,
      },
    };
  }

  // Transform origin: origin-center, origin-top, origin-top-end, etc.
  if (baseClass.startsWith("origin-")) {
    return cacheAndReturn({
      category: "transform-origin" as TokenCategory,
      value: baseClass.replace("origin-", ""),
      variants,
      baseClass,
    });
  }
  // Transform style: style-flat, style-preserve-3d
  if (
    baseClass === "style-flat" ||
    baseClass === "style-preserve-3d"
  ) {
    const value = baseClass === "style-preserve-3d" ? "preserve-3d" : "flat";
    return cacheAndReturn({
      category: "transform-style" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  // Backface visibility: backface-visible, backface-hidden
  if (baseClass.startsWith("backface-")) {
    const value = baseClass.replace("backface-", "");
    return cacheAndReturn({
      category: "backface-visibility" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  // Perspective origin BEFORE generic perspective-*: names share the "perspective-" prefix.
  if (baseClass.startsWith("perspective-origin-")) {
    const value = baseClass.replace("perspective-origin-", "");
    return cacheAndReturn({
      category: "perspective-origin" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }
  // Perspective: perspective-none, perspective-100, perspective-200, etc.
  if (baseClass.startsWith("perspective-")) {
    const value = baseClass.replace("perspective-", "");
    return cacheAndReturn({
      category: "perspective" as TokenCategory,
      value,
      variants,
      baseClass,
    });
  }

  // Shadow
  if (baseClass.startsWith("shadow")) {
    // Check for directional shadow colors first: shadow-t-red-500, shadow-e-blue-600, etc.
    const directionalColorMatch = baseClass.match(/^shadow-([tbes])-(.+)$/);
    if (directionalColorMatch) {
      const direction = directionalColorMatch[1];
      const colorValue = directionalColorMatch[2];
      if (isColorTokenWithOptionalOpacity(colorValue)) {
        return {
          category: `shadow-${direction}-color` as TokenCategory,
          value: colorValue,
          variants,
          baseClass,
        };
      }
    }

    // Check for directional shadow sizes: shadow-t-md, shadow-e-lg, etc.
    const directionalSizeMatch = baseClass.match(
      /^shadow-([tbes])-(2xs|xs|sm|md|lg|xl|2xl|none)$/,
    );

    if (directionalSizeMatch) {
      const direction = directionalSizeMatch[1];
      const sizeValue = directionalSizeMatch[2];
      return {
        category: `shadow-${direction}` as TokenCategory,
        value: sizeValue,
        variants,
        baseClass,
      };
    }

    const value =
      baseClass === "shadow" ? "default" : baseClass.replace("shadow-", "");

    // Check if it's a shadow color: shadow-red-500, shadow-brand-300, shadow-bros-600, etc.
    if (isColorTokenWithOptionalOpacity(value)) {
      return {
        category: "shadow-color" as TokenCategory,
        value,
        variants,
        baseClass,
      };
    }

    // Otherwise it's a shadow size
    return {
      category: "box-shadow" as TokenCategory,
      value,
      variants,
      baseClass,
    };
  }

  // Opacity
  if (baseClass.startsWith("opacity-")) {
    return {
      category: "opacity" as TokenCategory,
      value: baseClass.replace("opacity-", ""),
      variants,
      baseClass,
    };
  }

  // Cursor
  if (baseClass.startsWith("cursor-")) {
    return {
      category: "cursor" as TokenCategory,
      value: baseClass.replace("cursor-", ""),
      variants,
      baseClass,
    };
  }

  // Ring utilities
  // Check for negative ring-offset FIRST (BEFORE ring-offset- check) - Tailwind CSS standard: -ring-offset-2
  // This must be checked before baseClass.startsWith('ring-offset-') because -ring-offset-2 starts with '-', not 'ring-offset-'
  // Also handles variants like focus:-ring-offset-2 where the variant parser preserves the negative prefix
  if (baseClass.startsWith("-ring-offset-")) {
    // Handle negative prefix: -ring-offset-2 becomes ring-offset-width with value -2 (Tailwind CSS standard)
    const offsetValue = baseClass.replace("-ring-offset-", "");
    // Validate that it's a numeric value (not a color)
    if (/^\d+(\.\d+)?$/.test(offsetValue)) {
      return cacheAndReturn({
        category: "ring-offset-width" as TokenCategory,
        value: "-" + offsetValue,
        variants,
        baseClass,
      });
    }
    // If not numeric, it might be a color (shouldn't happen with negative, but handle gracefully)
    return null;
  }

  if (baseClass.startsWith("ring-offset-")) {
    const offsetValue = baseClass.replace("ring-offset-", "");

    // ring-offset-width: ring-offset-2, ring-offset-4, etc.
    if (/^\d+(\.\d+)?$/.test(offsetValue)) {
      return {
        category: "ring-offset-width" as TokenCategory,
        value: offsetValue,
        variants,
        baseClass,
      };
    }

    // ring-offset-color: ring-offset-brand-500, ring-offset-bros-600, ring-offset-brand-500/40
    if (isColorTokenWithOptionalOpacity(offsetValue)) {
      return {
        category: "ring-offset-color" as TokenCategory,
        value: offsetValue,
        variants,
        baseClass,
      };
    }

    // If not numeric and not a color token, return null
    return null;
  }

  // Block logical ring (Tailwind v4 naming): ring-bs-* ≈ ring-t-*, ring-be-* ≈ ring-b-*
  {
    const bs = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-bs-",
      "ring-bs",
      variants,
    );
    if (bs) return bs;
  }
  {
    const be = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-be-",
      "ring-be",
      variants,
    );
    if (be) return be;
  }

  // Axis / logical ring (ring-s/e = inline start/end; ring-x/y = both sides)
  {
    const rx = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-x-",
      "ring-x",
      variants,
    );
    if (rx) return rx;
  }
  {
    const ry = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-y-",
      "ring-y",
      variants,
    );
    if (ry) return ry;
  }
  {
    const rs = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-s-",
      "ring-s",
      variants,
    );
    if (rs) return rs;
  }
  {
    const re = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-e-",
      "ring-e",
      variants,
    );
    if (re) return re;
  }

  // Directional ring utilities: ring-t-*, ring-b-*
  {
    const rt = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-t-",
      "ring-t",
      variants,
    );
    if (rt) return rt;
  }
  {
    const rb = parseDirectionalRingWithOptionalColor(
      baseClass,
      "ring-b-",
      "ring-b",
      variants,
    );
    if (rb) return rb;
  }

  // Invalid ring-{axis}-* (not a width token and not a palette color)
  if (/^ring-(?:x|y|s|e|bs|be|t|b)-.+$/.test(baseClass)) {
    return null;
  }

  if (baseClass.startsWith("ring-")) {
    // Check for ring-inset utility (Tailwind CSS standard)
    // ring-inset sets --iui-ring-inset: inset to make ring appear inside element
    if (baseClass === "ring-inset" || baseClass === "inset-ring") {
      return {
        category: "ring-width" as TokenCategory, // Use ring-width category but handle specially
        value: "inset",
        variants,
        baseClass,
        properties: {
          "--iui-ring-inset": "inset",
        },
      };
    }

    const ringRest = baseClass.slice("ring-".length);
    if (isColorTokenWithOptionalOpacity(ringRest)) {
      return {
        category: "ring-color" as TokenCategory,
        value: ringRest,
        variants,
        baseClass,
      };
    }
    // Otherwise it's ring width: ring-2, ring-4, etc.
    return {
      category: "ring-width" as TokenCategory,
      value: ringRest,
      variants,
      baseClass,
    };
  }

  // Ring utility (default): ring
  if (baseClass === "ring") {
    return {
      category: "ring" as TokenCategory,
      value: "",
      variants,
      baseClass,
    };
  }

  // Divide utilities (Tailwind: borders between adjacent direct children via > * + *)
  if (baseClass.startsWith("divide-")) {
    const divideValue = baseClass.replace("divide-", "");

    if (divideValue === "x-reverse") {
      return cacheAndReturn({
        category: "divide-x-reverse" as TokenCategory,
        value: "",
        variants,
        baseClass,
      });
    }
    if (divideValue === "y-reverse") {
      return cacheAndReturn({
        category: "divide-y-reverse" as TokenCategory,
        value: "",
        variants,
        baseClass,
      });
    }

    const widthAxisMatch = divideValue.match(/^(x|y)-(\d+(?:\.\d+)?)$/);
    if (widthAxisMatch) {
      return cacheAndReturn({
        category: "divide-width" as TokenCategory,
        value: divideValue,
        variants,
        baseClass,
      });
    }

    if (divideValue === "x" || divideValue === "y") {
      return cacheAndReturn({
        category: "divide-width" as TokenCategory,
        value: divideValue,
        variants,
        baseClass,
      });
    }

    const axisStyleMatch = divideValue.match(
      /^(x|y)-(solid|dashed|dotted|double|hidden|none)$/,
    );
    if (axisStyleMatch) {
      const axis = axisStyleMatch[1];
      const styleKey = axisStyleMatch[2];
      const cssVal = VALUE_GETTERS["divide-style"]?.(styleKey);
      if (!cssVal) {
        context.cache.set(className, null);
        return null;
      }
      const properties: Record<string, string> =
        axis === "x"
          ? {
              "--iui-border-style": cssVal,
              "border-left-style": cssVal,
              "border-right-style": cssVal,
            }
          : {
              "--iui-border-style": cssVal,
              "border-top-style": cssVal,
              "border-bottom-style": cssVal,
            };
      return cacheAndReturn({
        category: "divide-style" as TokenCategory,
        value: divideValue,
        variants,
        baseClass,
        properties,
      });
    }

    const styleMatch = divideValue.match(
      /^(solid|dashed|dotted|double|hidden|none)$/,
    );
    if (styleMatch) {
      const cssVal = VALUE_GETTERS["divide-style"]?.(styleMatch[1]);
      if (!cssVal) {
        context.cache.set(className, null);
        return null;
      }
      return cacheAndReturn({
        category: "divide-style" as TokenCategory,
        value: styleMatch[1],
        variants,
        baseClass,
        // Tailwind v4: set --*-border-style so divide-x/y width longhands compose
        properties: {
          "--iui-border-style": cssVal,
          "border-style": cssVal,
        },
      });
    }

    const opacityMatch = divideValue.match(/^(.+?)\/(\d+(?:\.\d+)?)$/);
    const colorName = opacityMatch ? opacityMatch[1] : divideValue;
    const opacity = opacityMatch ? opacityMatch[2] : undefined;
    const colorCss = (
      VALUE_GETTERS["divide-color"] as (
        v: string,
        o?: string,
      ) => string | null
    )?.(colorName, opacity);
    if (colorCss) {
      return cacheAndReturn({
        category: "divide-color" as TokenCategory,
        value: colorName,
        variants,
        baseClass,
        properties: { "border-color": colorCss },
      });
    }

    context.cache.set(className, null);
    return null;
  }

  // Font style utilities: italic, not-italic
  if (baseClass === "italic") {
    return {
      category: "font-style" as TokenCategory,
      value: "italic",
      variants,
      baseClass,
    };
  }
  if (baseClass === "not-italic") {
    return {
      category: "font-style" as TokenCategory,
      value: "not-italic",
      variants,
      baseClass,
    };
  }

  // Font variant utilities: normal-nums, ordinal, slashed-zero, etc.
  const fontVariantValues = [
    "normal-nums",
    "ordinal",
    "slashed-zero",
    "lining-nums",
    "oldstyle-nums",
    "proportional-nums",
    "tabular-nums",
    "diagonal-fractions",
    "stacked-fractions",
  ];
  if (fontVariantValues.includes(baseClass)) {
    const cssValue = VALUE_GETTERS["font-variant-numeric"]?.(baseClass);
    if (!cssValue) {
      return cacheAndReturn(null);
    }
    const fts = FONT_VARIANT_NUMERIC_FEATURE_SETTINGS[baseClass];
    const properties: Record<string, string> = {
      "font-variant-numeric": cssValue,
    };
    if (fts) {
      properties["font-feature-settings"] = fts;
      properties["-webkit-font-feature-settings"] = fts;
    }
    return cacheAndReturn({
      category: "font-variant-numeric" as TokenCategory,
      value: baseClass,
      variants,
      baseClass,
      properties,
    });
  }

  // Writing mode: writing-vertical-es / writing-vertical-se (logical; CSS vertical-rl / vertical-lr)
  if (baseClass.startsWith("writing-")) {
    const value = baseClass.replace("writing-", "");
    const cssValue = VALUE_GETTERS["writing-mode"]?.(value);
    return cacheAndReturn({
      category: "writing-mode" as TokenCategory,
      value,
      variants,
      baseClass,
      properties: cssValue ? { "writing-mode": cssValue } : undefined,
    });
  }

  // Overscroll utilities: overscroll-auto, overscroll-contain, overscroll-none, overscroll-x-auto, overscroll-y-auto, etc.
  if (baseClass.startsWith("overscroll-")) {
    const overscrollValue = baseClass.replace("overscroll-", "");

    if (baseClass.startsWith("overscroll-x-")) {
      return {
        category: "overscroll-x" as TokenCategory,
        value: overscrollValue.replace("x-", ""),
        variants,
        baseClass,
      };
    }
    if (baseClass.startsWith("overscroll-y-")) {
      return {
        category: "overscroll-y" as TokenCategory,
        value: overscrollValue.replace("y-", ""),
        variants,
        baseClass,
      };
    }

    // Otherwise it's general overscroll: overscroll-auto, overscroll-contain, overscroll-none
    return {
      category: "overscroll" as TokenCategory,
      value: overscrollValue,
      variants,
      baseClass,
    };
  }

  // Grid utilities: col-auto, row-auto
  if (baseClass === "col-auto") {
    return {
      category: "grid-column" as TokenCategory,
      value: "auto",
      variants,
      baseClass,
    };
  }
  if (baseClass === "row-auto") {
    return {
      category: "grid-row" as TokenCategory,
      value: "auto",
      variants,
      baseClass,
    };
  }

  // Accent color utilities: accent-blue-500
  if (baseClass.startsWith("accent-")) {
    return {
      category: "accent-color" as TokenCategory,
      value: baseClass.replace("accent-", ""),
      variants,
      baseClass,
    };
  }

  // Caret color utilities: caret-blue-500
  if (baseClass.startsWith("caret-")) {
    return {
      category: "caret-color" as TokenCategory,
      value: baseClass.replace("caret-", ""),
      variants,
      baseClass,
    };
  }

  // Decoration color utilities: decoration-blue-500
  // decoration-* is handled early in the parser (style | thickness | color routing)

  // Outline utilities (Tailwind standard)
  // Check for negative outline-offset FIRST (BEFORE outline- check) - Tailwind CSS standard: -outline-offset-10
  // This must be checked before baseClass.startsWith('outline-') because -outline-offset-10 starts with '-', not 'outline-'
  if (baseClass.startsWith("-outline-offset-")) {
    // Handle negative prefix: -outline-offset-10 becomes outline-offset with value -10 (Tailwind CSS standard)
    return cacheAndReturn({
      category: "outline-offset" as TokenCategory,
      value: "-" + baseClass.replace("-outline-offset-", ""),
      variants,
      baseClass,
    });
  }

  if (baseClass === "outline") {
    return cacheAndReturn({
      category: "outline-width" as TokenCategory,
      value: "1",
      variants,
      baseClass,
      properties: {
        "outline-style": "var(--iui-outline-style)",
        "outline-width": "1px",
      },
    });
  }

  if (baseClass.startsWith("outline-")) {
    if (baseClass === "outline-hidden") {
      return cacheAndReturn({
        category: "outline-hidden" as TokenCategory,
        value: "hidden",
        variants,
        baseClass,
        properties: {
          outline: "2px solid transparent",
          "outline-offset": "2px",
        },
      });
    }

    if (baseClass === "outline-none") {
      return cacheAndReturn({
        category: "outline-style" as TokenCategory,
        value: "none",
        variants,
        baseClass,
        properties: {
          "outline-style": "none",
        },
      });
    }

    // Extract the value after 'outline-'
    const outlineValue = baseClass.replace("outline-", "");

    // Check for positive outline-offset (outline-offset-2, outline-offset-10)
    if (baseClass.startsWith("outline-offset-")) {
      return cacheAndReturn({
        category: "outline-offset" as TokenCategory,
        value: baseClass.replace("outline-offset-", ""),
        variants,
        baseClass,
      });
    }

    // outline-{width}: outline-0, outline-1, outline-2, outline-10, …
    if (/^[0-9]+(\.\d+)?$/.test(outlineValue)) {
      const outlineWidthValue =
        getBorderWidthValue(outlineValue) || `${outlineValue}px`;
      return cacheAndReturn({
        category: "outline-width" as TokenCategory,
        value: outlineValue,
        variants,
        baseClass,
        properties: {
          "outline-style": "var(--iui-outline-style)",
          "outline-width": outlineWidthValue,
        },
      });
    }

    // outline-{style}: outline-solid, outline-dashed, outline-dotted, outline-double
    const outlineStyles = ["solid", "dashed", "dotted", "double"];
    if (outlineStyles.includes(outlineValue)) {
      return cacheAndReturn({
        category: "outline-style" as TokenCategory,
        value: outlineValue,
        variants,
        baseClass,
        properties: {
          "outline-style": outlineValue,
        },
      });
    }

    // Semantic outline values (framework extensions): outline-focus, outline-danger, …
    const semanticOutlineValues = [
      "focus",
      "danger",
      "disabled",
      "interactive",
    ];
    if (semanticOutlineValues.includes(outlineValue)) {
      return {
        category: "outline" as TokenCategory,
        value: outlineValue,
        variants,
        baseClass,
      };
    }

    // outline color: outline-blue-500, outline-white/40, …
    const outlineColorMatch = baseClass.match(
      /^outline-(.+-\d+|white|black|transparent|current|inherit)(?:\/(\d+(?:\.\d+)?))?$/,
    );
    if (outlineColorMatch) {
      const colorName = outlineColorMatch[1];
      const opacity = outlineColorMatch[2];
      const cssValue = VALUE_GETTERS["outline-color"]?.(colorName, opacity);
      return {
        category: "outline-color" as TokenCategory,
        value: colorName,
        variants,
        baseClass,
        properties: cssValue ? { "outline-color": cssValue } : undefined,
      };
    }
  }

  // SVG Fill utilities
  if (baseClass.startsWith("fill-")) {
    // Check if it's fill-none, fill-current, fill-inherit, or fill-transparent
    if (baseClass === "fill-none" || baseClass === "fill-current" || baseClass === "fill-inherit" || baseClass === "fill-transparent") {
      return {
        category: "fill" as TokenCategory,
        value: baseClass.replace("fill-", ""),
        variants,
        baseClass,
      };
    }
    // Otherwise it's a fill color: fill-blue-500
    const colorMatch = baseClass.match(/^fill-(.+)$/);
    if (colorMatch) {
      return {
        category: "fill-color" as TokenCategory,
        value: colorMatch[1],
        variants,
        baseClass,
      };
    }
  }

  // SVG Stroke utilities
  if (baseClass.startsWith("stroke-")) {
    // Check if it's stroke-none, stroke-current, stroke-inherit, or stroke-transparent first
    if (baseClass === "stroke-none" || baseClass === "stroke-current" || baseClass === "stroke-inherit" || baseClass === "stroke-transparent") {
      return {
        category: "stroke" as TokenCategory,
        value: baseClass.replace("stroke-", ""),
        variants,
        baseClass,
      };
    }
    // Check if it's a stroke width, linecap, linejoin, or dasharray
    if (baseClass.match(/^stroke-(0|1|2|4|\d+(\.\d+)?)$/)) {
      return {
        category: "stroke-width" as TokenCategory,
        value: baseClass.replace("stroke-", ""),
        variants,
        baseClass,
      };
    }
    if (baseClass.match(/^stroke-(butt|round|square)$/)) {
      return {
        category: "stroke-linecap" as TokenCategory,
        value: baseClass.replace("stroke-", ""),
        variants,
        baseClass,
      };
    }
    if (baseClass.match(/^stroke-(miter|bevel)$/)) {
      return {
        category: "stroke-linejoin" as TokenCategory,
        value: baseClass.replace("stroke-", ""),
        variants,
        baseClass,
      };
    }
    if (baseClass.match(/^stroke-dasharray$/)) {
      return {
        category: "stroke-dasharray" as TokenCategory,
        value: "dasharray",
        variants,
        baseClass,
      };
    }
    // Otherwise it's a stroke color: stroke-blue-500
    const colorMatch = baseClass.match(/^stroke-(.+)$/);
    if (colorMatch) {
      return {
        category: "stroke-color" as TokenCategory,
        value: colorMatch[1],
        variants,
        baseClass,
      };
    }
  }

  // Handle complex class names that may not match simple patterns
  // This is a fallback for classes like "pointer-events-none", etc.

  // Cache the result (null) and return
  context.cache.set(className, null);
  return null;
}
