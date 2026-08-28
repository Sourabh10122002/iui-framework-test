import {
  useMemo,
  useCallback,
  useRef,
  useState,
  useLayoutEffect,
  useSyncExternalStore,
} from "react";
import {
  themeManager,
  semanticColors,
  accentColors,
  brandColor,
  neutralColor,
  neutralColors,
  availableColorPalettes,
  colorShades,
  type ColorShade,
  type ThemeState,
} from "../configuration/theme-options";
import { mapFont, completeHexCode } from "../utilities/theme-utilities";
import { VariableUtils } from "../utilities";

type ThemeLayoutSlice = {
  globalRadius: string;
  globalSpacing: string;
  globalColor: string;
  globalFont: string;
};

function shallowEqualLayout(a: ThemeLayoutSlice, b: ThemeLayoutSlice): boolean {
  return (
    a.globalRadius === b.globalRadius &&
    a.globalSpacing === b.globalSpacing &&
    a.globalColor === b.globalColor &&
    a.globalFont === b.globalFont
  );
}

/**
 * Subscribe to a derived theme value. Only re-renders when the selected
 * value changes per `isEqual` — mode toggles do not wake layout-only consumers.
 */
export function useThemeSelector<T>(
  selector: (state: ThemeState) => T,
  isEqual: (a: T, b: T) => boolean = Object.is,
): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const equalRef = useRef(isEqual);
  equalRef.current = isEqual;
  const cacheRef = useRef<{ value: T } | null>(null);

  const subscribe = useCallback((onStoreChange: () => void) => {
    return themeManager.subscribe(() => onStoreChange());
  }, []);

  const getSnapshot = useCallback(() => {
    const next = selectorRef.current(themeManager.getState());
    if (cacheRef.current && equalRef.current(cacheRef.current.value, next)) {
      return cacheRef.current.value;
    }
    cacheRef.current = { value: next };
    return next;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * Mode-only subscription for theme toggles / mode-aware UI.
 * Prefer this over useTheme() when you only need light/dark.
 */
export function useThemeMode(): {
  mode: "light" | "dark";
  isDark: boolean;
  globalMode: "light" | "dark";
  updateTheme: (updates: Partial<ThemeState>) => void;
} {
  const mode = useThemeSelector((s) =>
    s.mode === "dark" ? ("dark" as const) : ("light" as const),
  );

  return {
    mode,
    isDark: mode === "dark",
    globalMode: mode,
    updateTheme: useCallback((updates: Partial<ThemeState>) => {
      themeManager.updateTheme(updates);
    }, []),
  };
}

/**
 * Layout/token slice used by compile-first components (Button/Tag/Checkbox).
 * Does not subscribe to `mode` — dark styling uses CSS `dark:` variants.
 */
export function useThemeLayout(): ThemeLayoutSlice & {
  updateTheme: (updates: Partial<ThemeState>) => void;
  getDirection: () => "ltr" | "rtl";
} {
  const slice = useThemeSelector((s): ThemeLayoutSlice => {
    return {
      globalRadius: s.radius,
      globalSpacing: s.spacing,
      globalColor: s.color,
      globalFont: s.font,
    };
  }, shallowEqualLayout);

  return {
    ...slice,
    updateTheme: useCallback((updates: Partial<ThemeState>) => {
      themeManager.updateTheme(updates);
    }, []),
    getDirection: useCallback(
      () =>
        (typeof document !== "undefined"
          ? document.documentElement.getAttribute("dir")
          : null) === "rtl"
          ? "rtl"
          : "ltr",
      [],
    ),
  };
}

export function useTheme(): {
  semanticColors: typeof semanticColors;
  accentColors: typeof accentColors;
  brandColor: string;
  neutralColor: string;
  /** @deprecated Use `neutralColor`. */
  neutralColors: { set: string };
  availableColorPalettes: readonly string[];
  colorShades: readonly string[];
  globalRadius: string;
  globalSpacing: string;
  globalColor: string;
  globalFont: string;
  globalMode: string;
  globalDirection: "ltr" | "rtl";
  isDark: boolean;
  themeState: ReturnType<typeof themeManager.getState>;
  updateTheme: (
    updates: Partial<ReturnType<typeof themeManager.getState>>,
  ) => void;
  getColorName: (color: string) => string;
  getSemanticPaletteName: (semanticColor: string) => string;
  getResolvedColor: (color: string) => string;
  requiresDynamicGeneration: (color: string) => boolean;
  buildColorClass: (
    property: "bg" | "text" | "border",
    color: string,
    shade?: ColorShade,
    state?: "hover" | "focus" | "active",
  ) => string;
  isCustomHex: (color: string) => boolean;
  getActualColorName: (semanticColor: string) => string;
  getMode: () => string;
  getRadius: () => string;
  getSpacing: () => string;
  getFont: () => string;
  getDirection: () => "ltr" | "rtl";
} {
  // Full-state subscription — use useThemeMode / useThemeLayout when possible
  // so components do not re-render on mode-only toggles.
  const [themeState, setThemeState] = useState(themeManager.getState());

  useLayoutEffect(() => {
    setThemeState(themeManager.getState());
    const unsubscribe = themeManager.subscribe(() => {
      setThemeState(themeManager.getState());
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const isDark = themeState.mode === "dark";
  const globalDirection: "ltr" | "rtl" =
    (typeof document !== "undefined"
      ? document.documentElement.getAttribute("dir")
      : null) === "rtl"
      ? "rtl"
      : "ltr";

  const getCSSVariable = useCallback((name: string): string => {
    if (typeof window === "undefined") return "";
    return getComputedStyle(document.body).getPropertyValue(name)?.trim() || "";
  }, []);

  // Module-level palettes — stable across mode toggles.
  const semanticColorResolution = useMemo(() => {
    const resolution: Record<
      string,
      {
        semanticName: string;
        paletteName: string;
        isCustomHex: boolean;
        cssVarPrefix: string;
      }
    > = {};

    Object.entries(semanticColors).forEach(([semantic, value]) => {
      if (typeof value === "string") {
        resolution[semantic] = {
          semanticName: semantic,
          paletteName: value,
          isCustomHex: false,
          cssVarPrefix: VariableUtils.getColor(`${value}-500`).replace(
            "-500",
            "",
          ),
        };
      }
    });

    Object.entries(accentColors).forEach(([accentName, value]) => {
      if (typeof value === "string") {
        resolution[accentName] = {
          semanticName: accentName,
          paletteName: value,
          isCustomHex: false,
          cssVarPrefix: VariableUtils.getColor(`${accentName}-500`).replace(
            "-500",
            "",
          ),
        };
      }
    });

    return resolution;
  }, []);

  const getColorName = useCallback(
    (color: string): string => {
      if (semanticColorResolution[color]) {
        return color;
      }
      return color;
    },
    [semanticColorResolution],
  );

  const getSemanticPaletteName = useCallback(
    (semanticColor: string): string => {
      const resolution = semanticColorResolution[semanticColor];
      return resolution ? resolution.paletteName : semanticColor;
    },
    [semanticColorResolution],
  );

  const requiresDynamicGeneration = useCallback((_color: string): boolean => {
    return false;
  }, []);

  const getResolvedColor = useCallback(
    (color: string): string => {
      const resolution = semanticColorResolution[color];
      if (resolution) {
        if (resolution.isCustomHex) {
          return completeHexCode(
            semanticColors[color as keyof typeof semanticColors] as string,
          );
        } else {
          const preferredShades = ["400", "500", "600", "300", "700"];
          for (const shade of preferredShades) {
            const varValue = getCSSVariable(
              `${resolution.cssVarPrefix}-${shade}`,
            );
            if (varValue && varValue !== "") {
              return varValue;
            }
          }
          return resolution.paletteName;
        }
      }
      const preferredShades = ["400", "500", "600", "300", "700"];
      for (const shade of preferredShades) {
        const colorVar = VariableUtils.getColor(`${color}-${shade}`);
        const varValue = getCSSVariable(colorVar);
        if (varValue && varValue !== "") {
          return varValue;
        }
      }
      return color;
    },
    [semanticColorResolution, getCSSVariable],
  );

  const buildColorClass = useCallback(
    (
      property: "bg" | "text" | "border",
      color: string,
      shade: ColorShade = "500",
      state?: "hover" | "focus" | "active",
    ): string => {
      const colorName = getColorName(color);
      const baseClass = `${property}-${colorName}-${shade}`;
      return state ? `${state}:${baseClass}` : baseClass;
    },
    [getColorName],
  );

  return {
    semanticColors,
    accentColors,
    brandColor,
    neutralColor,
    neutralColors,
    availableColorPalettes,
    colorShades,
    globalRadius: themeState.radius,
    globalSpacing: themeState.spacing,
    globalColor: themeState.color,
    globalFont: themeState.font,
    globalMode: themeState.mode,
    globalDirection,
    isDark,
    themeState,
    updateTheme: useCallback((updates: Partial<typeof themeState>) => {
      themeManager.updateTheme(updates);
    }, []),
    getColorName,
    getSemanticPaletteName,
    getResolvedColor,
    requiresDynamicGeneration,
    buildColorClass,
    isCustomHex: requiresDynamicGeneration,
    getActualColorName: getSemanticPaletteName,
    getMode: useCallback(() => themeState.mode, [themeState.mode]),
    getRadius: useCallback(() => themeState.radius, [themeState.radius]),
    getSpacing: useCallback(() => themeState.spacing, [themeState.spacing]),
    getFont: useCallback(() => mapFont(themeState.font), [themeState.font]),
    getDirection: useCallback(
      () =>
        (typeof document !== "undefined"
          ? document.documentElement.getAttribute("dir")
          : null) === "rtl"
          ? "rtl"
          : "ltr",
      [],
    ),
  };
}
