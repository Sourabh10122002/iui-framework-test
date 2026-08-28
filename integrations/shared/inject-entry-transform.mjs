import { existsSync } from "fs";
import { dirname, join, relative } from "path";

/** App entry files only — not nested barrel index.ts modules. */
const ENTRY_RE =
  /(?:^|[\\/])(?:src[\\/](?:main|index)|\.storybook[\\/]preview)\.(tsx?|jsx?|mts|mjs|cjs|js)$/;
const FRAMEWORK_ENTRY_RE =
  /@inventive-ui[\\/]framework[\\/]dist[\\/]index\.(esm\.)?js$/;

/**
 * Resolve a bootstrap bridge import path relative to the entry file being transformed.
 * @param {string} entryId
 * @param {string} projectRoot
 */
export function resolveBootstrapImportForEntry(entryId, projectRoot) {
  const bridgeTs = join(projectRoot, "src", "iui", "bootstrap.ts");
  const bridgeTsx = join(projectRoot, "src", "iui", "bootstrap.tsx");
  const bridgePath = existsSync(bridgeTs)
    ? bridgeTs
    : existsSync(bridgeTsx)
      ? bridgeTsx
      : null;
  if (!bridgePath) return undefined;

  let rel = relative(dirname(entryId), bridgePath).replace(/\\/g, "/");
  rel = rel.replace(/\.tsx?$/, "");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

/**
 * @param {string} id
 */
export function shouldInjectBuildImports(id) {
  const normalized = id.replace(/\\/g, "/");
  if (normalized.includes("node_modules") && !FRAMEWORK_ENTRY_RE.test(normalized)) {
    return ENTRY_RE.test(normalized);
  }
  return ENTRY_RE.test(normalized);
}

/**
 * @param {string} code
 * @param {{ stylesId?: string, manifestId?: string, bootstrapImport?: string }} [options]
 */
export function prependBuildImports(code, options = {}) {
  const stylesId = options.stylesId;
  const manifestId = options.manifestId ?? "iui-build-manifest";
  const bootstrapImport = options.bootstrapImport;

  const markerStyles = stylesId ? `import ${JSON.stringify(stylesId)};` : null;
  const markerManifest = `import ${JSON.stringify(manifestId)};`;
  const markerBootstrap = bootstrapImport
    ? `import ${JSON.stringify(bootstrapImport)};`
    : null;

  const hasBootstrap =
    !markerBootstrap ||
    code.includes(markerBootstrap) ||
    /iui\/bootstrap/.test(code);

  const hasStyles = !markerStyles || code.includes(markerStyles);

  if (hasStyles && code.includes(markerManifest) && hasBootstrap) {
    return null;
  }

  const lines = [];
  if (markerBootstrap && !hasBootstrap) lines.push(markerBootstrap);
  if (markerStyles && !hasStyles) lines.push(markerStyles);
  if (!code.includes(markerManifest)) lines.push(markerManifest);
  if (lines.length === 0) return null;
  return `${lines.join("\n")}\n${code}`;
}

/**
 * @param {import('vite').TransformResult | null | undefined} result
 * @param {string} code
 */
export function mergeTransformCode(result, code) {
  if (!result) return { code, map: null };
  if (typeof result === "string") return { code: result, map: null };
  return { code: result.code ?? code, map: null };
}
