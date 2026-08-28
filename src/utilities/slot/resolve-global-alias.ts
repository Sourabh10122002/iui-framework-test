/**
 * Resolve `@alias` keys against a global map from assets.config.json.
 * Returns the mapped glyph, the literal name when no `@` prefix, or `null` when
 * an `@alias` is missing from the map.
 */

/** Normalize alias key variants (`check-circle` → `check_circle`) for lookup only. */
export function normalizeGlobalAliasKey(key: string): string {
  return key.replace(/-/g, "_");
}

function lookupGlobalAliasKey(
  map: Record<string, string>,
  key: string,
): string | null {
  if (Object.prototype.hasOwnProperty.call(map, key) && map[key]) {
    return map[key];
  }
  const normalized = normalizeGlobalAliasKey(key);
  if (
    normalized !== key &&
    Object.prototype.hasOwnProperty.call(map, normalized) &&
    map[normalized]
  ) {
    return map[normalized];
  }
  return null;
}

export function resolveGlobalAlias(
  rawName: string,
  map: Record<string, string> | undefined,
): string | null {
  if (!rawName || typeof rawName !== "string") return null;
  if (/\s/.test(rawName)) return null;

  if (!rawName.startsWith("@")) {
    return rawName;
  }

  const key = rawName.slice(1);
  if (!key) return null;

  if (key === "placeholder") {
    return null;
  }

  const icons = map ?? {};
  return lookupGlobalAliasKey(icons, key);
}
