// React not used in this file
import type { IconLibraryMap, IconLibraryRenderer } from "./slot-types";

/**
 * Runtime registry
 */
const iconLibraries: Partial<{
  [K in keyof IconLibraryMap]: IconLibraryRenderer<IconLibraryMap[K]>;
}> = {};

/**
 * Register an icon library
 */
export function registerIconLibrary<K extends keyof IconLibraryMap>(
  library: K,
  renderer: IconLibraryRenderer<IconLibraryMap[K]>
): void {
  // Type assertion is necessary and safe because:
  // 1. K extends keyof IconLibraryMap ensures library is a valid key
  // 2. renderer is typed as IconLibraryRenderer<IconLibraryMap[K]>, which matches the registry type
  // 3. TypeScript cannot automatically verify this assignment due to IconLibraryMap[K]
  //    being a union type when K is keyof IconLibraryMap
  // 4. At runtime, the types are guaranteed to match because:
  //    - library is a specific key (e.g., "material-icons", "lucide", "phosphor", "material-symbols")
  //    - renderer accepts exactly IconLibraryMap[library]
  //    - iconLibraries[library] expects IconLibraryRenderer<IconLibraryMap[library]>
  // This is a known TypeScript limitation when working with generic discriminated unions
  iconLibraries[library] = renderer as Partial<{
    [Key in keyof IconLibraryMap]: IconLibraryRenderer<IconLibraryMap[Key]>;
  }>[K];
}

/**
 * Get renderer (typed!)
 */
export function getIconLibraryRenderer<K extends keyof IconLibraryMap>(
  library: K
): IconLibraryRenderer<IconLibraryMap[K]> | undefined {
  return iconLibraries[library];
}
