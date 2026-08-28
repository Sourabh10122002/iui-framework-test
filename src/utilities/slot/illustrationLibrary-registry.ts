import type {
  IllustrationLibraryMap,
  IllustrationLibraryRenderer,
} from "./slot-types";

const illustrationLibraries: Partial<{
  [K in keyof IllustrationLibraryMap]: IllustrationLibraryRenderer<
    IllustrationLibraryMap[K]
  >;
}> = {};

/**
 * Register an illustration library (e.g. storyset).
 * Library slots (storyset.library.slot.tsx) call this.
 */
export function registerIllustrationLibrary<
  K extends keyof IllustrationLibraryMap,
>(
  library: K,
  renderer: IllustrationLibraryRenderer<IllustrationLibraryMap[K]>,
): void {
  (illustrationLibraries as Record<K, IllustrationLibraryRenderer<IllustrationLibraryMap[K]>>)[library] =
    renderer as IllustrationLibraryRenderer<IllustrationLibraryMap[K]>;
}

/**
 * Get the renderer for an illustration library.
 * Parent illustration.slot.tsx uses this to dispatch.
 */
export function getIllustrationLibraryRenderer<
  K extends keyof IllustrationLibraryMap,
>(
  library: K,
): IllustrationLibraryRenderer<IllustrationLibraryMap[K]> | undefined {
  return illustrationLibraries[library];
}
