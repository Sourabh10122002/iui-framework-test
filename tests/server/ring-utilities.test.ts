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

describe("ring utilities (Tailwind v4 parity)", () => {
  it("bare ring uses buildRingUtility shadow-var pattern (not self-referential)", () => {
    const result = generateBuildCSS(["ring", "ring-brand-500"], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, "ring");
    expect(rule).toBeTruthy();
    expect(rule!).not.toMatch(
      /--iui-ring-offset-shadow:\s*var\(--iui-ring-offset-shadow/,
    );
    expect(rule!).toMatch(
      /--iui-ring-shadow:\s*var\(--iui-ring-inset\)\s+0\s+0\s+0\s+calc\(2px\s+\+\s+var\(--iui-ring-offset-width\)\)/,
    );
    expect(rule!).toMatch(
      /box-shadow:\s*var\(--iui-ring-offset-shadow,\s*0\s+0\s+transparent\),\s*var\(--iui-ring-shadow,\s*0\s+0\s+transparent\),\s*var\(--iui-shadow,\s*0\s+0\s+transparent\)/,
    );
  });

  it("ring-1 and ring-4 use the same shadow-var stack", () => {
    for (const cls of ["ring-1", "ring-4"] as const) {
      const result = generateBuildCSS([cls, "ring-brand-500"], baseConfig);
      const rule = ruleBlock(result.utilitiesCSS, cls);
      expect(rule).toBeTruthy();
      expect(rule!).toMatch(/--iui-ring-offset-shadow:\s*var\(--iui-ring-inset\)/);
      expect(rule!).toMatch(
        /box-shadow:\s*var\(--iui-ring-offset-shadow,\s*0\s+0\s+transparent\),\s*var\(--iui-ring-shadow,\s*0\s+0\s+transparent\)/,
      );
    }
  });

  it("ring-color only sets --iui-ring-color", () => {
    const result = generateBuildCSS(["ring-brand-500"], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, "ring-brand-500");
    expect(rule).toBeTruthy();
    expect(rule!).toMatch(/--iui-ring-color:\s*var\(--iui-color-brand-500\)/);
  });

  it("ring + ring-offset-2 compose via CSS variables", () => {
    const result = generateBuildCSS(
      ["ring", "ring-offset-2", "ring-brand-500"],
      baseConfig,
    );
    const ringRule = ruleBlock(result.utilitiesCSS, "ring");
    const offsetRule = ruleBlock(result.utilitiesCSS, "ring-offset-2");
    expect(ringRule).toBeTruthy();
    expect(offsetRule).toBeTruthy();
    expect(ringRule!).toMatch(
      /calc\(2px\s+\+\s+var\(--iui-ring-offset-width\)\)/,
    );
    expect(offsetRule!).toMatch(/--iui-ring-offset-width:\s*2px/);
  });

  it("directional ring-t-2 sets --iui-ring-shadow and the composed box-shadow stack", () => {
    const result = generateBuildCSS(["ring-t-2", "ring-brand-500"], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, "ring-t-2");
    expect(rule).toBeTruthy();
    expect(rule!).toMatch(
      /--iui-ring-shadow:\s*0\s+-2px\s+0\s+0\s+var\(--iui-ring-color/,
    );
    expect(rule!).toMatch(
      /box-shadow:\s*var\(--iui-ring-offset-shadow,\s*0\s+0\s+transparent\),\s*var\(--iui-ring-shadow,\s*0\s+0\s+transparent\)/,
    );
  });

  it("shadow-sm sets --iui-shadow and does not clobber the ring stack", () => {
    const result = generateBuildCSS(
      ["ring-4", "ring-brand-500", "shadow-sm"],
      baseConfig,
    );
    const ringRule = ruleBlock(result.utilitiesCSS, "ring-4");
    const shadowRule = ruleBlock(result.utilitiesCSS, "shadow-sm");
    expect(ringRule).toBeTruthy();
    expect(shadowRule).toBeTruthy();
    expect(shadowRule!).toMatch(/--iui-shadow:/);
    expect(shadowRule!).toMatch(
      /box-shadow:\s*var\(--iui-ring-offset-shadow,\s*0\s+0\s+transparent\),\s*var\(--iui-ring-shadow,\s*0\s+0\s+transparent\),\s*var\(--iui-shadow,\s*0\s+0\s+transparent\)/,
    );
    expect(shadowRule!).not.toMatch(/box-shadow:\s*0\s+1px\s+2px/);
    expect(ringRule!).toMatch(/--iui-ring-shadow:/);
  });

  it("ring-0 clears ring shadows", () => {
    const result = generateBuildCSS(["ring-0"], baseConfig);
    const rule = ruleBlock(result.utilitiesCSS, "ring-0");
    expect(rule).toBeTruthy();
    expect(rule!).toMatch(
      /box-shadow:\s*var\(--iui-ring-offset-shadow,\s*0\s+0\s+transparent\),\s*var\(--iui-ring-shadow,\s*0\s+0\s+transparent\)/,
    );
  });
});
