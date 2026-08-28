/**
 * Generate compile-first utility prefix / standalone lists from the engine.
 *
 * Source of truth:
 *   - src/engine/core/parser.ts          (startsWith / === standalones)
 *   - src/utilities/class-utilities.ts   (tokenPatterns regexes)
 *
 * Output:
 *   integrations/shared/generated-utility-prefixes.mjs
 *
 * Run: node scripts/extract-utility-prefixes.mjs
 * CI:  test asserts generated file matches a fresh extract (no hand drift).
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join, normalize, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const NOISE = new Set([
  "true",
  "false",
  "class",
  "name",
  "type",
  "value",
  "style",
  "and",
  "or",
  "if",
  "else",
  "return",
  "const",
  "let",
  "var",
  "function",
  "string",
  "number",
  "object",
  "array",
  "null",
  "undefined",
  "export",
  "import",
  "default",
  "new",
  "this",
  "typeof",
  "category",
  "result",
  "match",
  "parts",
  "rest",
  "key",
  "map",
  "set",
  "get",
  "has",
  "add",
  "len",
  "idx",
  "str",
  "raw",
  "out",
  "tmp",
  "err",
  "msg",
  "ok",
  "id",
  "url",
  "path",
  "file",
  "line",
  "prop",
  "css",
  "html",
  "dom",
  "node",
  "react",
  "hook",
  "util",
  "utils",
  "core",
  "base",
  "yes",
  "no",
]);
// Keep real utility first-segments (auto-cols, from-/via-/to-, not-italic, …).

/**
 * @param {string} segment
 * @param {Set<string>} into
 */
function addFirstSegment(segment, into) {
  if (!segment) return;
  const s = segment.toLowerCase();
  if (!/^[a-z][a-z0-9]*$/.test(s)) return;
  if (NOISE.has(s)) return;
  into.add(s);
}

/**
 * @param {string} prefix
 * @param {Set<string>} into
 */
function addFromClassPrefix(prefix, into) {
  const body = prefix.endsWith("-") ? prefix.slice(0, -1) : prefix;
  if (!body) return;
  addFirstSegment(body.split("-")[0] ?? body, into);
}

/**
 * Strip leading optional negative patterns from regex bodies.
 * Handles `(-?)`, `(?:-)?`, and `-?` prefixes.
 * @param {string} body
 */
function stripOptionalNegative(body) {
  return body.replace(/^(?:\(-\?\)|\(\?:-\?\)\?|-\\?)/, "");
}

/**
 * Collect first-segment prefixes + standalone tokens from engine sources.
 * @returns {{ prefixes: string[], standalones: string[] }}
 */
export function collectUtilityPrefixesFromEngine() {
  const parser = readFileSync(join(root, "src/engine/core/parser.ts"), "utf8");
  const classUtil = readFileSync(
    join(root, "src/utilities/class-utilities.ts"),
    "utf8",
  );

  /** @type {Set<string>} */
  const firstSegments = new Set();
  /** @type {Set<string>} */
  const standalones = new Set();

  for (const m of parser.matchAll(/startsWith\(\s*["']([^"']+)["']\s*\)/g)) {
    addFromClassPrefix(m[1], firstSegments);
  }

  for (const m of parser.matchAll(
    /(?:baseClass|token)\s*===\s*["']([a-z][a-z0-9-]*)["']/gi,
  )) {
    const token = m[1].toLowerCase();
    standalones.add(token);
    addFirstSegment(token.split("-")[0] ?? token, firstSegments);
  }

  // tokenPatterns: /^…$/
  for (const m of classUtil.matchAll(/\/\^((?:\\.|[^/\\])+)\$\//g)) {
    let body = m[1];
    // drop optional leading !
    body = body.replace(/^!\\?/, "");

    // Exact alts: (a|b|c)
    const exactAlts = body.match(/^\(([^)]+)\)$/);
    if (exactAlts && !/[\\[.*+?{}]/.test(exactAlts[1].replace(/\|/g, ""))) {
      for (const alt of exactAlts[1].split("|")) {
        if (/^[a-z][a-z0-9-]*$/i.test(alt)) {
          const t = alt.toLowerCase();
          standalones.add(t);
          addFirstSegment(t.split("-")[0] ?? t, firstSegments);
        }
      }
      continue;
    }

    // Leading literal before regex metacharacters
    const normalized = stripOptionalNegative(body);
    const lit = normalized.match(/^([a-z][a-z0-9-]*)/i);
    if (lit) {
      addFromClassPrefix(lit[1], firstSegments);
    }
  }

  // Display / position / typography standalones commonly matched as exact tokens
  for (const s of [
    "flex",
    "grid",
    "block",
    "inline",
    "inline-block",
    "inline-flex",
    "inline-grid",
    "contents",
    "flow-root",
    "hidden",
    "visible",
    "invisible",
    "collapse",
    "static",
    "fixed",
    "absolute",
    "relative",
    "sticky",
    "truncate",
    "grow",
    "shrink",
    "uppercase",
    "lowercase",
    "capitalize",
    "normal-case",
    "underline",
    "overline",
    "line-through",
    "no-underline",
    "sr-only",
    "not-sr-only",
    "antialiased",
    "subpixel-antialiased",
    "italic",
    "not-italic",
    "border",
    "rounded",
    "shadow",
    "outline",
    "ring",
    "container",
    "table",
    "table-row",
    "table-cell",
    "table-column",
    "table-column-group",
    "table-header-group",
    "table-footer-group",
    "table-row-group",
    "list-item",
    "isolate",
    "isolation-auto",
    "ordinal",
    "slashed-zero",
    "lining-nums",
    "oldstyle-nums",
    "proportional-nums",
    "tabular-nums",
    "diagonal-fractions",
    "stacked-fractions",
    "normal-nums",
    "transform",
    "transform-none",
    "transform-gpu",
    "transform-cpu",
    "filter",
    "filter-none",
    "backdrop-filter",
    "backdrop-filter-none",
    "appearance-none",
    "pointer-events-none",
    "pointer-events-auto",
    "resize",
    "resize-none",
    "resize-y",
    "resize-x",
    "select-none",
    "select-text",
    "select-all",
    "select-auto",
  ]) {
    standalones.add(s);
    addFirstSegment(s.split("-")[0] ?? s, firstSegments);
  }

  const prefixes = [...firstSegments].sort();
  const standaloneList = [...standalones]
    .filter((s) => /^[a-z][a-z0-9-]*$/.test(s))
    .sort();

  return { prefixes, standalones: standaloneList };
}

/**
 * @param {{ prefixes: string[], standalones: string[] }} data
 */
export function formatGeneratedModule(data) {
  return `/** Auto-generated by scripts/extract-utility-prefixes.mjs — do not edit.
 * Source of truth: src/engine/core/parser.ts + src/utilities/class-utilities.ts
 * Re-run: node scripts/extract-utility-prefixes.mjs
 */

/** @type {readonly string[]} */
export const UTILITY_TOKEN_PREFIXES = ${JSON.stringify(data.prefixes, null, 2)};

/** @type {readonly string[]} */
export const STANDALONE_UTILITY_LIST = ${JSON.stringify(data.standalones, null, 2)};
`;
}

function isExecutedAsCli() {
  const entry = process.argv[1];
  if (!entry) return false;
  return (
    normalize(resolve(entry)).toLowerCase() ===
    normalize(fileURLToPath(import.meta.url)).toLowerCase()
  );
}

if (isExecutedAsCli()) {
  const data = collectUtilityPrefixesFromEngine();
  const outPath = join(
    root,
    "integrations/shared/generated-utility-prefixes.mjs",
  );
  writeFileSync(outPath, formatGeneratedModule(data), "utf8");
  console.log(
    `[extract-utility-prefixes] ${data.prefixes.length} prefixes, ${data.standalones.length} standalones → ${outPath}`,
  );
}
