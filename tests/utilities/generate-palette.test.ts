/**
 * @jest-environment node
 */
import { generatePalette } from "../../src/utilities/theme-utilities";

describe("generatePalette", () => {
  it("anchors low-saturation accent bases (zinc) with a light neutral ramp", () => {
    const { palette } = generatePalette("#71717a", true);

    expect(palette["500"]).toBe("#71717a");
    expect(palette["50"]).toBe("#f7f7f7");
    expect(palette["950"]).toBe("#0a0a0a");
  });

  it("generates tinted light shades (not pure white) for saturated colors", () => {
    const { palette } = generatePalette("#3b82f6", true);

    expect(palette["500"]).toBe("#3b82f6");
    expect(palette["50"]).toBe("#f2f7fe");
    expect(palette["50"]).not.toBe("#ffffff");
    expect(palette["100"]).toBe("#dbe8fd");
  });

  it("matches semantic defaults from config (danger, warning, brand)", () => {
    expect(generatePalette("#ef4444", true).palette["50"]).toBe("#fef3f3");
    expect(generatePalette("#f59e0b", true).palette["50"]).toBe("#fefaf2");
    expect(generatePalette("#6366f1", true).palette["50"]).toBe("#f3f3fe");
    expect(generatePalette("#6366f1", true).palette["50"]).not.toBe("#ffffff");
  });
});
