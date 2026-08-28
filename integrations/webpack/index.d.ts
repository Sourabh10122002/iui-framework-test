export interface IUIWebpackPluginOptions {
  /** Consumer project root (Storybook: app root, not .storybook). */
  root?: string;
  /** Path to iui.config.ts — auto-discovered from root when omitted. */
  configPath?: string;
  /** Emit `.next/static/iui/[hash].css` during webpack build (Next.js). */
  emitStaticAsset?: boolean;
  /** Slot asset scan options (shared with Vite plugin). */
  scan?: {
    scanDirs?: string[];
    include?: string[];
    exclude?: string[];
    /** @default "smart" — rescan on watch only when story/config files change */
    rescanOnWatch?: boolean | "smart";
  };
}

export class IUIWebpackPlugin {
  constructor(options?: IUIWebpackPluginOptions);
  apply(compiler: unknown): void;
}

export class InventiveUiSlotAssetsWebpackPlugin {
  constructor(options?: Pick<IUIWebpackPluginOptions, "root">);
  apply(compiler: unknown): void;
}

export class IUIBuildCSSWebpackPlugin {
  constructor(options?: IUIWebpackPluginOptions);
  apply(compiler: unknown): void;
}

/**
 * Official Inventive UI Webpack integration — config bootstrap, compile-first CSS,
 * slot asset scanning, and subpath resolution for @inventive-ui asset packages.
 */
export function inventiveUiWebpack(
  options?: IUIWebpackPluginOptions,
): unknown[];

export default IUIWebpackPlugin;
