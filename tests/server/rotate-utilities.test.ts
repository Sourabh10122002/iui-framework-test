/**
 * @jest-environment node
 *
 * Framework rotate utilities: named scale, open numeric, semantic aliases,
 * negative, axis (x/y), and arbitrary brackets — parse + CSS emit.
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";
import { parseUtilityClass } from "../../src/engine/core/parser";
import { UtilityCache } from "../../src/engine/core/cache";
import { validateIUIClass, cn } from "../../src/utilities/class-utilities";
import { IUI_TRANSFORM_VAR_TEMPLATE } from "../../src/engine/utilities/constants";
import { VALUE_GETTERS } from "../../src/engine/utilities/value-getters";

const baseConfig = {
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig;

const parserContext = { cache: new UtilityCache() };

/** Match how generate-arbitrary-css / SSR escape class names in selectors. */
function escapeCssClassInStylesheet(className: string): string {
  return className.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function builtProps(className: string): string | null {
  const result = generateBuildCSS([className], baseConfig);
  if (!result.builtClasses.includes(className)) return null;
  // Prefer indexOf over RegExp — escaped `[`/`]`/`.` break character-class parsing.
  const needle = `.${escapeCssClassInStylesheet(className)}`;
  const idx = result.utilitiesCSS.indexOf(needle);
  if (idx === -1) return null;
  const open = result.utilitiesCSS.indexOf("{", idx);
  const close = result.utilitiesCSS.indexOf("}", open);
  if (open === -1 || close === -1) return null;
  return result.utilitiesCSS
    .slice(open + 1, close)
    .trim()
    .replace(/;\s*$/, "")
    .replace(/\s+/g, " ");
}

function expectRotateZ(className: string, angle: string) {
  const parsed = parseUtilityClass(className, parserContext);
  expect(parsed?.category).toBe("rotate");
  expect(parsed?.properties?.["--iui-rotate-z"]).toBe(angle);
  expect(parsed?.properties?.transform).toBe(IUI_TRANSFORM_VAR_TEMPLATE);

  const css = builtProps(className);
  expect(css).toBeTruthy();
  expect(css!).toContain(`--iui-rotate-z: ${angle}`);
  expect(css!).toContain("rotateZ(var(--iui-rotate-z");
}

describe("rotate utilities (Framework)", () => {
  describe("named scale tokens (values.ts)", () => {
    it.each([
      ["rotate-0", "0deg"],
      ["rotate-1", "1deg"],
      ["rotate-2", "2deg"],
      ["rotate-3", "3deg"],
      ["rotate-6", "6deg"],
      ["rotate-12", "12deg"],
      ["rotate-45", "45deg"],
      ["rotate-90", "90deg"],
      ["rotate-180", "180deg"],
    ] as const)("%s → --iui-rotate-z: %s", (className, angle) => {
      expect(validateIUIClass(className)).toBe(true);
      expectRotateZ(className, angle);
    });
  });

  describe("open numeric angles (pattern-allowed, not in static scale)", () => {
    it.each([
      ["rotate-15", "15deg"],
      ["rotate-30", "30deg"],
      ["rotate-60", "60deg"],
      ["rotate-135", "135deg"],
      ["rotate-270", "270deg"],
      ["rotate-360", "360deg"],
      ["rotate-17", "17deg"],
      ["rotate-22.5", "22.5deg"],
    ] as const)("%s → --iui-rotate-z: %s", (className, angle) => {
      expect(validateIUIClass(className)).toBe(true);
      expectRotateZ(className, angle);
    });
  });

  describe("semantic aliases (quarter / half / three-quarter / full)", () => {
    it.each([
      ["rotate-quarter", "90deg"],
      ["rotate-half", "180deg"],
      ["rotate-three-quarter", "270deg"],
      ["rotate-full", "360deg"],
    ] as const)("%s → --iui-rotate-z: %s", (className, angle) => {
      expect(validateIUIClass(className)).toBe(true);
      // VALUE_GETTERS must resolve semantic names for emit to succeed
      const suffix = className.replace(/^rotate-/, "");
      expect(VALUE_GETTERS.rotate?.(suffix)).toBe(`rotate(${angle})`);
      expectRotateZ(className, angle);
    });
  });

  describe("negative rotate", () => {
    it.each([
      ["-rotate-45", "-45deg"],
      ["-rotate-90", "-90deg"],
      ["-rotate-12", "-12deg"],
      ["-rotate-15", "-15deg"],
    ] as const)("%s → --iui-rotate-z: %s", (className, angle) => {
      expect(validateIUIClass(className)).toBe(true);
      expectRotateZ(className, angle);
    });
  });

  describe("rotate-x / rotate-y", () => {
    it("rotate-x-45 sets --iui-rotate-x", () => {
      const parsed = parseUtilityClass("rotate-x-45", parserContext);
      expect(parsed?.category).toBe("rotate-x");
      expect(parsed?.properties?.["--iui-rotate-x"]).toBe("45deg");
      expect(parsed?.properties?.transform).toBe(IUI_TRANSFORM_VAR_TEMPLATE);
      const css = builtProps("rotate-x-45");
      expect(css).toContain("--iui-rotate-x: 45deg");
    });

    it("rotate-y-90 sets --iui-rotate-y", () => {
      const parsed = parseUtilityClass("rotate-y-90", parserContext);
      expect(parsed?.category).toBe("rotate-y");
      expect(parsed?.properties?.["--iui-rotate-y"]).toBe("90deg");
      const css = builtProps("rotate-y-90");
      expect(css).toContain("--iui-rotate-y: 90deg");
    });

    it("-rotate-x-45 is negative", () => {
      const parsed = parseUtilityClass("-rotate-x-45", parserContext);
      expect(parsed?.properties?.["--iui-rotate-x"]).toBe("-45deg");
    });
  });

  describe("arbitrary rotate-[…]", () => {
    it("rotate-[17deg] builds via arbitrary CSS path", () => {
      expect(validateIUIClass("rotate-[17deg]")).toBe(true);
      // Named parser leaves brackets to the arbitrary emitter
      expect(parseUtilityClass("rotate-[17deg]", parserContext)).toBeNull();
      const result = generateBuildCSS(["rotate-[17deg]"], baseConfig);
      expect(result.builtClasses).toContain("rotate-[17deg]");
      expect(result.uncoveredClasses).not.toContain("rotate-[17deg]");
      const css = builtProps("rotate-[17deg]");
      expect(css).toBeTruthy();
      expect(css!).toContain("--iui-rotate-z: 17deg");
      expect(css!).toContain("rotateZ(var(--iui-rotate-z");
    });

    it("iuimerge: later arbitrary wins over named", () => {
      expect(cn("rotate-45", "rotate-[17deg]")).toBe("rotate-[17deg]");
    });
  });

  describe("compose with other transform vars", () => {
    it("rotate-45 + translate-x-4 both emit shared transform recipe", () => {
      const result = generateBuildCSS(
        ["rotate-45", "translate-x-4"],
        baseConfig,
      );
      expect(result.builtClasses).toEqual(
        expect.arrayContaining(["rotate-45", "translate-x-4"]),
      );
      const rotateCss = builtProps("rotate-45");
      const translateCss = builtProps("translate-x-4");
      expect(rotateCss).toContain("--iui-rotate-z: 45deg");
      expect(translateCss).toContain("--iui-translate-x:");
      // Same transform expression so cascade vars compose
      expect(rotateCss).toContain("rotateZ(var(--iui-rotate-z");
      expect(translateCss).toContain("translateX(var(--iui-translate-x");
    });
  });
});
