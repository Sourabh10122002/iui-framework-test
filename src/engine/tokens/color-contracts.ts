import { FRAMEWORK_SEMANTIC_PALETTE_NAMES } from "../../core/palette-registry";

/** CSS color keywords supported by utility classifiers. */
export const COLOR_KEYWORDS = [
  "white",
  "black",
  "transparent",
  "current",
  "inherit",
] as const;

/** Framework-managed palette name contracts (not user accent keys). */
export const FRAMEWORK_PALETTE_CONTRACTS = [
  "brand",
  "neutral",
  ...FRAMEWORK_SEMANTIC_PALETTE_NAMES,
] as const;

/** Static token catalog palette names still emitted as literal CSS vars. */
export const STATIC_TOKEN_PALETTE_PREFIXES = [
  ...COLOR_KEYWORDS,
  ...FRAMEWORK_PALETTE_CONTRACTS,
] as const;
