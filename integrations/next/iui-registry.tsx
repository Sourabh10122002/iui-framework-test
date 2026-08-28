/**
 * IUIRegistry – Next.js App Router
 *
 * Injects theme init + compile-first CSS during SSR via useServerInsertedHTML
 * (Emotion / styled-components pattern). Preferred CSS delivery: linked
 * `/iui/{hash}.css` under `public/iui/` (parity with Vite/Webpack head injection —
 * styles before paint, without shipping megabyte CSS inside HTML/JS).
 *
 * Usage in layout.tsx:
 *   import { IUIRegistry } from "@inventive-ui/framework/next/registry";
 */
"use client";
import React, { type ReactNode, useMemo } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { getBootstrapFrameworkConfig } from "@inventive-ui/framework";
import {
  createSSRRegistry,
  generateCriticalCSSFromRegistry,
  generateThemeInitScript,
  IUIRegistryContext,
  useIUIRegisterClassNames,
} from "@inventive-ui/framework/server";
import type { IUIConfig } from "@inventive-ui/framework/config";
import "iui-bootstrap";

export interface IUIRegistryProps {
  children: ReactNode;
  /** Theme config for server-side CSS generation (tokens, etc.) */
  config?: IUIConfig | null;
  /** Optional: seed registry with these classes (e.g. from a build step). Otherwise classes are collected via context during render. */
  criticalClassNames?: string[];
}

type IuiGlobals = {
  __IUI_BUILD_CSS__?: string;
  __IUI_BUILD_CSS_HREF__?: string;
};

export default function IUIRegistry({
  children,
  config,
  criticalClassNames,
}: IUIRegistryProps): React.ReactElement {
  const registry = useMemo(() => {
    const r = createSSRRegistry();
    if (criticalClassNames?.length) {
      r.add(...criticalClassNames);
    }
    return r;
  }, [criticalClassNames]);

  useServerInsertedHTML(() => {
    const g =
      typeof globalThis !== "undefined"
        ? (globalThis as unknown as IuiGlobals)
        : {};
    const resolvedConfig = config ?? getBootstrapFrameworkConfig();
    const themeInitScript = resolvedConfig
      ? generateThemeInitScript(resolvedConfig)
      : "";
    const buildHref =
      typeof g.__IUI_BUILD_CSS_HREF__ === "string" ? g.__IUI_BUILD_CSS_HREF__ : "";
    const buildCSS =
      typeof g.__IUI_BUILD_CSS__ === "string" ? g.__IUI_BUILD_CSS__ : "";
    const criticalCSS = generateCriticalCSSFromRegistry(
      registry,
      resolvedConfig ?? undefined,
    );
    const hasInit = themeInitScript.length > 0;
    const hasBuildLink = buildHref.length > 0;
    const hasBuildInline = !hasBuildLink && buildCSS.length > 0;
    // Full compile-first sheet already covers scanned classes — skip duplicate critical.
    const hasCritical =
      criticalCSS.length > 0 && !hasBuildLink && !hasBuildInline;
    if (!hasInit && !hasBuildLink && !hasBuildInline && !hasCritical) {
      return null;
    }
    return (
      <>
        {hasInit && (
          <script
            id="iui-theme-init"
            dangerouslySetInnerHTML={{ __html: themeInitScript }}
          />
        )}
        {hasBuildLink && (
          <link
            rel="stylesheet"
            href={buildHref}
            data-iui-build=""
            precedence="iui-build"
          />
        )}
        {hasBuildInline && (
          <style
            data-iui-build=""
            dangerouslySetInnerHTML={{ __html: buildCSS }}
          />
        )}
        {hasCritical && (
          <style
            data-iui-ssr=""
            dangerouslySetInnerHTML={{ __html: criticalCSS }}
          />
        )}
      </>
    );
  });

  return (
    <IUIRegistryContext.Provider value={registry}>
      {children}
    </IUIRegistryContext.Provider>
  );
}

/**
 * Optional: use inside IUIRegistry to register class names during server render
 * (so critical CSS is generated automatically without hardcoding).
 * Renders a div; use for above-the-fold content when you want zero-FOUC.
 */
export interface IUIBoxProps {
  className?: string;
  children?: ReactNode;
  as?: React.ElementType;
  [key: string]: unknown;
}

export function IUIBox({
  className,
  children,
  as: Tag = "div",
  ...rest
}: IUIBoxProps): React.ReactElement {
  useIUIRegisterClassNames(className);
  return (
    <Tag className={className} {...rest}>
      {children}
    </Tag>
  );
}
