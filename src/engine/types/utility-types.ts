/**
 * IUI Design System - Utility Types
 * Type definitions for utility builder system
 */

import { TokenCategory } from '../../utilities/class-utilities';

/**
 * Unified negative value parser result
 * Provides consistent handling of negative values across all utilities
 */
export interface ParsedValue {
  isNegative: boolean;
  absoluteValue: string;
  originalValue: string;
}

/**
 * Utility class that represents a single CSS utility
 */
export interface CSSUtility {
  className: string;
  selector: string;
  properties: Record<string, string>;
  variants: string[];
  baseClass: string;
  specificity: number;
  important?: boolean; // Whether this utility should use !important
  /** Optional second rule (e.g. text-transform-sentencecase uses ::first-letter) */
  companionRule?: { selector: string; properties: Record<string, string> };
}

/**
 * CSS Rule representation for optimization
 */
export interface CSSRule {
  selector: string;
  properties: Record<string, string>;
  specificity: number;
}

/**
 * CSS optimization statistics
 */
export interface OptimizationStats {
  totalRules: number;
  duplicatesFound: number;
  rulesOptimized: number;
  bytesReduced: number;
}

/**
 * Parsed utility class result
 */
export interface ParsedUtility {
  category: TokenCategory;
  value: string;
  variants: string[];
  baseClass: string;
  properties?: Record<string, string>;
}


