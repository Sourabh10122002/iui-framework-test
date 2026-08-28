/**
 * Blocking compile-first stylesheet in <head> (Next.js IUIRegistry / zero-FOUC pattern).
 * Styles are available before the app bundle executes.
 *
 * @param {string} html
 * @param {string} css
 */
export function injectBuildStylesIntoHtml(html, css) {
  if (!css || typeof html !== "string") return html;

  const safeCss = css.replace(/<\/style/gi, "<\\/style");
  const tag = `<style data-iui-build>${safeCss}</style>`;

  if (html.includes("data-iui-build")) {
    return html
      .replace(/<style data-iui-build>[\s\S]*?<\/style>/, tag)
      .replace(/<link[^>]*data-iui-build[^>]*\/?>/, tag);
  }

  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${tag}\n</head>`);
  }

  return `${tag}\n${html}`;
}

/**
 * Linked compile-first stylesheet (optional / debug).
 * Vite **dev** prefers {@link injectBuildStylesIntoHtml} for zero-FOUC parity
 * with Next.js; keep this helper for static-asset tooling that needs a URL.
 *
 * @param {string} html
 * @param {string} href
 */
export function injectBuildStylesLinkIntoHtml(html, href) {
  if (!href || typeof html !== "string") return html;

  const tag = `<link rel="stylesheet" href="${href}" data-iui-build>`;

  if (html.includes("data-iui-build")) {
    return html
      .replace(/<style data-iui-build>[\s\S]*?<\/style>/, tag)
      .replace(/<link[^>]*data-iui-build[^>]*\/?>/, tag);
  }

  if (html.includes("</head>")) {
    return html.replace("</head>", `  ${tag}\n</head>`);
  }

  return `${tag}\n${html}`;
}
