import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { resolveGlobalAlias } from "./resolve-global-alias.mjs";

function readJsonAssets(viteRoot) {
  const configPath = join(viteRoot, "assets.config.json");
  if (!existsSync(configPath)) return null;
  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Global icon map for scan-time resolution (`assets.config.json` only — same as runtime).
 * @param {string} viteRoot
 */
export function readMergedGlobalIcons(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  return { ...(assetsJson?.icon?.globalIcons ?? {}) };
}

/**
 * Global mono-logo map for scan-time resolution (`assets.config.json` only).
 * @param {string} viteRoot
 */
export function readMergedGlobalLogos(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  return { ...(assetsJson?.logo?.globalLogos ?? {}) };
}

/**
 * Global color-logo map for scan-time resolution (`assets.config.json` only).
 * @param {string} viteRoot
 */
export function readMergedGlobalColorLogos(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  return { ...(assetsJson?.colorLogo?.globalColorLogos ?? {}) };
}

export function readMergedGlobalLoaders(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  return { ...(assetsJson?.loader?.globalLoaders ?? {}) };
}

export function readMergedGlobalEmojis(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  return { ...(assetsJson?.emoji?.globalEmojis ?? {}) };
}

/** Library-native fallback glyphs (mirrors Framework icon-fallback.ts). */
const LIBRARY_NATIVE_ICON_FALLBACK = {
  "material-symbols": "help",
  "material-icons": "help",
  lucide: "circle-help",
  phosphor: "question",
};

/**
 * Effective icon fallback glyph from assets.config.json (config or library default).
 * @param {string} viteRoot
 */
export function readIconFallbackFromConfig(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  const configured = assetsJson?.icon?.fallback;
  if (typeof configured === "string" && configured.trim().length > 0) {
    return configured.trim();
  }
  const library = assetsJson?.icon?.library ?? "material-symbols";
  return LIBRARY_NATIVE_ICON_FALLBACK[library] ?? LIBRARY_NATIVE_ICON_FALLBACK["material-symbols"];
}

/**
 * Reads default icon library from assets.config.json or iui.config.*.
 * @param {string} viteRoot
 */
export function readDefaultIconLibraryFromConfig(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  if (assetsJson?.icon?.library) {
    return assetsJson.icon.library;
  }

  return "material-symbols";
}

/**
 * Reads default illustration style (Storyset family) from config.
 * @param {string} viteRoot
 */
export function readDefaultIllustrationStyleFromConfig(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  if (assetsJson?.illustration?.style) {
    return assetsJson.illustration.style;
  }

  return "Amico";
}

/**
 * Reads effective preload tier from consumer config (mirrors warmSlotAssets defaults).
 * @param {string} viteRoot
 * @returns {"none" | "configured" | "scanned"}
 */
export function readAssetPreloadTierFromConfig(viteRoot) {
  const assetsJson = readJsonAssets(viteRoot);
  const iconPreload = assetsJson?.icon?.preload ?? assetsJson?.preload;
  if (iconPreload === "none" || iconPreload === "configured" || iconPreload === "scanned") {
    return iconPreload;
  }

  return "configured";
}

/**
 * Resolves a scanned icon slot `name` the same way as runtime {@link resolveIconSlot}.
 * @param {string} rawName
 * @param {Record<string, string>} globalIcons
 * @returns {string | null}
 */
export function resolveScannedIconName(rawName, globalIcons) {
  return resolveGlobalAlias(rawName, globalIcons ?? {});
}

const DEFAULT_SLOT_PLACEHOLDERS = {
  icon: "help",
  logo: "apple",
  "color-logo": "google-gmail",
  loader: "ring",
  illustration: "amico-1212-sale-hidden",
};

/**
 * Reads showcase placeholder asset names from assets.config.json / iui.config.*.
 * @param {string} viteRoot
 */
export function readSlotAssetPlaceholders(viteRoot) {
  const placeholders = { ...DEFAULT_SLOT_PLACEHOLDERS };

  const assetsJson = readJsonAssets(viteRoot);
  if (assetsJson?.icon?.placeholder?.name) {
    placeholders.icon = assetsJson.icon.placeholder.name;
  }
  if (assetsJson?.logo?.placeholder?.name) {
    placeholders.logo = assetsJson.logo.placeholder.name;
  }
  if (assetsJson?.colorLogo?.placeholder?.name) {
    placeholders["color-logo"] = assetsJson.colorLogo.placeholder.name;
  }
  if (assetsJson?.loader?.placeholder?.name) {
    placeholders.loader = assetsJson.loader.placeholder.name;
  } else if (assetsJson?.loader?.name) {
    placeholders.loader = assetsJson.loader.name;
  }
  if (assetsJson?.illustration?.placeholder?.name) {
    placeholders.illustration = assetsJson.illustration.placeholder.name;
  }

  return placeholders;
}

/**
 * Resolves scanned slot asset names (icons, logos, loaders) for build manifest.
 * @param {string} rawName
 * @param {string} slotType
 * @param {Record<string, string>} globalIcons
 * @param {Record<string, string>} slotPlaceholders
 * @param {Record<string, string>} [globalLogos]
 * @param {Record<string, string>} [globalColorLogos]
 * @param {Record<string, string>} [globalLoaders]
 * @param {Record<string, string>} [globalEmojis]
 */
export function resolveScannedSlotAssetName(
  rawName,
  slotType,
  globalIcons,
  slotPlaceholders,
  globalLogos = {},
  globalColorLogos = {},
  globalLoaders = {},
  globalEmojis = {},
) {
  if (!rawName || typeof rawName !== "string") return null;
  if (/\s/.test(rawName)) return null;

  if (rawName === "@placeholder" && slotPlaceholders[slotType]) {
    return slotPlaceholders[slotType];
  }

  if (slotType === "icon") {
    return resolveScannedIconName(rawName, globalIcons);
  }

  if (slotType === "logo") {
    return resolveGlobalAlias(rawName, globalLogos);
  }

  if (slotType === "color-logo") {
    return resolveGlobalAlias(rawName, globalColorLogos);
  }

  if (slotType === "loader") {
    return resolveGlobalAlias(rawName, globalLoaders);
  }

  if (slotType === "emoji") {
    return resolveGlobalAlias(rawName, globalEmojis);
  }

  if (rawName.startsWith("@")) {
    return rawName.slice(1);
  }

  return rawName;
}

/**
 * Unique glyph names from merged global icon map (for manifest baseline).
 * @param {Record<string, string>} globalIcons
 */
export function collectGlobalIconGlyphNames(globalIcons) {
  return [...new Set(Object.values(globalIcons).filter(Boolean))];
}

export function collectGlobalMapValues(globalMap) {
  return [...new Set(Object.values(globalMap ?? {}).filter(Boolean))];
}

const SLOT_TO_ASSET_CONFIG_KEY = {
  icon: "icon",
  logo: "logo",
  "color-logo": "colorLogo",
  flag: "flag",
  "file-type": "fileType",
  loader: "loader",
  illustration: "illustration",
  emoji: "emoji",
};

/**
 * Reads asset binding mode for a slot type from assets.config.json / iui.config.*.
 * @param {string} viteRoot
 * @param {string} slotType
 * @returns {"lazy" | "scanned"}
 */
export function readAssetBindingFromConfig(viteRoot, slotType) {
  const configKey = SLOT_TO_ASSET_CONFIG_KEY[slotType] ?? slotType;
  const assetsJson = readJsonAssets(viteRoot);
  const globalBinding = assetsJson?.binding === "scanned" ? "scanned" : "lazy";
  const perType = assetsJson?.[configKey]?.binding;
  if (perType === "scanned" || perType === "lazy") {
    return perType;
  }

  return globalBinding;
}

/**
 * @param {string} viteRoot
 * @param {string} slotType
 */
export function isScannedAssetBindingEnabled(viteRoot, slotType) {
  return readAssetBindingFromConfig(viteRoot, slotType) === "scanned";
}
