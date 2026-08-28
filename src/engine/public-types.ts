/**
 * Type-only re-exports from the CSS engine for the main bundle.
 * Build-time engine code lives under `src/engine/` and is used by the compile plugin.
 */
export type { CSSUtility } from "./types/utility-types";
export type { PseudoState } from "./parsing/pseudo-states";
export type { ParsedVariant } from "./parsing/variant";
