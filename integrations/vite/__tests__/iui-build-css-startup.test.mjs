import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { iuiBuildCSSPlugin } from "../iui-css.mjs";

function makeFixture() {
  const root = mkdtempSync(join(tmpdir(), "iui-vite-cache-"));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({ name: "iui-fixture", private: true, type: "module" }, null, 2),
    "utf8",
  );
  writeFileSync(
    join(root, "iui.config.js"),
    `export default {
  theme: { mode: { default: "light", allowSystem: true }, direction: "ltr" },
  states: {},
  core: {},
  build: {
    safelist: [],
    packageSafelist: false,
    includeShadeMatrix: false,
    includeThemePresets: true,
    resolvePalettePatterns: true,
    includeArbitraryScan: true,
    minify: true,
    useAst: true
  }
};`,
    "utf8",
  );
  writeFileSync(
    join(root, "src", "main.tsx"),
    `export function App() {
  return <div className="flex items-center gap-2 text-brand-500">Hello</div>;
}
`,
    "utf8",
  );
  return root;
}

function runServeStartup(root) {
  const plugin = iuiBuildCSSPlugin({ root });
  plugin.config({ root }, { command: "serve" });
  plugin.configResolved({ root, command: "serve" });
  return plugin;
}

test("valid cache path performs zero full regenerations on next startup", () => {
  const root = makeFixture();
  try {
    const first = runServeStartup(root);
    assert.equal(first.__iuiDebug.fullRegenerations, 1);
    assert.equal(first.__iuiDebug.warmCacheHits, 0);

    const second = runServeStartup(root);
    assert.equal(second.__iuiDebug.fullRegenerations, 0);
    assert.equal(second.__iuiDebug.warmCacheHits, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("cache invalidation performs one controlled full regeneration", () => {
  const root = makeFixture();
  try {
    runServeStartup(root);
    writeFileSync(
      join(root, "src", "main.tsx"),
      `export function App() {
  return <div className="flex items-center gap-2 text-brand-500 bg-red-500">Hello</div>;
}
`,
      "utf8",
    );

    const next = runServeStartup(root);
    assert.equal(next.__iuiDebug.fullRegenerations, 1);
    assert.equal(next.__iuiDebug.warmCacheHits, 0);
    assert.equal(next.__iuiDebug.warmCacheMisses, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("unrelated source edits do not trigger CSS regeneration work", () => {
  const root = makeFixture();
  try {
    const plugin = runServeStartup(root);
    const mainFile = join(root, "src", "main.tsx");
    const before = readFileSync(mainFile, "utf8");
    writeFileSync(mainFile, `${before}\n// unrelated edit: class list unchanged\n`, "utf8");

    const sent = [];
    const result = plugin.handleHotUpdate({
      file: mainFile,
      server: {
        watcher: { unwatch() {} },
        ws: { send(payload) { sent.push(payload); } },
      },
    });

    assert.equal(result, undefined);
    assert.equal(plugin.__iuiDebug.skippedNoClassChange, 1);
    assert.equal(plugin.__iuiDebug.incrementalRegenerations, 0);
    assert.equal(sent.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
