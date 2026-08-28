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

function escapeSelectorClass(className: string): string {
  return className.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function ruleIndex(css: string, className: string): number {
  const esc = escapeSelectorClass(className).replace(/\\/g, "\\\\");
  const m = css.match(new RegExp(`\\.${esc}\\s*\\{`));
  return m?.index ?? -1;
}

function effectiveMarginTop(css: string, classNames: string[]): string {
  let margin = "0";
  let marginTop = "0";

  const ordered = classNames
    .map((className) => ({ className, idx: ruleIndex(css, className) }))
    .filter((entry) => entry.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  for (const { className } of ordered) {
    const props = utilityProps(className);
    if (!props) continue;
    if (props.margin) margin = props.margin;
    if (props["margin-top"]) marginTop = props["margin-top"];
  }

  if (marginTop !== "0" || ordered.some((o) => utilityProps(o.className)?.["margin-top"])) {
    return marginTop;
  }
  return margin;
}

function effectivePaddingTop(css: string, classNames: string[]): string {
  let padding = "0";
  let paddingTop = "0";

  const ordered = classNames
    .map((className) => ({ className, idx: ruleIndex(css, className) }))
    .filter((entry) => entry.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  for (const { className } of ordered) {
    const props = utilityProps(className);
    if (!props) continue;
    if (props.padding) padding = props.padding;
    if (props["padding-top"]) paddingTop = props["padding-top"];
  }

  if (
    paddingTop !== "0" ||
    ordered.some((o) => utilityProps(o.className)?.["padding-top"])
  ) {
    return paddingTop;
  }
  return padding;
}

describe("shorthand cascade ordering (Tailwind parity)", () => {
  it("m-4 + mt-0: shorthand before longhand, top margin stays 0", () => {
    const classes = ["mt-0", "m-4"];
    const result = generateBuildCSS(classes, baseConfig);
    expect(ruleIndex(result.utilitiesCSS, "m-4")).toBeLessThan(
      ruleIndex(result.utilitiesCSS, "mt-0"),
    );
    expect(effectiveMarginTop(result.utilitiesCSS, classes)).toBe("0");
  });

  it("p-4 + pt-0: shorthand before longhand, top padding stays 0", () => {
    const classes = ["pt-0", "p-4"];
    const result = generateBuildCSS(classes, baseConfig);
    expect(ruleIndex(result.utilitiesCSS, "p-4")).toBeLessThan(
      ruleIndex(result.utilitiesCSS, "pt-0"),
    );
    expect(effectivePaddingTop(result.utilitiesCSS, classes)).toBe("0");
  });

  it("scroll-m-4 + scroll-mt-0: axis shorthand before side longhand", () => {
    const classes = ["scroll-mt-0", "scroll-m-4"];
    const result = generateBuildCSS(classes, baseConfig);
    expect(ruleIndex(result.utilitiesCSS, "scroll-m-4")).toBeLessThan(
      ruleIndex(result.utilitiesCSS, "scroll-mt-0"),
    );
  });
});
