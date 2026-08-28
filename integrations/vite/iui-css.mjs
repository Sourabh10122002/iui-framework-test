import { createHash } from "crypto";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "fs";
import { join, normalize } from "path";
import { generateBuildCSSForProject, loadIuiConfig, resolveIuiConfigPath } from "../shared/generate-build-css.mjs";
import { getFrameworkEngineFingerprint } from "../shared/load-build-css-api.mjs";
import {
  createBuildManifest,
  MANIFEST_ALIAS,
} from "../shared/build-manifest.mjs";
import {
  isCompleteBuildClassCache,
  readBuildClassCache,
  rescanCachedFileWithDiff,
  writeBuildClassCache,
} from "../shared/build-cache.mjs";
import { resolveBuildScanOptions } from "../shared/resolve-build-scan.mjs";
import { scanUsedClasses } from "../shared/scan-used-classes.mjs";
import {
  buildScanPackageStateFingerprint,
  buildScanStateFingerprint,
} from "../shared/scan-source-utils.mjs";
import {
  shouldInjectBuildImports,
  prependBuildImports,
  resolveBootstrapImportForEntry,
} from "../shared/inject-entry-transform.mjs";
import { warnUncoveredBuildClasses } from "../shared/dev-diagnostics.mjs";
import { writeBuildCssFiles } from "../shared/write-build-css.mjs";
import { injectBuildStylesIntoHtml, injectBuildStylesLinkIntoHtml } from "../shared/inject-build-styles-into-html.mjs";
import { reorderHeadStylesBeforeModuleScripts } from "../shared/reorder-head-assets.mjs";
import { assertValidGeneratedCss } from "../shared/validate-build-css.mjs";
import {
  generateThemeInitScriptFromConfig,
  hashThemeInitScript,
  injectThemeInitScriptIntoHtml,
} from "../shared/generate-theme-init-script.mjs";
import {
  iuiCacheDir,
  iuiCacheFile,
  STYLES_CSS_PUBLIC_PATH,
} from "../shared/iui-paths.mjs";

const SOURCE_FILE_RE = /\.(tsx?|jsx?|mdx?|html)$/;
const STYLES_CSS_IMPORT = "iui-build-styles.css";
const REGENERATE_DEBOUNCE_MS = 200;
const BUILD_CACHE_SCHEMA_VERSION = 2;
const FRAMEWORK_COMPILER_VERSION = "iui-vite-build-css-v6";

/**
 * Compile-first CSS plugin: scan → generate CSS in Node → disk artifacts + blocking <head> styles.
 * Parity with Webpack/Next: `writeBuildCssFiles`, sync injector module, no virtual CSS HMR pipeline.
 *
 * @param {{ root?: string, configPath?: string, scan?: Record<string, unknown>, writeFiles?: boolean }} [options]
 */
export function iuiBuildCSSPlugin(options = {}) {
  let projectRoot = process.cwd();
  let configPath = options.configPath ?? null;
  /** @type {boolean} */
  let isProductionBuild = false;
  /** @type {{ combinedCSS: string, manifest: Record<string, unknown>, cssHash: string, themeInitScript: string, themeInitHash: string } | null} */
  let cache = null;
  /** @type {string | null} */
  let lastWrittenCssHash = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let regenTimer = null;
  /** @type {string | null} */
  let pendingChangedFile = null;
  /** @type {boolean} */
  let startupPrepared = false;
  const debug = {
    warmCacheHits: 0,
    warmCacheMisses: 0,
    fullRegenerations: 0,
    incrementalRegenerations: 0,
    skippedNoClassChange: 0,
  };

  const normalizePath = (file) => normalize(file).replace(/\\/g, "/");

  const projectRootNormalized = () => normalizePath(projectRoot);

  const computeConfigFingerprint = (resolvedConfigPath) => {
    if (!resolvedConfigPath || !existsSync(resolvedConfigPath)) return "no-config";
    try {
      const raw = readFileSync(resolvedConfigPath, "utf8");
      return createHash("sha256").update(raw).digest("hex").slice(0, 24);
    } catch {
      return "config-unreadable";
    }
  };

  const computeInputFingerprint = ({
    resolvedConfigPath,
    scanOptions,
    scanStateFingerprint,
    scanPackageStateFingerprint,
  }) => {
    const payload = {
      schema: BUILD_CACHE_SCHEMA_VERSION,
      compiler: FRAMEWORK_COMPILER_VERSION,
      engineFingerprint: getFrameworkEngineFingerprint(),
      configPath: resolvedConfigPath ?? null,
      configFingerprint: computeConfigFingerprint(resolvedConfigPath),
      scanOptions: {
        scanDirs: scanOptions.scanDirs ?? [],
        scanPackages: scanOptions.scanPackages ?? [],
        include: scanOptions.include ?? null,
        exclude: scanOptions.exclude ?? null,
        useAst: scanOptions.useAst ?? true,
        shadeDiagnostics: scanOptions.shadeDiagnostics ?? "warn",
        minify: scanOptions.minify ?? false,
        safelistSize: Array.isArray(scanOptions.safelist)
          ? scanOptions.safelist.length
          : 0,
      },
      scanStateFingerprint,
      scanPackageStateFingerprint,
    };
    return createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex")
      .slice(0, 24);
  };

  const shouldIgnoreWatchPath = (file) => {
    const normalized = normalizePath(file);
    return (
      normalized.includes("/.iui/cache/") ||
      normalized.endsWith("/.iui/cache") ||
      normalized.includes("/node_modules/")
    );
  };

  /** Only rescan/rebuild for source under the consumer project — not linked framework packages. */
  const isProjectSourcePath = (file) => {
    const normalized = normalizePath(file);
    if (shouldIgnoreWatchPath(normalized)) return false;
    if (!SOURCE_FILE_RE.test(normalized) && !/iui\.config\.(ts|js|mjs)$/.test(normalized)) {
      return false;
    }
    const root = projectRootNormalized();
    return normalized === root || normalized.startsWith(`${root}/`);
  };

  /** @param {import('vite').ViteDevServer} server */
  const pushBuildReload = (server) => {
    server.ws.send({ type: "full-reload" });
  };

  const unwatchIuiCacheDir = (server) => {
    const cacheDir = iuiCacheDir(projectRoot);
    if (existsSync(cacheDir)) {
      server.watcher.unwatch(cacheDir);
    }
  };

  /** @type {number} */
  let lastDiskSyncMs = 0;
  const DISK_SYNC_COOLDOWN_MS = 2000;

  /**
   * Long-lived `vite` processes can keep a stale in-memory sheet after an
   * external/disk CSS rewrite (e.g. hoist-scan fix). Re-sync before serve/inject.
   *
   * Throttled: at most once per DISK_SYNC_COOLDOWN_MS to avoid re-reading and
   * re-hashing the full CSS file on every HTTP request.
   */
  const syncCacheWithDiskIfStale = () => {
    const now = Date.now();
    if (now - lastDiskSyncMs < DISK_SYNC_COOLDOWN_MS) return;
    lastDiskSyncMs = now;

    const cssFile = iuiCacheFile(projectRoot, "styles");
    if (!cache || !existsSync(cssFile)) return;
    try {
      const diskCss = readFileSync(cssFile, "utf8");
      const diskHash = createHash("sha256")
        .update(diskCss)
        .digest("hex")
        .slice(0, 12);
      if (
        diskHash !== cache.cssHash ||
        diskCss.length !== cache.combinedCSS.length
      ) {
        cache = {
          ...cache,
          cssHash: diskHash,
          combinedCSS: diskCss,
          manifest: createBuildManifest({
            cssHash: diskHash,
            classCount: cache.manifest?.classCount ?? 0,
            themeBytes: cache.manifest?.themeBytes ?? 0,
            utilityBytes: cache.manifest?.utilityBytes ?? 0,
            combinedBytes: diskCss.length,
            themeInitHash: cache.themeInitHash,
          }),
        };
      }
    } catch {
      // Disk unreadable — keep memory cache; next regenerate will rewrite.
    }
  };

  const hydrateFromWarmCache = () => {
    const resolvedConfigPath = configPath ?? resolveIuiConfigPath(projectRoot);
    const config = loadIuiConfig(resolvedConfigPath);
    const scanOptions = resolveBuildScanOptions(config, options.scan ?? {}, projectRoot);
    const scanState = buildScanStateFingerprint(projectRoot, {
      ...scanOptions,
      scanPackages: [],
    });
    const scanPackageStateFingerprint = buildScanPackageStateFingerprint(
      projectRoot,
      scanOptions.scanPackages ?? [],
    );
    const classCache = readBuildClassCache(projectRoot);
    const meta = classCache?.meta ?? {};

    if (!isCompleteBuildClassCache(classCache)) return false;
    if (meta?.schemaVersion !== BUILD_CACHE_SCHEMA_VERSION) return false;
    if (meta?.compilerVersion !== FRAMEWORK_COMPILER_VERSION) return false;
    if (meta?.engineFingerprint !== getFrameworkEngineFingerprint()) return false;

    const inputFingerprint = computeInputFingerprint({
      resolvedConfigPath,
      scanOptions,
      scanStateFingerprint: scanState.fingerprint,
      scanPackageStateFingerprint,
    });
    if (meta.inputFingerprint !== inputFingerprint) return false;
    if (meta.scanStateFingerprint !== scanState.fingerprint) return false;
    if (meta.scanPackageStateFingerprint !== scanPackageStateFingerprint) return false;

    const cssFile = iuiCacheFile(projectRoot, "styles");
    if (!existsSync(cssFile)) return false;
    const diskCss = readFileSync(cssFile, "utf8");
    assertValidGeneratedCss(diskCss, { source: cssFile });
    const diskHash = createHash("sha256")
      .update(diskCss)
      .digest("hex")
      .slice(0, 12);
    if (meta.cssHash !== diskHash) return false;

    const themeInitScript = generateThemeInitScriptFromConfig(config);
    const themeInitHash = hashThemeInitScript(themeInitScript);
    cache = {
      combinedCSS: diskCss,
      manifest: createBuildManifest({
        cssHash: diskHash,
        classCount: meta.classCount ?? 0,
        themeBytes: meta.themeBytes ?? 0,
        utilityBytes: meta.utilityBytes ?? 0,
        combinedBytes: diskCss.length,
        themeInitHash,
      }),
      cssHash: diskHash,
      themeInitScript,
      themeInitHash,
    };
    debug.warmCacheHits += 1;
    return true;
  };

  const resolveProjectConfigPath = () =>
    configPath ?? resolveIuiConfigPath(projectRoot);

  /** Always read iui.config at use time so `theme.shellBoot` is never stale in memory. */
  const buildThemeInitFromProjectConfig = () => {
    const projectConfig = loadIuiConfig(resolveProjectConfigPath());
    const themeInitScript = generateThemeInitScriptFromConfig(projectConfig);
    const themeInitHash = hashThemeInitScript(themeInitScript);
    return { themeInitScript, themeInitHash };
  };

  const syncThemeInitScriptOnCache = () => {
    const { themeInitScript, themeInitHash } = buildThemeInitFromProjectConfig();
    if (cache) {
      cache = { ...cache, themeInitScript, themeInitHash };
    }
    return themeInitScript;
  };

  const prepareStartupCache = () => {
    if (startupPrepared && cache) {
      syncThemeInitScriptOnCache();
      return;
    }
    if (!hydrateFromWarmCache()) {
      debug.warmCacheMisses += 1;
      regenerate();
    }
    startupPrepared = true;
  };

  const regenerate = (changedFile = null) => {
    const previousHash = cache?.cssHash ?? null;
    const previousThemeInit = cache?.themeInitHash ?? null;
    const resolvedConfigPath = configPath ?? resolveIuiConfigPath(projectRoot);
    const config = loadIuiConfig(resolvedConfigPath);
    const scanOptions = resolveBuildScanOptions(config, options.scan ?? {}, projectRoot);

    let scanResult;
    // Tailwind-style content scan: incremental HMR is only safe on a complete
    // project-wide cache. A wiped/partial cache (e.g. deleted .iui while Storybook
    // kept running) must fall back to a full filesystem scan of scanDirs.
    const existingCache = readBuildClassCache(projectRoot);
    const useIncremental =
      changedFile &&
      SOURCE_FILE_RE.test(changedFile) &&
      !changedFile.includes("iui.config.") &&
      isCompleteBuildClassCache(existingCache);

    if (useIncremental) {
      const incremental = rescanCachedFileWithDiff(projectRoot, changedFile);
      if (!incremental.changed && cache) {
        debug.skippedNoClassChange += 1;
        return cache;
      }
      debug.incrementalRegenerations += 1;
      const fileCache = readBuildClassCache(projectRoot);
      const merged = new Set(scanOptions.safelist ?? []);
      for (const list of Object.values(fileCache.files ?? {})) {
        for (const cls of list) merged.add(cls);
      }
      // Safelist is authoritative — if cache merge dropped most of it, full rescan.
      const safelistCount = scanOptions.safelist?.length ?? 0;
      if (safelistCount > 0 && merged.size < safelistCount * 0.9) {
        scanResult = scanUsedClasses(projectRoot, scanOptions);
        const files = {};
        for (const [file, set] of scanResult.fileMap.entries()) {
          files[file.replace(/\\/g, "/")] = [...set];
        }
        writeBuildClassCache(projectRoot, {
          version: 1,
          complete: true,
          files,
        });
      } else {
        scanResult = {
          classes: merged,
          fileMap: new Map(),
          scannedAt: Date.now(),
          fileCount: Object.keys(fileCache.files ?? {}).length,
          classCount: merged.size,
        };
      }
    } else {
      debug.fullRegenerations += 1;
      scanResult = scanUsedClasses(projectRoot, scanOptions);
      const files = {};
      for (const [file, set] of scanResult.fileMap.entries()) {
        files[file.replace(/\\/g, "/")] = [...set];
      }
      writeBuildClassCache(projectRoot, {
        version: 1,
        complete: true,
        files,
      });
    }

    const result = generateBuildCSSForProject(projectRoot, {
      configPath: resolvedConfigPath ?? undefined,
      config,
      classes: [...scanResult.classes],
      fileMap: scanResult.fileMap,
    });

    const themeInitScript = generateThemeInitScriptFromConfig(config);
    const themeInitHash = hashThemeInitScript(themeInitScript);

    if (
      previousHash === result.cssHash &&
      previousThemeInit === themeInitHash &&
      cache
    ) {
      return cache;
    }

    warnUncoveredBuildClasses(result.uncoveredClasses ?? []);
    if (
      typeof result.droppedScanClassCount === "number" &&
      result.droppedScanClassCount > 0 &&
      process.env.NODE_ENV !== "production"
    ) {
      // One-line summary — avoids flooding the Vite terminal on every regen.
      console.info(
        `[IUI Dev] Dropped ${result.droppedScanClassCount} non-emittable scan tokens (docs placeholders / unsupported names). Emit coverage is 100%.`,
      );
    }

    const manifest = createBuildManifest({
      cssHash: result.cssHash,
      classCount: result.stats.classCount,
      themeBytes: result.stats.themeBytes,
      utilityBytes: result.stats.utilityBytes,
      combinedBytes: result.stats.combinedBytes,
      themeInitHash,
    });

    writeBuildCssFiles(projectRoot, {
      combinedCSS: result.combinedCSS,
      manifest,
    }, { integration: "vite" });

    const nextClassCache = readBuildClassCache(projectRoot);
    if (useIncremental) {
      writeBuildClassCache(projectRoot, {
        ...nextClassCache,
        complete: true,
        meta: {
          ...(nextClassCache.meta ?? {}),
          schemaVersion: BUILD_CACHE_SCHEMA_VERSION,
          compilerVersion: FRAMEWORK_COMPILER_VERSION,
          engineFingerprint: getFrameworkEngineFingerprint(),
          inputFingerprint: null,
          scanStateFingerprint: null,
          cssHash: result.cssHash,
          classCount: result.stats.classCount,
          themeBytes: result.stats.themeBytes,
          utilityBytes: result.stats.utilityBytes,
          combinedBytes: result.stats.combinedBytes,
        },
      });
    } else {
      const scanState = buildScanStateFingerprint(projectRoot, {
        ...scanOptions,
        scanPackages: [],
      });
      const scanPackageStateFingerprint = buildScanPackageStateFingerprint(
        projectRoot,
        scanOptions.scanPackages ?? [],
      );
      const inputFingerprint = computeInputFingerprint({
        resolvedConfigPath,
        scanOptions,
        scanStateFingerprint: scanState.fingerprint,
        scanPackageStateFingerprint,
      });
      writeBuildClassCache(projectRoot, {
        ...nextClassCache,
        complete: true,
        meta: {
          ...(nextClassCache.meta ?? {}),
          schemaVersion: BUILD_CACHE_SCHEMA_VERSION,
          compilerVersion: FRAMEWORK_COMPILER_VERSION,
          engineFingerprint: getFrameworkEngineFingerprint(),
          inputFingerprint,
          scanStateFingerprint: scanState.fingerprint,
          scanPackageStateFingerprint,
          cssHash: result.cssHash,
          classCount: result.stats.classCount,
          themeBytes: result.stats.themeBytes,
          utilityBytes: result.stats.utilityBytes,
          combinedBytes: result.stats.combinedBytes,
        },
      });
    }

    cache = {
      combinedCSS: result.combinedCSS,
      manifest,
      cssHash: result.cssHash,
      themeInitScript,
      themeInitHash,
    };

    const writeFiles =
      typeof options.writeFiles === "boolean"
        ? options.writeFiles
        : config?.build?.writeFiles === true;

    if (writeFiles && result.cssHash !== lastWrittenCssHash) {
      const outDir = iuiCacheDir(projectRoot);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(
        iuiCacheFile(projectRoot, "utilities"),
        result.combinedCSS,
        "utf8",
      );
      writeFileSync(
        iuiCacheFile(projectRoot, "manifestJson"),
        JSON.stringify(manifest, null, 2),
        "utf8",
      );
      lastWrittenCssHash = result.cssHash;
    }

    return cache;
  };

  /**
   * @param {import('vite').ViteDevServer | null} server
   * @param {string | null} changedFile
   */
  const scheduleRegenerate = (server, changedFile) => {
    pendingChangedFile = changedFile;
    if (regenTimer) {
      clearTimeout(regenTimer);
    }
    regenTimer = setTimeout(() => {
      regenTimer = null;
      const file = pendingChangedFile;
      pendingChangedFile = null;
      const previousHash = cache?.cssHash ?? null;
      regenerate(file);
      if (server) {
        unwatchIuiCacheDir(server);
      }
      // Only full-reload when the stylesheet hash actually changed. Hash-stable
      // regenerations (scan noise, comment edits) must not restart the client forever.
      if (server && cache?.cssHash !== previousHash) {
        pushBuildReload(server);
      }
    }, REGENERATE_DEBOUNCE_MS);
  };

  const resolveAliases = (root, command) => {
    /** @type {Record<string, string>} */
    const aliases = {
      [MANIFEST_ALIAS]: iuiCacheFile(root, "manifest"),
    };

    if (command === "build") {
      aliases[STYLES_CSS_IMPORT] = iuiCacheFile(root, "styles");
    }

    return aliases;
  };

  return {
    name: "iui-build-css",
    enforce: "pre",
    __iuiDebug: debug,

    config(userConfig, { command }) {
      const root = options.root ?? userConfig.root ?? process.cwd();
      projectRoot = root;
      isProductionBuild = command === "build";

      return {
        resolve: {
          alias: resolveAliases(root, command),
        },
        server: {
          watch: {
            ignored: ["**/.iui/cache/**"],
          },
        },
      };
    },

    configResolved(config) {
      projectRoot = options.root ?? config.root ?? process.cwd();
      isProductionBuild = config.command === "build";
      if (!configPath) {
        configPath = options.configPath
          ? join(projectRoot, options.configPath)
          : resolveIuiConfigPath(projectRoot);
      }
      prepareStartupCache();
    },

    buildStart() {
      prepareStartupCache();
    },

    configureServer(server) {
      unwatchIuiCacheDir(server);
      prepareStartupCache();
      unwatchIuiCacheDir(server);

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split("?")[0] ?? "";
        if (url !== STYLES_CSS_PUBLIC_PATH) {
          next();
          return;
        }

        syncCacheWithDiskIfStale();
        if (!cache?.combinedCSS) {
          next();
          return;
        }

        const reqHash = new URL(req.url, "http://localhost").searchParams.get("v");
        if (reqHash && reqHash === cache.cssHash) {
          // Hash-versioned URL: immutable cache — browser only re-fetches when
          // the <link> href changes (hash rotates on CSS rebuild).
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "no-cache");
        }
        res.setHeader("Content-Type", "text/css; charset=utf-8");
        res.setHeader("ETag", `"${cache.cssHash}"`);
        res.end(cache.combinedCSS);
      });

      const onFsEvent = (file) => {
        if (!isProjectSourcePath(file)) return;
        scheduleRegenerate(server, file);
      };

      server.watcher.on("add", onFsEvent);
      server.watcher.on("unlink", onFsEvent);
    },

    handleHotUpdate(ctx) {
      const normalized = normalizePath(ctx.file);
      if (shouldIgnoreWatchPath(normalized)) return [];

      if (!isProjectSourcePath(normalized)) {
        return undefined;
      }

      if (/iui\.config\.(ts|js|mjs)$/.test(normalized)) {
        const previousHash = cache?.cssHash ?? null;
        const previousThemeInit = cache?.themeInitHash ?? null;
        regenerate();
        unwatchIuiCacheDir(ctx.server);
        if (
          cache?.cssHash === previousHash &&
          cache?.themeInitHash === previousThemeInit
        ) {
          return [];
        }
        ctx.server.ws.send({ type: "full-reload" });
        return [];
      }

      if (SOURCE_FILE_RE.test(normalized)) {
        const existingCache = readBuildClassCache(projectRoot);
        if (
          isCompleteBuildClassCache(existingCache) &&
          !normalized.includes("iui.config.")
        ) {
          const incremental = rescanCachedFileWithDiff(projectRoot, normalized);
          if (!incremental.changed && cache) {
            debug.skippedNoClassChange += 1;
            return undefined;
          }
        }

        // Debounce: avoid blocking the Vite HMR pipeline with a synchronous
        // full CSS regeneration on every keystroke / save.
        scheduleRegenerate(ctx.server, normalized);
        // Let Vite handle normal HMR for the module (React fast-refresh, etc.).
        return undefined;
      }

      return undefined;
    },

    transformIndexHtml: {
      // order "post": Vite has already prepended /@vite/client. String-inject
      // (Webpack parity) places #iui-theme-init right after <head> so theme +
      // boot paint run before Vite client; blocking data-iui-build before </head>.
      order: "post",
      handler(html, ctx) {
        if (!cache) {
          prepareStartupCache();
        }
        syncCacheWithDiskIfStale();

        let out = html;
        const themeInitScript = syncThemeInitScriptOnCache();
        out = injectThemeInitScriptIntoHtml(out, themeInitScript);
        if (cache?.combinedCSS) {
          // Dev: middleware endpoint. Production: same public cache path so
          // Storybook iframe.html (and other non-src/main entries) still get
          // compile-first CSS even when JS entry injection does not run.
          const cssHref = `${STYLES_CSS_PUBLIC_PATH}?v=${cache.cssHash}`;
          out = injectBuildStylesLinkIntoHtml(out, cssHref);
        }
        // Keep CSS before module scripts so hard reloads do not paint unstyled HTML.
        out = reorderHeadStylesBeforeModuleScripts(out);
        return out;
      },
    },

    transform(code, id) {
      if (!shouldInjectBuildImports(id)) return null;

      const autoBootstrap = options.autoBootstrap !== false;
      const bootstrapImport = autoBootstrap
        ? resolveBootstrapImportForEntry(id, projectRoot)
        : undefined;

      if (isProductionBuild) {
        const prepended = prependBuildImports(code, {
          stylesId: STYLES_CSS_IMPORT,
          manifestId: MANIFEST_ALIAS,
          bootstrapImport,
        });
        return prepended;
      }

      const prepended = prependBuildImports(code, {
        manifestId: MANIFEST_ALIAS,
        bootstrapImport,
      });
      return prepended;
    },
  };
}

export default iuiBuildCSSPlugin;
