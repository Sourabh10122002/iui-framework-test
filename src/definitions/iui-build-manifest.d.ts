declare module "iui-build-manifest" {
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

  export const IUI_BUILD: IUIBuildManifest;
  const manifest: IUIBuildManifest;
  export default manifest;
}

declare module "iui-build-styles" {
  const css: string;
  export default css;
}

declare module "iui-build-styles.css" {
  const css: string;
  export default css;
}

/** @deprecated Use `iui-build-styles` — Vite no longer uses the virtual CSS module. */
declare module "virtual:iui-build-styles" {
  const css: string;
  export default css;
}
