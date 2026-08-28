import React, { ReactNode, useLayoutEffect, useMemo, useRef } from "react";
import { IUIContext } from "./iui-context";
import type { IUIConfig } from "../config";
import { initFramework } from "../auto-config";
import {
  getBootstrapComponentConfig,
  getBootstrapFrameworkConfig,
} from "../bootstrap-state";
import { logger } from "../../utilities/logger";

export interface IUIProviderProps {
  /** Theme/config - takes precedence over iui.config + plugins (industry standard, zero-plugin path) */
  config?: IUIConfig | null;
  /** Component-level configuration (slots, defaults, etc.) */
  componentConfig?: any;
  children: ReactNode;
}

export const IUIProvider = ({
  config,
  componentConfig,
  children,
}: IUIProviderProps): React.ReactElement => {
  const resolvedConfig = config ?? getBootstrapFrameworkConfig() ?? undefined;
  const resolvedComponentConfig =
    componentConfig ?? getBootstrapComponentConfig();

  const contextValue = useMemo(
    () => ({
      componentConfig: resolvedComponentConfig,
      config: resolvedConfig,
    }),
    [resolvedComponentConfig, resolvedConfig],
  );

  const configAppliedOnMount = useRef(false);

  // Advanced path: explicit config initializes framework before paint.
  // Standard path: generated bootstrap calls initFramework before render.
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;

    if (config) (globalThis as any).__IUI_CONFIG__ = config;

    const themeBooted =
      typeof document !== "undefined" &&
      document.documentElement.dataset.iuiThemeInit === "1";

    if (!configAppliedOnMount.current) {
      configAppliedOnMount.current = true;
      if (themeBooted) return;
    }

    // Re-init only when advanced explicit config is supplied.
    if (config == null) return;

    try {
      initFramework(config, { force: true });
    } catch (err) {
      logger.warn("[IUI] Failed to apply config from IUIProvider:", err);
    }
  }, [config]);

  return (
    <IUIContext.Provider value={contextValue}>{children}</IUIContext.Provider>
  );
};
