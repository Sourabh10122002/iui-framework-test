/**
 * Blocking theme init script for compile-first apps (next-themes pattern).
 * Runs in <head> before the app bundle — sets mode/dir and paints html/body/#root
 * so SPAs (Vite/Webpack) do not flash white while modules load. Next SSR benefits too.
 */

import { createHash } from "crypto";
import { initConfig } from "../core/config-loader";
import type { IUIConfig } from "../core/config";
import { generateFullThemeCSS } from "./generate-theme-css";
import { generateNeutralPalette } from "../utilities/theme-utilities";
import { resolveThemePalettes } from "../core/palette-registry";

/** Last-resort boot colors when no config and no derivable neutral palette. */
export const THEME_BOOT_BG = {
  light: "#f9fafb",
  dark: "#030712",
} as const;

export const THEME_BOOT_FG = {
  light: "#111827",
  dark: "#f3f4f6",
} as const;

export interface ShellBootColors {
  lightBg: string;
  darkBg: string;
  lightFg: string;
  darkFg: string;
}

export interface ThemeInitScriptOptions {
  defaultMode: "light" | "dark";
  allowSystem: boolean;
  storageKey: string;
  direction: "ltr" | "rtl";
  panelBackground: "solid" | "translucent";
}

export function resolveThemeInitOptions(
  config?: IUIConfig | null,
): ThemeInitScriptOptions {
  if (!config) {
    return {
      defaultMode: "light",
      allowSystem: false,
      storageKey: "iui-theme",
      direction: "ltr",
      panelBackground: "solid",
    };
  }

  try {
    initConfig(config);
  } catch {
    // already initialized
  }

  const modeConfig = config.theme?.mode;
  const defaultRaw = modeConfig?.default;
  const defaultMode = defaultRaw === "dark" ? "dark" : "light";
  const allowSystem = modeConfig?.allowSystem === true;
  const storageKey = modeConfig?.storageKey ?? "iui-theme";

  const fullTheme = generateFullThemeCSS(config);
  const direction =
    fullTheme.htmlAttributes.dir === "rtl" ? "rtl" : "ltr";
  const panelRaw = fullTheme.htmlAttributes["data-panel-background"];
  const panelBackground =
    panelRaw === "translucent" ? "translucent" : "solid";

  return {
    defaultMode,
    allowSystem,
    storageKey,
    direction,
    panelBackground,
  };
}

/** Derive boot shell from the consumer's neutral palette when `theme.shellBoot` is omitted. */
export function deriveShellBootFromTheme(
  config?: IUIConfig | null,
): ShellBootColors | null {
  if (!config?.theme?.colors?.neutral) return null;

  try {
    initConfig(config);
  } catch {
    // continue with palette math only
  }

  const baseHex = resolveThemePalettes(config).neutralBase;
  if (!baseHex) return null;

  try {
    const { palette11 } = generateNeutralPalette(baseHex);
    const lightBg = palette11["50"];
    const darkBg = palette11["950"];
    const lightFg = palette11["900"];
    const darkFg = palette11["50"];
    if (!lightBg || !darkBg || !lightFg || !darkFg) return null;
    return { lightBg, darkBg, lightFg, darkFg };
  } catch {
    return null;
  }
}

/**
 * Resolve first-paint shell colors: explicit `theme.shellBoot` → neutral palette → framework fallback.
 */
export function resolveShellBootColors(
  config?: IUIConfig | null,
): ShellBootColors {
  const shell = config?.theme?.shellBoot;
  if (shell?.light?.background && shell?.dark?.background) {
    return {
      lightBg: shell.light.background,
      darkBg: shell.dark.background,
      lightFg: shell.light.foreground ?? THEME_BOOT_FG.light,
      darkFg: shell.dark.foreground ?? THEME_BOOT_FG.dark,
    };
  }

  const derived = deriveShellBootFromTheme(config);
  if (derived) return derived;

  return {
    lightBg: THEME_BOOT_BG.light,
    darkBg: THEME_BOOT_BG.dark,
    lightFg: THEME_BOOT_FG.light,
    darkFg: THEME_BOOT_FG.dark,
  };
}

/**
 * Inline IIFE executed synchronously in <head> before the app bundle.
 * Resolves theme from URL → cookie → localStorage → (optional) system → default.
 * Paints boot background immediately (does not wait for React or the full sheet).
 */
export function generateThemeInitScript(config?: IUIConfig | null): string {
  const opts = resolveThemeInitOptions(config);
  const { lightBg, darkBg, lightFg, darkFg } = resolveShellBootColors(config);

  return `(function(){try{var d=document.documentElement;var k=${JSON.stringify(opts.storageKey)};var m=null;var u=window.location.search?new URLSearchParams(window.location.search).get("theme"):null;if(u==="dark"||u==="light")m=u;if(!m){var c=document.cookie.match(/(?:^|;\\s*)${opts.storageKey.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}=([^;]*)/);if(c){var cv=decodeURIComponent(c[1]).trim();if(cv==="dark"||cv==="light")m=cv;}}if(!m){var s=localStorage.getItem(k);if(s==="light"||s==="dark")m=s;}if(!m){${opts.allowSystem ? 'if(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)m="dark";else m="light";' : ""}}if(m!=="light"&&m!=="dark")m=${JSON.stringify(opts.defaultMode)};var dark=m==="dark";if(dark){d.classList.add("dark");d.setAttribute("data-theme","dark");}else{d.classList.remove("dark");d.setAttribute("data-theme","light");}d.style.colorScheme=m;var bg=dark?${JSON.stringify(darkBg)}:${JSON.stringify(lightBg)};var fg=dark?${JSON.stringify(darkFg)}:${JSON.stringify(lightFg)};d.style.backgroundColor=bg;d.style.color=fg;d.setAttribute("dir",${JSON.stringify(opts.direction)});d.setAttribute("data-panel-background",${JSON.stringify(opts.panelBackground)});var bootCss="html,body,#root{min-height:100%}body,#root{background-color:"+bg+";color:"+fg+"}";var boot=document.getElementById("iui-boot");if(!boot){boot=document.createElement("style");boot.id="iui-boot";boot.setAttribute("data-iui-boot","");(document.head||d).appendChild(boot);}boot.textContent=bootCss;d.dataset.iuiThemeInit="1";}catch(e){}})();`;
}

export function hashThemeInitScript(script: string): string {
  return createHash("sha256")
    .update(script ?? "")
    .digest("hex")
    .slice(0, 12);
}

/**
 * Place theme init as early as possible in <head> (before other head content).
 * Vite also uses HtmlTagDescriptor `injectTo: "head-prepend"` so this runs
 * ahead of `/@vite/client`.
 */
export function injectThemeInitScriptIntoHtml(
  html: string,
  scriptContent: string,
): string {
  if (!scriptContent || typeof html !== "string") return html;

  const tag = `<script id="iui-theme-init">${scriptContent}</script>`;

  if (html.includes('id="iui-theme-init"')) {
    return html.replace(
      /<script id="iui-theme-init">[\s\S]*?<\/script>/,
      tag,
    );
  }

  const headOpen = html.match(/<head[^>]*>/i);
  if (headOpen && headOpen.index != null) {
    const i = headOpen.index + headOpen[0].length;
    return `${html.slice(0, i)}\n  ${tag}${html.slice(i)}`;
  }

  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${tag}\n</head>`);
  }

  return `${tag}\n${html}`;
}
