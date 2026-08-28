import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const frameworkRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Load postcss from the framework package or the consuming project.
 * @returns {typeof import("postcss") | null}
 */
function loadPostcss() {
  const candidates = [
    () => require("postcss"),
    () => require(join(frameworkRoot, "node_modules/postcss")),
    () => require(join(process.cwd(), "node_modules/postcss")),
  ];
  for (const load of candidates) {
    try {
      return load();
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Custom-property / var() names must stay CSS-ident safe. Quotes mid-name mean
 * a polluted scan token was interpolated into a declaration value.
 * Font stacks like `var(--font, "Inter", sans-serif)` remain valid (quote after `,`).
 * @param {string} css
 * @param {string} label
 */
function assertNoPollutedCustomProperties(css, label) {
  // e.g. var(--iui-color-transparent";) — quote inside the first var() argument name
  const brokenVar = css.match(/var\(\s*--[^,)\s{]*["']/);
  if (brokenVar) {
    throw new Error(
      `[${label}] Invalid CSS: custom property reference contains a quote ` +
        `(polluted scan token). Near: ${brokenVar[0].slice(0, 96)}`,
    );
  }
  // e.g. --iui-color-transparent": ... (quote glued to the property name)
  const brokenName = css.match(/--[a-zA-Z0-9_-]*["']/);
  if (brokenName) {
    throw new Error(
      `[${label}] Invalid CSS: custom property name contains a quote. Near: ${brokenName[0]}`,
    );
  }
}

/**
 * Selectors that escaped string-literal debris (quote + trailing `,`/`;`).
 * Valid arbitrary utilities escape quotes only inside `\[...\]`
 * (e.g. `.font-features-\[\'smcp\'\,\'onum\'\]`).
 * @param {string} css
 * @param {string} label
 */
function assertNoPollutedSelectors(css, label) {
  // Ignore escaped arbitrary segments so legitimate quote/comma values aren't flagged.
  const withoutArbitrary = css.replace(/\\\[[\s\S]*?\\\]/g, "[]");
  // .border-transparent\"\; or .gap-1\.5\"\,  (debris outside \[...\])
  const polluted = withoutArbitrary.match(/\.[^{}/\n]*\\["']\\[;,]/);
  if (polluted) {
    throw new Error(
      `[${label}] Invalid CSS: selector contains escaped quote + punctuation ` +
        `from scan pollution. Near: ${polluted[0].slice(0, 96)}`,
    );
  }
}

function stripCounterStyleBlocks(css) {
  return css.replace(/@counter-style[\s\S]*?\}/g, "");
}

/**
 * Reject declaration values that embed JS string concatenation (scan → emit leak).
 * @param {string} css
 * @param {string} label
 */
function assertNoJsConcatDebris(css, label) {
  const hit = stripCounterStyleBlocks(css).match(
    /:\s*[^;{}]*["']\s*\+|:\s*[^;{}]*\+\s*["']/,
  );
  if (hit) {
    throw new Error(
      `[${label}] Invalid CSS: declaration looks like JS string concatenation. Near: ${hit[0].slice(0, 96)}`,
    );
  }
}

/**
 * @param {string} css
 * @param {string} label
 */
function assertBalancedBraces(css, label) {
  let depth = 0;
  let inStr = false;
  let strCh = "";
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (inStr) {
      if (ch === strCh && css[i - 1] !== "\\") inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      strCh = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth < 0) {
        throw new Error(`[${label}] Invalid CSS: unmatched closing brace near index ${i}`);
      }
    }
  }
  if (depth !== 0) {
    throw new Error(`[${label}] Invalid CSS: unbalanced braces (depth=${depth})`);
  }
}

/**
 * Fail loud if generated compile-first CSS is not valid CSS.
 * Industry gate: never write a stylesheet browsers will partially discard.
 *
 * @param {string} css
 * @param {{ source?: string }} [options]
 */
export function assertValidGeneratedCss(css, options = {}) {
  const label = options.source ?? "IUI build CSS";
  if (typeof css !== "string") {
    throw new Error(`[${label}] Expected CSS string, got ${typeof css}`);
  }
  if (!css.trim()) return;

  // Catch pollutions before brace/string walking (broken quotes confuse balance checks).
  assertNoPollutedCustomProperties(css, label);
  assertNoPollutedSelectors(css, label);
  assertNoJsConcatDebris(css, label);
  assertBalancedBraces(css, label);

  const postcss = loadPostcss();
  if (!postcss) {
    return;
  }

  try {
    postcss.parse(css);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `[${label}] Generated CSS failed to parse (${message}). ` +
        `Fix scan pollution or the CSS emitter — refusing to write invalid build styles.`,
      { cause: error },
    );
  }
}
