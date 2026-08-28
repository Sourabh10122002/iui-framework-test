const {
  resolveAssetSubpath,
  findInventiveUiNodeModulesRoot,
} = require("../shared/asset-packages.cjs");

/**
 * Webpack resolve plugin — maps @inventive-ui/<pkg>/<glyph> to dist files.
 */
class InventiveUiAssetSubpathResolver {
  constructor(options = {}) {
    this.consumerRoot = options.root ?? process.cwd();
    this.projectRoot = findInventiveUiNodeModulesRoot(this.consumerRoot);
  }

  apply(resolver) {
    const target = resolver.getHook("resolve");

    target.tapAsync(
      "InventiveUiAssetSubpath",
      (request, resolveContext, callback) => {
        const req = request.request;
        if (!req || !req.startsWith("@inventive-ui/")) {
          return callback();
        }

        const resolvedPath = resolveAssetSubpath(this.projectRoot, req);
        if (!resolvedPath) {
          return callback();
        }

        const nextRequest = {
          ...request,
          request: resolvedPath,
          path: resolvedPath,
          relativePath: undefined,
        };

        return resolver.doResolve(
          resolver.getHook("resolved"),
          nextRequest,
          `resolved inventive-ui asset subpath: ${req}`,
          resolveContext,
          callback,
        );
      },
    );
  }
}

function inventiveUiAssetSubpathResolver(options = {}) {
  return new InventiveUiAssetSubpathResolver(options);
}

module.exports = {
  InventiveUiAssetSubpathResolver,
  inventiveUiAssetSubpathResolver,
};
