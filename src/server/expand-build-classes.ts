import { readFileSync } from "fs";
import type { IUIConfig } from "../core/config";
import { expandShadeClasses } from "./expand-shade-classes";
import { expandThemeUtilityClasses } from "./expand-theme-utility-classes";
import {
  expandThemeGrayUtilityClasses,
  filterChromaticGrayUtilitiesWithoutAccent,
} from "./expand-theme-gray-utility-classes";
import {
  resolvePaletteUtilities,
  type FilePaletteSignals,
} from "./resolve-palette-utilities";

export interface ExpandBuildClassesOptions {
  config?: IUIConfig | null;
  /** Per-file palette pattern signals from scan-palette-patterns.mjs */
  filePaletteSignals?: FilePaletteSignals[];
  /** Arbitrary utility classes from scan-arbitrary-classes.mjs */
  arbitraryClasses?: Iterable<string>;
  includeShadeMatrix?: boolean;
  includeThemePresets?: boolean;
  /** Pre-expand theme gray utilities gray-2…98 (default: true). Independent of accent.gray. */
  includeThemeGrayScale?: boolean;
  resolvePalettePatterns?: boolean;
}

function buildDefault(
  value: boolean | undefined,
  fallback: boolean,
): boolean {
  return value === undefined ? fallback : value;
}

export function expandBuildClasses(
  scannedClasses: Iterable<string>,
  options: ExpandBuildClassesOptions = {},
): Set<string> {
  const classes = new Set(scannedClasses);
  const config = options.config ?? undefined;

  if (buildDefault(options.includeThemePresets, true)) {
    expandThemeUtilityClasses().forEach((token) => classes.add(token));
  }

  const includeThemeGrayScale =
    options.includeThemeGrayScale ??
    buildDefault(config?.build?.includeThemeGrayScale, true);

  if (includeThemeGrayScale) {
    expandThemeGrayUtilityClasses().forEach((token) => classes.add(token));
  }

  if (buildDefault(options.includeShadeMatrix, false)) {
    expandShadeClasses(config).forEach((token) => classes.add(token));
  }

  if (buildDefault(options.resolvePalettePatterns, true) && options.filePaletteSignals) {
    resolvePaletteUtilities(options.filePaletteSignals, config).forEach((token) =>
      classes.add(token),
    );
  }

  if (options.arbitraryClasses) {
    for (const token of options.arbitraryClasses) {
      classes.add(token);
    }
  }

  filterChromaticGrayUtilitiesWithoutAccent(classes, config);

  return classes;
}

export function collectFilePaletteSignals(
  fileMap: Map<string, Set<string>>,
  scanPalettePatternsFromSource: (
    content: string,
    filename?: string,
  ) => FilePaletteSignals,
): FilePaletteSignals[] {
  const signals: FilePaletteSignals[] = [];

  for (const [filePath] of fileMap) {
    try {
      const content = readFileSync(filePath, "utf8");
      signals.push(scanPalettePatternsFromSource(content, filePath));
    } catch {
      // Skip unreadable files.
    }
  }

  return signals;
}
