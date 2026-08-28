/**
 * Normalize loader slot names to ldrs / @inventive-ui/loaders canonical kebab-case ids
 * (e.g. `DotPulse` → `dot-pulse`, `ring2` → `ring-2`).
 */
export function normalizeLoaderName(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([a-zA-Z])(\d)/g, "$1-$2")
    .replace(/(\d)([a-zA-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}
