import type { IUIConfig, NeutralColor } from "../../src/core/config";
import {
  THEME_BRAND_DEFAULT_HEX,
  THEME_NEUTRAL_DEFAULT_HEX,
  THEME_SEMANTIC_DEFAULT_HEX,
} from "../../src/engine/tokens/values";

/** Minimal accent keys for Jest fixtures — not framework defaults. */
export const TEST_ACCENT_PALETTE = {};

export const TEST_SEMANTIC_HEX = {
  ...THEME_SEMANTIC_DEFAULT_HEX,
};

export const TEST_BRAND_HEX = THEME_BRAND_DEFAULT_HEX;
export const TEST_NEUTRAL_HEX = {
  set: THEME_NEUTRAL_DEFAULT_HEX,
} satisfies NeutralColor;

export function withTestAccentPalette(
  config: IUIConfig,
  accentOverrides: Record<string, string> = {},
): IUIConfig {
  return {
    ...config,
    theme: {
      ...config.theme,
      colors: {
        ...config.theme?.colors,
        semantic: {
          ...TEST_SEMANTIC_HEX,
          ...config.theme?.colors?.semantic,
        },
        brand: config.theme?.colors?.brand ?? { set: TEST_BRAND_HEX },
        neutral: {
          ...TEST_NEUTRAL_HEX,
          ...config.theme?.colors?.neutral,
        } satisfies NeutralColor,
        accent: {
          ...TEST_ACCENT_PALETTE,
          ...config.theme?.colors?.accent,
          ...accentOverrides,
        },
      },
    },
  };
}
