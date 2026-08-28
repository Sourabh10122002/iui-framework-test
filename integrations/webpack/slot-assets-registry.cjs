/** @type {{ root: string | null, registry: Map<string, Set<string>>, ready: boolean, scanOptions: object | null }} */
const cache = {
  root: null,
  registry: new Map(),
  ready: false,
  scanOptions: null,
};

function setRegistryCache(root, registry, scanOptions) {
  cache.root = root;
  cache.registry = registry;
  cache.scanOptions = scanOptions;
  cache.ready = true;
}

async function refreshUsedAssets(root, scanOptions = {}) {
  const { scanUsedSlotAssets, lookupKeyToModuleId } = await import(
    "../vite/scan-used-slot-assets.mjs"
  );
  const { resolveAssetSubpath, findInventiveUiNodeModulesRoot } = await import(
    "../shared/asset-packages.cjs"
  );
  const { writeSlotWarmupFile } = await import("../shared/write-slot-warmup.mjs");

  const registry = scanUsedSlotAssets(root, scanOptions);
  const projectRoot = findInventiveUiNodeModulesRoot(root);
  writeSlotWarmupFile(
    root,
    registry,
    projectRoot,
    lookupKeyToModuleId,
    resolveAssetSubpath,
  );
  setRegistryCache(root, registry, scanOptions);
  return registry;
}

function getUsedAssetsRegistry(root) {
  if (!cache.ready || cache.root !== root) {
    return new Map();
  }
  return cache.registry;
}

module.exports = {
  refreshUsedAssets,
  getUsedAssetsRegistry,
  setRegistryCache,
};
