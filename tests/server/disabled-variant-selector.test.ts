/**
 * @jest-environment node
 */
import { buildSelector } from "../../src/engine/parsing/variant";
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";

const baseConfig = {
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig;

describe("disabled variant selectors (Tailwind :is parity)", () => {
  it("scopes disabled alternatives with :is()", () => {
    expect(buildSelector("opacity-50", ["disabled"])).toBe(
      '.opacity-50:is(:disabled, [disabled], [aria-disabled="true"], [data-disabled="true"])',
    );
  });

  it("expands group-disabled branches with the utility class", () => {
    expect(buildSelector("opacity-50", ["group-disabled"])).toBe(
      '.group:disabled .opacity-50, .group[disabled] .opacity-50, .group[aria-disabled="true"] .opacity-50, .group[data-disabled="true"] .opacity-50',
    );
  });

  it("expands peer-disabled branches with the utility class", () => {
    expect(buildSelector("opacity-50", ["peer-disabled"])).toBe(
      '.peer:disabled ~ .opacity-50, .peer[disabled] ~ .opacity-50, .peer[aria-disabled="true"] ~ .opacity-50, .peer[data-disabled="true"] ~ .opacity-50',
    );
  });

  it("does not emit global disabled attribute selectors in build CSS", () => {
    const result = generateBuildCSS(["disabled:opacity-50"], baseConfig);
    expect(result.utilitiesCSS).toMatch(
      /\.disabled\\:opacity-50:is\(:disabled, \[disabled\], \[aria-disabled="true"\], \[data-disabled="true"\]\)/,
    );
    expect(result.utilitiesCSS).not.toMatch(
      /^\s*\[aria-disabled="true"\]\s*\{/m,
    );
    expect(result.utilitiesCSS).not.toMatch(
      /^\s*\[data-disabled="true"\]\s*\{/m,
    );
  });
});
