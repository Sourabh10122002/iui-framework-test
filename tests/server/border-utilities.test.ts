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
  const m = css.match(new RegExp(`\\.${esc}\\s*\\{([^}]+)\\}`));
  if (!m) return null;
  return m[1]
    .trim()
    .replace(/;\s*$/, "")
    .replace(/\s+/g, " ");
}

/** Simulate preflight + stacked utilities on one element (Tailwind composition). */
function effectiveSideWidths(classNames: string[]): Record<string, string> {
  const widths: Record<string, string> = {
    "border-top-width": "0",
    "border-bottom-width": "0",
    "border-inline-start-width": "0",
    "border-inline-end-width": "0",
  };

  for (const className of classNames) {
    const props = utilityProps(className);
    if (!props) continue;

    if (props["border-width"]) {
      const w = props["border-width"];
      for (const key of Object.keys(widths)) widths[key] = w;
    }
    if (props["border-top-width"]) widths["border-top-width"] = props["border-top-width"];
    if (props["border-bottom-width"]) {
      widths["border-bottom-width"] = props["border-bottom-width"];
    }
    if (props["border-inline-start-width"]) {
      widths["border-inline-start-width"] = props["border-inline-start-width"];
    }
    if (props["border-inline-end-width"]) {
      widths["border-inline-end-width"] = props["border-inline-end-width"];
    }
    if (props["border-inline-width"]) {
      widths["border-inline-start-width"] = props["border-inline-width"];
      widths["border-inline-end-width"] = props["border-inline-width"];
    }
    if (props["border-block-width"]) {
      widths["border-top-width"] = props["border-block-width"];
      widths["border-bottom-width"] = props["border-block-width"];
    }
  }

  return widths;
}

function sideVisible(width: string): boolean {
  return width !== "0" && width !== "0px";
}

describe("border utilities (Tailwind parity)", () => {
  it("includes IUI preflight in build CSS", () => {
    const result = generateBuildCSS(["border"], baseConfig);
    expect(result.combinedCSS).toMatch(
      /\*,::before,::after\{border-width:0;border-style:solid;border-color:currentColor;--iui-outline-style:solid;\}/,
    );
  });

  it("emits correct properties in build CSS", () => {
    const result = generateBuildCSS(
      ["border-t", "border-b", "border-s", "border-e", "border-x", "border-y"],
      baseConfig,
    );
    expect(ruleProps(result.utilitiesCSS, "border-t")).toBe(
      "border-top-width: 1px",
    );
    expect(ruleProps(result.utilitiesCSS, "border-b")).toBe(
      "border-bottom-width: 1px",
    );
    expect(ruleProps(result.utilitiesCSS, "border-s")).toBe(
      "border-inline-start-width: 1px",
    );
    expect(ruleProps(result.utilitiesCSS, "border-e")).toBe(
      "border-inline-end-width: 1px",
    );
    expect(ruleProps(result.utilitiesCSS, "border-x")).toBe(
      "border-inline-width: 1px",
    );
    expect(ruleProps(result.utilitiesCSS, "border-y")).toBe(
      "border-block-width: 1px",
    );
  });

  it("width-only utilities rely on preflight for solid style", () => {
    expect(utilityProps("border")).toEqual({ "border-width": "1px" });
    expect(utilityProps("border-2")).toEqual({ "border-width": "2px" });
    expect(utilityProps("border-solid")).toEqual({ "border-style": "solid" });
  });

  it("border-dashed sets style only — no width on any side", () => {
    expect(utilityProps("border-dashed")).toEqual({ "border-style": "dashed" });
    expect(utilityProps("border-dashed")).not.toHaveProperty("border-width");
    expect(utilityProps("border-dashed")).not.toHaveProperty("border-top-width");
    expect(utilityProps("border-dashed")).not.toHaveProperty(
      "border-inline-start-width",
    );
  });

  it("directional width utilities do not set style or other sides", () => {
    expect(utilityProps("border-t")).toEqual({ "border-top-width": "1px" });
    expect(utilityProps("border-b")).toEqual({ "border-bottom-width": "1px" });
    expect(utilityProps("border-s")).toEqual({
      "border-inline-start-width": "1px",
    });
    expect(utilityProps("border-e")).toEqual({
      "border-inline-end-width": "1px",
    });
    expect(utilityProps("border-x")).toEqual({ "border-inline-width": "1px" });
    expect(utilityProps("border-y")).toEqual({ "border-block-width": "1px" });
  });

  it("border-dashed + border-t/b only shows dashed on top and bottom (not start/end)", () => {
    const classes = ["border-dashed", "border-t", "border-b"];
    const result = generateBuildCSS(classes, baseConfig);

    expect(ruleProps(result.utilitiesCSS, "border-dashed")).toBe(
      "border-style: dashed",
    );
    expect(ruleProps(result.utilitiesCSS, "border-t")).toBe(
      "border-top-width: 1px",
    );
    expect(ruleProps(result.utilitiesCSS, "border-b")).toBe(
      "border-bottom-width: 1px",
    );

    const widths = effectiveSideWidths(classes);
    expect(sideVisible(widths["border-top-width"])).toBe(true);
    expect(sideVisible(widths["border-bottom-width"])).toBe(true);
    expect(sideVisible(widths["border-inline-start-width"])).toBe(false);
    expect(sideVisible(widths["border-inline-end-width"])).toBe(false);
  });

  it("border-dashed + border-s/e only shows dashed on inline start/end (not top/bottom)", () => {
    const classes = ["border-dashed", "border-s", "border-e"];
    const widths = effectiveSideWidths(classes);

    expect(sideVisible(widths["border-top-width"])).toBe(false);
    expect(sideVisible(widths["border-bottom-width"])).toBe(false);
    expect(sideVisible(widths["border-inline-start-width"])).toBe(true);
    expect(sideVisible(widths["border-inline-end-width"])).toBe(true);
  });

  it("border-dashed + border-x/y maps dashed to the correct axes", () => {
    const xWidths = effectiveSideWidths(["border-dashed", "border-x"]);
    expect(sideVisible(xWidths["border-inline-start-width"])).toBe(true);
    expect(sideVisible(xWidths["border-inline-end-width"])).toBe(true);
    expect(sideVisible(xWidths["border-top-width"])).toBe(false);
    expect(sideVisible(xWidths["border-bottom-width"])).toBe(false);

    const yWidths = effectiveSideWidths(["border-dashed", "border-y"]);
    expect(sideVisible(yWidths["border-top-width"])).toBe(true);
    expect(sideVisible(yWidths["border-bottom-width"])).toBe(true);
    expect(sideVisible(yWidths["border-inline-start-width"])).toBe(false);
    expect(sideVisible(yWidths["border-inline-end-width"])).toBe(false);
  });

  it("border-s/e colors emit logical CSS properties (Tailwind parity)", () => {
    expect(utilityProps("border-s-brand-500")).toMatchObject({
      "border-inline-start-color": expect.stringMatching(/./),
    });
    expect(utilityProps("border-e-brand-500")).toMatchObject({
      "border-inline-end-color": expect.stringMatching(/./),
    });
    expect(utilityProps("border-bs-brand-500")).toMatchObject({
      "border-block-start-color": expect.stringMatching(/./),
    });
    expect(utilityProps("border-be-brand-500")).toMatchObject({
      "border-block-end-color": expect.stringMatching(/./),
    });

    const result = generateBuildCSS(
      ["border-s-brand-500", "border-e-blue-500"],
      baseConfig,
    );
    expect(ruleProps(result.utilitiesCSS, "border-s-brand-500")).toMatch(
      /border-inline-start-color:/,
    );
    expect(ruleProps(result.utilitiesCSS, "border-e-blue-500")).toMatch(
      /border-inline-end-color:/,
    );
  });

  it("does not accept long-form border-inline-* / border-block-* class aliases", () => {
    expect(utilityProps("border-inline-start-brand-500")).toBeUndefined();
    expect(utilityProps("border-inline-end-brand-500")).toBeUndefined();
    expect(utilityProps("border-block-start-brand-500")).toBeUndefined();
    expect(utilityProps("border-block-end-brand-500")).toBeUndefined();
    expect(utilityProps("border-inline-start")).toBeUndefined();
    expect(utilityProps("border-inline-end-2")).toBeUndefined();
    expect(utilityProps("border-block-start-dashed")).toBeUndefined();
  });

  it("parses config-driven shaded border-color tokens and rejects unsupported l/r aliases", () => {
    expect(utilityProps("border-danger-100")).toEqual({
      "border-color": "var(--iui-color-danger-100)",
    });
    expect(utilityProps("border-accent-11-600")).toEqual({
      "border-color": "var(--iui-color-accent-11-600)",
    });
    expect(utilityProps("border-neutral-200")).toEqual({
      "border-color": "var(--iui-color-neutral-200)",
    });
    expect(utilityProps("border-s-2")).toEqual({
      "border-inline-start-width": "2px",
    });
    expect(utilityProps("border-s-neutral-200")).toMatchObject({
      "border-inline-start-color": "var(--iui-color-neutral-200)",
    });
    expect(utilityProps("border-e-brand-500/30")).toMatchObject({
      "border-inline-end-color": expect.stringMatching(/./),
    });
    expect(utilityProps("border-l")).toBeUndefined();
    expect(utilityProps("border-l-8")).toBeUndefined();
    expect(utilityProps("border-r-2")).toBeUndefined();
    expect(utilityProps("border-l-neutral-200")).toBeUndefined();
  });
});

function escapeSelectorClass(className: string): string {
  return className.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function ruleIndex(css: string, className: string): number {
  const esc = escapeSelectorClass(className).replace(/\\/g, "\\\\");
  const m = css.match(new RegExp(`\\.${esc}\\s*\\{`));
  return m?.index ?? -1;
}

type SideColorState = {
  "border-top-color": string;
  "border-bottom-color": string;
  "border-inline-start-color": string;
  "border-inline-end-color": string;
};

function effectiveBorderColors(
  css: string,
  classNames: string[],
): SideColorState {
  const colors: SideColorState = {
    "border-top-color": "currentColor",
    "border-bottom-color": "currentColor",
    "border-inline-start-color": "currentColor",
    "border-inline-end-color": "currentColor",
  };

  const ordered = classNames
    .map((className) => ({ className, idx: ruleIndex(css, className) }))
    .filter((entry) => entry.idx >= 0)
    .sort((a, b) => a.idx - b.idx);

  for (const { className } of ordered) {
    const props = utilityProps(className);
    if (!props) continue;

    if (props["border-color"]) {
      const value = props["border-color"];
      for (const key of Object.keys(colors) as Array<keyof SideColorState>) {
        colors[key] = value;
      }
    }
    if (props["border-inline-color"]) {
      colors["border-inline-start-color"] = props["border-inline-color"];
      colors["border-inline-end-color"] = props["border-inline-color"];
    }
    if (props["border-block-color"]) {
      colors["border-top-color"] = props["border-block-color"];
      colors["border-bottom-color"] = props["border-block-color"];
    }
    if (props["border-top-color"]) {
      colors["border-top-color"] = props["border-top-color"];
    }
    if (props["border-bottom-color"]) {
      colors["border-bottom-color"] = props["border-bottom-color"];
    }
    if (props["border-inline-start-color"]) {
      colors["border-inline-start-color"] = props["border-inline-start-color"];
    }
    if (props["border-inline-end-color"]) {
      colors["border-inline-end-color"] = props["border-inline-end-color"];
    }
  }

  return colors;
}

function hasReducedOpacity(color: string): boolean {
  return (
    /\/\s*0\.3\)/.test(color) ||
    /\/\s*30%\)/.test(color) ||
    /rgba?\([^)]*0\.3[^)]*\)/.test(color)
  );
}

describe("border color cascade (Tailwind parity)", () => {
  const classPairs = [
    ["border-red-500/30", "border-t-red-500"],
    ["border-t-red-500", "border-red-500/30"],
  ] as const;

  it.each(classPairs)(
    "border-t-red-500 overrides top opacity from border-red-500/30 (input %j)",
    (...inputClasses) => {
      const result = generateBuildCSS([...inputClasses], baseConfig);
      const css = result.utilitiesCSS;

      expect(ruleIndex(css, "border-red-500/30")).toBeGreaterThan(-1);
      expect(ruleIndex(css, "border-t-red-500")).toBeGreaterThan(-1);
      expect(ruleIndex(css, "border-red-500/30")).toBeLessThan(
        ruleIndex(css, "border-t-red-500"),
      );

      const colors = effectiveBorderColors(css, [...inputClasses]);
      expect(hasReducedOpacity(colors["border-top-color"])).toBe(false);
      expect(hasReducedOpacity(colors["border-bottom-color"])).toBe(true);
      expect(hasReducedOpacity(colors["border-inline-start-color"])).toBe(
        true,
      );
      expect(hasReducedOpacity(colors["border-inline-end-color"])).toBe(true);
    },
  );

  it("border-2 + border-t-4 keeps top width at 4px", () => {
    const result = generateBuildCSS(["border-t-4", "border-2"], baseConfig);
    const ordered = ["border-2", "border-t-4"]
      .map((c) => ({ c, idx: ruleIndex(result.utilitiesCSS, c) }))
      .sort((a, b) => a.idx - b.idx)
      .map((x) => x.c);
    const widthsFromCss = effectiveSideWidths(ordered);
    expect(widthsFromCss["border-top-width"]).toBe("4px");
    expect(widthsFromCss["border-bottom-width"]).toBe("2px");
    expect(ruleIndex(result.utilitiesCSS, "border-2")).toBeLessThan(
      ruleIndex(result.utilitiesCSS, "border-t-4"),
    );
  });

  it("border-dashed + border-t-solid keeps top dashed when side rule follows", () => {
    const classes = ["border-t-solid", "border-dashed"];
    const result = generateBuildCSS(classes, baseConfig);
    expect(ruleIndex(result.utilitiesCSS, "border-dashed")).toBeLessThan(
      ruleIndex(result.utilitiesCSS, "border-t-solid"),
    );

    const styles: Record<string, string> = {
      "border-top-style": "solid",
      "border-bottom-style": "solid",
      "border-inline-start-style": "solid",
      "border-inline-end-style": "solid",
    };
    const ordered = classes
      .map((c) => ({ c, idx: ruleIndex(result.utilitiesCSS, c) }))
      .filter((x) => x.idx >= 0)
      .sort((a, b) => a.idx - b.idx);
    for (const { c } of ordered) {
      const props = utilityProps(c);
      if (!props) continue;
      if (props["border-style"]) {
        for (const key of Object.keys(styles)) styles[key] = props["border-style"];
      }
      if (props["border-top-style"]) {
        styles["border-top-style"] = props["border-top-style"];
      }
    }
    expect(styles["border-top-style"]).toBe("solid");
    expect(styles["border-bottom-style"]).toBe("dashed");
  });
});

describe("border-radius utilities (theme CSS variables)", () => {
  it("bare rounded uses --iui-global-radius", () => {
    const result = generateBuildCSS(["rounded"], baseConfig);
    const rule = ruleProps(result.utilitiesCSS, "rounded");
    expect(rule).toMatch(
      /border-radius:\s*var\(--iui-global-radius,\s*0\.25rem\)/,
    );
  });

  it("rounded-md uses --iui-border-radius-md with fallback", () => {
    const result = generateBuildCSS(["rounded-md"], baseConfig);
    const rule = ruleProps(result.utilitiesCSS, "rounded-md");
    expect(rule).toMatch(
      /border-radius:\s*var\(--iui-border-radius-md,\s*0\.375rem\)/,
    );
  });

  it("directional rounded-t-md uses the same token var", () => {
    const result = generateBuildCSS(["rounded-t-md"], baseConfig);
    const rule = ruleProps(result.utilitiesCSS, "rounded-t-md");
    expect(rule).toMatch(
      /border-start-start-radius:\s*var\(--iui-border-radius-md,\s*0\.375rem\)/,
    );
    expect(rule).toMatch(
      /border-start-end-radius:\s*var\(--iui-border-radius-md,\s*0\.375rem\)/,
    );
  });

  it("rounded-be-xs emits border-end-end-radius with xs token var", () => {
    const result = generateBuildCSS(["rounded-be-xs"], baseConfig);
    const rule = ruleProps(result.utilitiesCSS, "rounded-be-xs");
    expect(rule).toMatch(
      /border-end-end-radius:\s*var\(--iui-border-radius-xs,\s*0\.125rem\)/,
    );
  });

  it("TBSE corner aliases match logical corner CSS (rounded-be ≡ rounded-ee)", () => {
    const be = generateBuildCSS(["rounded-be-sm"], baseConfig);
    const ee = generateBuildCSS(["rounded-ee-sm"], baseConfig);
    expect(ruleProps(be.utilitiesCSS, "rounded-be-sm")).toMatch(
      /border-end-end-radius:\s*var\(--iui-border-radius-sm,\s*0\.25rem\)/,
    );
    expect(ruleProps(ee.utilitiesCSS, "rounded-ee-sm")).toMatch(
      /border-end-end-radius:\s*var\(--iui-border-radius-sm,\s*0\.25rem\)/,
    );
  });

  it("generates CSS for all TBSE side and corner sizes including xs", () => {
    const classes = [
      "rounded-t-xs",
      "rounded-b-xs",
      "rounded-s-xs",
      "rounded-e-xs",
      "rounded-ts-xs",
      "rounded-te-xs",
      "rounded-bs-xs",
      "rounded-be-xs",
    ];
    const result = generateBuildCSS(classes, baseConfig);
    for (const cls of classes) {
      expect(result.utilitiesCSS).toContain(cls);
      expect(result.builtClasses).toContain(cls);
    }
  });

  it("emits border-radius shorthand before corner longhands (rounded-lg + rounded-be-sm)", () => {
    const result = generateBuildCSS(
      ["rounded-lg", "rounded-be-sm"],
      baseConfig,
    );
    const lgIdx = result.utilitiesCSS.indexOf(".rounded-lg");
    const beIdx = result.utilitiesCSS.indexOf(".rounded-be-sm");
    expect(lgIdx).toBeGreaterThanOrEqual(0);
    expect(beIdx).toBeGreaterThan(lgIdx);
    expect(ruleProps(result.utilitiesCSS, "rounded-be-sm")).toMatch(
      /border-end-end-radius:\s*var\(--iui-border-radius-sm,\s*0\.25rem\)/,
    );
  });
});
