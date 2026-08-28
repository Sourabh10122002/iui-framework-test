import { test } from "node:test";
import assert from "node:assert/strict";
import { transformAssetDistModule } from "../slot-transform.cjs";

const SAMPLE = `
import { useLayoutEffect, useState } from "react";
const componentCache = new Map();
export function useDynamicStaticIcon(name) {
  import(\`./icons/\${name.trim()}.js\`)
    .then((mod) => mod.default);
}
`;

test("catalog glob fallback injects import.meta.glob for production catalogs", () => {
  const registry = new Map([["material-symbols", new Set(["./icons/add.js"])]]);
  const out = transformAssetDistModule(SAMPLE, "material-symbols", registry, {
    catalogGlobFallback: true,
  });

  assert.ok(out);
  assert.match(out, /import\.meta\.glob\("\.\/icons\/\*\.js"/);
  assert.match(out, /__iuiSlotMaterialSymbolsGlob\[_k\]/);
});

test("external runtime fallback loads glyphs from public asset base", () => {
  const registry = new Map([["icons-lucide", new Set(["./icons/star.js"])]]);
  const out = transformAssetDistModule(SAMPLE, "icons-lucide", registry, {
    assetRuntimeExternal: "/iui-assets",
  });

  assert.ok(out);
  assert.doesNotMatch(out, /import\.meta\.glob/);
  assert.match(
    out,
    /import\(\/\* @vite-ignore \*\/ `\/iui-assets\/icons-lucide\/icons\/\$\{/,
  );
  assert.match(out, /\?\? \(\(\) => import\(\/\* @vite-ignore \*\//);
});

test("default fallback wraps dynamic import as loader thunk", () => {
  const registry = new Map([["material-symbols", new Set(["./icons/add.js"])]]);
  const out = transformAssetDistModule(SAMPLE, "material-symbols", registry, {
    catalogGlobFallback: false,
  });

  assert.ok(out);
  assert.doesNotMatch(out, /import\.meta\.glob/);
  assert.match(out, /\?\? \(\(\) => import\(`\.\/icons\/\$\{/);
});
