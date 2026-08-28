/**
 * Performance Configuration Constants
 * 
 * Centralized configuration for performance-related settings across the framework.
 * This makes it easier to tune performance and maintain consistency.
 */

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  /** Maximum number of parsed utilities to cache (LRU) */
  MAX_CACHE_SIZE: 2000,
  
  /** Maximum number of CSS rules to cache */
  MAX_CSS_RULE_CACHE_SIZE: 5000,
} as const;

/**
 * Debouncing and batching configuration
 */
export const TIMING_CONFIG = {
  /** Debounce delay for DOM mutations (16ms = one frame at 60fps) */
  DOM_OBSERVER_DEBOUNCE: 16,
  
  /** Batch delay for CSS variable updates (16ms = one frame at 60fps) */
  CSS_VARIABLE_BATCH_DELAY: 16,
  
  /** Initial delay for arbitrary values initialization (0 = immediate, was 100ms) */
  ARBITRARY_VALUES_INIT_DELAY: 0,
  
  /** RequestAnimationFrame fallback timeout (16ms) */
  RAF_FALLBACK_DELAY: 16,
} as const;

/**
 * Utility purging configuration
 */
export const PURGE_CONFIG = {
  /** Threshold for unused utilities before purging */
  PURGE_THRESHOLD: 1000 as number,
  
  /** Enable usage tracking in production */
  TRACK_USAGE_IN_PRODUCTION: true,
} as const;

/**
 * CSS optimization configuration
 */
export const CSS_OPTIMIZATION_CONFIG = {
  /** Enable rule deduplication by default */
  ENABLE_RULE_DEDUPLICATION: true,
  
  /** Maximum CSS size before warning (in bytes) */
  MAX_CSS_SIZE_WARNING: 500000, // 500KB
} as const;

/**
 * Observer configuration
 */
export const OBSERVER_CONFIG = {
  /** Enable unified DOM observer by default */
  ENABLE_UNIFIED_OBSERVER: true,
  
  /** Observer options */
  OBSERVER_OPTIONS: {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  },
} as const;

