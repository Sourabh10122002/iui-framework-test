const path = require("path");
const fs = require("fs");

const PLUGIN_NAME = "IUIBuildCSSWebpackPlugin";
const SOURCE_FILE_RE = /\.(tsx?|jsx?|mdx?|html)$/;
const STYLES_ALIAS = "iui-build-styles";
const MANIFEST_ALIAS = "iui-build-manifest";
const ENTRY_LOADER = path.join(__dirname, "iui-css-entry-loader.cjs");
const ENTRY_RE = /[\\/]src[\\/](?:main|index)\.(tsx?|jsx?|mts|mjs|cjs|js)$/;

function normalizeWatchPath(file) {
  return String(file).replace(/\\/g, "/");
}

function isGeneratedIuiCachePath(file) {
  return normalizeWatchPath(file).includes("/.iui/cache/");
}

function isSourceWatchPath(file) {
  const normalized = normalizeWatchPath(file);
  return (
    SOURCE_FILE_RE.test(normalized) ||
    /iui\.config\.(ts|js|mjs)$/.test(normalized)
  );
}

function shouldRegenerateOnWatch(compiler) {
  const modified = compiler.modifiedFiles;
  if (!modified || modified.size === 0) return true;

  return [...modified].some((file) => {
    if (isGeneratedIuiCachePath(file)) return false;
    const normalized = normalizeWatchPath(file);
    if (normalized.includes("node_modules")) return false;
    return isSourceWatchPath(file);
  });
}

/** Dedup Next.js server+client webpack compilers racing the same full regenerate. */
const regenerateInFlight = new Map();
/** @type {Map<string, { cache: unknown, at: number, changedFile: string | null }>} */
const lastCompleted = new Map();

/**
 * @param {string} root
 * @param {string | null} changedFile
 * @param {() => Promise<unknown>} run
 */
function regenerateWithDedup(root, changedFile, run) {
  const key = path.resolve(root);
  const normalizedChange = changedFile ? path.resolve(changedFile) : null;
  const existing = regenerateInFlight.get(key);

  if (
    existing &&
    existing.changedFile === normalizedChange &&
    (!normalizedChange || Date.now() - existing.at < 5000)
  ) {
    return existing.promise;
  }
  // Concurrent full regenerates (changedFile null) within a short window share one pass.
  if (
    existing &&
    !normalizedChange &&
    !existing.changedFile &&
    Date.now() - existing.at < 3000
  ) {
    return existing.promise;
  }

  // Sequential server→client full regenerates (Next) reuse the just-finished result.
  if (!normalizedChange) {
    const last = lastCompleted.get(key);
    if (last && !last.changedFile && Date.now() - last.at < 2500) {
      return Promise.resolve(last.cache);
    }
  }

  const promise = Promise.resolve()
    .then(run)
    .then((cache) => {
      lastCompleted.set(key, {
        cache,
        at: Date.now(),
        changedFile: normalizedChange,
      });
      return cache;
    })
    .finally(() => {
      if (regenerateInFlight.get(key)?.promise === promise) {
        regenerateInFlight.delete(key);
      }
    });
  regenerateInFlight.set(key, {
    promise,
    changedFile: normalizedChange,
    at: Date.now(),
  });
  return promise;
}

class IUIBuildCSSWebpackPlugin {
  /**
   * @param {{ root?: string, configPath?: string, scan?: Record<string, unknown>, writeFiles?: boolean, integration?: 'vite' | 'webpack' | 'next' }} [options]
   */
  constructor(options = {}) {
    this.options = options;
    /** @type {{ combinedCSS: string, manifest: Record<string, unknown>, cssHash: string, themeInitScript: string, themeInitHash: string } | null} */
    this.cache = null;
  }

  apply(compiler) {
    const consumerRoot = this.options.root ?? compiler.context;

    const regenerate = async (changedFile = null) => {
      const {
        generateBuildCSSForProject,
        loadIuiConfig,
        resolveIuiConfigPath,
      } = await import("../shared/generate-build-css.mjs");
      const { createBuildManifest } = await import("../shared/build-manifest.mjs");
      const { resolveBuildScanOptions } = await import("../shared/resolve-build-scan.mjs");
      const { scanUsedClasses } = await import("../shared/scan-used-classes.mjs");
      const {
        isCompleteBuildClassCache,
        readBuildClassCache,
        rescanCachedFile,
        writeBuildClassCache,
      } = await import("../shared/build-cache.mjs");
      const { warnUncoveredBuildClasses } = await import("../shared/dev-diagnostics.mjs");
      const {
        generateThemeInitScriptFromConfig,
        hashThemeInitScript,
        injectThemeInitScriptIntoHtml,
      } = await import("../shared/generate-theme-init-script.mjs");
      const { injectBuildStylesIntoHtml } = await import(
        "../shared/inject-build-styles-into-html.mjs"
      );

      this.injectThemeInitScriptIntoHtml = injectThemeInitScriptIntoHtml;
      this.injectBuildStylesIntoHtml = injectBuildStylesIntoHtml;

      const configPath =
        this.options.configPath ??
        resolveIuiConfigPath(consumerRoot);
      const config = loadIuiConfig(configPath);
      const scanOptions = resolveBuildScanOptions(config, this.options.scan ?? {}, consumerRoot);

      let scanResult;
      const existingCache = readBuildClassCache(consumerRoot);
      const useIncremental =
        changedFile &&
        SOURCE_FILE_RE.test(changedFile) &&
        !String(changedFile).includes("iui.config.") &&
        isCompleteBuildClassCache(existingCache);

      if (useIncremental) {
        rescanCachedFile(consumerRoot, changedFile);
        const fileCache = readBuildClassCache(consumerRoot);
        const merged = new Set(scanOptions.safelist ?? []);
        for (const list of Object.values(fileCache.files ?? {})) {
          for (const cls of list) merged.add(cls);
        }
        scanResult = {
          classes: merged,
          fileMap: new Map(),
          scannedAt: Date.now(),
          fileCount: Object.keys(fileCache.files ?? {}).length,
          classCount: merged.size,
        };
      } else {
        scanResult = scanUsedClasses(consumerRoot, scanOptions);
        const files = {};
        for (const [file, set] of scanResult.fileMap.entries()) {
          files[file.replace(/\\/g, "/")] = [...set];
        }
        writeBuildClassCache(consumerRoot, {
          version: 1,
          complete: true,
          files,
        });
      }

      const result = generateBuildCSSForProject(consumerRoot, {
        configPath: configPath ?? undefined,
        config,
        classes: [...scanResult.classes],
      });

      warnUncoveredBuildClasses(result.uncoveredClasses ?? []);

      const { writeBuildCssFiles } = await import("../shared/write-build-css.mjs");

      const themeInitScript = generateThemeInitScriptFromConfig(config);
      const themeInitHash = hashThemeInitScript(themeInitScript);

      if (
        this.cache?.cssHash === result.cssHash &&
        this.cache?.themeInitHash === themeInitHash
      ) {
        if (this.options.emitPublicCss && result.combinedCSS) {
          try {
            const publicDir = path.join(consumerRoot, "public", "iui");
            fs.mkdirSync(publicDir, { recursive: true });
            const dest = path.join(publicDir, `${result.cssHash}.css`);
            if (!fs.existsSync(dest)) {
              fs.writeFileSync(dest, result.combinedCSS, "utf8");
            }
          } catch (error) {
            console.warn("[IUI Webpack] Failed to write public CSS:", error);
          }
        }
        return this.cache;
      }

      const manifest = createBuildManifest({
        cssHash: result.cssHash,
        classCount: result.stats.classCount,
        themeBytes: result.stats.themeBytes,
        utilityBytes: result.stats.utilityBytes,
        combinedBytes: result.stats.combinedBytes,
        themeInitHash,
      });

      this.cache = {
        combinedCSS: result.combinedCSS,
        manifest,
        cssHash: result.cssHash,
        themeInitScript,
        themeInitHash,
      };

      const writeFiles =
        typeof this.options.writeFiles === "boolean"
          ? this.options.writeFiles
          : config?.build?.writeFiles === true;

      writeBuildCssFiles(
        consumerRoot,
        {
          combinedCSS: result.combinedCSS,
          manifest,
        },
        { integration: this.options.integration ?? "webpack" },
      );

      if (this.options.emitPublicCss) {
        try {
          const publicDir = path.join(consumerRoot, "public", "iui");
          fs.mkdirSync(publicDir, { recursive: true });
          fs.writeFileSync(
            path.join(publicDir, `${result.cssHash}.css`),
            result.combinedCSS,
            "utf8",
          );
        } catch (error) {
          console.warn("[IUI Webpack] Failed to write public CSS:", error);
        }
      }

      if (writeFiles) {
        const outDir = path.join(consumerRoot, ".iui", "cache");
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(
          path.join(outDir, "manifest.json"),
          JSON.stringify(manifest, null, 2),
          "utf8",
        );
      }

      return this.cache;
    };

    compiler.hooks.beforeRun.tapPromise(`${PLUGIN_NAME}BeforeRun`, async () => {
      this.cache = await regenerateWithDedup(consumerRoot, null, async () => {
        await regenerate();
        return this.cache;
      });
    });
    compiler.hooks.watchRun.tapPromise(
      `${PLUGIN_NAME}WatchRun`,
      async (compiler) => {
        if (!shouldRegenerateOnWatch(compiler)) {
          return;
        }
        const modified = compiler.modifiedFiles
          ? [...compiler.modifiedFiles]
          : [];
        const changedFile =
          modified.find(
            (file) =>
              !isGeneratedIuiCachePath(file) &&
              isSourceWatchPath(file) &&
              !normalizeWatchPath(file).includes("node_modules"),
          ) ?? null;
        this.cache = await regenerateWithDedup(
          consumerRoot,
          changedFile,
          async () => {
            await regenerate(changedFile);
            return this.cache;
          },
        );
      },
    );

    compiler.hooks.afterEnvironment.tap(PLUGIN_NAME, () => {
      compiler.options.watchOptions ??= {};
      const ignored = compiler.options.watchOptions.ignored;
      const iuiIgnore = /[\\/]\.iui[\\/]cache[\\/]/;
      if (Array.isArray(ignored)) {
        if (!ignored.some((p) => String(p).includes(".iui"))) {
          ignored.push(iuiIgnore);
        }
      } else if (!ignored) {
        compiler.options.watchOptions.ignored = iuiIgnore;
      }
    });

    if (this.options.emitStaticAsset) {
      compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {
        if (!this.cache?.combinedCSS) return;
        try {
          const { sources } = require("webpack");
          const assetPath = `static/iui/${this.cache.cssHash || "build"}.css`;
          compilation.emitAsset(
            assetPath,
            new sources.RawSource(this.cache.combinedCSS),
          );
        } catch (error) {
          console.warn("[IUI Webpack] Failed to emit static CSS asset:", error);
        }
      });
    }

    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, () => {
      const integration = this.options.integration ?? "webpack";
      const manifestFile = path.join(
        consumerRoot,
        ".iui",
        "cache",
        "manifest.js",
      );

      compiler.options.resolve ??= {};
      compiler.options.resolve.alias ??= {};
      compiler.options.resolve.alias[MANIFEST_ALIAS] = manifestFile;

      if (integration === "webpack") {
        const stylesFile = path.join(
          consumerRoot,
          ".iui",
          "cache",
          "styles.inject.js",
        );
        compiler.options.resolve.alias[STYLES_ALIAS] = stylesFile;
      }

      compiler.options.module.rules ??= [];
      compiler.options.module.rules.unshift({
        test: ENTRY_RE,
        exclude: /node_modules/,
        enforce: "pre",
        use: [
          {
            loader: ENTRY_LOADER,
            options: {
              projectRoot: consumerRoot,
              autoBootstrap: this.options.autoBootstrap !== false,
            },
          },
        ],
      });
    });

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      let HtmlWebpackPlugin;
      try {
        HtmlWebpackPlugin = require(
          require.resolve("html-webpack-plugin", {
            paths: [consumerRoot, process.cwd()],
          }),
        );
      } catch {
        return;
      }

      if (!HtmlWebpackPlugin?.getHooks) return;

      const hooks = HtmlWebpackPlugin.getHooks(compilation);
      hooks.beforeEmit.tapAsync(`${PLUGIN_NAME}HeadInject`, async (data, cb) => {
        try {
          const {
            loadIuiConfig,
            resolveIuiConfigPath,
          } = await import("../shared/generate-build-css.mjs");
          const {
            generateThemeInitScriptFromConfig,
            hashThemeInitScript,
            injectThemeInitScriptIntoHtml,
          } = await import("../shared/generate-theme-init-script.mjs");

          const configPath =
            this.options.configPath ?? resolveIuiConfigPath(consumerRoot);
          const config = loadIuiConfig(configPath);
          const themeInitScript = generateThemeInitScriptFromConfig(config);
          const themeInitHash = hashThemeInitScript(themeInitScript);

          if (this.cache) {
            this.cache.themeInitScript = themeInitScript;
            this.cache.themeInitHash = themeInitHash;
          }

          data.html = injectThemeInitScriptIntoHtml(data.html, themeInitScript);
          // Zero-FOUC parity with Vite/Next: styles in <head> before app JS.
          if (this.cache?.combinedCSS && this.injectBuildStylesIntoHtml) {
            data.html = this.injectBuildStylesIntoHtml(
              data.html,
              this.cache.combinedCSS,
            );
          }
        } catch (error) {
          console.warn("[IUI Webpack] Failed to inject head styles:", error);
        }
        cb(null, data);
      });
    });
  }
}

module.exports = { IUIBuildCSSWebpackPlugin, STYLES_ALIAS, MANIFEST_ALIAS };
