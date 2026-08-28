import type { IconSlot } from "./slot-types";
import {
  getGlobalIcons,
  getIconFallback,
  getIconLibrary,
  getIconDefaults,
  getIconPlaceholderProps,
  SLOT_PLACEHOLDER_SENTINEL,
} from "../../core/config-loader";
import { normalizeIconLibraryId } from "./normalize-icon-library";
import { resolveGlobalAlias } from "./resolve-global-alias";
import { createScopedLogger } from "../logger";

/** Leading `@` resolves via `assets.icon.globalIcons`; otherwise `name` is a literal glyph id. */
export const GLOBAL_ICON_NAME_PREFIX = "@";

const iconLogger = createScopedLogger("IconSlot");

/**
 * Resolves an icon slot: fill library from config if omitted,
 * merge config defaults when slot library matches config library.
 *
 * - `@placeholder` → `assets.icon.placeholder.name`
 * - Other `@alias` → `assets.icon.globalIcons` (config library only)
 * - Unmapped `@alias` → dev warning + `assets.icon.fallback` at render time
 */
export function resolveIconSlot<T extends IconSlot>(slot: T): T {
  const configLibrary = normalizeIconLibraryId(getIconLibrary());
  const rawLibrary = slot.library ?? configLibrary;
  const library = normalizeIconLibraryId(rawLibrary);
  const useDefaults = library === configLibrary ? getIconDefaults() : null;

  const merged = {
    ...(useDefaults || {}),
    ...slot,
    library: library as T extends { library: infer L } ? L : never,
  } as T;

  const name = (merged as { name?: unknown }).name;
  if (typeof name !== "string" || name.length === 0) {
    return merged;
  }

  if (!name.startsWith(GLOBAL_ICON_NAME_PREFIX)) {
    return merged;
  }

  if (name === SLOT_PLACEHOLDER_SENTINEL) {
    const placeholder = getIconPlaceholderProps();
    const glyph =
      typeof placeholder.name === "string" && placeholder.name.length > 0
        ? placeholder.name
        : null;
    if (glyph) {
      return { ...merged, library: configLibrary as T extends { library: infer L } ? L : never, name: glyph } as T;
    }
    iconLogger.warn(
      `@placeholder used but assets.icon.placeholder.name is not configured`,
    );
    return {
      ...merged,
      library: configLibrary as T extends { library: infer L } ? L : never,
      name: getIconFallback(),
    } as T;
  }

  if (slot.library && library !== configLibrary) {
    iconLogger.warn(
      `@alias "${name}" ignores slot.library "${library}" — globalIcons apply to assets.icon.library "${configLibrary}" only`,
    );
  }

  const glyph = resolveGlobalAlias(name, getGlobalIcons() as Record<string, string>);
  if (glyph) {
    return {
      ...merged,
      library: configLibrary as T extends { library: infer L } ? L : never,
      name: glyph,
    } as T;
  }

  const fallback = getIconFallback();
  iconLogger.warn(
    `Unmapped alias "${name}", using fallback glyph "${fallback}"`,
  );
  return {
    ...merged,
    library: configLibrary as T extends { library: infer L } ? L : never,
    name: fallback,
  } as T;
}
