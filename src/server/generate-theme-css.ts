/**
 * Compile-time full theme CSS — palette vars, design tokens, global styles, font imports.
 * Replaces runtime injectGlobalStyles + initializeGlobalDesignTokens + palette init in build.
 */

import { initConfig, getConfigLoader } from "../core/config-loader";
import type { IUIConfig } from "../core/config";
import {
  collectDesignTokenVariables,
  designTokenVariablesToCSS,
  buildGlobalConfigStylesCSS,
  buildFontImportCSS,
  type TypographyExtend,
} from "../configuration/theme-css-builders";
import { borderRadius, spacing, fontFamily } from "../engine/tokens/values";
import { VariableUtils } from "../utilities/variable-utilities";
import {
  generatePalette,
  generateNeutralPalette,
} from "../utilities/theme-utilities";
import {
  buildAccentPaletteRegistry,
  isHexColor,
  resolvePaletteBaseHex,
  resolveThemePalettes,
} from "../core/palette-registry";

const COLOR_SHADES = [
  "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950",
] as const;

function appendHexPalette(
  entries: string[],
  prefix: string,
  baseHex: string,
): void {
  const { palette } = generatePalette(baseHex, true);
  for (const shade of COLOR_SHADES) {
    const varName = VariableUtils.getColor(`${prefix}-${shade}`);
    entries.push(`${varName}:${palette[shade as keyof typeof palette]}`);
  }
}

/**
 * Build-time neutral + theme gray palettes (mirrors initializeNeutralColors).
 */
function appendNeutralPaletteAtBuild(
  entries: string[],
  prefix: string,
  baseHex: string,
): void {
  const { palette11, grayPalette } = generateNeutralPalette(baseHex);

  for (const shade of COLOR_SHADES) {
    const hex = palette11[shade];
    if (hex) {
      const varName = VariableUtils.getColor(`${prefix}-${shade}`);
      entries.push(`${varName}:${hex}`);
    }
  }

  for (const [shade, hex] of Object.entries(grayPalette)) {
    const varName = VariableUtils.getColor(`gray-${shade}`);
    entries.push(`${varName}:${hex}`);
  }
}

function appendPaletteFromReference(
  entries: string[],
  prefix: string,
  reference: string,
  accentRegistry: Map<string, string>,
): void {
  if (!reference) return;

  if (isHexColor(reference)) {
    appendHexPalette(entries, prefix, reference);
    return;
  }

  const baseHex = resolvePaletteBaseHex(reference, accentRegistry);
  if (baseHex) {
    appendHexPalette(entries, prefix, baseHex);
  }
}

/**
 * Generate theme CSS variables for SSR / compile-first build.
 * Includes global tokens plus semantic, brand, accent, and neutral palettes.
 */
export function generateThemeCSSVars(config?: IUIConfig | null): string {
  if (!config) return "";
  try {
    initConfig(config);
  } catch {
    // Config might already be initialized
  }
  const loader = getConfigLoader();
  const radiusSet = loader.getRadiusSet?.() ?? "md";
  const spacingSet = loader.getSpacingSet?.() ?? "standard";
  const typographySet = loader.getTypographySet?.() ?? "inter";
  const panelBg = loader.getPanelBackgroundSet?.() ?? "solid";
  const direction = config?.theme?.direction ?? "ltr";

  const radiusMap: Record<string, string> = {
    none: borderRadius.none,
    sm: borderRadius.sm,
    md: borderRadius.md,
    lg: borderRadius.lg,
    full: borderRadius.full,
  };
  const radiusValue = radiusMap[radiusSet] ?? borderRadius.default;

  const spacingMap: Record<string, string> = {
    compact: spacing["1"],
    standard: spacing["2"],
    spacious: spacing["4"],
  };
  const spacingValue = spacingMap[spacingSet] ?? spacing["2"];

  const fontValue =
    fontFamily[typographySet as keyof typeof fontFamily] ?? fontFamily.inter;
  const fontFamilyValue = Array.isArray(fontValue)
    ? fontValue.join(", ")
    : String(fontValue);

  const vars: string[] = [
    `--iui-global-radius:${radiusValue}`,
    `--iui-global-spacing:${spacingValue}`,
    `--iui-global-font:${fontFamilyValue}`,
    `--iui-panel-background:${panelBg}`,
  ];

  const accentRegistry = buildAccentPaletteRegistry(config?.theme?.colors?.accent);
  const resolved = resolveThemePalettes(config);

  for (const [semanticName, baseHex] of Object.entries(resolved.semantic)) {
    appendHexPalette(vars, semanticName, baseHex);
  }

  if (resolved.brand) {
    appendHexPalette(vars, "brand", resolved.brand);
  }

  const accent = config?.theme?.colors?.accent ?? {};
  for (const [accentName, baseColor] of Object.entries(accent)) {
    if (typeof baseColor === "string") {
      appendPaletteFromReference(vars, accentName, baseColor, accentRegistry);
    }
  }

  if (resolved.neutralBase) {
    appendNeutralPaletteAtBuild(vars, "neutral", resolved.neutralBase);
  }

  return `:root{${vars.join(";")}}[dir="${direction}"]{direction:${direction}}`;
}

export interface FullThemeCSSResult {
  css: string;
  htmlAttributes: Record<string, string>;
}

/**
 * Generate complete theme CSS for compile-first builds.
 * Includes palette vars, spacing/font tokens, global styles, and optional font @imports.
 */
export function generateFullThemeCSS(
  config?: IUIConfig | null,
): FullThemeCSSResult {
  if (!config) {
    return { css: "", htmlAttributes: {} };
  }

  try {
    initConfig(config);
  } catch {
    // Config may already be initialized
  }

  const loader = getConfigLoader();
  const direction = config.theme?.direction ?? "ltr";
  const panelBg = loader.getPanelBackgroundSet?.() ?? "solid";
  const panelBackgroundValue =
    panelBg === "translucent" ? "translucent" : "solid";

  const typographyExtend =
    (loader.getTypographyExtend?.() as TypographyExtend | undefined) ?? {};

  const paletteCSS = generateThemeCSSVars(config);
  const tokenCSS = designTokenVariablesToCSS(
    collectDesignTokenVariables(typographyExtend),
  );
  const globalStylesCSS = buildGlobalConfigStylesCSS();
  const fontImportCSS = buildFontImportCSS({
    provider: loader.getTypographyProvider?.(),
    typographyExtend,
    localFontUrls: loader.getLocalFontUrls?.(),
  });

  const css = [fontImportCSS, paletteCSS, tokenCSS, globalStylesCSS]
    .filter(Boolean)
    .join("\n");

  return {
    css,
    htmlAttributes: {
      dir: direction,
      "data-panel-background": panelBackgroundValue,
    },
  };
}
