const {
  transformAssetDistModule,
  isTransformableAssetDist,
  packageFolderFromId,
} = require("../shared/slot-transform.cjs");
const { getUsedAssetsRegistry } = require("./slot-assets-registry.cjs");

/**
 * Webpack loader — rewrites @inventive-ui asset hook dynamic imports to scanned manifests.
 */
module.exports = function inventiveUiSlotAssetsLoader(source) {
  const { root } = this.getOptions();
  const resourcePath = this.resourcePath;

  if (!isTransformableAssetDist(resourcePath)) {
    return source;
  }

  const pkgFolder = packageFolderFromId(resourcePath);
  if (!pkgFolder) {
    return source;
  }

  const registry = getUsedAssetsRegistry(root);
  const rewritten = transformAssetDistModule(source, pkgFolder, registry);
  return rewritten ?? source;
};
