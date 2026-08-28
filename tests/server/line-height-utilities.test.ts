/**
 * @jest-environment node
 */
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

function ruleBlock(css: string, className: string): string | null {
  const esc = className.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const direct = css.match(new RegExp(`\\.${esc}\\s*\\{([^}]+)\\}`));
  if (direct) return direct[1].trim().replace(/\s+/g, " ");
  const batched = css.match(
    new RegExp(`\\.${esc}(?:[^{,]|\\[[^\\]]*\\])*,[^{]*\\{([^}]+)\\}`),
  );
  if (!batched) return null;
  return batched[1].trim().replace(/\s+/g, " ");
}

describe("line-height utilities (Tailwind parity)", () => {
  it.each([
    ["leading-none", "line-height: 1"],
    ["leading-snug", "line-height: 1.375"],
    ["leading-relaxed", "line-height: 1.625"],
    ["leading-loose", "line-height: 2"],
    ["leading-6", "line-height: 1.5rem"],
  ] as const)("generates %s", (className, expected) => {
    const result = generateBuildCSS([className], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, className);
    expect(rule).toContain(expected);
  });

  it("text-base bundles line-height; leading-* sorts after so it overrides", () => {
    const result = generateBuildCSS(
      ["text-base", "leading-none", "leading-snug", "leading-relaxed", "text-lg"],
      baseConfig,
    );

    const textBase = ruleBlock(result.utilitiesCSS, "text-base");
    const leadingSnug = ruleBlock(result.utilitiesCSS, "leading-snug");

    expect(textBase).toContain("font-size:");
    expect(textBase).toContain("line-height:");
    expect(leadingSnug).toContain("line-height: 1.375");

    const textBaseIdx = result.utilitiesCSS.indexOf(".text-base");
    const textLgIdx = result.utilitiesCSS.indexOf(".text-lg");
    const leadingNoneIdx = result.utilitiesCSS.indexOf(".leading-none");
    const leadingSnugIdx = result.utilitiesCSS.indexOf(".leading-snug");
    const leadingRelaxedIdx = result.utilitiesCSS.indexOf(".leading-relaxed");

    expect(textBaseIdx).toBeGreaterThanOrEqual(0);
    expect(textLgIdx).toBeGreaterThan(textBaseIdx);
    expect(leadingNoneIdx).toBeGreaterThan(textLgIdx);
    expect(leadingSnugIdx).toBeGreaterThan(textLgIdx);
    expect(leadingRelaxedIdx).toBeGreaterThan(textLgIdx);
  });

  it("leading-* stays after text-* in large batch-optimized builds", () => {
    const classes = [
      "text-base",
      "text-lg",
      "text-sm",
      "leading-none",
      "leading-snug",
      "leading-relaxed",
      "leading-loose",
      "leading-6",
      "m-4",
      "p-4",
      "flex",
      "grid",
      "bg-red-500",
      "text-white",
      "rounded-md",
      "shadow-md",
      "underline",
      "decoration-solid",
    ];
    const result = generateBuildCSS(classes, baseConfig);
    const textBaseIdx = result.utilitiesCSS.indexOf(".text-base");
    const leadingSnugIdx = result.utilitiesCSS.indexOf(".leading-snug");
    expect(textBaseIdx).toBeGreaterThanOrEqual(0);
    expect(leadingSnugIdx).toBeGreaterThan(textBaseIdx);
  });
});
