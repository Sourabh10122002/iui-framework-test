/**
 * @jest-environment node
 */
import {
  THEME_GRAY_STEPS,
  expandThemeGrayUtilityClasses,
  filterChromaticGrayUtilitiesWithoutAccent,
  accentPaletteIncludesGray,
} from "../../src/server/expand-theme-gray-utility-classes";

describe("expandThemeGrayUtilityClasses", () => {
  it("defines 49 even steps from 2 to 98", () => {
    expect(THEME_GRAY_STEPS).toHaveLength(49);
    expect(THEME_GRAY_STEPS[0]).toBe(2);
    expect(THEME_GRAY_STEPS[THEME_GRAY_STEPS.length - 1]).toBe(98);
  });

  it("emits color utilities for each theme gray step", () => {
    const classes = expandThemeGrayUtilityClasses();
    expect(classes.has("bg-gray-24")).toBe(true);
    expect(classes.has("text-gray-96")).toBe(true);
    expect(classes.has("border-gray-50")).toBe(true);
    expect(classes.has("bg-gray-200")).toBe(false);
  });
});

describe("filterChromaticGrayUtilitiesWithoutAccent", () => {
  it("removes gray-50…950 utilities when accent.gray is missing", () => {
    const classes = new Set(["bg-gray-24", "bg-gray-200", "hover:bg-gray-500"]);
    filterChromaticGrayUtilitiesWithoutAccent(classes, {
      theme: { colors: { accent: { slate: "#64748b" } } },
    });
    expect(classes.has("bg-gray-24")).toBe(true);
    expect(classes.has("bg-gray-200")).toBe(false);
    expect(classes.has("hover:bg-gray-500")).toBe(false);
  });

  it("keeps chromatic gray utilities when accent.gray is configured", () => {
    const classes = new Set(["bg-gray-200"]);
    filterChromaticGrayUtilitiesWithoutAccent(classes, {
      theme: { colors: { accent: { gray: "#64748b" } } },
    });
    expect(classes.has("bg-gray-200")).toBe(true);
    expect(accentPaletteIncludesGray({ theme: { colors: { accent: { gray: "#64748b" } } } })).toBe(true);
  });
});
