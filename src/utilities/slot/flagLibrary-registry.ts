import type { FlagLibraryMap, FlagLibraryRenderer } from "./slot-types";

const flagLibraries: Partial<{
  [K in keyof FlagLibraryMap]: FlagLibraryRenderer<FlagLibraryMap[K]>;
}> = {};

/**
 * Register a flag library (e.g. flagpack).
 * Library slots (flagpack.library.slot.tsx) call this.
 */
export function registerFlagLibrary<K extends keyof FlagLibraryMap>(
  library: K,
  renderer: FlagLibraryRenderer<FlagLibraryMap[K]>,
): void {
  (flagLibraries as Record<K, FlagLibraryRenderer<FlagLibraryMap[K]>>)[
    library
  ] = renderer as FlagLibraryRenderer<FlagLibraryMap[K]>;
}

/**
 * Get the renderer for a flag library.
 * Parent flag.slot.tsx uses this to dispatch.
 */
export function getFlagLibraryRenderer<K extends keyof FlagLibraryMap>(
  library: K,
): FlagLibraryRenderer<FlagLibraryMap[K]> | undefined {
  return flagLibraries[library];
}
