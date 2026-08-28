/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import { initConfig } from "../../src/core/config-loader";
import { utilityBuilder } from "../../src/engine/core/builder";
import { expandShadeClasses } from "../../src/server/expand-shade-classes";
import { expandThemeUtilityClasses } from "../../src/server/expand-theme-utility-classes";
import { expandBuildClasses } from "../../src/server/expand-build-classes";
import {
  resolvePaletteUtilitiesFromPatterns,
  type PalettePattern,
} from "../../src/server/resolve-palette-utilities";
import { generateBuildCSS } from "../../src/server/ssr-extraction";
import { withTestAccentPalette } from "../helpers/test-accent-palette";

const sampleConfig = withTestAccentPalette({
  theme: {
    direction: "ltr" as const,
    typography: { provider: "system" as const, set: "inter" as const },
    radius: { set: "md" as const },
    spacing: { set: "standard" as const },
  },
} satisfies IUIConfig);

beforeAll(() => {
  initConfig(sampleConfig);
});

beforeEach(() => {
  utilityBuilder.clear();
});

describe("expandShadeClasses", () => {
  it("produces shade-composed utility classes for config palettes", () => {
    const classes = expandShadeClasses(sampleConfig);
    expect(classes.size).toBeGreaterThan(100);
    expect(classes.has("bg-brand-600")).toBe(true);
    expect(classes.has("hover:bg-brand-700") || [...classes].some((c) => c.includes("hover:bg-brand"))).toBe(true);
  });

  it("returns empty set when shade matrix is skipped via expandBuildClasses", () => {
    const expanded = expandBuildClasses(["flex"], {
      config: sampleConfig,
      includeShadeMatrix: false,
      includeThemePresets: false,
      resolvePalettePatterns: false,
    });
    expect(expanded.has("flex")).toBe(true);
    expect(expanded.has("bg-brand-600")).toBe(false);
  });

  it("defaults includeShadeMatrix to false (scan-first)", () => {
    const expanded = expandBuildClasses(["flex", "p-4"], {
      config: sampleConfig,
      includeThemePresets: false,
      includeThemeGrayScale: false,
      resolvePalettePatterns: false,
    });
    expect(expanded.has("flex")).toBe(true);
    expect(expanded.has("p-4")).toBe(true);
    expect(expanded.has("bg-brand-600")).toBe(false);
    expect(expanded.size).toBe(2);
  });

  it("expands shade matrix when includeShadeMatrix is explicitly true", () => {
    const expanded = expandBuildClasses(["flex"], {
      config: sampleConfig,
      includeShadeMatrix: true,
      includeThemePresets: false,
      resolvePalettePatterns: false,
    });
    expect(expanded.has("flex")).toBe(true);
    expect(expanded.has("bg-brand-600")).toBe(true);
    expect(expanded.size).toBeGreaterThan(100);
  });
});

describe("expandThemeUtilityClasses", () => {
  it("includes spacing and radius preset utilities", () => {
    const classes = expandThemeUtilityClasses();
    expect(classes.size).toBeGreaterThan(0);
    expect([...classes].some((token) => token.startsWith("p-") || token.startsWith("gap-"))).toBe(true);
  });
});

describe("expandThemeGrayUtilityClasses", () => {
  it("includes theme gray bg/text/border for even steps 2–98", () => {
    const expanded = expandBuildClasses(["flex"], {
      config: sampleConfig,
      includeThemePresets: false,
      includeThemeGrayScale: true,
      resolvePalettePatterns: false,
    });
    expect(expanded.has("bg-gray-2")).toBe(true);
    expect(expanded.has("bg-gray-24")).toBe(true);
    expect(expanded.has("bg-gray-98")).toBe(true);
    expect(expanded.has("text-gray-50")).toBe(true);
    expect(expanded.has("border-gray-96")).toBe(true);
    expect(expanded.has("bg-gray-3")).toBe(false);
  });

  it("strips chromatic gray-50…950 utilities when accent.gray is absent", () => {
    const expanded = expandBuildClasses(["bg-gray-200", "text-gray-500", "bg-gray-24"], {
      config: sampleConfig,
      includeThemePresets: false,
      includeThemeGrayScale: true,
      resolvePalettePatterns: false,
    });
    expect(expanded.has("bg-gray-200")).toBe(false);
    expect(expanded.has("text-gray-500")).toBe(false);
    expect(expanded.has("bg-gray-24")).toBe(true);
  });

  it("skips theme gray expansion when includeThemeGrayScale is false", () => {
    const expanded = expandBuildClasses(["flex"], {
      config: sampleConfig,
      includeThemePresets: false,
      includeThemeGrayScale: false,
      resolvePalettePatterns: false,
    });
    expect(expanded.has("bg-gray-24")).toBe(false);
  });
});

describe("resolvePaletteUtilitiesFromPatterns", () => {
  it("generates bg-brand-500 from bg-${paletteName}-500 pattern", () => {
    const patterns: PalettePattern[] = [
      {
        variantPrefix: "",
        property: "bg",
        paletteVar: "paletteName",
        shade: "500",
        dynamicShade: false,
      },
    ];

    const classes = resolvePaletteUtilitiesFromPatterns(patterns, sampleConfig, [
      "brand",
      "danger",
      "success",
    ]);

    expect(classes.has("bg-brand-500")).toBe(true);
    expect(classes.has("bg-danger-500")).toBe(true);
    expect(classes.has("bg-success-500")).toBe(true);
    expect(classes.has("bg-brand-400")).toBe(false);
    expect(classes.has("bg-brand-50")).toBe(false);
  });

  it("generates variant-prefixed utilities for hover:dark:bg-${color}-600", () => {
    const patterns: PalettePattern[] = [
      {
        variantPrefix: "hover:dark",
        property: "bg",
        paletteVar: "color",
        shade: "600",
        dynamicShade: false,
      },
    ];

    const classes = resolvePaletteUtilitiesFromPatterns(patterns, sampleConfig, ["brand"]);
    expect(classes.has("hover:dark:bg-brand-600")).toBe(true);
  });
});

describe("generateBuildCSS with shade expansion", () => {
  it("builds CSS for shade-composed classes without safelist", () => {
    const shadeClasses = expandShadeClasses(sampleConfig);
    const sample = [...shadeClasses].slice(0, 50);
    const result = generateBuildCSS(sample, sampleConfig);

    expect(result.utilitiesCSS.length).toBeGreaterThan(0);
    expect(result.uncoveredClasses.length).toBe(0);
  });
});
