/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";
import { generateFullThemeCSS } from "../../src/server/generate-theme-css";
import { collectStateUtilityClasses } from "../../src/server/generate-state-utilities";
import { VALUE_GETTERS } from "../../src/engine/utilities/value-getters";

const resolveUnorderedList = VALUE_GETTERS["list-style-type-unordered"] as (
  value: string,
) => string | null;
const resolveOrderedList = VALUE_GETTERS["list-style-type-ordered"] as (
  value: string,
) => string | null;

import { withTestAccentPalette } from "../helpers/test-accent-palette";

const baseConfig = withTestAccentPalette({
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig);

describe("generateFullThemeCSS", () => {
  it("includes spacing and font-family design token variables", () => {
    const { css } = generateFullThemeCSS(baseConfig);
    expect(css).toContain("--iui-spacing-1");
    expect(css).toContain("--iui-font-family-inter");
  });

  it("includes logical inline-axis CSS variables", () => {
    const { css } = generateFullThemeCSS(baseConfig);
    expect(css).toContain("--iui-inline-start-x");
    expect(css).toContain('[dir="rtl"]');
  });

  it("includes dark-mode translucent panel rules", () => {
    const config = {
      theme: {
        ...baseConfig.theme,
        panelBackground: { set: "translucent" },
      },
    } as IUIConfig;
    const { css, htmlAttributes } = generateFullThemeCSS(config);
    expect(css).toContain(
      '[data-theme="dark"][data-panel-background="translucent"]',
    );
    expect(htmlAttributes["data-panel-background"]).toBe("translucent");
  });

  it("registers gradient utilities in build CSS when config defines gradients", () => {
    const config = withTestAccentPalette({
      theme: {
        ...baseConfig.theme,
        colors: {
          gradients: {
            sunset: {
              from: "orange",
              to: "pink",
              direction: "to end",
            },
          },
        },
      },
    } as IUIConfig);
    const result = generateBuildCSS(["p-4"], config);
    expect(result.combinedCSS).toMatch(/\.bg-sunset|background/i);
  });
});

describe("generateBuildCSS", () => {
  it("generates theme and utility CSS for known classes", () => {
    const result = generateBuildCSS(
      ["flex", "items-center", "gap-4", "p-4"],
      baseConfig,
    );

    expect(result.combinedCSS.length).toBeGreaterThan(20);
    expect(result.themeCSS).toContain(":root");
    expect(result.themeCSS).toContain("--iui-spacing-1");
    expect(result.utilitiesCSS).toContain(".flex");
    expect(result.stats.classCount).toBeGreaterThan(4);
    expect(result.builtClasses).toContain("flex");
  });

  it("generates arbitrary width utilities at compile time", () => {
    const result = generateBuildCSS(["w-[120px]"], baseConfig);
    expect(result.utilitiesCSS.length).toBeGreaterThan(0);
    expect(result.combinedCSS).toMatch(/120px|width/i);
  });

  it("generates background-image for bg-[url(...)] arbitrary utilities", () => {
    const result = generateBuildCSS(
      ["bg-[url(https://example.com/hero.png)]"],
      baseConfig,
    );
    expect(result.utilitiesCSS.length).toBeGreaterThan(0);
    expect(result.combinedCSS).toMatch(/background-image/i);
    expect(result.combinedCSS).toContain("url(https://example.com/hero.png)");
    expect(result.builtClasses).toContain(
      "bg-[url(https://example.com/hero.png)]",
    );
  });

  it("includes default state utility CSS even when scan list is empty", () => {
    const result = generateBuildCSS([], baseConfig);
    expect(result.utilitiesCSS.length).toBeGreaterThan(0);
    expect(result.themeCSS.length).toBeGreaterThan(0);
    expect(result.combinedCSS).toMatch(/focus-visible|disabled/i);
  });

  it("includes @counter-style foundation for list-style-type utilities", () => {
    const result = generateBuildCSS(["list-disc", "list-decimal"], baseConfig);
    expect(result.combinedCSS).toContain("@counter-style iui-ul-disc");
    expect(result.combinedCSS).toContain("@counter-style iui-ol-decimal-dot");
    expect(result.combinedCSS).toContain('pad: 2 "\\2007"');
    expect(result.utilitiesCSS).toContain("list-style-type: iui-ul-disc");
    expect(result.utilitiesCSS).toContain("--iui-ol-counter-dot: iui-ol-decimal-dot");
    expect(result.utilitiesCSS).toContain("list-style-type: var(--iui-ol-counter)");
  });

  it("composes ordered system + suffix tokens (Tailwind-style)", () => {
    const composed = generateBuildCSS(
      ["list-decimal", "list-parentheses"],
      baseConfig,
    );
    expect(composed.builtClasses).toEqual(
      expect.arrayContaining(["list-decimal", "list-parentheses"]),
    );
    expect(composed.utilitiesCSS).toContain("--iui-ol-counter-rparen: iui-ol-decimal-rparen");
    expect(composed.utilitiesCSS).toContain(
      "--iui-ol-counter: var(--iui-ol-counter-rparen, var(--iui-ol-counter-dot))",
    );

    const shorthand = generateBuildCSS(["list-decimal-parentheses"], baseConfig);
    expect(shorthand.utilitiesCSS).toContain("list-style-type: iui-ol-decimal-rparen");
  });

  it("keeps legacy duplicate markers compiling to canonical counters", () => {
    expect(resolveUnorderedList("bullet")).toBe("iui-ul-disc");
    expect(resolveUnorderedList("pointer")).toBe("iui-ul-arrowhead");
    expect(resolveOrderedList("decimal-period")).toBe("iui-ol-decimal-dot");
  });

  it("restores marker-gutter padding (ch, from pad+suffix width) for outside lists, skips list-inside", () => {
    const result = generateBuildCSS(
      ["list-decimal", "list-decimal-double-parentheses", "list-disc"],
      baseConfig,
    );
    const gutterRule = result.combinedCSS.match(
      /:is\(ol, ul\):not\(\.list-inside, \.list-none\)\[class\*="list-"\]\s*\{[^}]+\}/,
    )?.[0];
    const dparensRule = result.combinedCSS.match(
      /:is\(ol, ul\):not\(\.list-inside, \.list-none\)\.list-double-parentheses,\s*ol:not\(\.list-inside, \.list-none\)\[class\*="double-parentheses"\]\s*\{[^}]+\}/,
    )?.[0];

    // Default 4ch gutter for regular ordered/unordered markers (not list-inside).
    expect(gutterRule).toContain("padding-inline-start: 4ch");
    // Wider 5ch gutter only for the `(1)`-style double-parentheses variant.
    expect(dparensRule).toContain("padding-inline-start: 5ch");
    // The gutter foundation itself never forces list-style-position — outside
    // stays the CSS/UA default; it only restores padding a reset removed.
    expect(gutterRule).not.toContain("list-style-position");
    expect(dparensRule).not.toContain("list-style-position");
  });

  it("emits overflow-x / overflow-y as axis properties, not overflow shorthand", () => {
    const result = generateBuildCSS(
      ["overflow-x-hidden", "overflow-y-scroll", "overflow-auto"],
      baseConfig,
    );
    const css = result.utilitiesCSS;
    expect(css).toMatch(/\.overflow-x-hidden\s*\{[^}]*overflow-x:\s*hidden/);
    expect(css).toMatch(/\.overflow-y-scroll\s*\{[^}]*overflow-y:\s*scroll/);
    expect(css).toMatch(/\.overflow-auto\s*\{[^}]*overflow:\s*auto/);
    expect(css).not.toContain(
      ".overflow-hidden, .overflow-x-hidden, .overflow-y-hidden",
    );
  });
});

describe("collectStateUtilityClasses", () => {
  it("includes focus-visible ring utilities from default states config", () => {
    const classes = collectStateUtilityClasses(baseConfig);
    expect(classes.some((c) => c.includes("focus-visible:ring"))).toBe(true);
    expect(classes.some((c) => c.includes("disabled:cursor"))).toBe(true);
  });

  it("expands adaptive focus colors from theme semantic keys", () => {
    const config = withTestAccentPalette({
      theme: {
        ...baseConfig.theme,
      },
      states: {
        focused: { mode: "adaptive" as const, color: "brand" },
      },
    } as IUIConfig);

    const classes = collectStateUtilityClasses(config);
    expect(classes.some((c) => c.includes("ring-success-600"))).toBe(true);
    expect(classes.some((c) => c.includes("ring-danger-600"))).toBe(true);
  });

  it("merges state classes into generateBuildCSS output", () => {
    const config = {
      ...baseConfig,
      states: {
        focused: { mode: "custom" as const, color: "brand" },
      },
    } as IUIConfig;
    const result = generateBuildCSS(["p-4"], config);
    expect(result.combinedCSS).toMatch(/focus-visible|ring-brand/);
  });

  it("does not batch-merge plain text-white with !text-white (dark mode override)", () => {
    const result = generateBuildCSS(
      ["text-white", "!text-white", "dark:text-neutral-950"],
      baseConfig,
    );
    const css = result.utilitiesCSS;
    const plainWhiteRule = css.match(/\.text-white\s*\{[^}]+\}/)?.[0] ?? "";
    const importantWhiteRule = css.match(/\.\\!text-white\s*\{[^}]+\}/)?.[0] ?? "";

    expect(plainWhiteRule).toContain("color: #ffffff");
    expect(plainWhiteRule).not.toContain("!important");
    expect(importantWhiteRule).toContain("!important");
    expect(css).toMatch(
      /\.dark\\:text-neutral-950:where\(\.dark,\s*\.dark\s*\*\)/,
    );
  });
});
