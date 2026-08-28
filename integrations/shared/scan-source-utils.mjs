import { existsSync, readdirSync, statSync } from "fs";
import { createHash } from "crypto";
import { dirname, join } from "path";

/** @typedef {{ scanDirs?: string[], include?: string[], exclude?: string[] }} ScanWalkOptions */

/**
 * Resolve `node_modules/<pkg>` walking up from startDir (npm/pnpm/yarn workspaces).
 * @param {string} startDir
 * @param {string} pkg
 * @returns {string | null}
 */
export function resolveInstalledPackageDir(startDir, pkg) {
  let dir = startDir;
  while (true) {
    const candidate = join(dir, "node_modules", pkg);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Minimal glob → RegExp converter used for scan include/exclude matching.
 *
 * Supports `**` (any path segments), `*` (any chars except `/`), `?` (single
 * char), and brace alternation `{a,b,c}` (e.g. `*.{ts,tsx}`). Without brace
 * support, a pattern like `**\/*.{ts,tsx,js,jsx}` silently escapes the braces
 * as literal characters and never matches any real file — the scan then
 * appears to "work" (no error) while quietly finding almost nothing.
 * @param {string} glob
 */
export function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i++;
      } else {
        out += "[^/]*";
      }
      continue;
    }
    if (ch === "?") {
      out += "[^/]";
      continue;
    }
    if (ch === "{") {
      const end = glob.indexOf("}", i);
      if (end === -1) {
        out += "\\{";
        continue;
      }
      const alternatives = glob
        .slice(i + 1, end)
        .split(",")
        .map((alt) => alt.replace(/[.+^${}()|[\]\\]/g, "\\$&"));
      out += `(?:${alternatives.join("|")})`;
      i = end;
      continue;
    }
    if (/[.+^${}()|[\]\\]/.test(ch)) {
      out += `\\${ch}`;
      continue;
    }
    out += ch;
  }
  return new RegExp(out);
}

/**
 * @param {string} dir
 * @param {string[]} [out]
 * @param {RegExp | null} [includePattern]
 * @param {RegExp[]} [excludePatterns]
 * @param {RegExp} [filePattern]
 */
export function walkSourceFiles(
  dir,
  out = [],
  includePattern = null,
  excludePatterns = [],
  filePattern = /\.(tsx?|jsx?|mdx?|html)$/,
) {
  if (!existsSync(dir)) return out;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".git") continue;
      walkSourceFiles(fullPath, out, includePattern, excludePatterns, filePattern);
      continue;
    }
    if (!filePattern.test(entry)) continue;
    const normalized = fullPath.replace(/\\/g, "/");
    if (excludePatterns.some((pattern) => pattern.test(normalized))) continue;
    if (includePattern && !includePattern.test(normalized)) continue;
    out.push(fullPath);
  }

  return out;
}

/**
 * @param {string} projectRoot
 * @param {ScanWalkOptions & { scanPackages?: string[] }} options
 */
export function collectScanRoots(projectRoot, options = {}) {
  const scanDirs = options.scanDirs ?? ["src", ".iui"];
  const roots = scanDirs.map((dir) => join(projectRoot, dir));

  for (const pkg of options.scanPackages ?? []) {
    const pkgDir = resolveInstalledPackageDir(projectRoot, pkg);
    if (!pkgDir) continue;
    const dist = join(pkgDir, "dist");
    if (existsSync(dist)) {
      roots.push(dist);
    }
  }

  return [...new Set(roots)];
}

/**
 * @param {string} projectRoot
 * @param {ScanWalkOptions & { scanPackages?: string[] }} options
 */
export function listScanFiles(projectRoot, options = {}) {
  const includePatterns = options.include?.map((glob) => globToRegExp(glob));
  const excludePatterns = (options.exclude ?? ["**/*.test.*", "**/*.spec.*"]).map(
    (glob) => globToRegExp(glob),
  );

  const files = [];
  for (const root of collectScanRoots(projectRoot, options)) {
    if (includePatterns?.length) {
      for (const pattern of includePatterns) {
        walkSourceFiles(root, files, pattern, excludePatterns);
      }
    } else {
      walkSourceFiles(root, files, null, excludePatterns);
    }
  }

  return [...new Set(files)];
}

/**
 * Build a deterministic fingerprint for scan roots and source dependency state.
 * Uses normalized path + size + mtime to detect changed/new/removed files
 * without re-parsing source contents.
 *
 * @param {string} projectRoot
 * @param {ScanWalkOptions & { scanPackages?: string[] }} options
 */
export function buildScanStateFingerprint(projectRoot, options = {}) {
  const hash = createHash("sha256");
  const normalize = (v) => String(v).replace(/\\/g, "/");
  hash.update("iui-scan-state:v1\n");

  const roots = collectScanRoots(projectRoot, options)
    .map(normalize)
    .sort();
  for (const root of roots) {
    hash.update(`root:${root}:${existsSync(root) ? 1 : 0}\n`);
  }

  const files = listScanFiles(projectRoot, options)
    .map(normalize)
    .sort();
  for (const file of files) {
    const stat = statSync(file);
    hash.update(
      `file:${file}:${Math.trunc(stat.mtimeMs)}:${stat.size}\n`,
    );
  }

  return {
    fingerprint: hash.digest("hex").slice(0, 24),
    fileCount: files.length,
    roots,
  };
}

/**
 * Fingerprint scan package dependency state without walking large `dist/` trees.
 * Uses package.json + iui-manifest.json metadata from resolved installed packages.
 *
 * @param {string} projectRoot
 * @param {string[]} scanPackages
 */
export function buildScanPackageStateFingerprint(projectRoot, scanPackages = []) {
  const hash = createHash("sha256");
  hash.update("iui-scan-packages:v1\n");

  for (const pkg of [...new Set(scanPackages)].sort()) {
    if (typeof pkg !== "string" || !pkg.trim()) continue;
    const pkgDir = resolveInstalledPackageDir(projectRoot, pkg);
    if (!pkgDir) {
      hash.update(`pkg:${pkg}:missing\n`);
      continue;
    }
    hash.update(`pkg:${pkg}:${pkgDir.replace(/\\/g, "/")}\n`);
    for (const rel of ["package.json", "iui-manifest.json"]) {
      const full = join(pkgDir, rel);
      if (!existsSync(full)) {
        hash.update(`file:${rel}:missing\n`);
        continue;
      }
      const stat = statSync(full);
      hash.update(`file:${rel}:${Math.trunc(stat.mtimeMs)}:${stat.size}\n`);
    }
  }

  return hash.digest("hex").slice(0, 24);
}
