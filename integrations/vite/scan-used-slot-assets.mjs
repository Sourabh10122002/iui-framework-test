import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { findInventiveUiNodeModulesRoot, resolveAssetSubpath } from "./asset-packages.mjs";
import {
  readMergedGlobalIcons,
  readMergedGlobalLogos,
  readMergedGlobalColorLogos,
  readMergedGlobalLoaders,
  readMergedGlobalEmojis,
  readDefaultIconLibraryFromConfig,
  readDefaultIllustrationStyleFromConfig,
  resolveScannedSlotAssetName,
  readSlotAssetPlaceholders,
  readAssetPreloadTierFromConfig,
  collectGlobalIconGlyphNames,
  collectGlobalMapValues,
  readIconFallbackFromConfig,
} from "../shared/resolve-scanned-icon-name.mjs";

function normalizeIconLibraryId(library) {
  if (library === "materialSymbols") return "material-symbols";
  return library;
}
/** Slot `library` values → published package folder under @inventive-ui. */
const LIBRARY_TO_PKG = {
  lucide: "icons-lucide",
  phosphor: "icons-phosphor",
  material: "icons-material",
  "material-icons": "icons-material",
  materialSymbols: "material-symbols",
  "material-symbols": "material-symbols",
  logos: "logos",
  "color-logos": "color-logos",
  flagpack: "flags",
  flags: "flags",
  "file-types": "file-types",
  loaders: "loaders",
  illustration: "illustrations",
  illustrations: "illustrations",
};

const RESERVED_SUBPATHS = new Set(["react", "vanilla", "utils"]);

const STATIC_SUBPATH_RE =
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]@inventive-ui\/(icons-lucide|icons-phosphor|icons-material|material-symbols|logos|color-logos|flags|file-types|loaders)\/([^'"]+)['"]/g;

const ILLUSTRATION_SUBPATH_RE =
  /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]@inventive-ui\/illustrations\/(amico|bro|cuate|pana|rafiki)\/([^'"]+)['"]/g;

function normalizeSnakeCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
    .replace(/-/g, "_")
    .toLowerCase()
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizeKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/_/g, "-")
    .toLowerCase();
}

const PKG_NORMALIZE = {
  "material-symbols": normalizeSnakeCase,
  "icons-material": normalizeSnakeCase,
  "icons-lucide": normalizeKebabCase,
  "icons-phosphor": normalizeKebabCase,
  logos: (name) => name.toLowerCase(),
  "color-logos": (name) => name.toLowerCase(),
  flags: (name) => name.toLowerCase(),
  "file-types": (name) => name.toLowerCase(),
  loaders: (name) => name.toLowerCase(),
};

const SLOT_TYPE_TO_PKG = {
  icon: null,
  logo: "logos",
  "color-logo": "color-logos",
  flag: "flags",
  "file-type": "file-types",
  loader: "loaders",
  illustration: "illustrations",
};

const SLOT_PLACEHOLDER = "@placeholder";
const DEFAULT_FLAG_PLACEHOLDER = "US";
const DEFAULT_FILETYPE_EXTENSION = "pdf";

const FILETYPE_EXTENSION_ALIASES = {
  doc: "word",
  docx: "word",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  mp4: "video",
  mov: "video",
};

function readAssetsConfig(viteRoot) {
  const configPath = join(viteRoot, "assets.config.json");
  if (!existsSync(configPath)) return {};

  try {
    return JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    return {};
  }
}

function readDefaultIconLibrary(viteRoot) {
  return readDefaultIconLibraryFromConfig(viteRoot);
}

function readFlagPlaceholderCode(viteRoot) {
  const assets = readAssetsConfig(viteRoot);
  const raw = assets?.flag?.placeholder;
  if (typeof raw === "string" && raw.length > 0) {
    return raw;
  }
  if (raw && typeof raw === "object" && typeof raw.code === "string") {
    return raw.code;
  }
  return DEFAULT_FLAG_PLACEHOLDER;
}

function readFileTypePlaceholderExtension(viteRoot) {
  const assets = readAssetsConfig(viteRoot);
  return assets?.["file-type"]?.placeholder?.extension
    ?? assets?.fileType?.placeholder?.extension
    ?? DEFAULT_FILETYPE_EXTENSION;
}

function normalizeFlagCode(code) {
  if (code && typeof code === "object" && typeof code.code === "string") {
    code = code.code;
  }
  if (typeof code !== "string") {
    return DEFAULT_FLAG_PLACEHOLDER.toLowerCase().trim();
  }
  return code.toLowerCase().trim();
}

function resolveFileTypeSubpath(input) {
  let ext = input.trim();
  if (ext.includes("/") || ext.includes("\\")) {
    ext = ext.split(/[/\\]/).pop() || ext;
  }
  if (ext.includes(".")) {
    ext = ext.slice(ext.lastIndexOf(".") + 1);
  }
  ext = ext.replace(/^\./, "").toLowerCase();
  const safe = ext.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  const base = safe || "unknown";
  return FILETYPE_EXTENSION_ALIASES[base] ?? base;
}

function globToRegExp(glob) {
  return new RegExp(
    glob
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*\*/g, "\0GLOBSTAR\0")
      .replace(/\*/g, "[^/]*")
      .replace(/\0GLOBSTAR\0/g, ".*"),
  );
}

function globToExcludeRegExp(glob) {
  return globToRegExp(glob);
}

function walkSourceFiles(dir, out = [], includePattern = null, excludePatterns = []) {
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      walkSourceFiles(fullPath, out, includePattern, excludePatterns);
      continue;
    }
    if (!/\.(tsx?|jsx?|mdx?)$/.test(entry)) continue;
    const normalized = fullPath.replace(/\\/g, "/");
    if (excludePatterns.some((pattern) => pattern.test(normalized))) continue;
    if (includePattern && !includePattern.test(normalized)) continue;
    out.push(fullPath);
  }

  return out;
}

const PKG_LOOKUP_PREFIX = {
  "icons-lucide": "./icons/",
  "icons-phosphor": "./icons/",
  "icons-material": "./icons/",
  "material-symbols": "./icons/",
  logos: "./logos/",
  "color-logos": "./logos/",
  flags: "./flags/",
  "file-types": "./types/",
  loaders: "./loaders/",
};

/** Style / doc tokens that regex scans sometimes capture as icon names. */
const NON_GLYPH_SCAN_NAMES = new Set(["outline", "regular", "filled", "solid", "bold", "light"]);

function addAsset(registry, provenance, pkg, key, origin) {
  if (!pkg || !key) return;
  if (!registry.has(pkg)) registry.set(pkg, new Set());
  registry.get(pkg).add(key);

  if (!provenance.has(pkg)) provenance.set(pkg, new Map());
  const pkgProvenance = provenance.get(pkg);
  if (!pkgProvenance.has(key)) pkgProvenance.set(key, new Set());
  pkgProvenance.get(key).add(origin);
}

function shouldSkipScannedAssetName(rawName) {
  if (!rawName || typeof rawName !== "string") return true;
  if (/\s/.test(rawName)) return true;
  if (/[$`{}%\\]/.test(rawName)) return true;
  if (rawName.includes("…") || rawName.includes("${")) return true;
  if (/escape-jsx/i.test(rawName)) return true;
  if (NON_GLYPH_SCAN_NAMES.has(rawName)) return true;
  return false;
}

/** Innermost `{ ... }` object that contains `anchorIndex` (avoids cross-slot name bleed). */
function extractEnclosingObject(content, anchorIndex) {
  let depth = 0;
  for (let i = anchorIndex; i >= 0; i--) {
    const ch = content[i];
    if (ch === "}") depth++;
    else if (ch === "{") {
      if (depth === 0) {
        const start = i;
        let openDepth = 0;
        for (let j = start; j < content.length; j++) {
          if (content[j] === "{") openDepth++;
          else if (content[j] === "}") {
            openDepth--;
            if (openDepth === 0) return content.slice(start, j + 1);
          }
        }
        return null;
      }
      depth--;
    }
  }
  return null;
}

function resolveNamedAssetSlotType(pkg) {
  if (pkg === "logos") return "logo";
  if (pkg === "color-logos") return "color-logo";
  if (pkg === "loaders") return "loader";
  return "icon";
}

const SLOT_GLOBAL_MAP_HINT = {
  icon: "icon.globalIcons",
  logo: "logo.globalLogos",
  "color-logo": "colorLogo.globalColorLogos",
  loader: "loader.globalLoaders",
  emoji: "emoji.globalEmojis",
};

function resolveNamedAssetLookupKey(pkg, rawName, scanContext = null) {
  if (!PKG_LOOKUP_PREFIX[pkg] || RESERVED_SUBPATHS.has(rawName)) return null;
  if (shouldSkipScannedAssetName(rawName)) return null;

  let glyphName = rawName;
  if (scanContext) {
    const resolved = resolveScannedSlotAssetName(
      rawName,
      resolveNamedAssetSlotType(pkg),
      scanContext.globalIcons,
      scanContext.slotPlaceholders,
      scanContext.globalLogos,
      scanContext.globalColorLogos,
      scanContext.globalLoaders,
      scanContext.globalEmojis,
    );
    if (resolved != null) {
      glyphName = resolved;
    } else if (rawName.startsWith("@")) {
      const slotType = resolveNamedAssetSlotType(pkg);
      const hint = SLOT_GLOBAL_MAP_HINT[slotType] ?? "icon.globalIcons";
      console.warn(
        `[inventive-ui/scan] Unmapped @alias "${rawName}" — add it to assets.config.json ${hint} (skipped from manifest)`,
      );
      return null;
    }
    if (shouldSkipScannedAssetName(glyphName)) return null;
  }

  const normalized = normalizeAssetKey(pkg, glyphName);
  return `${PKG_LOOKUP_PREFIX[pkg]}${normalized}.js`;
}

function assetExistsOnDisk(projectRoot, pkg, lookupKey) {
  const modId = lookupKeyToModuleId(pkg, lookupKey);
  return Boolean(resolveAssetSubpath(projectRoot, modId));
}

function addNamedAsset(registry, provenance, pkg, rawName, scanContext, origin) {
  const lookupKey = resolveNamedAssetLookupKey(pkg, rawName, scanContext);
  if (!lookupKey) return;
  addAsset(registry, provenance, pkg, lookupKey, origin);
}

function resolveIconPkg(library, defaultLibrary) {
  const canonical = LIBRARY_TO_PKG[library] ?? library;
  if (PKG_NORMALIZE[canonical]) return canonical;
  const fallback = LIBRARY_TO_PKG[defaultLibrary] ?? defaultLibrary;
  return PKG_NORMALIZE[fallback] ? fallback : null;
}

function normalizeAssetKey(pkg, rawName) {
  const normalize = PKG_NORMALIZE[pkg];
  return normalize ? normalize(rawName) : rawName;
}

function scanSlotWindows(content, defaultIconLibrary, registry, provenance, scanContext) {
  const slotTypeRe = /type\s*:\s*["']([^"']+)["']/g;
  let match;

  while ((match = slotTypeRe.exec(content)) !== null) {
    const slotType = match[1];
    const slotObject = extractEnclosingObject(content, match.index);
    if (!slotObject) continue;

    if (slotType === "icon") {
      const nameMatch = slotObject.match(/name\s*:\s*["']([^"']+)["']/);
      if (!nameMatch) continue;

      const rawName = nameMatch[1];
      const libMatch = slotObject.match(/library\s*:\s*["']([^"']+)["']/);
      const slotLibrary = libMatch?.[1];
      const defaultPkg = resolveIconPkg(defaultIconLibrary, defaultIconLibrary);
      if (!defaultPkg) continue;

      const useConfigLibrary =
        rawName.startsWith("@") ||
        !slotLibrary ||
        normalizeIconLibraryId(slotLibrary) ===
          normalizeIconLibraryId(defaultIconLibrary);
      const pkg = useConfigLibrary
        ? defaultPkg
        : resolveIconPkg(slotLibrary, defaultIconLibrary);

      if (
        rawName.startsWith("@") &&
        slotLibrary &&
        !useConfigLibrary
      ) {
        console.warn(
          `[inventive-ui/scan] @alias "${rawName}" with slot.library "${slotLibrary}" — scanning glyph for assets.icon.library "${defaultIconLibrary}"`,
        );
      }

      if (!pkg) continue;

      addNamedAsset(registry, provenance, pkg, rawName, scanContext, "source");
      continue;
    }

    if (slotType === "flag") {
      const codeMatch = slotObject.match(/code\s*:\s*["']([^"']+)["']/);
      let code = codeMatch?.[1];
      if (!code || code === SLOT_PLACEHOLDER) {
        code = readFlagPlaceholderCode(scanContext.viteRoot);
      }
      addNamedAsset(registry, provenance, "flags", normalizeFlagCode(code), null, "source");
      continue;
    }

    if (slotType === "file-type") {
      const extensionMatch = slotObject.match(/extension\s*:\s*["']([^"']+)["']/);
      let extension = extensionMatch?.[1];
      if (!extension || extension === SLOT_PLACEHOLDER) {
        extension = readFileTypePlaceholderExtension(scanContext.viteRoot);
      }
      addNamedAsset(registry, provenance, "file-types", resolveFileTypeSubpath(extension), null, "source");
      continue;
    }

    const pkg = SLOT_TYPE_TO_PKG[slotType];
    if (!pkg) continue;

    if (slotType === "illustration") {
      const nameMatch = slotObject.match(/name\s*:\s*["']([^"']+)["']/);
      if (!nameMatch) continue;

      const styleMatch = slotObject.match(/style\s*:\s*["']([^"']+)["']/);
      const familyMatch = slotObject.match(/family\s*:\s*["']([^"']+)["']/);
      let family = (
        familyMatch?.[1] ??
        styleMatch?.[1] ??
        readDefaultIllustrationStyleFromConfig(scanContext.viteRoot) ??
        "Amico"
      ).toLowerCase();

      let sceneName =
        resolveScannedSlotAssetName(
          nameMatch[1],
          "illustration",
          scanContext.globalIcons,
          scanContext.slotPlaceholders,
          scanContext.globalLogos,
          scanContext.globalColorLogos,
          scanContext.globalLoaders,
          scanContext.globalEmojis,
        ) ?? nameMatch[1];

      const fullIdMatch = sceneName.match(
        /^(amico|bro|cuate|pana|rafiki|storyset)-(.+)$/i,
      );
      if (fullIdMatch) {
        family = fullIdMatch[1].toLowerCase();
        sceneName = fullIdMatch[2];
      }

      addAsset(registry, provenance, pkg, `./${family}/${sceneName}.js`, "source");
      continue;
    }

    const nameMatch = slotObject.match(/name\s*:\s*["']([^"']+)["']/);
    if (!nameMatch) continue;
    addNamedAsset(registry, provenance, pkg, nameMatch[1], scanContext, "source");
  }
}

function scanStaticSubpaths(content, registry, provenance, scanContext) {
  let match;

  STATIC_SUBPATH_RE.lastIndex = 0;
  while ((match = STATIC_SUBPATH_RE.exec(content)) !== null) {
    const [, pkg, rawName] = match;
    if (rawName.endsWith(".json")) continue;
    addNamedAsset(registry, provenance, pkg, rawName, scanContext, "source");
  }

  ILLUSTRATION_SUBPATH_RE.lastIndex = 0;
  while ((match = ILLUSTRATION_SUBPATH_RE.exec(content)) !== null) {
    const [, family, scene] = match;
    addAsset(registry, provenance, "illustrations", `./${family}/${scene}.js`, "source");
  }
}

export function lookupKeyToModuleId(pkg, lookupKey) {
  if (pkg === "illustrations") {
    const subpath = lookupKey.replace(/^\.\//, "").replace(/\.js$/, "");
    return `@inventive-ui/illustrations/${subpath}`;
  }

  let subpath = lookupKey.replace(/^\.\//, "").replace(/\.js$/, "");
  const prefix = PKG_LOOKUP_PREFIX[pkg];
  if (prefix) {
    const dir = prefix.slice(2, -1);
    if (subpath.startsWith(`${dir}/`)) {
      subpath = subpath.slice(dir.length + 1);
    }
  }
  return `@inventive-ui/${pkg}/${subpath}`;
}

function filterExistingAssets(registry, provenance, projectRoot) {
  for (const [pkg, keys] of registry.entries()) {
    for (const key of [...keys]) {
      const modId = lookupKeyToModuleId(pkg, key);
      if (!resolveAssetSubpath(projectRoot, modId)) {
        keys.delete(key);
        const origins = provenance.get(pkg)?.get(key);
        if (origins?.has("source")) {
          console.warn(`[inventive-ui/scan] Asset not found, skipped from slot manifest: ${modId}`);
        }
        provenance.get(pkg)?.delete(key);
      }
    }
    if (keys.size === 0) registry.delete(pkg);
  }
}

function applyGlobalNamedAssetBaseline(
  registry,
  provenance,
  pkg,
  globalMap,
  scanContext,
  projectRoot,
  slotType,
  fallbackGlyph,
  placeholderGlyph,
) {
  const baselineGlyphs = new Set(collectGlobalMapValues(globalMap));
  if (typeof fallbackGlyph === "string" && fallbackGlyph.length > 0) {
    baselineGlyphs.add(fallbackGlyph);
  }
  if (typeof placeholderGlyph === "string" && placeholderGlyph.length > 0) {
    baselineGlyphs.add(placeholderGlyph);
  }

  for (const glyph of baselineGlyphs) {
    const lookupKey = resolveNamedAssetLookupKey(pkg, glyph, scanContext);
    if (!lookupKey) continue;
    if (!assetExistsOnDisk(projectRoot, pkg, lookupKey)) continue;
    addAsset(registry, provenance, pkg, lookupKey, "baseline");
  }
}

/**
 * When preload is configured or scanned, include every glyph from the merged global icon map
 * for the active icon library (covers @expand in component source, etc.).
 */
function applyGlobalIconBaseline(registry, provenance, defaultIconLibrary, globalIcons, scanContext, projectRoot) {
  const pkg = resolveIconPkg(defaultIconLibrary, defaultIconLibrary);
  if (!pkg) return;

  const baselineGlyphs = new Set(collectGlobalIconGlyphNames(globalIcons));
  const fallback = readIconFallbackFromConfig(scanContext.viteRoot);
  const placeholder = scanContext.slotPlaceholders?.icon;
  if (typeof fallback === "string" && fallback.length > 0) {
    baselineGlyphs.add(fallback);
  }
  if (typeof placeholder === "string" && placeholder.length > 0) {
    baselineGlyphs.add(placeholder);
  }

  for (const glyph of baselineGlyphs) {
    const lookupKey = resolveNamedAssetLookupKey(pkg, glyph, scanContext);
    if (!lookupKey) continue;
    if (!assetExistsOnDisk(projectRoot, pkg, lookupKey)) continue;
    addAsset(registry, provenance, pkg, lookupKey, "baseline");
  }
}

/**
 * @param {string} viteRoot
 * @param {{ scanDirs?: string[], include?: string[], exclude?: string[] }} [options]
 */
export function scanUsedSlotAssets(viteRoot, options = {}) {
  const registry = new Map();
  const provenance = new Map();
  const defaultIconLibrary = readDefaultIconLibrary(viteRoot);
  const globalIcons = readMergedGlobalIcons(viteRoot);
  const globalLogos = readMergedGlobalLogos(viteRoot);
  const globalColorLogos = readMergedGlobalColorLogos(viteRoot);
  const globalLoaders = readMergedGlobalLoaders(viteRoot);
  const globalEmojis = readMergedGlobalEmojis(viteRoot);
  const slotPlaceholders = readSlotAssetPlaceholders(viteRoot);
  const scanContext = {
    viteRoot,
    globalIcons,
    globalLogos,
    globalColorLogos,
    globalLoaders,
    globalEmojis,
    slotPlaceholders,
  };
  const projectRoot = findInventiveUiNodeModulesRoot(viteRoot);
  const preloadTier = readAssetPreloadTierFromConfig(viteRoot);

  if (preloadTier === "configured" || preloadTier === "scanned") {
    applyGlobalIconBaseline(
      registry,
      provenance,
      defaultIconLibrary,
      globalIcons,
      scanContext,
      projectRoot,
    );
    applyGlobalNamedAssetBaseline(
      registry,
      provenance,
      "logos",
      globalLogos,
      scanContext,
      projectRoot,
      "logo",
      slotPlaceholders.logo,
      slotPlaceholders.logo,
    );
    applyGlobalNamedAssetBaseline(
      registry,
      provenance,
      "color-logos",
      globalColorLogos,
      scanContext,
      projectRoot,
      "color-logo",
      slotPlaceholders["color-logo"],
      slotPlaceholders["color-logo"],
    );
    applyGlobalNamedAssetBaseline(
      registry,
      provenance,
      "loaders",
      globalLoaders,
      scanContext,
      projectRoot,
      "loader",
      slotPlaceholders.loader,
      slotPlaceholders.loader,
    );
  }

  const scanDirs = options.scanDirs ?? ["src", ".iui"];
  const includePatterns = options.include?.map((glob) => globToRegExp(glob));
  const excludePatterns = (options.exclude ?? ["**/*.test.*", "**/*.spec.*"]).map((glob) =>
    globToExcludeRegExp(glob),
  );

  const files = [];
  for (const dir of scanDirs) {
    const base = join(viteRoot, dir);
    if (includePatterns?.length) {
      for (const pattern of includePatterns) {
        walkSourceFiles(base, files, pattern, excludePatterns);
      }
    } else {
      walkSourceFiles(base, files, null, excludePatterns);
    }
  }

  const uniqueFiles = [...new Set(files)];

  for (const file of uniqueFiles) {
    const content = readFileSync(file, "utf8");
    scanSlotWindows(content, defaultIconLibrary, registry, provenance, scanContext);
    scanStaticSubpaths(content, registry, provenance, scanContext);
  }

  filterExistingAssets(registry, provenance, projectRoot);
  return registry;
}
