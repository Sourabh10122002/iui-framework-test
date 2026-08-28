/**
 * IUI Design System - Utility Helpers
 * Helper functions for utility builder system
 */

import { ParsedValue } from '../types/utility-types';
import * as tokenValues from '../tokens/values';
import { getSpacingValue } from '../tokens/dynamic';
import { isShadedColorToken } from '../../utilities/color-token-utils';

/**
 * Unified negative value parser
 * Provides consistent handling of negative values across all utilities
 */
export function parseNegativeValue(value: string): ParsedValue {
  const isNegative = value.startsWith('-');
  return {
    isNegative,
    absoluteValue: isNegative ? value.slice(1) : value,
    originalValue: value
  };
}

/**
 * Smart spacing value resolver that uses CSS variables for static tokens
 * and computed values for dynamic tokens
 */
export function getSmartSpacingValue(value: string): string | null {
  const { isNegative, absoluteValue } = parseNegativeValue(value);

  // Handle special case: -px should become -1px
  if (absoluteValue === 'px') {
    return isNegative ? '-1px' : '1px';
  }

  // Semantic spacing aliases used across DS components (map onto numeric scale).
  const SEMANTIC_SPACING: Record<string, string> = {
    xs: '1',
    sm: '2',
    md: '4',
    lg: '6',
    xl: '8',
    '2xl': '10',
    '3xl': '12',
  };
  const resolvedKey = SEMANTIC_SPACING[absoluteValue] ?? absoluteValue;

  // REJECT PERCENTAGE VALUES - These should be handled by Arbitrary Values Hook
  if (resolvedKey.includes('%')) {
    return null;
  }

  // REJECT CSS UNITS - These should be handled by Arbitrary Values Hook
  if (resolvedKey.match(/\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|cm|mm|in|pt|pc)$/)) {
    return null;
  }

  const staticValue = tokenValues.spacing[resolvedKey as keyof typeof tokenValues.spacing];
  if (staticValue) {
    // For decimal and fractional values, use direct values (CSS variables with dots/slashes are invalid)
    if (resolvedKey.includes('.') || resolvedKey.includes('/')) {
      return isNegative ? `-${staticValue}` : staticValue;
    }
    // Use CSS variable for integer values - allows runtime customization
    // Add fallback to ensure spacing still works if the CSS variable is missing
    const varValue = `var(--iui-spacing-${resolvedKey}, ${staticValue})`;
    return isNegative ? `calc(-1 * ${varValue})` : varValue;
  }
  // Use computed value directly for dynamic tokens (only numeric multipliers)
  const computedValue = getSpacingValue(resolvedKey);
  return computedValue && isNegative ? `-${computedValue}` : computedValue;
}

/**
 * Gap / gap-x / gap-y (Tailwind-aligned; CSS properties are gap / column-gap / row-gap).
 * - `normal` → CSS keyword (browser default gap)
 * - `none` → `0px` (Tailwind-style gap-none)
 */
export function resolveGapSpacingValue(value: string): string | null {
  if (value === "normal") return "normal";
  if (value === "none") return "0px";
  return getSmartSpacingValue(value);
}

/**
 * For min/max *width* (and inline-size constraints): map every viewport token to the
 * **width** axis so `min-w-svh` is not `100svh` (that uses viewport height as a length and
 * forces a huge min-width). `w-dvh` / `h-dvw` still use cross-axis tokens via width/height getters.
 */
export function viewportLengthForMinMaxWidth(value: string): string | null {
  const map: Record<string, string> = {
    dvw: "100dvw",
    dvh: "100dvw",
    lvw: "100lvw",
    lvh: "100lvw",
    svw: "100svw",
    svh: "100svw",
  };
  return map[value] ?? null;
}

/**
 * For min/max *height* (and block-size constraints): map viewport tokens to the **height** axis
 * so `min-h-svw` is not `100svw` as a height (width unit as height behaves oddly).
 */
export function viewportLengthForMinMaxHeight(value: string): string | null {
  const map: Record<string, string> = {
    dvw: "100dvh",
    lvw: "100lvh",
    svw: "100svh",
    dvh: "100dvh",
    lvh: "100lvh",
    svh: "100svh",
  };
  return map[value] ?? null;
}

export function getSmartWidthValue(value: string): string | null {
  const { isNegative, absoluteValue } = parseNegativeValue(value);
  
  // Handle special case: -px should become -1px
  if (absoluteValue === 'px') {
    return isNegative ? '-1px' : '1px';
  }
  
  // REJECT PERCENTAGE VALUES - These should be handled by Arbitrary Values Hook
  if (absoluteValue.includes('%')) {
    return null;
  }
  
  // REJECT CSS UNITS - These should be handled by Arbitrary Values Hook
  if (absoluteValue.match(/\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|dvw|dvh|lvw|lvh|svw|svh|cm|mm|in|pt|pc)$/)) {
    return null;
  }

  // spacing.screen is 100vh for legacy vertical contexts; width utilities must use viewport width
  if (absoluteValue === 'screen') {
    return isNegative ? null : '100vw';
  }
  
  const staticValue = tokenValues.spacing[absoluteValue as keyof typeof tokenValues.spacing];
  if (staticValue) {
    // For decimal and fractional values, use direct values (CSS variables with dots/slashes are invalid)
    if (absoluteValue.includes('.') || absoluteValue.includes('/')) {
      return isNegative ? `-${staticValue}` : staticValue;
    }
    // Use CSS variable for integer values - allows runtime customization
    const varValue = `var(--iui-width-${absoluteValue}, ${staticValue})`;
    return isNegative ? `calc(-1 * ${varValue})` : varValue;
  }
  // Use computed value directly for dynamic tokens (only numeric multipliers)
  const computedValue = getSpacingValue(absoluteValue);
  return computedValue && isNegative ? `-${computedValue}` : computedValue;
}

export function getSmartHeightValue(value: string): string | null {
  const { isNegative, absoluteValue } = parseNegativeValue(value);
  
  // Handle special case: -px should become -1px
  if (absoluteValue === 'px') {
    return isNegative ? '-1px' : '1px';
  }
  
  // REJECT PERCENTAGE VALUES - These should be handled by Arbitrary Values Hook
  if (absoluteValue.includes('%')) {
    return null;
  }
  
  // REJECT CSS UNITS - These should be handled by Arbitrary Values Hook
  if (absoluteValue.match(/\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|dvw|dvh|lvw|lvh|svw|svh|cm|mm|in|pt|pc)$/)) {
    return null;
  }

  if (absoluteValue === 'screen') {
    return isNegative ? null : '100vh';
  }
  
  const staticValue = tokenValues.spacing[absoluteValue as keyof typeof tokenValues.spacing];
  if (staticValue) {
    // For decimal and fractional values, use direct values (CSS variables with dots/slashes are invalid)
    if (absoluteValue.includes('.') || absoluteValue.includes('/')) {
      return isNegative ? `-${staticValue}` : staticValue;
    }
    // Use CSS variable for integer values - allows runtime customization
    const varValue = `var(--iui-height-${absoluteValue}, ${staticValue})`;
    return isNegative ? `calc(-1 * ${varValue})` : varValue;
  }
  // Use computed value directly for dynamic tokens (only numeric multipliers)
  const computedValue = getSpacingValue(absoluteValue);
  return computedValue && isNegative ? `-${computedValue}` : computedValue;
}

/**
 * Smart positioning value resolver for top, right, bottom, left utilities
 * Handles fractional values (1/2, 1/4, etc.) correctly by returning percentages directly
 */
export function getSmartPositioningValue(value: string): string | null {
  const { isNegative, absoluteValue } = parseNegativeValue(value);
  
  // Handle special case: -px should become -1px
  if (absoluteValue === 'px') {
    return isNegative ? '-1px' : '1px';
  }
  
  // REJECT PERCENTAGE VALUES - These should be handled by Arbitrary Values Hook
  if (absoluteValue.includes('%')) {
    return null;
  }
  
  // REJECT CSS UNITS - These should be handled by Arbitrary Values Hook
  if (absoluteValue.match(/\d+(\.\d+)?(px|rem|em|vh|vw|vmin|vmax|cm|mm|in|pt|pc)$/)) {
    return null;
  }
  
  const staticValue = tokenValues.spacing[absoluteValue as keyof typeof tokenValues.spacing];
  if (staticValue) {
    // For fractional values (1/2, 1/4, etc.), return percentage directly (no CSS variable)
    // CSS variables can't contain slashes, so we must use the actual percentage value
    if (absoluteValue.includes('/')) {
      return isNegative ? `calc(-1 * ${staticValue})` : staticValue;
    }
    // For decimal values, use direct values
    if (absoluteValue.includes('.')) {
      return isNegative ? `-${staticValue}` : staticValue;
    }
    // For integer values, use CSS variable for runtime customization
    const varValue = `var(--iui-spacing-${absoluteValue}, ${staticValue})`;
    return isNegative ? `calc(-1 * ${varValue})` : varValue;
  }
  // Use computed value directly for dynamic tokens (only numeric multipliers)
  const computedValue = getSpacingValue(absoluteValue);
  return computedValue && isNegative ? `-${computedValue}` : computedValue;
}

/**
 * Smart hue-rotate value resolver that handles negative values
 */
export function getSmartHueRotateValue(value: string): string | null {
  const { isNegative, absoluteValue } = parseNegativeValue(value);
  
  const num = parseFloat(absoluteValue);
  if (!isNaN(num) && isFinite(num)) {
    const sign = isNegative ? '-' : '';
    return `hue-rotate(${sign}${num}deg)`;
  }
  
  return null;
}

/**
 * Helper function to convert hex color to rgb/rgba format
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle 3-digit hex
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  // Handle 6-digit hex
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
  }
  
  return null;
}

/**
 * Factory function to create color value getters
 * Eliminates code duplication across all color utilities
 * Supports Tailwind-style opacity modifiers: bg-black/30, text-red-500/50, etc.
 */
export function createColorValueGetter(): (value: string, opacity?: string) => string | null {
  return (value: string, opacity?: string) => {
    // Reject polluted / non-ident values before interpolating into CSS variables.
    // Valid color tokens are idents (+ optional shade); never quotes or punctuation.
    if (!value || /["'`;,]/.test(value) || !/^[a-zA-Z][\w-]*$/.test(value)) {
      return null;
    }

    // Config-driven shaded palettes always resolve through CSS variables.
    if (isShadedColorToken(value)) {
      const cssVar = `var(--iui-color-${value})`;
      if (opacity === undefined) {
        return cssVar;
      }
    }

    // Literal keywords and framework contract aliases from the static token catalog.
    const colorValue = tokenValues.colors[value as keyof typeof tokenValues.colors];
    
    // Handle opacity modifier (Tailwind standard: /30 means 30% = 0.3)
    if (opacity !== undefined) {
      let opacityValue: number;
      
      // Parse opacity: can be integer (30 = 0.3) or decimal (0.3 = 0.3)
      const opacityNum = parseFloat(opacity);
      if (!isNaN(opacityNum)) {
        // If opacity is > 1, treat as percentage (30 -> 0.3)
        // If opacity is <= 1, use as-is (0.3 -> 0.3)
        opacityValue = opacityNum > 1 ? opacityNum / 100 : opacityNum;
        // Clamp between 0 and 1
        opacityValue = Math.max(0, Math.min(1, opacityValue));
      } else {
        // Invalid opacity, return color without opacity
        if (colorValue) return colorValue;
        return `var(--iui-color-${value})`;
      }
      
      // Convert color to rgb/rgba format with opacity
      if (colorValue) {
        // Handle hex colors
        if (colorValue.startsWith('#')) {
          const rgb = hexToRgb(colorValue);
          if (rgb) {
            // Use modern rgb() syntax with alpha: rgb(r g b / alpha)
            return `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${opacityValue})`;
          }
        }
        // Handle rgb/rgba colors - extract rgb values and apply opacity
        const rgbMatch = colorValue.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        if (rgbMatch) {
          const r = rgbMatch[1];
          const g = rgbMatch[2];
          const b = rgbMatch[3];
          return `rgb(${r} ${g} ${b} / ${opacityValue})`;
        }
        // Handle rgb() with space-separated values: rgb(0 0 0 / 0.5)
        const rgbSpaceMatch = colorValue.match(/rgb\((\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*[\d.]+)?\)/);
        if (rgbSpaceMatch) {
          const r = rgbSpaceMatch[1];
          const g = rgbSpaceMatch[2];
          const b = rgbSpaceMatch[3];
          return `rgb(${r} ${g} ${b} / ${opacityValue})`;
        }
        // For other color formats (named colors, currentColor, etc.), use color-mix or fallback
        // Use CSS color-mix for better browser support
        if (colorValue === 'transparent' || colorValue === 'currentColor' || colorValue === 'inherit') {
          return colorValue; // These don't support opacity
        }
        // For other formats, try to use color-mix (modern browsers)
        return `color-mix(in srgb, ${colorValue} ${opacityValue * 100}%, transparent)`;
      }
      
      // If color not found in tokenValues, use CSS variable with opacity
      // This requires the CSS variable to be in a format that supports opacity
      return `rgb(from var(--iui-color-${value}) r g b / ${opacityValue})`;
    }
    
    // No opacity modifier - return color as-is
    if (colorValue) {
      return colorValue;
    }
    
    // If not found, try CSS variable as fallback
    return `var(--iui-color-${value})`;
  };
}

/**
 * Factory function to create filter value getters
 * Optimizes common filter patterns
 */
export function createFilterValueGetter(filterName: string, defaultValue?: string): (value: string) => string | null {
  return (value: string) => {
    if (value === filterName && defaultValue) return defaultValue;
    return `${filterName}(${value})`;
  };
}

/**
 * Factory function to create backdrop filter value getters
 * Optimizes backdrop filter patterns
 */
export function createBackdropFilterValueGetter(filterName: string, defaultValue?: string): (value: string) => string | null {
  return (value: string) => {
    if (value === `backdrop-${filterName}` && defaultValue) return defaultValue;
    return `backdrop-filter: ${filterName}(${value})`;
  };
}

/**
 * Tokenize animation shorthand without splitting inside parentheses
 * (e.g. cubic-bezier(0, 0, 0.2, 1) must stay one token).
 */
function tokenizeAnimationShorthand(shorthand: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let parenDepth = 0;

  for (let i = 0; i < shorthand.length; i++) {
    const ch = shorthand[i];
    if (ch === "(") {
      parenDepth++;
      current += ch;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      current += ch;
      continue;
    }
    if (/\s/.test(ch) && parenDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) tokens.push(trimmed);
      current = "";
      continue;
    }
    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed) tokens.push(trimmed);
  return tokens;
}

/**
 * Split preset animation shorthands into longhands so duration/ease utilities compose
 * (Tailwind / tailwindcss-animate: animate-* + ease-* + animate-duration-*).
 * Example: "fadeIn 0.3s ease-in-out" → name + duration + timing as separate properties.
 */
export function animationShorthandToLonghands(
  shorthand: string,
): Record<string, string> {
  const tokens = tokenizeAnimationShorthand(shorthand);
  if (tokens.length === 0) return {};

  const props: Record<string, string> = {
    "animation-name": tokens[0],
  };
  let i = 1;

  if (i < tokens.length && /^(\d|\.)/.test(tokens[i])) {
    props["animation-duration"] = tokens[i++];
  }

  if (i < tokens.length && tokens[i] === "infinite") {
    props["animation-iteration-count"] = "infinite";
    return props;
  }

  if (
    i < tokens.length &&
    tokens[i] !== "infinite" &&
    !/^\d+$/.test(tokens[i])
  ) {
    props["animation-timing-function"] = tokens[i++];
  }

  if (i < tokens.length) {
    props["animation-iteration-count"] = tokens[i];
  }

  return props;
}

