import { readFileSync } from "fs";
import { listScanFiles } from "./scan-source-utils.mjs";

const ARBITRARY_TOKEN = /(?:^|\s)(!?[a-zA-Z0-9:_-]+\[[^\]]+\])/g;
const ARBITRARY_IN_STRING_RE = /["'`](!?[a-zA-Z0-9:_-]+\[[^\]]+\])["'`]/g;

/**
 * @param {string} content
 * @param {Set<string>} classes
 */
function collectArbitraryFromContent(content, classes) {
  ARBITRARY_TOKEN.lastIndex = 0;
  let match;
  while ((match = ARBITRARY_TOKEN.exec(content)) !== null) {
    const token = match[1]?.trim();
    if (token && isStaticArbitraryToken(token)) {
      classes.add(token);
    }
  }

  ARBITRARY_IN_STRING_RE.lastIndex = 0;
  while ((match = ARBITRARY_IN_STRING_RE.exec(content)) !== null) {
    const token = match[1]?.trim();
    if (token && isStaticArbitraryToken(token)) {
      classes.add(token);
    }
  }
}

/**
 * @param {string} token
 */
function isStaticArbitraryToken(token) {
  if (!token) return false;
  if (token.includes("${") || token.includes("`")) return false;
  return token.includes("[") && token.includes("]");
}

/**
 * Full-file regex scan for arbitrary utility tokens (w-[120px], bg-[#fff]).
 *
 * @param {string} projectRoot
 * @param {import('./scan-source-utils.mjs').ScanWalkOptions} [options]
 * @returns {Set<string>}
 */
export function scanArbitraryClasses(projectRoot, options = {}) {
  const classes = new Set();

  for (const file of listScanFiles(projectRoot, options)) {
    const content = readFileSync(file, "utf8");
    collectArbitraryFromContent(content, classes);
  }

  return classes;
}
