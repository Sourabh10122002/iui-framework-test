/**
 * Compile-first pipeline detection (internal — not a user-facing mode switch).
 * Set by `iui-build-manifest` virtual module before the framework entry loads.
 */

export interface IUIBuildManifest {
  mode: "compile" | "runtime";
  version: number;
  cssHash: string;
  classCount: number;
  themeBytes: number;
  utilityBytes: number;
  combinedBytes: number;
  themeInitHash?: string;
  /** @deprecated Omitted from compile manifests — wall-clock times break Vite HMR. */
  generatedAt?: string;
}

const RUNTIME_MANIFEST: IUIBuildManifest = {
  mode: "runtime",
  version: 1,
  cssHash: "",
  classCount: 0,
  themeBytes: 0,
  utilityBytes: 0,
  combinedBytes: 0,
  generatedAt: "",
};

declare global {
  // eslint-disable-next-line no-var
  var __IUI_BUILD__: IUIBuildManifest | undefined;
}

/** Snapshot of the active build manifest (compile plugin or runtime fallback). */
export function getIUIBuildManifest(): IUIBuildManifest {
  if (typeof globalThis !== "undefined" && globalThis.__IUI_BUILD__) {
    return globalThis.__IUI_BUILD__;
  }
  return RUNTIME_MANIFEST;
}

/** True when Vite/Webpack/Next compile CSS plugin injected build-time styles. */
export function isCompilePipelineActive(): boolean {
  return getIUIBuildManifest().mode === "compile";
}
