/**
 * List marker contract — aligned with Tailwind CSS list utilities, with IUI extensions.
 *
 * **Tailwind core:** `list-none`, `list-disc`, `list-decimal`, `list-inside`, `list-outside`,
 * `list-image-none` (same class strings as TW).
 *
 * **IUI ordered extensions (Word-style, composable like `list-disc list-outside`):**
 * - **System:** `list-decimal`, `list-upper-roman`, …
 * - **Suffix (separate tokens):** `list-period`, `list-parentheses`, `list-double-parentheses`
 * - Example: `list-upper-roman list-parentheses` → `A)`, `B)`, …
 * - One-class shorthands (`list-decimal-parentheses`) still compile for convenience.
 */

/** Numbering systems — Tailwind `list-decimal` plus theme-style extensions. */
export const ORDERED_LIST_SYSTEMS = [
  "decimal",
  "decimal-leading-zero",
  "upper-roman",
  "upper-alpha",
  "lower-alpha",
  "lower-roman",
] as const;

export type OrderedListSystem = (typeof ORDERED_LIST_SYSTEMS)[number];

/** Marker layout tokens — compose with any ordered system utility. */
export const ORDERED_LIST_SUFFIXES = [
  "period",
  "parentheses",
  "double-parentheses",
] as const;

export type OrderedListSuffix = (typeof ORDERED_LIST_SUFFIXES)[number];

/** `@counter-style` suffix segment (`iui-ol-{system}-{key}`). */
export const ORDERED_SUFFIX_COUNTER_KEYS: Record<
  OrderedListSuffix,
  "dot" | "rparen" | "dparens"
> = {
  period: "dot",
  parentheses: "rparen",
  "double-parentheses": "dparens",
};

/** After `list-`: ordered numbering systems only. */
export const LIST_ORDERED_SYSTEM_SOURCE =
  "decimal(?:-leading-zero)?|(upper-roman|upper-alpha|lower-alpha|lower-roman)";

/** After `list-`: composable suffix utilities. */
export const LIST_ORDERED_SUFFIX_SOURCE =
  "period|parentheses|double-parentheses";

/** After `list-`: systems, compounds, and legacy one-class suffix forms. */
export const LIST_ORDERED_REST_SOURCE = `${LIST_ORDERED_SYSTEM_SOURCE}|decimal-(?:period|parentheses|double-parentheses)|decimal-leading-zero-(?:period|parentheses|double-parentheses)|(?:upper-roman|upper-alpha|lower-alpha|lower-roman)-(?:period|parentheses|double-parentheses)`;

/**
 * After `list-`: unordered markers.
 * Tailwind: `none`, `disc`. IUI extensions: `square`, symbols, disclosure.
 * Legacy duplicate names (`bullet`, `circle`, `pointer`, arrow aliases) parse but are not documented.
 */
export const LIST_UNORDERED_REST_SOURCE =
  "none|disclosure-closed|disclosure-open|square-double|square-hollow|diamond-cluster|diamond-outline|arrow-across|down-arrow|diamond|arrowhead|disc|square|star|plus|minus|dash|check|tick|cross|smiley|frown|x-mark|bullet|circle|pointer|right-arrow|arrow-right";

export const LIST_ORDERED_SYSTEM_RE = new RegExp(
  `^(${LIST_ORDERED_SYSTEM_SOURCE})$`,
);
export const LIST_ORDERED_SUFFIX_RE = new RegExp(
  `^(${LIST_ORDERED_SUFFIX_SOURCE})$`,
);
export const LIST_ORDERED_REST_RE = new RegExp(
  `^(${LIST_ORDERED_REST_SOURCE})$`,
);
export const LIST_UNORDERED_REST_RE = new RegExp(
  `^(${LIST_UNORDERED_REST_SOURCE})$`,
);

/** `@counter-style` id for ordered system + suffix layout. */
export function orderedCounterStyleId(
  system: string,
  suffix: OrderedListSuffix,
): string {
  const key = ORDERED_SUFFIX_COUNTER_KEYS[suffix];
  if (system === "decimal-leading-zero") {
    return suffix === "period"
      ? "iui-ol-decimal-leading-zero"
      : `iui-ol-decimal-leading-zero-${key}`;
  }
  return `iui-ol-${system}-${key}`;
}

/** CSS vars for composable ordered system utilities (`list-decimal`, …). */
export function buildOrderedSystemListProperties(
  system: OrderedListSystem,
): Record<string, string> {
  const dot = orderedCounterStyleId(system, "period");
  const rparen = orderedCounterStyleId(system, "parentheses");
  const dparens = orderedCounterStyleId(system, "double-parentheses");
  return {
    "--iui-ol-counter-dot": dot,
    "--iui-ol-counter-rparen": rparen,
    "--iui-ol-counter-dparens": dparens,
    "--iui-ol-counter": "var(--iui-ol-counter-dot)",
    "list-style-type": "var(--iui-ol-counter)",
  };
}

/** CSS vars for composable suffix utilities (`list-parentheses`, …). */
export function buildOrderedSuffixListProperties(
  suffix: OrderedListSuffix,
): Record<string, string> {
  const key = ORDERED_SUFFIX_COUNTER_KEYS[suffix];
  const varName = `--iui-ol-counter-${key}`;
  return {
    "--iui-ol-counter": `var(${varName}, var(--iui-ol-counter-dot))`,
    "list-style-type": "var(--iui-ol-counter)",
  };
}

/** Compound token `decimal-parentheses` → counter id (one-class shorthand). */
export function resolveOrderedCompoundToken(rest: string): string | null {
  const match = rest.match(
    /^(decimal(?:-leading-zero)?|upper-roman|upper-alpha|lower-alpha|lower-roman)-(period|parentheses|double-parentheses)$/,
  );
  if (!match) return null;
  const [, system, suffix] = match;
  return orderedCounterStyleId(system, suffix as OrderedListSuffix);
}

/** Class list for system + optional suffix (TW-style composition). */
export function orderedListUtilityClass(
  system: OrderedListSystem,
  suffix: OrderedListSuffix = "period",
): string[] {
  if (suffix === "period") return [`list-${system}`];
  return [`list-${system}`, `list-${suffix}`];
}

/** All system × suffix combinations as composable class lists. */
export function orderedListUtilityMatrix(): string[][] {
  const combos: string[][] = [];
  for (const system of ORDERED_LIST_SYSTEMS) {
    for (const suffix of ORDERED_LIST_SUFFIXES) {
      combos.push(orderedListUtilityClass(system, suffix));
    }
  }
  return combos;
}
