import type { IUIAssetsConfig, IUIConfig, IUIThemeConfig } from "./config";

/**
 * Merge theme config (iui.config.ts) with assets (assets.config.json).
 * Use in apps and Storybook with static imports — no filesystem access.
 */
export function mergeProjectConfig(
  theme: IUIThemeConfig,
  assets?: IUIAssetsConfig | null,
): IUIConfig {
  if (!assets) return theme;
  return { ...theme, assets };
}
