const path = require("path");
const { refreshUsedAssets } = require("./slot-assets-registry.cjs");
const { inventiveUiAssetSubpathResolver } = require("./asset-subpath-resolver.cjs");
const { IUIBuildCSSWebpackPlugin } = require("./iui-css.cjs");

const PLUGIN_NAME = "IUIWebpackPlugin";
const SLOT_PLUGIN_NAME = "InventiveUiSlotAssetsWebpackPlugin";
const WARMUP_MODULE_ID = "iui-slot-warmup";

class IUIWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const context = this.options.root ?? compiler.context;
    const bootstrapFile = path.join(context, ".iui-bootstrap.js");

    const refreshShim = async () => {
      const { writeWebpackBootstrapShim } = await import(
        "../shared/bootstrap-bridge.mjs"
      );
      return writeWebpackBootstrapShim(context);
    };

    compiler.hooks.beforeRun.tapPromise(`${PLUGIN_NAME}BeforeRun`, refreshShim);
    compiler.hooks.watchRun.tapPromise(`${PLUGIN_NAME}WatchRun`, refreshShim);

    compiler.hooks.afterPlugins.tap(PLUGIN_NAME, () => {
      compiler.options.resolve ??= {};
      compiler.options.resolve.alias ??= {};
      compiler.options.resolve.alias["iui-bootstrap"] = bootstrapFile;
    });
  }
}

class InventiveUiSlotAssetsWebpackPlugin {
  constructor(options = {}) {
    this.root = options.root ?? process.cwd();
    this.loaderPath = path.join(__dirname, "slot-assets-loader.cjs");
    this.scanOptions = options.scan ?? {};
    this.rescanOnWatch = options.scan?.rescanOnWatch ?? "smart";
  }

  apply(compiler) {
    const consumerRoot = this.root;
    const scanOptions = this.scanOptions;
    const warmupFile = path.join(consumerRoot, ".iui", "cache", "slot-warmup.mjs");

    const runScan = () => refreshUsedAssets(consumerRoot, scanOptions);

    const shouldRescanOnWatch = (compilerInstance) => {
      if (this.rescanOnWatch === true) return true;
      if (this.rescanOnWatch === false) return false;

      const modified = compilerInstance.modifiedFiles;
      if (!modified || modified.size === 0) return true;

      return [...modified].some((file) => {
        const normalized = String(file).replace(/\\/g, "/");
        if (normalized.includes("/.iui/cache/")) return false;
        if (normalized.includes("/node_modules/")) return false;
        return (
          /\.(tsx?|jsx?)$/.test(normalized) ||
          /\.stories\.(tsx?|jsx?|mdx?)$/i.test(normalized) ||
          /\.mdx$/i.test(normalized) ||
          /assets\.config\.json$/i.test(normalized) ||
          /iui\.config\.(ts|js|mjs)$/i.test(normalized)
        );
      });
    };

    compiler.hooks.beforeRun.tapPromise(`${SLOT_PLUGIN_NAME}BeforeRun`, runScan);
    compiler.hooks.watchRun.tapPromise(`${SLOT_PLUGIN_NAME}WatchRun`, (c) => {
      if (!shouldRescanOnWatch(c)) return Promise.resolve();
      return runScan();
    });

    compiler.hooks.afterPlugins.tap(SLOT_PLUGIN_NAME, () => {
      compiler.options.module.rules ??= [];
      compiler.options.module.rules.unshift({
        test: /[\\/]node_modules[\\/]@inventive-ui[\\/][^\\/]+[\\/]dist[\\/].+\.js$/,
        enforce: "pre",
        use: [
          {
            loader: this.loaderPath,
            options: { root: consumerRoot },
          },
        ],
      });

      compiler.options.resolve ??= {};
      compiler.options.resolve.modules ??= ["node_modules"];
      const consumerModules = path.join(consumerRoot, "node_modules");
      if (!compiler.options.resolve.modules.includes(consumerModules)) {
        compiler.options.resolve.modules.unshift(consumerModules);
      }

      compiler.options.resolve.alias ??= {};
      compiler.options.resolve.alias[WARMUP_MODULE_ID] = warmupFile;

      compiler.options.resolve.plugins ??= [];
      compiler.options.resolve.plugins.push(
        inventiveUiAssetSubpathResolver({ root: consumerRoot }),
      );
    });
  }
}

/**
 * Official Inventive UI Webpack integration (bootstrap-state + compile CSS + slot assets).
 *
 * @param {{ root?: string, configPath?: string, scan?: { include?: string[], scanDirs?: string[], rescanOnWatch?: boolean | 'smart' } }} [options]
 * @returns {Array<import('webpack').WebpackPluginInstance>}
 */
function inventiveUiWebpack(options = {}) {
  return [
    new IUIWebpackPlugin(options),
    new IUIBuildCSSWebpackPlugin(options),
    new InventiveUiSlotAssetsWebpackPlugin(options),
  ];
}

module.exports = {
  IUIWebpackPlugin,
  IUIBuildCSSWebpackPlugin,
  InventiveUiSlotAssetsWebpackPlugin,
  inventiveUiWebpack,
};
