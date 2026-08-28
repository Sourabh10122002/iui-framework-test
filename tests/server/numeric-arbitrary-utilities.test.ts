/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";
import { parseUtilityClass } from "../../src/engine/core/parser";
import { UtilityCache } from "../../src/engine/core/cache";
import { cn } from "../../src/utilities/class-utilities";

const baseConfig = {
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig;

const parserContext = { cache: new UtilityCache() };

function toCssSelectorClass(className: string): string {
  return className.replace(/\[/g, "\\[").replace(/\]/g, "\\]");
}

function escapeCssClassSelector(className: string): string {
  return className.replace(/([.*+?^${}()|[\]\\])/g, "\\$1");
}

function builtProps(className: string): string | null {
  const result = generateBuildCSS([className], baseConfig);
  if (!result.builtClasses.includes(className)) return null;
  const marker = `.${escapeCssClassSelector(toCssSelectorClass(className))}`;
  const m = result.utilitiesCSS.match(new RegExp(`${marker}\\s*\\{([^}]+)\\}`));
  if (!m) return null;
  return m[1].trim().replace(/;\s*$/, "").replace(/\s+/g, " ");
}

describe("numeric and arbitrary sizing utilities", () => {
  const numericBuildCases = [
    { className: "w-17", expect: /width:\s*4\.25rem/ },
    { className: "h-17", expect: /height:\s*4\.25rem/ },
    { className: "basis-17", expect: /flex-basis:\s*4\.25rem/ },
    { className: "min-w-17", expect: /min-width:\s*4\.25rem/ },
    { className: "max-w-17", expect: /max-width:\s*4\.25rem/ },
    { className: "gap-17", expect: /gap:\s*4\.25rem/ },
    { className: "p-17", expect: /padding:\s*4\.25rem/ },
    { className: "size-17", expect: /width:\s*4\.25rem/ },
  ];

  it.each(numericBuildCases)(
    "builds open numeric $className",
    ({ className, expect: pattern }) => {
      const css = builtProps(className);
      expect(css).toBeTruthy();
      expect(css).toMatch(pattern);
    },
  );

  const arbitraryCases = [
    { className: "w-[120px]", expect: /width:\s*120px/ },
    { className: "h-[120px]", expect: /height:\s*120px/ },
    { className: "basis-[120px]", expect: /flex-basis:\s*120px/ },
    { className: "min-w-[120px]", expect: /min-width:\s*120px/ },
    { className: "gap-[10px]", expect: /gap:\s*10px/ },
    { className: "p-[13px]", expect: /padding:\s*13px/ },
    { className: "outline-[3px]", expect: /outline-width:\s*3px/ },
  ];

  it.each(arbitraryCases)(
    "builds arbitrary utility $className",
    ({ className, expect: pattern }) => {
      const result = generateBuildCSS([className], baseConfig);
      expect(result.builtClasses).toContain(className);
      expect(result.uncoveredClasses).not.toContain(className);
      const css = builtProps(className);
      expect(css).toMatch(pattern);
    },
  );

  it("iuimerge resolves basis scale conflicts", () => {
    expect(cn("basis-4", "basis-17")).toBe("basis-17");
    expect(cn("basis-full", "basis-[200px]")).toBe("basis-[200px]");
  });
});

describe("outline utilities (Tailwind v4 parity)", () => {
  it("outline sets width and composes style via preflight variable", () => {
    expect(parseUtilityClass("outline", parserContext)?.properties).toEqual({
      "outline-style": "var(--iui-outline-style)",
      "outline-width": "1px",
    });
  });

  it("outline-2 sets width and composes style via preflight variable", () => {
    expect(parseUtilityClass("outline-2", parserContext)?.properties).toEqual({
      "outline-style": "var(--iui-outline-style)",
      "outline-width": "2px",
    });
  });

  it("outline-dashed sets style only", () => {
    expect(builtProps("outline-dashed")).toBe("outline-style: dashed");
  });

  it("outline-none sets outline-style none", () => {
    expect(parseUtilityClass("outline-none", parserContext)?.properties).toEqual({
      "outline-style": "none",
    });
  });

  it("outline-hidden uses transparent outline for forced-colors accessibility", () => {
    expect(parseUtilityClass("outline-hidden", parserContext)?.properties).toEqual({
      outline: "2px solid transparent",
      "outline-offset": "2px",
    });
  });

  it("outline-2 + outline-dashed composes width and style separately", () => {
    expect(cn("outline-2", "outline-dashed")).toBe("outline-2 outline-dashed");
    const result = generateBuildCSS(["outline-2", "outline-dashed"], baseConfig);
    expect(builtProps("outline-2")).toBe(
      "outline-style: var(--iui-outline-style); outline-width: 2px",
    );
    expect(builtProps("outline-dashed")).toBe("outline-style: dashed");
    expect(result.combinedCSS).toMatch(/--iui-outline-style:solid/);
  });

  it("iuimerge resolves outline width conflicts", () => {
    expect(cn("outline", "outline-2")).toBe("outline-2");
    expect(cn("outline-1", "outline-[3px]")).toBe("outline-[3px]");
  });
});
