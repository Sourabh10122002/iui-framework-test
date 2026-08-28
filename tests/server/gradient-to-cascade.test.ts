/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";

import { withTestAccentPalette } from "../helpers/test-accent-palette";

const baseConfig = withTestAccentPalette({
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig);

describe("gradient to color with via (cascade-safe)", () => {
  it("keeps to-* color even when via-* appears later in the stylesheet", () => {
    // Emit via before to (alphabetical / scan order in docs CSS).
    const result = generateBuildCSS(
      ["bg-gradient-to-e", "via-violet-500", "to-pink-500", "from-blue-500"],
      baseConfig,
    );

    const css = result.combinedCSS;
    const viaBlockStart = css.indexOf(".via-violet-500");
    const toBlockStart = css.indexOf(".to-pink-500");
    expect(viaBlockStart).toBeGreaterThan(-1);
    expect(toBlockStart).toBeGreaterThan(-1);

    // via must not assign --iui-gradient-to (that overwrote to-* when via sorted after to)
    const viaEnd = css.indexOf("}", viaBlockStart);
    const viaRule = css.slice(viaBlockStart, viaEnd + 1);
    expect(viaRule).not.toMatch(/--iui-gradient-to\s*:/);
    expect(viaRule).toContain("--iui-gradient-via:");

    const toEnd = css.indexOf("}", toBlockStart);
    const toRule = css.slice(toBlockStart, toEnd + 1);
    expect(toRule).toMatch(
      /--iui-gradient-to\s*:\s*var\(--iui-color-pink-500\)/,
    );

    // stops use CSS fallback when to is unset
    expect(css).toContain("var(--iui-gradient-to, rgb(0 0 0 / 0))");
  });

  it("maps Tailwind L/R direction aliases", () => {
    const result = generateBuildCSS(
      ["bg-gradient-to-r", "bg-gradient-to-br", "from-blue-500", "to-pink-500"],
      baseConfig,
    );
    expect(result.combinedCSS).toContain(
      "linear-gradient(to right, var(--iui-gradient-stops))",
    );
    expect(result.combinedCSS).toContain(
      "linear-gradient(to bottom right, var(--iui-gradient-stops))",
    );
    expect(result.combinedCSS).not.toContain(
      "--iui-color-gradient-to-r",
    );
  });
});
