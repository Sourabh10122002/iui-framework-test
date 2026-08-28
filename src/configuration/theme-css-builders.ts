/**
 * Pure CSS string builders for theme output — shared by runtime injection and Node build.
 * No DOM access; safe to import from server/generate-theme-css.ts.
 */

import {
  colors,
  fontSize,
  fontFamily,
  fontWeight,
  spacing,
  borderRadius,
  borderWidth,
  ringWidth,
  ringOffsetWidth,
} from "../engine/tokens/values";
import { getDynamicTokenValue } from "../engine/tokens/dynamic";

export type TypographyExtend = Record<string, string | string[]>;

/**
 * Collect all design-token CSS variables (spacing scale, fonts, colors, etc.)
 * Equivalent to initializeGlobalDesignTokens() without DOM injection.
 */
export function collectDesignTokenVariables(
  typographyExtend: TypographyExtend = {},
): Record<string, string> {
  const variables: Record<string, string> = {};

  Object.entries(spacing).forEach(([key, value]) => {
    variables[`--iui-spacing-${key}`] = value;
    variables[`--iui-width-${key}`] = value;
    variables[`--iui-height-${key}`] = value;
  });

  const fontsFamilyExtended = { ...fontFamily, ...typographyExtend };
  Object.entries(fontsFamilyExtended).forEach(([key, value]) => {
    const fontValue = Array.isArray(value) ? value.join(", ") : String(value);
    variables[`--iui-font-family-${key}`] = fontValue;
  });

  Object.entries(fontSize).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      const [sizeValue, config] = value;
      variables[`--iui-font-size-${key}`] = sizeValue;
      if (config && config.lineHeight) {
        variables[`--iui-line-height-${key}`] = config.lineHeight;
      }
    } else {
      variables[`--iui-font-size-${key}`] = String(value);
    }
  });

  Object.entries(fontWeight).forEach(([key, value]) => {
    variables[`--iui-font-weight-${key}`] = String(value);
  });

  Object.entries(borderRadius).forEach(([key, value]) => {
    variables[`--iui-border-radius-${key}`] = value;
  });

  Object.entries(borderWidth).forEach(([key, value]) => {
    variables[`--iui-border-width-${key}`] = value;
  });

  Object.entries(ringWidth).forEach(([key, value]) => {
    variables[`--iui-ring-width-${key}`] = value;
  });

  Object.entries(ringOffsetWidth).forEach(([key, value]) => {
    variables[`--iui-ring-offset-width-${key}`] = value;
  });

  for (let i = 9; i <= 20; i++) {
    const dynamicBorderValue = getDynamicTokenValue("border-width", String(i));
    if (dynamicBorderValue) {
      variables[`--iui-border-width-${i}`] = dynamicBorderValue;
    }
  }

  for (let i = 60; i <= 100; i += 4) {
    const dynamicSpacingValue = getDynamicTokenValue("spacing", String(i));
    if (dynamicSpacingValue) {
      variables[`--iui-spacing-${i}`] = dynamicSpacingValue;
    }
  }

  Object.entries(colors).forEach(([key, value]) => {
    // Skip theme-driven placeholders — generateThemeCSSVars sets real hex values.
    if (value === `var(--iui-color-${key})`) {
      return;
    }
    variables[`--iui-color-${key}`] = value;
  });

  variables["--iui-container-type-normal"] = "normal";
  variables["--iui-container-type-inline-size"] = "inline-size";
  variables["--iui-container-type-size"] = "size";

  variables["--iui-scroll-snap-type-none"] = "none";
  variables["--iui-scroll-snap-type-x"] = "x";
  variables["--iui-scroll-snap-type-y"] = "y";
  variables["--iui-scroll-snap-type-both"] = "both";
  variables["--iui-scroll-snap-type-mandatory"] = "mandatory";
  variables["--iui-scroll-snap-type-proximity"] = "proximity";
  variables["--iui-scroll-snap-align-start"] = "start";
  variables["--iui-scroll-snap-align-end"] = "end";
  variables["--iui-scroll-snap-align-center"] = "center";
  variables["--iui-scroll-snap-align-none"] = "none";
  variables["--iui-scroll-snap-stop-normal"] = "normal";
  variables["--iui-scroll-snap-stop-always"] = "always";

  variables["--iui-text-wrap-wrap"] = "wrap";
  variables["--iui-text-wrap-nowrap"] = "nowrap";
  variables["--iui-text-wrap-balance"] = "balance";
  variables["--iui-text-wrap-pretty"] = "pretty";

  variables["--iui-columns-1"] = "1";
  variables["--iui-columns-2"] = "2";
  variables["--iui-columns-3"] = "3";
  variables["--iui-columns-auto"] = "auto";

  return variables;
}

export function designTokenVariablesToCSS(
  variables: Record<string, string>,
): string {
  if (Object.keys(variables).length === 0) return "";
  const body = Object.entries(variables)
    .map(([key, value]) => `${key}:${value}`)
    .join(";");
  return `:root{${body}}`;
}

/**
 * Static global styles from injectGlobalStyles() — logical inline vars, typography,
 * panel translucent rules, and dark-mode panel overrides.
 */
export function buildGlobalConfigStylesCSS(): string {
  return `
    /* Logical inline-axis helpers (LTR default; swapped in RTL below) */
    :root {
      --iui-inline-start-x: left;
      --iui-inline-end-x: right;

      /* Logical object-position helpers */
      --iui-object-start-x: var(--iui-inline-start-x);
      --iui-object-end-x: var(--iui-inline-end-x);
    }
    [dir="rtl"] {
      --iui-inline-start-x: right;
      --iui-inline-end-x: left;

      --iui-object-start-x: var(--iui-inline-start-x);
      --iui-object-end-x: var(--iui-inline-end-x);
    }

    /* Global typography from config - ALWAYS FRESH */
    *, ::before, ::after {
      font-family: var(--iui-global-font);
    }

    /* Interactive elements only */
    button, input, textarea, select,
    [role="button"], [role="tab"], [role="menuitem"],
    .iui-card, .iui-modal, .iui-dialog, .iui-popover, .iui-tooltip,
    img, video, iframe {
      border-radius: var(--iui-global-radius);
    }

    /* Structural elements reset */
    html, body, main, section, article, aside, nav,
    header, footer, div[class*="container"], div[class*="wrapper"] {
      border-radius: 0 !important;
    }

    /* Panel background (Card and Table) - Translucent vs Solid */
    [data-panel-background="translucent"] [class*="card"],
    [data-panel-background="translucent"] [class*="Card"],
    [data-panel-background="translucent"] .card,
    [data-panel-background="translucent"] .Card,
    [data-panel-background="translucent"] [class*="table"],
    [data-panel-background="translucent"] [class*="Table"],
    [data-panel-background="translucent"] .table,
    [data-panel-background="translucent"] .Table,
    [data-panel-background="translucent"] table,
    [data-panel-background="translucent"] thead,
    [data-panel-background="translucent"] tbody,
    [data-panel-background="translucent"] tfoot,
    [data-panel-background="translucent"] tr,
    [data-panel-background="translucent"] td,
    [data-panel-background="translucent"] th {
      background-color: var(--iui-panel-bg-color-translucent, rgba(255, 255, 255, 0.8));
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
    }

    [data-theme="dark"][data-panel-background="translucent"] [class*="card"],
    [data-theme="dark"][data-panel-background="translucent"] [class*="Card"],
    [data-theme="dark"][data-panel-background="translucent"] .card,
    [data-theme="dark"][data-panel-background="translucent"] .Card,
    [data-theme="dark"][data-panel-background="translucent"] [class*="table"],
    [data-theme="dark"][data-panel-background="translucent"] [class*="Table"],
    [data-theme="dark"][data-panel-background="translucent"] .table,
    [data-theme="dark"][data-panel-background="translucent"] .Table,
    [data-theme="dark"][data-panel-background="translucent"] table,
    [data-theme="dark"][data-panel-background="translucent"] thead,
    [data-theme="dark"][data-panel-background="translucent"] tbody,
    [data-theme="dark"][data-panel-background="translucent"] tfoot,
    [data-theme="dark"][data-panel-background="translucent"] tr,
    [data-theme="dark"][data-panel-background="translucent"] td,
    [data-theme="dark"][data-panel-background="translucent"] th {
      background-color: var(--iui-panel-bg-color-translucent-dark, rgba(0, 0, 0, 0.6));
    }
  `.trim();
}

export function buildFontImportCSS(options: {
  provider?: string | null;
  typographyExtend?: TypographyExtend;
  localFontUrls?: string | string[] | readonly string[];
}): string {
  const { provider, typographyExtend = {}, localFontUrls } = options;
  const imports: string[] = [];

  if (provider === "google") {
    Object.values(typographyExtend).forEach((value) => {
      if (Array.isArray(value) && value.length > 0) {
        const font = value[0].replace(/['"]/g, "").replace(/ /g, "+");
        imports.push(
          `@import url("https://fonts.googleapis.com/css2?family=${font}&display=swap");`,
        );
      }
    });
  }

  if (provider === "local" && localFontUrls) {
    const urls = Array.isArray(localFontUrls) ? localFontUrls : [localFontUrls];
    urls.forEach((url) => {
      imports.push(`@import url('${url}');`);
    });
  }

  return imports.join("\n");
}
