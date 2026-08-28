/**
 * Compile-first scan filter: keep tokens the engine can parse as real utilities.
 *
 * Prefix / standalone lists are generated from the engine for diagnostics only.
 * Acceptance gate: engine parse (non-arbitrary) or valid arbitrary utility shape.
 */
import {
  UTILITY_TOKEN_PREFIXES,
  STANDALONE_UTILITY_LIST,
} from "./generated-utility-prefixes.mjs";
import { parsesAsEngineUtility } from "./engine-parse-check.mjs";

export { UTILITY_TOKEN_PREFIXES };

/** @type {ReadonlySet<string>} */
export const STANDALONE_UTILITIES = new Set(STANDALONE_UTILITY_LIST);

/** @type {Set<string>} */
export const NON_UTILITY_TOKENS = new Set([
  "align-items", "align-self", "align-content",
  "justify-content", "justify-items", "justify-self",
  "place-content", "place-items", "place-self",
  // CSS property names (not utilities). Do NOT list `flex-wrap` here —
  // that token is both a CSS property and a valid IUI/Tailwind utility.
  "flex-direction", "flex-grow", "flex-shrink", "flex-basis",
  "grid-template-columns", "grid-template-rows", "grid-column", "grid-row",
  "background-color", "background-image", "border-radius", "border-width",
  "font-size", "font-weight", "font-family", "line-height", "letter-spacing",
  "text-decoration", "vertical-align", "box-shadow", "object-fit", "object-position",
  "margin-top", "margin-bottom", "margin-inline-start", "margin-inline-end",
  "padding-top", "padding-bottom", "padding-inline-start", "padding-inline-end",
  "transition-property", "transition-duration", "transition-delay",
  "transition-timing-function", "text-decoration-line",
  "min-width", "max-width", "min-height", "max-height",
  "min-inline-size", "max-inline-size", "min-block-size", "max-block-size",
  "min-w", "max-w", "min-h", "max-h", "min-is", "max-is", "min-bs", "max-bs",
  "box-sizing", "overscroll-behavior", "scroll-area", "filter-tags", "auto-emit",
  "grid-3x3", "font-preview-target", "font-preview-scale",
]);

/**
 * @param {string} token
 */
function stripVariants(token) {
  let remaining = token.startsWith("!") ? token.slice(1) : token;
  let changed = true;
  while (changed) {
    changed = false;
    const match = remaining.match(
      /^(?:dark|light|hover|focus|focus-visible|focus-within|active|visited|disabled|checked|required|valid|invalid|enabled|group-hover|group-focus|group-active|group-disabled|peer-hover|peer-focus|peer-active|peer-disabled|first|last|odd|even|empty|sm|md|lg|xl|2xl|motion-safe|motion-reduce|print|ltr|rtl|open|closed|placeholder|before|after|file|marker|selection|first-line|first-letter|backdrop|has-\[[^\]]+\]|aria-[\w-]+|data-[\w-]+|aria-\[[^\]]+\]|data-\[[^\]]+\]|group-data-\[[^\]]+\]|peer-data-\[[^\]]+\]):/,
    );
    if (match) {
      remaining = remaining.slice(match[0].length);
      changed = true;
      continue;
    }
    if (
      /^group-\[.+?\]:/.test(remaining) ||
      /^peer-\[.+?\]:/.test(remaining) ||
      /^group-data-\[.+?\]:/.test(remaining) ||
      /^peer-data-\[.+?\]:/.test(remaining)
    ) {
      remaining = remaining.replace(/^[^:]+:/, "");
      changed = true;
    }
  }
  return remaining;
}

/**
 * @param {string} token
 */
function hasBalancedBrackets(token) {
  let depth = 0;
  for (const ch of token) {
    if (ch === "[") depth += 1;
    if (ch === "]") depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/**
 * @param {string} token
 */
function withoutArbitrarySegments(token) {
  return token.replace(/\[[^\]]*\]/g, "[]");
}

/**
 * @param {string} base
 */
function isParenVarShorthand(base) {
  return /^!?[\w-]+-\([^)]+\)$/.test(base);
}

/**
 * @param {string} token
 */
export function hasInvalidUtilitySyntax(token) {
  if (!token) return true;

  const outsideArbitrary = withoutArbitrarySegments(token);
  const base = stripVariants(token);
  const allowParensOutside = isParenVarShorthand(base);

  if (/["'`;,]/.test(outsideArbitrary)) return true;
  if (!allowParensOutside && /[()]/.test(outsideArbitrary)) return true;

  const withoutDecimals = outsideArbitrary.replace(/\d+\.\d+/g, "0");
  if (/\./.test(withoutDecimals)) return true;

  if (token.includes("[")) {
    const base = stripVariants(token);
    if (base.includes("[")) {
      const isArbitraryUtility =
        /^!?[\w-]+-\[[^\]]+\]$/.test(base) ||
        /^!?\[[\w-]+:[^\]]+\]$/.test(base);
      if (!isArbitraryUtility) {
        return true;
      }
      if (base.includes("[...]")) return true;
      for (const match of base.matchAll(/\[([^\]]*)\]/g)) {
        const inner = match[1] ?? "";
        if (/[<>]/.test(inner)) return true;
        if (/\+\s*["']|["']\s*\+/.test(inner)) return true;
      }
    }
  }

  return false;
}

/**
 * @param {string} base
 */
function isArbitraryUtilityShape(base) {
  if (/^\[[\w-]+:[^\]]+\]$/.test(base)) return true;
  if (/^!?[\w-]+-\[[^\]]+\]$/.test(base)) {
    return !base.includes("[...]");
  }
  return false;
}

/**
 * @param {string} base
 */
function isLegacyMisnamedUtility(base) {
  if (/^column-w-/.test(base)) return true;
  if (/^column-rule-(solid|dashed|dotted|double|groove|ridge|inset|outset|hidden)$/.test(base)) {
    return true;
  }
  if (
    /^column-rule-(?!none$|thin$|medium$|thick$)(?:[a-z]+-\d{2,3}|[a-z]+-\[[^\]]+\])$/.test(
      base,
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Engine parse on full token, or on variant-stripped base when variants are unsupported.
 * @param {string} token
 */
function isEngineRecognizedUtility(token) {
  if (parsesAsEngineUtility(token)) return true;
  const base = stripVariants(token);
  if (base === token || base.includes("[")) return false;
  if (base.endsWith("-")) return false;
  return parsesAsEngineUtility(base);
}

/**
 * @param {string} token
 */
function isDocumentationPlaceholder(token) {
  if (/[<>]/.test(token)) return true;
  const base = stripVariants(token);
  if (/-[A-Z]$/.test(base)) return true;
  if (/\b(col|row)-(start|end)-N\b/.test(base)) return true;
  if (/^(inline-message|inline-radio|inline-built)(-|$)/.test(base)) return true;
  return false;
}

/**
 * @param {string} token
 * @returns {boolean}
 */
export function isStaticUtilityToken(token) {
  if (!token) return false;
  if (token.includes("${") || token.includes("`")) return false;
  if (!hasBalancedBrackets(token)) return false;
  if (token === ":" || token === ";" || token === ",") return false;
  if (token.endsWith(":")) return false;
  if (hasInvalidUtilitySyntax(token)) return false;
  if (isDocumentationPlaceholder(token)) return false;
  if (
    /^(?:bg|text|border|outline|ring|fill|stroke)-$/.test(stripVariants(token))
  ) {
    return false;
  }
  if (NON_UTILITY_TOKENS.has(stripVariants(token))) return false;
  // Docs wildcard / section titles / inspector region ids — never emit CSS.
  if (/-\*$/.test(stripVariants(token)) || stripVariants(token).includes("-*")) {
    return false;
  }
  if (/^gap-child-\d+$/.test(stripVariants(token))) return false;
  if (
    /^(writing-mode|inline-size|block-size|caption-side|transitions|transitions-animation|shadows|backface-visibility|container-type|container-name|perspective-origin|perspective-distance|font-style|font-variant-numeric|font-italic|font-roboto|animate-in|animate-search-modal-in|scale-down|rotate-ccw|place-content-normal|transition-allow-discrete|col-span-all|bottom-center|top-center|top-left-secondary)$/.test(
      stripVariants(token),
    )
  ) {
    return false;
  }
  // Physical directional shadows are documented but not emitted by the engine yet.
  if (/^shadow-[ltrb](?:-|$)/.test(stripVariants(token))) return false;
  // Incomplete variant-only markers (no utility after the variant).
  if (
    /^(?:dark:)?has-\[[^\]]+\]$/.test(token) ||
    /^(?:group|peer)-data-\[[^\]]+\]$/.test(token)
  ) {
    return false;
  }
  // Reject path-like prose tokens, but allow URLs/paths inside arbitrary values
  // (e.g. bg-[url(https://example.com/img.png)]).
  const outsideArbitrary = withoutArbitrarySegments(stripVariants(token));
  if (
    outsideArbitrary.startsWith("./") ||
    outsideArbitrary.startsWith("../") ||
    outsideArbitrary.includes("://") ||
    outsideArbitrary.startsWith("/") ||
    outsideArbitrary.startsWith("#")
  ) {
    return false;
  }

  const base = stripVariants(token);

  if (isLegacyMisnamedUtility(base)) return false;

  if (/^(group|peer)\/[\w-]+$/.test(base)) {
    return false;
  }

  if (/^[\w!.-]+\/[\w.-]+$/.test(base) && !base.includes("[")) {
    if (isEngineRecognizedUtility(token)) return true;
  }

  if (/^(overflow|space|translate|scroll)-(x|y)$/.test(base)) return false;
  if (/^(grid-cols|grid-rows)$/.test(base)) return false;
  if (/^inset-(start|end)$/.test(base)) return false;
  if (/^rounded-\*$/.test(base) || base === "rounded-X") return false;

  if (
    /^(top|bottom|left|right|start|end)-(start|end|left|right|top|bottom|stacked|side|align)$/.test(
      base,
    )
  ) {
    return false;
  }

  if (
    /^(block-level|inline-radio|inline-built|overflow-menu|line-dots|flex-column|flex-co|flex-col-2|flex-start|align-items-center|left-align|text-decoration-none|transition-border|select-optional|select-required|font-family-inter|extreme-start|extreme-end)$/.test(
      base,
    )
  ) {
    return false;
  }

  if (base.includes("[")) {
    return isArbitraryUtilityShape(base);
  }

  if (isParenVarShorthand(base)) {
    return true;
  }

  if (base.endsWith("-")) return false;

  return isEngineRecognizedUtility(token);
}

/**
 * @param {Set<string>} set
 * @param {string} raw
 */
export function addFilteredClassTokens(set, raw) {
  if (!raw) return;
  for (const part of raw.split(/\s+/)) {
    const token = part.trim();
    if (isStaticUtilityToken(token)) {
      set.add(token);
    }
  }
}
