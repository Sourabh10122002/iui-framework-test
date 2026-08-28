/**
 * SSR (Server-Side Rendering) Utilities
 *
 * Industry-standard utilities for checking execution environment
 * Used throughout the framework to ensure SSR compatibility
 */

/**
 * Cached browser check result (computed once at module load)
 * This avoids repeated typeof checks and improves performance
 */
const _isBrowser = typeof window !== "undefined" && typeof document !== "undefined";

/**
 * Check if code is running in browser environment
 * Uses cached result for optimal performance
 */
export const isBrowser = (): boolean => _isBrowser;

/**
 * Check if code is running in Node.js environment
 */
export const isNode = (): boolean => {
  return (
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null
  );
};

/**
 * Check if code is running in Next.js environment
 */
export const isNextJS = (): boolean => {
  if (!isNode()) return false;
  try {
    // Check for Next.js specific environment variables
    return (
      process.env.NEXT_PUBLIC_BASE_PATH !== undefined ||
      process.env.NEXT_RUNTIME !== undefined ||
      typeof (global as any).__NEXT_DATA__ !== "undefined"
    );
  } catch {
    return false;
  }
};

/**
 * Safely access window object
 */
export const getWindow = (): Window | undefined => {
  return typeof window !== "undefined" ? window : undefined;
};

/**
 * Safely access document object
 */
export const getDocument = (): Document | undefined => {
  return typeof document !== "undefined" ? document : undefined;
};

/**
 * Execute function only in browser
 */
export const browserOnly = <T>(fn: () => T): T | undefined => {
  if (isBrowser()) {
    return fn();
  }
  return undefined;
};

/**
 * Execute function only on server
 */
export const serverOnly = <T>(fn: () => T): T | undefined => {
  if (!isBrowser()) {
    return fn();
  }
  return undefined;
};
