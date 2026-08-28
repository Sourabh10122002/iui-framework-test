/**
 * IUI Design System - Utility Cache
 * LRU cache management for parsed utilities
 */

import { TokenCategory } from '../../utilities/class-utilities';
import { CACHE_CONFIG } from '../config/performance';

/**
 * Parsed utility cache entry type
 */
export type ParsedUtilityCacheEntry = {
  category: TokenCategory;
  value: string;
  variants: string[];
  baseClass: string;
  properties?: Record<string, string>;
} | null;

/**
 * LRU Cache Manager for parsed utilities
 * Provides efficient caching with automatic eviction of least recently used entries
 */
export class UtilityCache {
  private readonly MAX_CACHE_SIZE = CACHE_CONFIG.MAX_CACHE_SIZE;
  private cache = new Map<string, ParsedUtilityCacheEntry>();

  /**
   * Manage LRU cache - add entry and evict oldest if needed
   */
  set(key: string, value: ParsedUtilityCacheEntry): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    // Add new entry (most recently used goes to end)
    this.cache.set(key, value);
  }

  /**
   * Get cached parsed utility with LRU management
   * Moves accessed entry to end (most recently used)
   */
  get(key: string): ParsedUtilityCacheEntry | undefined {
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      // Move to end (most recently used) - LRU behavior
      this.cache.delete(key);
      this.cache.set(key, cached);
    }
    return cached;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get max cache size
   */
  getMaxSize(): number {
    return this.MAX_CACHE_SIZE;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    usage: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      usage: (this.cache.size / this.MAX_CACHE_SIZE) * 100
    };
  }
}


