/**
 * IUI Design System - Utility Purging
 * Production optimization for removing unused utilities
 */

import { PURGE_CONFIG } from '../config/performance';
import { logger } from '../../utilities/logger';

/**
 * Purging configuration
 */
export interface PurgingConfig {
  trackUsageInProduction: boolean;
  purgeThreshold: number;
}

/**
 * Utility purging manager
 * Tracks usage and removes unused utilities to reduce memory footprint
 */
export class UtilityPurging {
  private usedUtilities = new Set<string>();
  private usageTrackingEnabled: boolean;
  private purgeThreshold: number;

  constructor(config?: Partial<PurgingConfig>) {
    this.usageTrackingEnabled = config?.trackUsageInProduction ?? 
      (PURGE_CONFIG.TRACK_USAGE_IN_PRODUCTION && process.env.NODE_ENV === 'production');
    this.purgeThreshold = config?.purgeThreshold ?? PURGE_CONFIG.PURGE_THRESHOLD;
  }

  /**
   * Track utility usage
   */
  trackUsage(className: string): void {
    if (this.usageTrackingEnabled) {
      this.usedUtilities.add(className);
    }
  }

  /**
   * Check if usage tracking is enabled
   */
  isTrackingEnabled(): boolean {
    return this.usageTrackingEnabled;
  }

  /**
   * Enable/disable usage tracking
   */
  setUsageTracking(enabled: boolean): void {
    this.usageTrackingEnabled = enabled;
    if (!enabled) {
      this.usedUtilities.clear();
    }
  }

  /**
   * Get used utilities count
   */
  getUsedUtilitiesCount(): number {
    return this.usedUtilities.size;
  }

  /**
   * Get unused utilities count
   */
  getUnusedUtilitiesCount(totalUtilities: number): number {
    return totalUtilities - this.usedUtilities.size;
  }

  /**
   * Purge unused utilities from the provided utilities map
   * Returns the number of utilities purged
   */
  purgeUnusedUtilities(
    utilities: Map<string, unknown>,
    cache?: Map<string, unknown>
  ): number {
    if (!this.usageTrackingEnabled) {
      logger.warn('⚠️ Usage tracking is disabled. Enable it first to purge unused utilities.');
      return 0;
    }
    
    const initialSize = utilities.size;
    const utilitiesToKeep = new Set<string>();
    
    // Keep only used utilities
    this.usedUtilities.forEach(className => {
      if (utilities.has(className)) {
        utilitiesToKeep.add(className);
      }
    });
    
    // Remove unused utilities
    const utilitiesToRemove: string[] = [];
    utilities.forEach((_, className) => {
      if (!utilitiesToKeep.has(className)) {
        utilitiesToRemove.push(className);
      }
    });
    
    utilitiesToRemove.forEach(className => {
      utilities.delete(className);
      // Also remove from cache if provided
      if (cache) {
        cache.delete(className);
      }
    });
    
    const purgedCount = initialSize - utilities.size;
    
    if (purgedCount > 0) {
      logger.log(`🧹 Purged ${purgedCount} unused utilities (${initialSize} → ${utilities.size})`);
    }
    
    return purgedCount;
  }

  /**
   * Auto-purge unused utilities when threshold is reached
   * Called automatically when unused utilities exceed purgeThreshold
   */
  autoPurgeIfNeeded(
    utilities: Map<string, unknown>,
    cache?: Map<string, unknown>
  ): boolean {
    if (!this.usageTrackingEnabled) return false;
    
    const unusedCount = this.getUnusedUtilitiesCount(utilities.size);
    if (unusedCount > this.purgeThreshold) {
      this.purgeUnusedUtilities(utilities, cache);
      return true;
    }
    return false;
  }

  /**
   * Set purge threshold
   */
  setPurgeThreshold(threshold: number): void {
    this.purgeThreshold = threshold;
  }

  /**
   * Get purge threshold
   */
  getPurgeThreshold(): number {
    return this.purgeThreshold;
  }

  /**
   * Get purge statistics
   */
  getPurgeStats(totalUtilities: number): {
    totalUtilities: number;
    usedUtilities: number;
    unusedUtilities: number;
    purgeThreshold: number;
    canPurge: boolean;
  } {
    return {
      totalUtilities,
      usedUtilities: this.usedUtilities.size,
      unusedUtilities: this.getUnusedUtilitiesCount(totalUtilities),
      purgeThreshold: this.purgeThreshold,
      canPurge: this.getUnusedUtilitiesCount(totalUtilities) > this.purgeThreshold
    };
  }

  /**
   * Clear all usage tracking data
   */
  clear(): void {
    this.usedUtilities.clear();
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    this.usageTrackingEnabled = PURGE_CONFIG.TRACK_USAGE_IN_PRODUCTION && 
      process.env.NODE_ENV === 'production';
    this.purgeThreshold = PURGE_CONFIG.PURGE_THRESHOLD;
    this.usedUtilities.clear();
  }
}


