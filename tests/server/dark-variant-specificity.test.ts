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

describe("dark/light variant selectors (Tailwind v3.4+ / v4 parity)", () => {
  it("uses :where(.dark, .dark *) so dark: does not raise specificity", () => {
    expect(buildSelector("dark:border-brand-500", ["dark"])).toBe(
      ".dark\\:border-brand-500:where(.dark, .dark *)",
    );
    expect(buildSelector("dark:bg-gray-900", ["dark"])).toBe(
      ".dark\\:bg-gray-900:where(.dark, .dark *)",
    );
  });

  it("uses :where(.light, .light *) for light:", () => {
    expect(buildSelector("light:bg-white", ["light"])).toBe(
      ".light\\:bg-white:where(.light, .light *)",
    );
  });

  it("composes dark with hover without ancestor .dark wrapper", () => {
    expect(buildSelector("dark:hover:bg-red-500", ["dark", "hover"])).toBe(
      ".dark\\:hover\\:bg-red-500:hover:where(.dark, .dark *)",
    );
  });

  it("emits dark:border-* with :where so side colors can compose", () => {
    const result = generateBuildCSS(
      [
        "border-2",
        "border-brand-500",
        "dark:border-brand-500",
        "border-s-transparent",
        "border-b-transparent",
      ],
      baseConfig,
    );
    const css = result.utilitiesCSS;

    expect(css).toMatch(
      /\.dark\\:border-brand-500:where\(\.dark,\s*\.dark\s*\*\)/,
    );
    expect(css).not.toMatch(/\.dark\s+\.dark\\:border-brand-500/);

    expect(css).toMatch(
      /\.border-s-transparent\s*\{[^}]*border-inline-start-color:\s*transparent/,
    );
    expect(css).toMatch(
      /\.border-b-transparent\s*\{[^}]*border-bottom-color:\s*transparent/,
    );
  });

  it("emits base utilities before dark: so :where() variants win in the cascade", () => {
    const result = generateBuildCSS(
      ["text-zinc-600", "dark:text-zinc-400", "bg-white", "dark:bg-black"],
      baseConfig,
    );
    const css = result.utilitiesCSS;

    const baseText = css.indexOf(".text-zinc-600");
    const darkText = css.indexOf(".dark\\:text-zinc-400:where");
    const baseBg = css.indexOf(".bg-white");
    const darkBg = css.indexOf(".dark\\:bg-black:where");

    expect(baseText).toBeGreaterThan(-1);
    expect(darkText).toBeGreaterThan(-1);
    expect(baseText).toBeLessThan(darkText);
    expect(baseBg).toBeLessThan(darkBg);
  });
});
