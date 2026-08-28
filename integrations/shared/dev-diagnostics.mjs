import { looksLikeUtilityClass } from "./utility-registry.mjs";

/**
 * Warn when scanned utility-like classes were not built by the CSS generator.
 * Uses generator truth (built vs uncovered), not CSS substring matching.
 *
 * @param {string[]} uncoveredClasses
 */
export function warnUncoveredBuildClasses(uncoveredClasses) {
  if (process.env.NODE_ENV === "production") return;

  const actionable = [];
  for (const className of uncoveredClasses) {
    if (!className || className.length < 2) continue;
    if (!looksLikeUtilityClass(className)) continue;
    actionable.push(className);
  }
  if (actionable.length === 0) return;

  const MAX = 8;
  for (const className of actionable.slice(0, MAX)) {
    console.warn(
      `[IUI Dev] Class "${className}" was scanned but produced no CSS. Use logical utilities (start/end, ps/pe, text-start/text-end) or add to build.safelist.`,
    );
  }
  if (actionable.length > MAX) {
    console.warn(
      `[IUI Dev] …and ${actionable.length - MAX} more uncovered classes (${actionable.length} total).`,
    );
  }
}
