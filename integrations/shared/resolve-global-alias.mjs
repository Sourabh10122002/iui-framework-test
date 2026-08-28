/**
 * Resolve `@alias` keys against a global map from assets.config.json.
 * @param {string} rawName
 * @param {Record<string, string> | undefined} map
 * @returns {string | null}
 */

/** @param {string} key */
function normalizeGlobalAliasKey(key) {
  return key.replace(/-/g, "_");
}

/** @param {Record<string, string>} map @param {string} key */
function lookupGlobalAliasKey(map, key) {
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

export function resolveGlobalAlias(rawName, map) {
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
