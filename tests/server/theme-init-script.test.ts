/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import {
  generateThemeInitScript,
  resolveThemeInitOptions,
  injectThemeInitScriptIntoHtml,
  hashThemeInitScript,
} from "../../src/server/generate-theme-init-script";

const config = {
  theme: {
    mode: {
      default: "dark",
      allowSystem: true,
      storageKey: "iui-theme-test",
    },
    direction: "rtl",
    panelBackground: { set: "translucent" },
    typography: { provider: "system" as const, set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig;

describe("generateThemeInitScript", () => {
  it("resolves mode, direction, and panel background from config", () => {
    const opts = resolveThemeInitOptions(config);
    expect(opts.defaultMode).toBe("dark");
    expect(opts.allowSystem).toBe(true);
    expect(opts.storageKey).toBe("iui-theme-test");
    expect(opts.direction).toBe("rtl");
    expect(opts.panelBackground).toBe("translucent");
  });

  it("emits blocking script with init marker, storage key, and boot paint", () => {
    const script = generateThemeInitScript(config);
    expect(script).toContain("iui-theme-test");
    expect(script).toContain('dataset.iuiThemeInit="1"');
    expect(script).toContain("prefers-color-scheme: dark");
    expect(script).toContain('setAttribute("dir","rtl")');
    expect(script).toContain('setAttribute("data-panel-background","translucent")');
    expect(script).toContain("backgroundColor");
    expect(script).toContain("data-iui-boot");
    expect(script).toContain("boot.textContent=bootCss");
  });

  it("injects script at the start of HTML head", () => {
    const script = generateThemeInitScript(config);
    const html = injectThemeInitScriptIntoHtml(
      "<html><head><title>x</title></head><body></body></html>",
      script,
    );
    expect(html).toContain('<script id="iui-theme-init">');
    expect(html.indexOf("iui-theme-init")).toBeLessThan(html.indexOf("<title>"));
    expect(html.indexOf("iui-theme-init")).toBeLessThan(html.indexOf("<body>"));
  });

  it("produces stable hash for unchanged script", () => {
    const a = hashThemeInitScript(generateThemeInitScript(config));
    const b = hashThemeInitScript(generateThemeInitScript(config));
    expect(a).toBe(b);
    expect(a).toHaveLength(12);
  });

  it("uses neutral palette for boot when shellBoot is omitted", () => {
    const script = generateThemeInitScript({
      theme: {
        mode: { default: "dark", allowSystem: false },
        colors: { neutral: { set: "#64748b" } },
      },
    } as IUIConfig);
    expect(script).not.toMatch(/#030712/);
    expect(script).toContain("backgroundColor");
  });

  it("honors explicit theme.shellBoot", () => {
    const script = generateThemeInitScript({
      theme: {
        mode: { default: "dark", allowSystem: false },
        shellBoot: {
          light: { background: "#ffffff", foreground: "#111111" },
          dark: { background: "#000000", foreground: "#eeeeee" },
        },
      },
    } as IUIConfig);
    expect(script).toContain("#000000");
    expect(script).toContain("#ffffff");
  });
});
