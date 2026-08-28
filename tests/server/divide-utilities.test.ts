/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";
import { parseUtilityClass } from "../../src/engine/core/parser";
import { UtilityCache } from "../../src/engine/core/cache";

const baseConfig = {
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig;

const parserContext = { cache: new UtilityCache() };

function utilityProps(className: string): Record<string, string> | undefined {
  return parseUtilityClass(className, parserContext)?.properties;
}

function ruleProps(css: string, className: string): string | null {
  const esc = className.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const m = css.match(new RegExp(`\\.${esc}\\s*>\\s*\\*\\s*\\+\\s*\\*\\s*\\{([^}]+)\\}`));
  if (!m) return null;
  return m[1]
    .trim()
    .replace(/;\s*$/, "")
    .replace(/\s+/g, " ");
}

describe("divide utilities (Tailwind v4 parity)", () => {
  it("divide-y width does not hardcode border-style: solid", () => {
    const result = generateBuildCSS(["divide-y-2"], baseConfig);
    const widthRule = ruleProps(result.utilitiesCSS, "divide-y-2");
    expect(widthRule).toBeTruthy();
    expect(widthRule!).not.toMatch(/border-style:\s*solid/);
    expect(widthRule!).toMatch(
      /border-top-style:\s*var\(--iui-border-style,\s*solid\)/,
    );
    expect(widthRule!).toMatch(
      /border-bottom-style:\s*var\(--iui-border-style,\s*solid\)/,
    );
  });

  it("divide-x width uses style var on inline sides", () => {
    const result = generateBuildCSS(["divide-x"], baseConfig);
    const widthRule = ruleProps(result.utilitiesCSS, "divide-x");
    expect(widthRule).toBeTruthy();
    expect(widthRule!).not.toMatch(/border-style:\s*solid/);
    expect(widthRule!).toMatch(
      /border-left-style:\s*var\(--iui-border-style,\s*solid\)/,
    );
    expect(widthRule!).toMatch(
      /border-right-style:\s*var\(--iui-border-style,\s*solid\)/,
    );
  });

  it("divide-dashed sets --iui-border-style and border-style", () => {
    expect(utilityProps("divide-dashed")).toEqual({
      "--iui-border-style": "dashed",
      "border-style": "dashed",
    });
    expect(utilityProps("divide-dotted")).toEqual({
      "--iui-border-style": "dotted",
      "border-style": "dotted",
    });
    expect(utilityProps("divide-solid")).toEqual({
      "--iui-border-style": "solid",
      "border-style": "solid",
    });
  });

  it("divide-y-2 + divide-dashed compose: style var wins over width emission order", () => {
    const result = generateBuildCSS(
      ["divide-y-2", "divide-dashed", "divide-brand-500"],
      baseConfig,
    );
    const widthRule = ruleProps(result.utilitiesCSS, "divide-y-2");
    const styleRule = ruleProps(result.utilitiesCSS, "divide-dashed");

    expect(widthRule).toBeTruthy();
    expect(styleRule).toBeTruthy();
    expect(widthRule!).not.toMatch(/border-style:\s*solid/);
    expect(widthRule!).toMatch(
      /border-top-style:\s*var\(--iui-border-style,\s*solid\)/,
    );
    expect(styleRule!).toMatch(/--iui-border-style:\s*dashed/);
    expect(styleRule!).toMatch(/border-style:\s*dashed/);
  });
});
