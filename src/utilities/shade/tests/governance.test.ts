import fs from "node:fs";
import path from "node:path";

const COMPONENTS_ROOT = path.resolve(__dirname, "../../../components");
const ALLOWED_CORE_IMPORTS = new Set([
  "dimensions",
  "palette-classify",
]);

const collectTsFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
};

describe("shade governance", () => {
  test("components do not import shade/core modules directly", () => {
    if (!fs.existsSync(COMPONENTS_ROOT)) {
      return;
    }

    const violations: string[] = [];
    const importPattern =
      /from\s+["'](?:\.\.\/)+utilities\/shade\/core\/([^"']+)["']/g;

    for (const file of collectTsFiles(COMPONENTS_ROOT)) {
      const content = fs.readFileSync(file, "utf8");
      for (const match of content.matchAll(importPattern)) {
        const moduleName = match[1]?.replace(/\.(ts|tsx)$/, "") ?? "";
        if (!ALLOWED_CORE_IMPORTS.has(moduleName)) {
          violations.push(`${path.relative(COMPONENTS_ROOT, file)} -> shade/core/${moduleName}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
