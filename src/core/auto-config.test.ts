/**
 * @jest-environment jsdom
 */
import {
  __resetAutoConfigForTests,
  initFramework,
} from "./auto-config";
import { clearConfigCache, getCachedConfig } from "./config-loader";
import type { IUIConfig } from "./config";

describe("initFramework idempotency", () => {
  const sampleConfig: IUIConfig = {
    theme: { direction: "ltr" },
  };

  beforeEach(() => {
    __resetAutoConfigForTests();
    clearConfigCache();
    delete (globalThis as { __IUI_CONFIG__?: unknown }).__IUI_CONFIG__;
    document.documentElement.removeAttribute("dir");
  });

  it("applies config once and skips duplicate init without force", () => {
    initFramework(sampleConfig);
    expect(getCachedConfig()?.theme?.direction).toBe("ltr");

    initFramework({ theme: { direction: "rtl" } });
    expect(getCachedConfig()?.theme?.direction).toBe("ltr");
  });

  it("re-applies config when force option is set", () => {
    initFramework(sampleConfig);
    initFramework({ theme: { direction: "rtl" } }, { force: true });
    expect(getCachedConfig()?.theme?.direction).toBe("rtl");
  });

  it("reads __IUI_CONFIG__ when no explicit config is passed", () => {
    (globalThis as { __IUI_CONFIG__?: IUIConfig }).__IUI_CONFIG__ = {
      theme: { direction: "rtl" },
    };
    initFramework();
    expect(getCachedConfig()?.theme?.direction).toBe("rtl");
  });
});
