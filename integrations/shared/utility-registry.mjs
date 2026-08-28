/**
 * Known utility prefixes for compile-first dev diagnostics.
 * Same engine-generated source as `utility-token-filter.mjs`.
 */
import {
  UTILITY_TOKEN_PREFIXES,
  STANDALONE_UTILITY_LIST,
} from "./generated-utility-prefixes.mjs";

/** @type {ReadonlySet<string>} */
const PREFIX_SET = new Set(UTILITY_TOKEN_PREFIXES);
/** @type {ReadonlySet<string>} */
const STANDALONE = new Set(STANDALONE_UTILITY_LIST);

/** @deprecated Prefer PREFIX_SET via looksLikeUtilityClass; kept for callers that iterate prefixes. */
export const UTILITY_PREFIXES = UTILITY_TOKEN_PREFIXES.map((p) => `${p}-`);

/**
 * Heuristic: does this token look like an IUI/Tailwind-style utility?
 * @param {string} className
 */
export function looksLikeUtilityClass(className) {
  if (!className || typeof className !== "string") return false;
  const token = className.trim();
  if (!token) return false;
  if (token.includes("[")) return true;
  if (STANDALONE.has(token)) return true;
  const first = token.split("-")[0] ?? token;
  return PREFIX_SET.has(first);
}
