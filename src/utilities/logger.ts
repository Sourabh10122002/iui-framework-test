/* eslint-disable no-console */
/**
 * Centralized logging utility for Inventive UI Framework
 * 
 * Industry-standard logging that:
 * - Respects NODE_ENV (only logs in development)
 * - Provides consistent formatting
 * - Can be stripped in production builds
 * - Supports different log levels
 * - Optimized for tree-shaking in production
 * 
 * Note: Console statements are intentional - this is the logger implementation
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

// No-op functions for production (better tree-shaking)
const noop = (): void => {};

/**
 * Logger utility with environment-aware logging
 * Uses no-op functions in production for optimal tree-shaking
 */
export const logger = isDevelopment
  ? {
      /**
       * Log informational messages (development only)
       */
      log: (...args: unknown[]): void => {
        console.log(...args);
      },

      /**
       * Log warning messages (development only)
       */
      warn: (...args: unknown[]): void => {
        console.warn(...args);
      },

      /**
       * Log error messages (always shown - errors should be visible)
       */
      error: (...args: unknown[]): void => {
        console.error(...args);
      },

      /**
       * Log debug messages (development only)
       */
      debug: (...args: unknown[]): void => {
        console.debug(...args);
      },

      /**
       * Log info messages (development only)
       */
      info: (...args: unknown[]): void => {
        console.info(...args);
      },

      /**
       * Group related logs (development only)
       */
      group: (label: string): void => {
        console.group(label);
      },

      /**
       * End log group (development only)
       */
      groupEnd: (): void => {
        console.groupEnd();
      },
    }
  : {
      // Production: all methods are no-ops except error
      log: noop,
      warn: noop,
      error: (...args: unknown[]): void => {
        console.error(...args);
      },
      debug: noop,
      info: noop,
      group: noop,
      groupEnd: noop,
    };

/**
 * Create a scoped logger with a prefix
 */
export function createScopedLogger(scope: string): {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
} {
  return {
    log: (...args: unknown[]) => logger.log(`[${scope}]`, ...args),
    warn: (...args: unknown[]) => logger.warn(`[${scope}]`, ...args),
    error: (...args: unknown[]) => logger.error(`[${scope}]`, ...args),
    debug: (...args: unknown[]) => logger.debug(`[${scope}]`, ...args),
    info: (...args: unknown[]) => logger.info(`[${scope}]`, ...args),
  };
}

