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

describe("text decoration utilities (Tailwind v4 parity)", () => {
  it.each([
    ["underline", "underline"],
    ["overline", "overline"],
    ["line-through", "line-through"],
    ["no-underline", "none"],
  ] as const)("emits text-decoration-line for %s", (className, line) => {
    const result = generateBuildCSS([className], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, className);
    expect(rule).toBeTruthy();
    expect(rule!).toMatch(new RegExp(`text-decoration-line:\\s*${line}`));
    expect(rule!).not.toMatch(/text-decoration:\s/);
  });

  it.each([
    ["decoration-solid", "text-decoration-style: solid"],
    ["decoration-dashed", "text-decoration-style: dashed"],
    ["decoration-brand-500", "text-decoration-color: var(--iui-color-brand-500)"],
    ["decoration-2", "text-decoration-thickness: 2px"],
    ["decoration-auto", "text-decoration-thickness: auto"],
    ["decoration-from-font", "text-decoration-thickness: from-font"],
  ] as const)("generates modifier %s", (className, expected) => {
    const result = generateBuildCSS([className], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, className);
    expect(rule).toContain(expected);
  });

  it("line utilities sort before color/style/thickness modifiers", () => {
    const classes = [
      "decoration-solid",
      "decoration-brand-500",
      "decoration-2",
      "underline",
      "decoration-dashed",
      "line-through",
    ];
    const result = generateBuildCSS(classes, baseConfig);

    const underlineIdx = result.utilitiesCSS.indexOf(".underline");
    const lineThroughIdx = result.utilitiesCSS.indexOf(".line-through");
    const solidIdx = result.utilitiesCSS.indexOf(".decoration-solid");
    const brandIdx = result.utilitiesCSS.indexOf(".decoration-brand-500");
    const thicknessIdx = result.utilitiesCSS.indexOf(".decoration-2");

    expect(underlineIdx).toBeGreaterThanOrEqual(0);
    expect(lineThroughIdx).toBeGreaterThanOrEqual(0);
    expect(solidIdx).toBeGreaterThan(underlineIdx);
    expect(brandIdx).toBeGreaterThan(underlineIdx);
    expect(thicknessIdx).toBeGreaterThan(underlineIdx);
    expect(solidIdx).toBeGreaterThan(lineThroughIdx);
  });
});
