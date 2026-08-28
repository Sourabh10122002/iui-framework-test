/**
 * Dynamic Token Multiplier System
 * Enables dynamic generation of design tokens through mathematical relationships
 * Example: border-4 = 4 × border-1, p-12 = 12 × spacing-1
 */

import * as tokenValues from './values';

// Cache for computed values to optimize performance
const computedValueCache = new Map<string, string>();

// Base units for different token categories (single source of truth for increment size)
// Following Tailwind CSS industry standards:
// - 4px increments (0.25rem): spacing, font-size; also used for margin, padding, gap,
//   width, height, min/max size, translate, indent, border-spacing, column-gap, scroll-*, etc. (via getSpacingValue / getSmartSpacingValue)
// - 1px increments: border-width, ring-width, outline-width, ring-offset-width
const BASE_UNITS: Record<string, { unit: string; baseValue: string }> = {
  'border-width': { unit: 'px', baseValue: '1px' }, // 1px increments
  'ring-width': { unit: 'px', baseValue: '1px' }, // 1px increments
  'outline-width': { unit: 'px', baseValue: '1px' }, // 1px increments
  'ring-offset-width': { unit: 'px', baseValue: '1px' }, // 1px increments
  'spacing': { unit: 'rem', baseValue: '0.25rem' }, // 4px increments (0.25rem base)
  'font-size': { unit: 'rem', baseValue: '0.25rem' }, // 4px increments to match spacing scale
};

/**
 * Parse numeric multiplier from token value, including negative values
 * Examples: "4" -> 4, "1.5" -> 1.5, "12" -> 12
 * Negative examples: "-4" -> -4, "-1.5" -> -1.5, "-12" -> -12
 */
function parseMultiplier(value: string): number | null {
  // Handle negative values by checking for leading minus
  const isNegative = value.startsWith('-');
  const numericPart = isNegative ? value.slice(1) : value;
  
  // Handle pure numbers (most common case)
  const num = parseFloat(numericPart);
  if (!isNaN(num) && isFinite(num) && num >= 0) {
    return isNegative ? -num : num;
  }
  return null;
}

/**
 * Calculate dynamic value using base unit multiplication
 * Example: calculateDynamicValue('border-width', '4') -> '4px'
 */
function calculateDynamicValue(category: string, value: string): string | null {
  const cacheKey = `${category}-${value}`;
  
  // Check cache first for performance
  if (computedValueCache.has(cacheKey)) {
    return computedValueCache.get(cacheKey)!;
  }
  
  const baseUnit = BASE_UNITS[category];
  if (!baseUnit) return null;
  
  const multiplier = parseMultiplier(value);
  if (multiplier === null) return null;
  
  // Handle special case of 0
  if (multiplier === 0) {
    const result = '0';
    computedValueCache.set(cacheKey, result);
    return result;
  }
  
  // Calculate the dynamic value with support for negative values
  let result: string;
  
  if (category === 'spacing') {
    // Spacing uses 0.25rem base unit, so spacing-1 = 1 × 0.25rem = 0.25rem (matches static tokens)
    // Negative: spacing--1 = -1 × 0.25rem = -0.25rem
    result = `${multiplier * 0.25}rem`;
  } else if (category === 'font-size') {
    // Font size uses 0.25rem base unit (4px increments) to match spacing scale
    // text-1 = 0.25rem (4px), text-2 = 0.5rem (8px), etc.
    result = `${multiplier * 0.25}rem`;
  } else {
    // Default: simple pixel multiplication (1px increments for borders, rings, outlines)
    // border-1 = 1px, border-2 = 2px, ring-1 = 1px, etc.
    result = `${multiplier}px`;
  }
  
  // Cache the result
  computedValueCache.set(cacheKey, result);
  
  return result;
}

/**
 * Get token value with dynamic fallback
 * 1. Try static token first (performance optimization)
 * 2. If not found, try dynamic calculation
 * 3. Return null if neither works
 */
export function getDynamicTokenValue(category: string, value: string): string | null {
  // First, try to get from static tokens (fastest path)
  let staticValue: string | null = null;
  
  switch (category) {
    case 'border-width':
      staticValue = tokenValues.borderWidth[value as keyof typeof tokenValues.borderWidth] || null;
      break;
    case 'spacing':
      staticValue = tokenValues.spacing[value as keyof typeof tokenValues.spacing] || null;
      break;
    case 'ring-width':
      staticValue = tokenValues.ringWidth[value as keyof typeof tokenValues.ringWidth] || null;
      break;
    case 'ring-offset-width':
      staticValue = tokenValues.ringOffsetWidth[value as keyof typeof tokenValues.ringOffsetWidth] || null;
      break;
    case 'outline-width':
      staticValue = tokenValues.outlineWidth[value as keyof typeof tokenValues.outlineWidth] || null;
      break;
    case 'font-size':
      // Font-size tokens are arrays with [size, { lineHeight }]
      const fontSizeToken = tokenValues.fontSize[value as keyof typeof tokenValues.fontSize];
      if (fontSizeToken && Array.isArray(fontSizeToken)) {
        staticValue = fontSizeToken[0] as string;
      }
      break;
  }
  
  // If static value exists, use it (performance optimization)
  if (staticValue) {
    return staticValue;
  }
  
  // Otherwise, try dynamic calculation
  return calculateDynamicValue(category, value);
}

/**
 * Enhanced spacing value getter with dynamic support
 */
export function getSpacingValue(value: string): string | null {
  return getDynamicTokenValue('spacing', value);
}

/**
 * Enhanced border width value getter with dynamic support  
 */
export function getBorderWidthValue(value: string): string | null {
  return getDynamicTokenValue('border-width', value);
}

/**
 * Enhanced ring width value getter with dynamic support
 */
export function getRingWidthValue(value: string): string | null {
  return getDynamicTokenValue('ring-width', value);
}

/**
 * Enhanced font size value getter with dynamic support
 */
export function getFontSizeValue(value: string): string | null {
  return getDynamicTokenValue('font-size', value);
}