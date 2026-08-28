/**
 * Backward-compatible no-ops for apps and libraries still calling runtime CSS hooks.
 * Under compile-first, utilities are emitted by the build plugin instead.
 */

/** @deprecated Arbitrary utilities are resolved at build time when the IUI plugin is active. */
export function useArbitraryValues(): void {}

/** @deprecated Arbitrary utilities are resolved at build time when the IUI plugin is active. */
export function initializeArbitraryValues(): void {}

/** @deprecated Utility CSS is emitted at build time when the IUI plugin is active. */
export function processClasses(_classes: string | string[]): void {}

/** @deprecated Legacy theme boot hook — no-op under compile-first. */
export function prefetchUtilities(): void {}
