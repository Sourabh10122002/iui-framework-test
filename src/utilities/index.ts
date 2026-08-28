/**
 * IUI Design System - Utilities
 * Main export file for utility functions
 *
 * This file serves as the centralized export point for all utility functions
 * that support the design system components and implementation.
 *
 * Utilities typically include:
 * - Accessibility helpers (a11y)
 * - Color manipulation functions
 * - Type guards and type utilities
 * - String formatting and manipulation
 * - Object and array manipulation helpers
 * - Math and calculation utilities
 * - Class utilities for component styling
 *
 * Recommended structure:
 * - Group related utilities in separate files by concern * - Document each function with JSDoc comments
 * - Export from this main index file
 */

// Export IUI Design System class utilities
export {
  // Main merging functions
  iuimerge,
  cn,
  cn2,

  // Conditional classes
  conditionalClasses,
  cx,

  // Variant helpers
  withStateVariants,
  withResponsiveVariants,
  withThemeVariants,
  withAllVariants,

  // Component builders
  createComponentClasses,
  createIUIVariants,

  // Validation and debugging
  validateIUIClass,
  getConflictingClasses,
  extractDesignTokens,

  // External utilities
  cva,
} from "./class-utilities";

export {
  // Theme utilities
  mapRadius,
  getResponsiveRadius,
  mapSpacingClass,
  mapSpacingClass as mapSpacing,
  mapSpacingToPadding,
  mapFont,
  fontMap,
  generatePalette,
  generateNeutralPalette,
  completeHexCode,
} from "./theme-utilities";

export type { VariantProps } from "./class-utilities";
export type { Shade as ThemeShade } from "./theme-utilities";

// Semantic shade system (compose, stack, interactive/control/field APIs)
export {
  shade,
  shadeRegistry,
  fieldAddonDivider,
} from "./shade";
export type {
  Shade,
  SemanticRequest,
  ComponentAppearance,
  ComponentStyleVariant,
  InteractiveFullConfig,
  InteractiveStateConfig,
  SelectionConfig,
  SurfaceConfig,
  FieldConfig,
  StatusConfig,
  ScrollConfig,
  SwatchConfig,
  ShadeRegistryEntry,
} from "./shade";
export { compose, stack, slice, channel, semanticApi } from "./shade/api";

// Variable utilities for hashed CSS variables
export { VariableUtils } from "./variable-utilities";

// CSS Variable Manager for centralized variable management
export {
  cssVariableManager,
  setRootCssVariables,
  setRootCssVariable,
  getRootCssVariable,
  removeRootCssVariable,
  clearRootCssVariables,
} from "./css-variable-manager";

// Color palette utilities handled by useColorPalette hook

// Design system is ready with comprehensive utilities
export const UTILS_AVAILABLE = true;

/**
 * Extracts initials from a full name
 * Takes first and last name initials, ignoring middle names and periods
 * @param name - The full name string
 * @returns String containing first and last name initials (max 2 characters)
 */
export const getInitialsFromName = (name: string): string => {
  if (!name || typeof name !== "string") {
    return "";
  }

  // Remove periods and extra whitespace, then split by spaces
  const cleanedName = name.replace(/\./g, "").trim();
  const nameParts = cleanedName.split(/\s+/).filter((part) => part.length > 0);

  if (nameParts.length === 0) {
    return "";
  }

  if (nameParts.length === 1) {
    // Single name - take first character
    return nameParts[0].charAt(0).toUpperCase();
  }

  // Multiple names - take first character of first and last name
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
};
