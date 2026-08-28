import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  renameSync,
  unlinkSync,
} from "fs";
import { dirname, join } from "path";
import { extractClassesFromSource } from "./scan-used-classes.mjs";
import { isStaticUtilityToken } from "./utility-token-filter.mjs";
import { iuiCacheFile, iuiRoot } from "./iui-paths.mjs";

/**
 * True when the on-disk class cache was produced by a full project scan
 * (not incomplete HMR incremental accumulation after a missing/wiped cache).
 * @param {{ version?: number, complete?: boolean, files?: Record<string, string[]> } | null | undefined} cache
 */
export function isCompleteBuildClassCache(cache) {
  if (!cache || typeof cache !== "object") return false;
  if (cache.complete !== true) return false;
  const files = cache.files;
  return Boolean(files) && Object.keys(files).length > 0;
}

/**
 * @param {string} projectRoot
 */
export function readBuildClassCache(projectRoot) {
  const cachePath = iuiCacheFile(projectRoot, "scan");
  const legacyPath = join(iuiRoot(projectRoot), "classes.cache.json");
  const pathToRead = existsSync(cachePath)
    ? cachePath
    : existsSync(legacyPath)
      ? legacyPath
      : cachePath;
  if (!existsSync(pathToRead)) {
    return { version: 1, complete: false, files: {}, meta: {} };
  }
  try {
    const parsed = JSON.parse(readFileSync(pathToRead, "utf8"));
    return {
      version: parsed.version ?? 1,
      complete: parsed.complete === true,
      files: parsed.files ?? {},
      meta:
        parsed.meta && typeof parsed.meta === "object" ? parsed.meta : {},
    };
  } catch {
    return { version: 1, complete: false, files: {}, meta: {} };
  }
}

function atomicWriteText(filePath, contents) {
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.${Math.random()
    .toString(16)
    .slice(2)}.tmp`;
  writeFileSync(tempPath, contents, "utf8");
  try {
    renameSync(tempPath, filePath);
  } finally {
    if (existsSync(tempPath)) {
      try {
        unlinkSync(tempPath);
      } catch {
        // Best-effort temp cleanup.
      }
    }
  }
}

/**
 * @param {string} projectRoot
 * @param {{ version?: number, complete?: boolean, files: Record<string, string[]>, meta?: Record<string, unknown> }} cache
 */
export function writeBuildClassCache(projectRoot, cache) {
  const outPath = iuiCacheFile(projectRoot, "scan");
  mkdirSync(dirname(outPath), { recursive: true });
  const payload = {
    version: cache.version ?? 1,
    // Preserve completeness unless callers explicitly set it.
    complete: cache.complete === true,
    files: cache.files ?? {},
    meta:
      cache.meta && typeof cache.meta === "object"
        ? cache.meta
        : {},
  };
  const next = JSON.stringify(payload, null, 2);
  if (existsSync(outPath)) {
    try {
      if (readFileSync(outPath, "utf8") === next) {
        return;
      }
    } catch {
      // Fall through and rewrite.
    }
  }
  atomicWriteText(outPath, next);
}

/**
 * @param {string} projectRoot
 * @param {string} filePath
 * @param {string[] | null} classes
 */
export function updateBuildClassCacheFile(projectRoot, filePath, classes) {
  const cache = readBuildClassCache(projectRoot);
  const normalized = filePath.replace(/\\/g, "/");
  const previous = cache.files[normalized] ?? null;

  if (classes === null) {
    delete cache.files[normalized];
  } else {
    cache.files[normalized] = classes.filter((c) => isStaticUtilityToken(c));
  }

  // Incremental file updates never promote an incomplete cache to complete.
  writeBuildClassCache(projectRoot, cache);
  const next = cache.files[normalized] ?? null;
  const normalizeList = (list) =>
    [...new Set((list ?? []).map(String))].sort();
  const changed =
    JSON.stringify(normalizeList(previous)) !==
    JSON.stringify(normalizeList(next));
  return { classes: aggregateClassesFromCache(cache), changed };
}

/**
 * @param {{ files: Record<string, string[]> }} cache
 */
export function aggregateClassesFromCache(cache) {
  const all = new Set();
  for (const list of Object.values(cache.files ?? {})) {
    for (const cls of list) {
      // Re-filter: older caches may contain polluted scan tokens.
      if (isStaticUtilityToken(cls)) {
        all.add(cls);
      }
    }
  }
  return all;
}

/**
 * @param {string} projectRoot
 * @param {string} filePath
 */
export function rescanCachedFile(projectRoot, filePath) {
  if (!existsSync(filePath)) {
    return updateBuildClassCacheFile(projectRoot, filePath, null).classes;
  }
  const content = readFileSync(filePath, "utf8");
  const found = extractClassesFromSource(content);
  return updateBuildClassCacheFile(projectRoot, filePath, [...found]).classes;
}

/**
 * Incremental update with change flag; used to skip downstream CSS generation
 * when class usage is unchanged for a touched source file.
 * @param {string} projectRoot
 * @param {string} filePath
 */
export function rescanCachedFileWithDiff(projectRoot, filePath) {
  if (!existsSync(filePath)) {
    return updateBuildClassCacheFile(projectRoot, filePath, null);
  }
  const content = readFileSync(filePath, "utf8");
  const found = extractClassesFromSource(content);
  return updateBuildClassCacheFile(projectRoot, filePath, [...found]);
}
