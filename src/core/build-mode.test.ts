/**
 * @jest-environment jsdom
 */
import { isCompilePipelineActive, getIUIBuildManifest } from "../core/build-mode";

describe("build-mode", () => {
  afterEach(() => {
    delete (globalThis as typeof globalThis & { __IUI_BUILD__?: unknown })
      .__IUI_BUILD__;
  });

  it("defaults to runtime when manifest is absent", () => {
    expect(isCompilePipelineActive()).toBe(false);
    expect(getIUIBuildManifest().mode).toBe("runtime");
  });

  it("detects compile pipeline from global manifest", () => {
    globalThis.__IUI_BUILD__ = {
      mode: "compile",
      version: 1,
      cssHash: "abc",
      classCount: 10,
      themeBytes: 100,
      utilityBytes: 200,
      combinedBytes: 300,
      generatedAt: "",
    };
    expect(isCompilePipelineActive()).toBe(true);
  });
});
