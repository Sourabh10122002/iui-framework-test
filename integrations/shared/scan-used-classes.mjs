import { readFileSync } from "fs";
import { listScanFiles } from "./scan-source-utils.mjs";
import { extractClassesFromSourceAST } from "./scan-used-classes-ast.mjs";
import { addFilteredClassTokens } from "./utility-token-filter.mjs";

const CLASSNAME_ATTR_RE =
  /(?:className|class)\s*=\s*(?:\{)?["'`]([^"'`]+)["'`]/g;

/** Match full `cn(...)` arg lists. Keep a high ceiling so generated scanner
 *  modules (many string literals per call) are not silently truncated; AST
 *  remains the primary extractor when `useAst` is on. */
const CN_LIKE_CALL_RE =
  /\b(?:cn|cx|iuimerge|clsx|cva)\(\s*([^)]{1,12000}?)\)/g;

const STRING_LITERAL_RE = /["'`]([^"'`\\]*(?:\\.[^"'`]*)*)["'`]/g;

const TEMPLATE_STATIC_SEGMENT_RE = /`([^${}]*?)`/g;

/**
 * @param {Set<string>} set
 * @param {string} raw
 */
function addClassTokens(set, raw) {
  addFilteredClassTokens(set, raw);
}

/**
 * @param {string} content
 * @param {string} [filename]
 * @param {{ useAst?: boolean, onDiagnostic?: (diagnostic: Record<string, unknown>) => void }} [options]
 * @returns {Set<string> & { diagnostics?: Record<string, unknown>[] }}
 */
export function extractClassesFromSource(content, filename, options = {}) {
  const classes = extractClassesFromSourceRegex(content);

  if (options.useAst !== false) {
    const astClasses = extractClassesFromSourceAST(content, filename, options);
    for (const cls of astClasses) {
      classes.add(cls);
    }
    Object.defineProperty(classes, "diagnostics", {
      value: astClasses.diagnostics ?? [],
      enumerable: false,
    });
  }

  return classes;
}

/**
 * Regex-based extraction (M1–M3).
 * @param {string} content
 * @returns {Set<string>}
 */
function extractClassesFromSourceRegex(content) {
  const classes = new Set();

  CLASSNAME_ATTR_RE.lastIndex = 0;
  let match;
  while ((match = CLASSNAME_ATTR_RE.exec(content)) !== null) {
    addClassTokens(classes, match[1]);
  }

  CN_LIKE_CALL_RE.lastIndex = 0;
  while ((match = CN_LIKE_CALL_RE.exec(content)) !== null) {
    const argsBlock = match[1];
    STRING_LITERAL_RE.lastIndex = 0;
    let strMatch;
    while ((strMatch = STRING_LITERAL_RE.exec(argsBlock)) !== null) {
      addClassTokens(classes, strMatch[1]);
    }
  }

  TEMPLATE_STATIC_SEGMENT_RE.lastIndex = 0;
  while ((match = TEMPLATE_STATIC_SEGMENT_RE.exec(content)) !== null) {
    addClassTokens(classes, match[1]);
  }

  return classes;
}

/**
 * @param {string} projectRoot
 * @param {import('./scan-source-utils.mjs').ScanWalkOptions & { scanPackages?: string[], safelist?: string[], useAst?: boolean, includeArbitraryScan?: boolean, includePalettePatternScan?: boolean, shadeDiagnostics?: "warn" | "error" | "silent" }} [options]
 */
export function scanUsedClasses(projectRoot, options = {}) {
  const fileMap = new Map();
  const classes = new Set(options.safelist ?? []);
  const diagnostics = [];
  const useAst = options.useAst;

  for (const file of listScanFiles(projectRoot, options)) {
    const content = readFileSync(file, "utf8");
    const found = extractClassesFromSource(content, file, {
      useAst,
      onDiagnostic(diagnostic) {
        diagnostics.push(diagnostic);
      },
    });
    if (found.size === 0) continue;

    fileMap.set(file, found);
    for (const cls of found) {
      classes.add(cls);
    }
  }

  diagnostics.sort(
    (a, b) =>
      String(a.filename).localeCompare(String(b.filename)) ||
      Number(a.line) - Number(b.line) ||
      String(a.method).localeCompare(String(b.method)) ||
      String(a.reason).localeCompare(String(b.reason)),
  );
  const diagnosticMode = options.shadeDiagnostics ?? "warn";
  if (diagnostics.length > 0 && diagnosticMode === "error") {
    throw new Error(diagnostics.map((diagnostic) => diagnostic.message).join("\n"));
  }
  if (diagnosticMode === "warn") {
    for (const diagnostic of diagnostics) {
      console.warn(diagnostic.message);
    }
  }

  const sortedClasses = new Set([...classes].sort());
  const sortedFileMap = new Map(
    [...fileMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([file, found]) => [file, new Set([...found].sort())]),
  );

  return {
    classes: sortedClasses,
    fileMap: sortedFileMap,
    diagnostics,
    scannedAt: Date.now(),
    fileCount: fileMap.size,
    classCount: sortedClasses.size,
  };
}

export { extractClassesFromSource as extractClassesFromContent };
