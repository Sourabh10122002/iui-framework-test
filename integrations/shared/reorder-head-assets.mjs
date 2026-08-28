/**
 * Ensure render-blocking stylesheets load before application module scripts.
 * Vite emits the entry module early in <head>; without reordering, the browser
 * can paint prerendered HTML before utility CSS applies (hard-reload FOUC).
 *
 * Does not inline CSS — keeps external sheets cacheable.
 *
 * @param {string} html
 * @returns {string}
 */
export function reorderHeadStylesBeforeModuleScripts(html) {
  if (typeof html !== "string" || !html.includes("<head")) return html;

  const headOpen = html.match(/<head[^>]*>/i);
  if (!headOpen || headOpen.index == null) return html;

  const headStart = headOpen.index + headOpen[0].length;
  const headClose = html.indexOf("</head>", headStart);
  if (headClose === -1) return html;

  const headInner = html.slice(headStart, headClose);

  const stylesheetRe = /<link\b[^>]*\srel=["']stylesheet["'][^>]*>/gi;
  const moduleScriptRe = /<script\b[^>]*\stype=["']module["'][^>]*>\s*<\/script>/gi;
  const moduleScriptSelfClosingRe =
    /<script\b[^>]*\stype=["']module["'][^>]*\/>/gi;

  /** @type {string[]} */
  const styles = headInner.match(stylesheetRe) ?? [];
  /** @type {string[]} */
  const moduleScripts = [
    ...(headInner.match(moduleScriptRe) ?? []),
    ...(headInner.match(moduleScriptSelfClosingRe) ?? []),
  ];

  if (styles.length === 0 || moduleScripts.length === 0) {
    return html;
  }

  const firstModuleIdx = headInner.search(/<script\b[^>]*\stype=["']module["']/i);
  const firstStyleIdx = headInner.search(stylesheetRe);
  if (firstStyleIdx !== -1 && firstStyleIdx < firstModuleIdx) {
    return html;
  }

  let stripped = headInner;
  for (const tag of styles) {
    stripped = stripped.replace(tag, "");
  }
  for (const tag of moduleScripts) {
    stripped = stripped.replace(tag, "");
  }

  const reorderedHead = `${stripped}${styles.join("")}${moduleScripts.join("")}`;

  return html.slice(0, headStart) + reorderedHead + html.slice(headClose);
}
