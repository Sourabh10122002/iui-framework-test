import { mkdirSync, writeFileSync } from "fs";
import { buildWarmupModuleSource, collectWarmupImportIds } from "./generate-slot-warmup.mjs";
import { iuiCacheDir, iuiCacheFile } from "./iui-paths.mjs";

/**
 * Writes `.iui/cache/slot-warmup.mjs` for Webpack consumers.
 */
export function writeSlotWarmupFile(
  consumerRoot,
  registry,
  projectRoot,
  lookupKeyToModuleId,
  resolveAssetSubpath,
) {
  const ids = collectWarmupImportIds(
    registry,
    projectRoot,
    lookupKeyToModuleId,
    resolveAssetSubpath,
  );
  const outDir = iuiCacheDir(consumerRoot);
  mkdirSync(outDir, { recursive: true });
  const outFile = iuiCacheFile(consumerRoot, "slotWarmup");
  writeFileSync(outFile, buildWarmupModuleSource(ids), "utf8");
  return outFile;
}

export function getWarmupModuleSource(
  registry,
  projectRoot,
  lookupKeyToModuleId,
  resolveAssetSubpath,
) {
  const ids = collectWarmupImportIds(
    registry,
    projectRoot,
    lookupKeyToModuleId,
    resolveAssetSubpath,
  );
  return buildWarmupModuleSource(ids);
}
