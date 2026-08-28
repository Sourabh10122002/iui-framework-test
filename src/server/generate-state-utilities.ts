/**
 * Collect state utility class names for compile-first CSS generation.
 * CSS at build time; behavior (data attrs, aria, blocking) stays in useStates at runtime.
 */

import { initConfig, getStatesConfig } from "../core/config-loader";
import type { IUIConfig } from "../core/config";
import {
  resolveStatesConfig,
  generateStateCSS,
} from "../core/states/resolver";
import { getConfigPalettes } from "./get-config-palettes";

export interface CollectStateUtilityOptions {
  /** Extra component colors for adaptive focus rings at build time */
  colors?: string[];
  /** Emit data-loading:focus-visible:* variants (maximal context pass). @default true */
  includeLoadingFocus?: boolean;
}

/** Palette names that adaptive focus rings may follow (semantic, accent slots, base palettes). */
function collectThemeColorKeys(config: IUIConfig): string[] {
  return [...new Set(getConfigPalettes(config))];
}

/**
 * Flatten generateStateCSS output into deduplicated utility class names for the build scanner.
 */
export function collectStateUtilityClasses(
  config?: IUIConfig | null,
  options?: CollectStateUtilityOptions,
): string[] {
  if (!config) return [];

  try {
    initConfig(config);
  } catch {
    // Config may already be initialized
  }

  const resolved = resolveStatesConfig(getStatesConfig());
  const classSet = new Set<string>();

  const addClasses = (classNames: string[]) => {
    for (const cls of classNames) {
      if (cls && typeof cls === "string") classSet.add(cls);
    }
  };

  // Base pass — static ring color / default adaptive fallback (config.color)
  addClasses(generateStateCSS(resolved, {}).combined.classNames);

  // Adaptive focus: expand per semantic / brand / accent keys from theme
  if (resolved.focused.mode === "adaptive") {
    const adaptiveColors = [
      ...new Set([
        ...collectThemeColorKeys(config),
        ...(options?.colors ?? []),
      ]),
    ];

    for (const componentColor of adaptiveColors) {
      addClasses(
        generateStateCSS(resolved, { componentColor }).combined.classNames,
      );
    }
  }

  // Loading + focusable context (data-loading:focus-visible:*)
  if (options?.includeLoadingFocus !== false) {
    const loadingColor = resolved.loading.color ?? "neutral";
    const componentColor = resolved.focused.color ?? "brand";
    addClasses(
      generateStateCSS(resolved, {
        componentColor,
        loadingColor,
        isLoadingAndFocusable: true,
      }).combined.classNames,
    );
  }

  return [...classSet];
}
