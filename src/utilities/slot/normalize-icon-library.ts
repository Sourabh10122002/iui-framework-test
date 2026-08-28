/**
 * Maps alternate / legacy `library` strings to the id passed to
 * `registerIconLibrary` (single source of truth per icon pack).
 */
const ICON_LIBRARY_ALIASES: Readonly<Record<string, string>> = {
  materialSymbols: "material-symbols",
};

/**
 * Returns the canonical icon library id for registry lookup.
 */
export function normalizeIconLibraryId(library: string): string {
  return ICON_LIBRARY_ALIASES[library] ?? library;
}
