import type { FileTypeLibrary } from "../../core/config";
import {
  getFileTypeFallback,
  getFileTypeLibrary,
  getFileTypePlaceholderProps,
  getGlobalFileTypes,
  resolvePlaceholderValuesInObject,
} from "../../core/config-loader";
import { resolveAssetAliasValue } from "./resolve-asset-alias-value";

export interface FileTypeSlotBase {
  type: "file-type";
  extension?: string;
  library?: FileTypeLibrary;
}

/**
 * Resolves a file-type slot: `@placeholder`, `@alias`, fallback on extension field.
 */
export function resolveFileTypeSlot<T extends FileTypeSlotBase>(slot: T): T {
  const configLibrary = getFileTypeLibrary();
  const library = slot.library ?? configLibrary;
  let merged = { ...slot, library } as T;

  merged = resolvePlaceholderValuesInObject(
    merged,
    getFileTypePlaceholderProps(),
  );

  const extension = (merged as FileTypeSlotBase).extension;
  if (typeof extension !== "string" || extension.length === 0) {
    return merged;
  }
  if (!extension.startsWith("@")) {
    return merged;
  }

  const resolved = resolveAssetAliasValue({
    rawValue: extension,
    globalMap: getGlobalFileTypes(),
    placeholderProps: getFileTypePlaceholderProps(),
    placeholderField: "extension",
    fallback: getFileTypeFallback(),
    assetLabel: "fileType",
  });

  return { ...merged, extension: resolved } as T;
}
