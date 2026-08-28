/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import {
  buildAccentPaletteRegistry,
  resolvePaletteBaseHex,
  resolveThemePalettes,
} from "../../src/core/palette-registry";
import {
  THEME_BRAND_DEFAULT_HEX,
  THEME_NEUTRAL_DEFAULT_HEX,
  THEME_SEMANTIC_DEFAULT_HEX,
} from "../../src/engine/tokens/values";
import { generateThemeCSSVars } from "../../src/server/generate-theme-css";
import { createColorValueGetter } from "../../src/engine/utilities/helpers";
import { withTestAccentPalette } from "../helpers/test-accent-palette";

describe("palette registry (config-first)", () => {
  const config = withTestAccentPalette(
    {
      theme: {
        colors: {
          semantic: {
            success: THEME_SEMANTIC_DEFAULT_HEX.success,
            warning: THEME_SEMANTIC_DEFAULT_HEX.warning,
            danger: "#ff0000",
            info: THEME_SEMANTIC_DEFAULT_HEX.info,
          },
          brand: { set: "#14b8a6" },
          neutral: { set: THEME_NEUTRAL_DEFAULT_HEX },
          accent: {
            bros: "#c888f2",
            "accent-3": "#f59e0b",
          },
        },
      },
    } as IUIConfig,
  );

  it("resolves accent entries defined with hex", () => {
    const registry = buildAccentPaletteRegistry(config.theme?.colors?.accent);
    expect(registry.get("bros")).toBe("#c888f2");
    expect(registry.get("accent-3")).toBe("#f59e0b");
    expect(resolvePaletteBaseHex("bros", registry)).toBe("#c888f2");
  });

  it("resolves semantic and brand from hex config", () => {
    const resolved = resolveThemePalettes(config);
    expect(resolved.semantic.danger).toBe("#ff0000");
    expect(resolved.semantic.success).toBe(THEME_SEMANTIC_DEFAULT_HEX.success);
    expect(resolved.brand).toBe("#14b8a6");
    expect(resolved.neutralBase).toBe(THEME_NEUTRAL_DEFAULT_HEX);
  });

  it("emits custom danger hex in theme CSS", () => {
    const css = generateThemeCSSVars(config);
    expect(css).toMatch(/--iui-color-danger-500:#(?:ff0000|f{2}0000)/i);
    expect(css).not.toContain("--iui-color-danger-500:#ef4444");
  });

  it("createColorValueGetter prefers CSS vars for shaded tokens", () => {
    const getter = createColorValueGetter();
    expect(getter("bros-600")).toBe("var(--iui-color-bros-600)");
    expect(getter("danger-500")).toBe("var(--iui-color-danger-500)");
  });

  it("uses hex defaults from test helper when semantic omitted", () => {
    const minimal = withTestAccentPalette({ theme: {} } as IUIConfig);
    const resolved = resolveThemePalettes(minimal);
    expect(resolved.semantic.success).toBe(THEME_SEMANTIC_DEFAULT_HEX.success);
    expect(resolved.brand).toBe(THEME_BRAND_DEFAULT_HEX);
  });
});
