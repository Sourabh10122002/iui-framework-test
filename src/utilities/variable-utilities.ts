/**
 * Utility to get CSS variable names.
 */
export class VariableUtils {
  /**
   * Get the variable name for a given original variable
   * @param originalVar - The original variable name (e.g., "--iui-color-blue-500")
   * @param _category - The category/folder name (e.g., "colors") - unused, kept for API compatibility
   * @returns The original variable name
   */
  static getVariable(originalVar: string, _category: string): string {
    return originalVar;
  }

  /**
   * Get all variables for a specific category
   * @param _category - The category name (unused, kept for API compatibility)
   * @returns Empty object since we don't have mappings
   */
  static getCategoryVariables(_category: string): Record<string, string> {
    return {};
  }

  /**
   * Get a color variable by name
   * @param colorName - The color name (e.g., "blue-500", "gray-100")
   * @returns The original color variable name
   */
  static getColor(colorName: string): string {
    return `--iui-color-${colorName}`;
  }

  /**
   * Get a typography variable by name
   * @param typographyName - The typography name (e.g., "font-size-lg", "font-weight-bold")
   * @returns The original typography variable name
   */
  static getTypography(typographyName: string): string {
    return `--iui-${typographyName}`;
  }

  /**
   * Get a spacing variable by name
   * @param spacingName - The spacing name (e.g., "spacing-1", "spacing-2")
   * @returns The original spacing variable name
   */
  static getSpacing(spacingName: string): string {
    return `--iui-${spacingName}`;
  }

  /**
   * Get a sizing variable by name
   * @param sizingName - The sizing name (e.g., "width-full", "height-100")
   * @returns The original sizing variable name
   */
  static getSizing(sizingName: string): string {
    return `--iui-${sizingName}`;
  }

  /**
   * Get a border variable by name
   * @param borderName - The border name (e.g., "border-width-1", "border-radius-lg")
   * @returns The original border variable name
   */
  static getBorder(borderName: string): string {
    return `--iui-${borderName}`;
  }

  /**
   * Get a z-index variable by name
   * @param zIndexName - The z-index name (e.g., "z-10", "z-50")
   * @returns The original z-index variable name
   */
  static getZIndex(zIndexName: string): string {
    return `--iui-z-index-${zIndexName}`;
  }
}

export default VariableUtils;