/**
 * IUI Design System - CSS Optimization Configuration
 * 
 * Configuration options for CSS deduplication and optimization features.
 * All features are backward compatible and can be toggled on/off.
 */

export interface CSSOptimizationConfig {
  /** Enable CSS rule-level deduplication (default: true) */
  enableRuleDeduplication: boolean;
  
  /** Enable batch CSS optimization (combining identical properties) (default: true) */
  enableBatchOptimization: boolean;
  
  /** Enable development mode warnings for duplicate detection (default: process.env.NODE_ENV === 'development') */
  enableDuplicateWarnings: boolean;
  
  /** Maximum cache size for CSS rules (default: 5000) */
  maxCacheSize: number;
  
  /** Enable verbose logging for debugging (default: false) */
  enableVerboseLogging: boolean;
  
  /** Enable memory optimization with LRU cache (default: true) */
  enableMemoryOptimization?: boolean;
}

/** Default configuration */
export const DEFAULT_CSS_CONFIG: CSSOptimizationConfig = {
  enableRuleDeduplication: true,
  enableBatchOptimization: true,
  enableDuplicateWarnings: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
  maxCacheSize: 5000, // Increased for large applications
  enableVerboseLogging: false,
  enableMemoryOptimization: true, // Enable LRU cache optimization
};

/** Global configuration state */
let globalConfig: CSSOptimizationConfig = { ...DEFAULT_CSS_CONFIG };

/**
 * Update CSS optimization configuration
 */
export function configureCSSOptimization(config: Partial<CSSOptimizationConfig>): void {
  globalConfig = { ...globalConfig, ...config };
}

/**
 * Get current CSS optimization configuration
 */
export function getCSSOptimizationConfig(): CSSOptimizationConfig {
  return { ...globalConfig };
}

/**
 * Reset configuration to defaults
 */
export function resetCSSOptimizationConfig(): void {
  globalConfig = { ...DEFAULT_CSS_CONFIG };
}