import type { FileTypeLibraryMap, FileTypeLibraryRenderer } from "./slot-types";

const fileTypeLibraries: Partial<{
  [K in keyof FileTypeLibraryMap]: FileTypeLibraryRenderer<FileTypeLibraryMap[K]>;
}> = {};

export function registerFileTypeLibrary<K extends keyof FileTypeLibraryMap>(
  library: K,
  renderer: FileTypeLibraryRenderer<FileTypeLibraryMap[K]>,
): void {
  (
    fileTypeLibraries as Record<
      K,
      FileTypeLibraryRenderer<FileTypeLibraryMap[K]>
    >
  )[library] = renderer as FileTypeLibraryRenderer<FileTypeLibraryMap[K]>;
}

export function getFileTypeLibraryRenderer<K extends keyof FileTypeLibraryMap>(
  library: K,
): FileTypeLibraryRenderer<FileTypeLibraryMap[K]> | undefined {
  return fileTypeLibraries[library];
}

