/**
 * IUI Design System - useStates Hook
 * Thin adapter over the state engine
 */

import { useMemo, useCallback } from "react";
import { useIUIContext } from "../context/iui-context";
import { getStatesConfig } from "../config-loader";
import { minimalPreset } from "./define-states";
import {
  resolveStatesConfig,
  generateStateCSS,
  type StateContext,
} from "./resolver";

import type {
  StatesConfig,
  ResolvedStatesConfig,
  ResolvedFocusedConfig,
  ResolvedDisabledStateConfig,
  ResolvedLoadingStateConfig,
  LoaderSlotConfig,
} from "./types";

/* =============================================================================
   Types
============================================================================= */

export interface UseStatesOptions {
  componentColor?: string;
  disabled?: boolean;
  loading?: boolean;
  borderRadius?: string | number;
  overrides?: Partial<StatesConfig>;
}

export interface UseStatesReturn {
  config: ResolvedStatesConfig;

  focused: {
    config: ResolvedFocusedConfig;
    classes: string;
  };

  disabled: {
    config: ResolvedDisabledStateConfig;
    classes: string;
    isActive: boolean;
  };

  loading: {
    config: ResolvedLoadingStateConfig;
    classes: string;
    isActive: boolean;
  };

  stateClasses: string;
  dataAttrs: Record<string, string | boolean>;

  getBlockingProps: () => {
    "aria-disabled"?: boolean;
    "aria-busy"?: boolean;
    tabIndex?: number;
    onClick?: (e: React.MouseEvent) => void;
  };
  blockingProps: {
    "aria-disabled"?: boolean;
    tabIndex?: number;
    onClick?: (e: React.MouseEvent) => void;
  };

  isBlocked: boolean;

  /** Use this for interaction variant when disabled or loading so hover/active styles are off but cursor still shows. */
  effectiveInteractionVariant: "none" | undefined;
}

/* Cache */

let cachedStatesConfig: ResolvedStatesConfig | null = null;
let cachedRawConfig: StatesConfig | undefined;

/** Clear cache when config is reapplied (called from auto-config) */
export function clearStatesCache(): void {
  cachedStatesConfig = null;
  cachedRawConfig = undefined;
}

function getCachedStatesConfig(raw?: StatesConfig): ResolvedStatesConfig {
  if (cachedStatesConfig && cachedRawConfig === raw) return cachedStatesConfig;
  cachedRawConfig = raw;
  cachedStatesConfig = resolveStatesConfig(raw);
  return cachedStatesConfig;
}

/* Hook */
export function useStates(options: UseStatesOptions = {}): UseStatesReturn {
  const {
    componentColor,
    disabled = false,
    loading = false,
    borderRadius,
    overrides,
  } = options;

  const context = useIUIContext();
  const contextConfig = context?.config;

  /* Load config: context first (industry standard), then global loader, then minimalPreset */
  const rawConfig = useMemo(() => {
    const fromContext = contextConfig?.states;
    let base: StatesConfig | undefined;
    if (fromContext) {
      base = fromContext;
    } else {
      try {
        base = getStatesConfig();
      } catch {
        base = minimalPreset;
      }
    }
    if (!overrides) return base;

    return {
      ...base,
      focused: { ...base?.focused, ...overrides.focused },
      disabled: { ...base?.disabled, ...overrides.disabled },
      loading: { ...base?.loading, ...overrides.loading },
    };
  }, [contextConfig, overrides]);

  const config = useMemo(() => {
    return getCachedStatesConfig(rawConfig);
  }, [rawConfig]);

  /* Context (loading/disabled always block interaction, so never focusable when loading) */
  const stateContext: StateContext = useMemo(
    () => ({
      componentColor,
      borderRadius,
    }),
    [componentColor, borderRadius],
  );

  /* Generate CSS */

  const generated = useMemo(() => {
    return generateStateCSS(config, stateContext);
  }, [config, stateContext]);

  const stateClasses = useMemo(() => {
    return generated.combined.classNames.filter(Boolean).join(" ");
  }, [generated]);
  /* ---------------------------------- */
  /* Data attributes */
  /* ---------------------------------- */

  const dataAttrs = useMemo(() => {
    const attrs: Record<string, string | boolean> = {
      ...generated.focused.dataAttributes,
      ...generated.disabled.dataAttributes,
      ...generated.loading.dataAttributes,
    };

    // Only add data-loading if actually loading (optimization: avoid unnecessary attribute)
    if (loading) {
      attrs["data-loading"] = true;
    }

    return attrs;
  }, [loading, generated]);

  /* ---------------------------------- */
  /* Blocking */
  /* ---------------------------------- */

  // Always block interaction when disabled or loading (no prop to opt out)
  const blockingProps = useMemo(() => {
    const props: Record<string, unknown> = {};
    if (disabled || loading) {
      props["aria-disabled"] = true;
      props.tabIndex = -1;
      props.onClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      };
    }
    return props;
  }, [disabled, loading]);

  // Keep getBlockingProps for backward compatibility, but return memoized value
  const getBlockingProps = useCallback(() => blockingProps, [blockingProps]);

  const isBlocked = useMemo(() => disabled || loading, [disabled, loading]);

  /** When blocked, use "none" so components skip hover/active styles; cursor still applies from state classes. */
  const effectiveInteractionVariant: "none" | undefined = isBlocked
    ? "none"
    : undefined;

  /* ---------------------------------- */
  /* Return */
  /* ---------------------------------- */

  return {
    config,

    focused: {
      config: config.focused,
      classes: generated.focused.classNames.join(" "),
    },

    disabled: {
      config: config.disabled,
      classes: generated.disabled.classNames.join(" "),
      isActive: disabled,
    },

    loading: {
      config: config.loading,
      classes: generated.loading.classNames.join(" "),
      isActive: loading,
    },

    stateClasses,
    dataAttrs,
    getBlockingProps,
    blockingProps, // Return memoized blocking props directly
    isBlocked,
    effectiveInteractionVariant,
  };
}

/*optional helpers*/
export function useFocused(componentColor?: string): { classes: string } {
  const states = useStates({ componentColor });
  return {
    classes: states.focused.classes,
  };
}

export function useDisabledState(disabled: boolean): {
  isActive: boolean;
  classes: string;
  dataAttrs: Record<string, string | boolean>;
  isBlocked: boolean;
  getBlockingProps: () => {
    "aria-disabled"?: boolean;
    "aria-busy"?: boolean;
    tabIndex?: number;
    onClick?: (e: React.MouseEvent) => void;
  };
  config: ResolvedDisabledStateConfig;
} {
  const states = useStates({ disabled });

  return {
    isActive: disabled,

    // visuals
    classes: states.disabled.classes,
    dataAttrs: states.dataAttrs,

    // behavior
    isBlocked: states.isBlocked,
    getBlockingProps: states.getBlockingProps,

    // config access
    config: states.disabled.config,
  };
}

export function useLoadingState(loading: boolean): {
  isActive: boolean;
  classes: string;
  dataAttrs: Record<string, string | boolean>;
  isBlocked: boolean;
  getBlockingProps: () => {
    "aria-disabled"?: boolean;
    "aria-busy"?: boolean;
    tabIndex?: number;
    onClick?: (e: React.MouseEvent) => void;
  };
  showSpinner: boolean;
  loaderSlot: LoaderSlotConfig;
  loadingLabel: string;
  config: ResolvedLoadingStateConfig;
} {
  const states = useStates({ loading });

  return {
    isActive: loading,

    // visuals
    classes: states.loading.classes,
    dataAttrs: states.dataAttrs,

    // behavior
    isBlocked: states.isBlocked,
    getBlockingProps: states.getBlockingProps,

    // extras
    showSpinner: states.config.loading.spinner,
    loaderSlot: states.config.loading.loader,
    loadingLabel: states.config.loading.label,
    config: states.loading.config,
  };
}
