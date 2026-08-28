const path = require("path");
const { pathToFileURL } = require("url");

const STYLES_IMPORT = "iui-build-styles";
const MANIFEST_IMPORT = "iui-build-manifest";

/** @type {Promise<typeof import("../shared/inject-entry-transform.mjs")> | null} */
let injectModulePromise = null;

function loadInjectHelpers() {
  if (!injectModulePromise) {
    injectModulePromise = import(
      pathToFileURL(
        path.join(__dirname, "../shared/inject-entry-transform.mjs"),
      ).href
    );
  }
  return injectModulePromise;
}

/**
 * Prepends compile-first imports to app entry files (main.tsx / index.tsx).
 * Uses the same inject helpers as the Vite plugin for bootstrap/manifest parity.
 */
module.exports = async function iuiCssEntryLoader(source) {
  const helpers = await loadInjectHelpers();
  const resourcePath = this.resourcePath;
  const options = this.getOptions ? this.getOptions() : {};
  const projectRoot = options.projectRoot || this.rootContext || process.cwd();
  const autoBootstrap = options.autoBootstrap !== false;

  if (!helpers.shouldInjectBuildImports(resourcePath)) {
    return source;
  }

  const injectStyles =
    process.env.IUI_ENTRY_INJECT_STYLES === "1" ||
    process.env.IUI_ENTRY_INJECT_STYLES === "true" ||
    this.mode === "production" ||
    process.env.NODE_ENV === "production";

  const bootstrapImport = autoBootstrap
    ? helpers.resolveBootstrapImportForEntry(resourcePath, projectRoot)
    : undefined;

  const prepended = helpers.prependBuildImports(source, {
    manifestId: MANIFEST_IMPORT,
    stylesId: injectStyles ? STYLES_IMPORT : undefined,
    bootstrapImport,
  });

  return prepended ?? source;
};
