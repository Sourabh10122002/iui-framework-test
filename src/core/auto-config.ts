import { initConfig, getConfigLoader } from "./config-loader";
import { themeManager, bootstrapThemeFromScript } from "../configuration/theme-options";
import type { IUIConfig } from "./config";
import { clearStatesCache } from "./states";
import { logger } from "../utilities/logger";
import { warmSlotAssets } from "../utilities/slot/warm-slot-assets";
import { isCompilePipelineActive } from "./build-mode";

let isConfigApplied = false;

const GLOBAL_CONFIG_APPLIED_KEY = "__IUI_CONFIG_APPLIED__" as const;

function isConfigAppliedShared(): boolean {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_CONFIG_APPLIED_KEY]?: boolean;
  };
  return g[GLOBAL_CONFIG_APPLIED_KEY] === true || isConfigApplied;
}

function setConfigAppliedShared(value: boolean): void {
  isConfigApplied = value;
  (globalThis as typeof globalThis & {
    [GLOBAL_CONFIG_APPLIED_KEY]?: boolean;
  })[GLOBAL_CONFIG_APPLIED_KEY] = value;
}

/** @internal Reset init guards for unit tests. */
export function __resetAutoConfigForTests(): void {
  isConfigApplied = false;
  delete (globalThis as typeof globalThis & {
    [GLOBAL_CONFIG_APPLIED_KEY]?: boolean;
  })[GLOBAL_CONFIG_APPLIED_KEY];
}

/** Options for applyLoadedConfig - enables Provider override (industry standard) */
export interface ApplyLoadedConfigOptions {
  /** When true, re-apply config even if already applied (used by IUIProvider to override globals) */
  force?: boolean;
}

/**
 * Apply config in compile-first mode (theme CSS is in the build stylesheet).
 */
function applyLoadedConfigCompile(
  config: IUIConfig | null | undefined,
  options?: ApplyLoadedConfigOptions,
): void {
  const force = options?.force === true;

  if (!config) {
    if (!isConfigAppliedShared()) {
      logger.warn("[IUI] No config provided. Using defaults.");
      config = {} as IUIConfig;
    } else {
      return;
    }
  }

  if (isConfigAppliedShared() && !force) {
    logger.debug(
      "[IUI] Config already applied, skipping duplicate application",
    );
    return;
  }
  if (force) {
    setConfigAppliedShared(false);
  }
  setConfigAppliedShared(true);

  clearStatesCache();

  if (themeManager && typeof themeManager.resetState === "function") {
    themeManager.resetState();
  }

  try {
    initConfig(config);
  } catch (error) {
    logger.debug(
      "[auto-config] Config already initialized, using existing loader:",
      error,
    );
    getConfigLoader();
  }

  const direction = config.theme?.direction || "ltr";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("dir", direction);
  }
}

/**
 * Apply an already-injected IUI config to the runtime.
 * CSS utilities are generated at build time via the compile plugin.
 */
export function applyLoadedConfig(
  config: IUIConfig | null | undefined,
  options?: ApplyLoadedConfigOptions,
): void {
  if (!isCompilePipelineActive()) {
    logger.warn(
      "[IUI] Compile plugin not detected. CSS utilities require inventiveUiVite / inventiveUiWebpack / withIUI.",
    );
  }
  applyLoadedConfigCompile(config, options);
}

/**
 * Framework initialization — compile-first.
 */
export function initFramework(
  config?: IUIConfig | null,
  options?: ApplyLoadedConfigOptions,
): void {
  if (isCompilePipelineActive()) {
    logger.log(
      "[IUI] Compile pipeline active — CSS generated at build time",
    );
  } else {
    logger.warn(
      "[IUI] Compile plugin not detected. Use inventiveUiVite / inventiveUiWebpack / withIUI for CSS utilities.",
    );
  }

  let configToApply: IUIConfig | null = null;
  if (config !== undefined && config !== null) {
    configToApply = config;
  } else {
    configToApply =
      typeof globalThis !== "undefined"
        ? ((globalThis as { __IUI_CONFIG__?: IUIConfig }).__IUI_CONFIG__ ??
          null)
        : null;
  }

  try {
    applyLoadedConfigCompile(configToApply ?? null, options);
    warmSlotAssets(configToApply);
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      bootstrapThemeFromScript();
    }
  } catch (err) {
    logger.warn("[IUI] Failed to apply config:", err);
    setConfigAppliedShared(false);
  }
}
