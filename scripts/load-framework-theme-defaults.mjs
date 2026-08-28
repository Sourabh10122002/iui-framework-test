/**
 * Single source for framework contract scaffold defaults (semantic, brand, neutral).
 * Used by iui-init (createconfig.js) and the product CLI scaffold.
 */
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createJiti } from "jiti";

function resolveValuesPath(frameworkRoot) {
  const candidates = [
    join(frameworkRoot, "src/engine/tokens/values.ts"),
    join(frameworkRoot, "dist/engine/tokens/values.js"),
    join(frameworkRoot, "dist/engine/tokens/values.mjs"),
    join(frameworkRoot, "dist/index.esm.js"),
    join(frameworkRoot, "dist/index.cjs"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function readThemeDefaultExports(valuesModule) {
  const {
    THEME_SEMANTIC_DEFAULT_HEX,
    THEME_BRAND_DEFAULT_HEX,
    THEME_NEUTRAL_DEFAULT_HEX,
    THEME_ACCENT_CONTRACT_DEFAULT_HEX,
  } = valuesModule ?? {};

  if (
    !THEME_SEMANTIC_DEFAULT_HEX ||
    !THEME_BRAND_DEFAULT_HEX ||
    !THEME_NEUTRAL_DEFAULT_HEX ||
    !THEME_ACCENT_CONTRACT_DEFAULT_HEX
  ) {
    return null;
  }

  return {
    semantic: THEME_SEMANTIC_DEFAULT_HEX,
    brand: THEME_BRAND_DEFAULT_HEX,
    neutral: THEME_NEUTRAL_DEFAULT_HEX,
    accent: THEME_ACCENT_CONTRACT_DEFAULT_HEX,
  };
}

/** @param {string} scriptsDir absolute path to Framework `scripts/` directory */
export function loadFrameworkThemeDefaults(scriptsDir) {
  const frameworkRoot = dirname(scriptsDir);
  const valuesPath = resolveValuesPath(frameworkRoot);
  if (!valuesPath) {
    throw new Error(
      "Cannot load theme defaults: Framework values.ts not found. Build @inventive-ui/framework first.",
    );
  }

  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const values = jiti(valuesPath);
  const defaults = readThemeDefaultExports(values);

  if (!defaults) {
    throw new Error(
      "Cannot load theme defaults: Framework token exports not found. Build @inventive-ui/framework first.",
    );
  }

  return defaults;
}

/**
 * @param {{ semantic: Record<string, string>, brand: string, neutral: string, accent: Record<string, string> }} defaults
 * @param {{ configType?: string, frameworkImport?: string }} [options]
 */
export function buildThemeScaffoldConfig(defaults, options = {}) {
  const configType = options.configType ?? "IUIConfig";
  const frameworkImport =
    options.frameworkImport ?? "@inventive-ui/framework/config";
  const { semantic, brand, neutral, accent } = defaults;

  const accentLines = Object.entries(accent)
    .map(([key, hex]) => `        ${key}: "${hex}",`)
    .join("\n");

  return `import type { ${configType} } from "${frameworkImport}";

const config: ${configType} = {
  theme: {
    mode: {
      default: "light",
      allowSystem: true,
    },

    direction: "ltr",

    colors: {
      brand: {
        set: "${brand}",
      },

      neutral: {
        set: "${neutral}",
      },

      semantic: {
        success: "${semantic.success}",
        warning: "${semantic.warning}",
        danger: "${semantic.danger}",
        info: "${semantic.info}",
      },

      accent: {
${accentLines}
      },

      gradients: {
        sunset: {
          from: "success",
          to: "info",
          direction: "to end",
        },
      },
    },

    typography: {
      provider: "system",
      set: "inter",
    },

    spacing: {
      set: "compact",
    },

    radius: {
      set: "none",
    },

    /**
     * Optional theme.shellBoot — first-paint html/body/#root before CSS loads.
     * Omit to derive from theme.colors.neutral.set (palette 50/950).
     * Override with hex when your canvas differs from the neutral scale.
     */
  },

  states: {
    focused: {
      mode: "native",
      shades: { light: "600", dark: "400" },
      style: {
        width: 2,
        offset: 2,
        offsetColor: { light: "white", dark: "black" },
      },
      accessibility: { minContrast: 3, highContrastSupport: false },
    },
    disabled: {
      style: "fade",
      opacity: 0.5,
    },
    loading: {
      style: "fade",
      opacity: 0.5,
      spinner: true,
      cursor: "wait",
      loader: { name: "line-spinner", color: "currentColor", strokeWidth: 2 },
      label: "Loading",
    },
  },

  core: {
    important: false,
  },

  /**
   * Compile-first CSS — scanned at build time by the Vite/Webpack/Next plugin.
   * Do not import style-map ".generated" files into the browser graph.
   * scanDirs / scanPackages default in Framework — override only when needed.
   * See Framework docs/01-compile-first-guide.md for all build options.
   */
  build: {
    safelist: [],
    packageSafelist: false,
    includeShadeMatrix: false,
    includeThemePresets: true,
    includeThemeGrayScale: true,
    resolvePalettePatterns: true,
    includeArbitraryScan: true,
    writeFiles: false,
    minify: true,
    useAst: true,
  },
};

export default config;
`;
}

/** Resolve Framework `scripts/` from this module's location (iui-init). */
export function frameworkScriptsDirFromMeta(metaUrl) {
  return dirname(fileURLToPath(metaUrl));
}
