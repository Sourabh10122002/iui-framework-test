/**
 * Lightweight CSS minifier for compile-first build output (Node-only).
 * Strips comments and redundant whitespace — no PostCSS required.
 *
 * @param {string} css
 * @returns {string}
 */
export function minifyBuildCSS(css) {
  if (!css || typeof css !== "string") return "";

  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s*,\s*/g, ",")
    .replace(/;}/g, "}")
    // Space-only custom properties (e.g. --iui-ring-inset: ) must stay valid.
    // `:\s*` above collapses `--foo: ;` to `--foo:;`, which is invalid at
    // computed-value time and drops the entire ring box-shadow.
    .replace(/(--[\w-]+):(?=[;}])/g, "$1: ")
    .trim();
}
