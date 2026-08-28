/**
 * IUI element reset (border + outline).
 * Border width defaults to 0 with solid style so width utilities compose.
 * Outline uses a CSS variable default (not global style) so outlines render
 * only when an outline utility is applied.
 * Behavior aligns with utility-first preflight / outline utility composition.
 */
export const IUI_PREFLIGHT_RULE =
  "*,::before,::after{border-width:0;border-style:solid;border-color:currentColor;--iui-outline-style:solid;}";

export function withIuiPreflight(css: string): string {
  if (!css) {
    return IUI_PREFLIGHT_RULE;
  }
  if (css.includes(IUI_PREFLIGHT_RULE)) {
    return css;
  }
  return `${IUI_PREFLIGHT_RULE}\n${css}`;
}
