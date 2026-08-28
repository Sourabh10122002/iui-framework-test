/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";
import { animationShorthandToLonghands } from "../../src/engine/utilities/helpers";

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

describe("animation timing utilities (Tailwind / tailwindcss-animate parity)", () => {
  it.each([
    ["animate-ease-linear", "linear"],
    ["animate-ease-in", "cubic-bezier(0.4, 0, 1, 1)"],
    ["animate-ease-out", "cubic-bezier(0, 0, 0.2, 1)"],
    ["animate-ease-in-out", "cubic-bezier(0.4, 0, 0.2, 1)"],
  ] as const)("generates %s", (className, timing) => {
    const result = generateBuildCSS([className], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, className);
    expect(rule).toBeTruthy();
    expect(rule!).toMatch(
      new RegExp(`animation-timing-function:\\s*${timing.replace(/[()]/g, "\\$&")}`),
    );
  });

  it("ease-* also sets animation-timing-function (tailwindcss-animate pattern)", () => {
    const result = generateBuildCSS(["ease-linear", "ease-in-out"], baseConfig);
    const linear = ruleBlock(result.utilitiesCSS, "ease-linear");
    const inOut = ruleBlock(result.utilitiesCSS, "ease-in-out");
    expect(linear).toMatch(/transition-timing-function:\s*linear/);
    expect(linear).toMatch(/animation-timing-function:\s*linear/);
    expect(inOut).toMatch(/animation-timing-function:\s*cubic-bezier\(0\.4, 0, 0\.2, 1\)/);
  });

  it("preset animations emit longhands so ease utilities compose", () => {
    expect(animationShorthandToLonghands("fadeIn 0.3s ease-in-out")).toEqual({
      "animation-name": "fadeIn",
      "animation-duration": "0.3s",
      "animation-timing-function": "ease-in-out",
    });

    const result = generateBuildCSS(
      ["animate-fade-in", "animate-ease-linear", "animate-duration-1000"],
      baseConfig,
    );
    const preset = ruleBlock(result.utilitiesCSS, "animate-fade-in");
    const ease = ruleBlock(result.utilitiesCSS, "animate-ease-linear");
    const duration = ruleBlock(result.utilitiesCSS, "animate-duration-1000");

    expect(preset).toMatch(/animation-name:\s*fadeIn/);
    expect(preset).not.toMatch(/animation:\s*fadeIn/);
    expect(ease).toMatch(/animation-timing-function:\s*linear/);
    expect(duration).toMatch(/animation-duration:\s*1000ms/);

    const fadeIdx = result.utilitiesCSS.indexOf(".animate-fade-in");
    const easeIdx = result.utilitiesCSS.indexOf(".animate-ease-linear");
    const durationIdx = result.utilitiesCSS.indexOf(".animate-duration-1000");
    expect(fadeIdx).toBeGreaterThanOrEqual(0);
    expect(easeIdx).toBeGreaterThan(fadeIdx);
    expect(durationIdx).toBeGreaterThan(fadeIdx);
  });

  it("spin preset keeps iteration and timing as longhands", () => {
    const result = generateBuildCSS(["animate-spin"], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, "animate-spin");
    expect(rule).toMatch(/animation-name:\s*spin/);
    expect(rule).toMatch(/animation-duration:\s*1s/);
    expect(rule).toMatch(/animation-timing-function:\s*linear/);
    expect(rule).toMatch(/animation-iteration-count:\s*infinite/);
  });

  it("ping and pulse presets preserve cubic-bezier timing functions", () => {
    expect(
      animationShorthandToLonghands("ping 1s cubic-bezier(0, 0, 0.2, 1) infinite"),
    ).toEqual({
      "animation-name": "ping",
      "animation-duration": "1s",
      "animation-timing-function": "cubic-bezier(0, 0, 0.2, 1)",
      "animation-iteration-count": "infinite",
    });
    expect(
      animationShorthandToLonghands("pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"),
    ).toEqual({
      "animation-name": "pulse",
      "animation-duration": "2s",
      "animation-timing-function": "cubic-bezier(0.4, 0, 0.6, 1)",
      "animation-iteration-count": "infinite",
    });

    const result = generateBuildCSS(["animate-ping", "animate-pulse"], baseConfig);
    const ping = ruleBlock(result.utilitiesCSS, "animate-ping");
    const pulse = ruleBlock(result.utilitiesCSS, "animate-pulse");
    expect(ping).toMatch(
      /animation-timing-function:\s*cubic-bezier\(0, 0, 0\.2, 1\)/,
    );
    expect(ping).toMatch(/animation-iteration-count:\s*infinite/);
    expect(ping).not.toMatch(/animation-iteration-count:\s*0,/);
    expect(pulse).toMatch(
      /animation-timing-function:\s*cubic-bezier\(0\.4, 0, 0\.6, 1\)/,
    );
  });

  it("includes @keyframes when presets emit animation-name longhands only", () => {
    const result = generateBuildCSS(["animate-fade-in"], baseConfig);
    expect(result.utilitiesCSS).toContain("@keyframes fadeIn");
    expect(result.utilitiesCSS).toMatch(/animation-name:\s*fadeIn/);
  });
});
