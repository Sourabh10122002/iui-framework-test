import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { createJiti } from "jiti";

const scriptsDir = join(dirname(fileURLToPath(import.meta.url)), "..");

test("load-framework-theme-defaults reads contract from published layout", () => {
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const loader = jiti(join(scriptsDir, "load-framework-theme-defaults.mjs"));

  const defaults = loader.loadFrameworkThemeDefaults(scriptsDir);

  assert.equal(defaults.brand, "#6366f1");
  assert.equal(defaults.neutral, "#64748b");
  assert.equal(defaults.semantic.success, "#22c55e");
  assert.equal(defaults.accent.white, "#ffffff");
  assert.equal(defaults.accent.black, "#000000");
});

test("buildThemeScaffoldConfig documents optional shellBoot (derived from neutral when omitted)", () => {
  const jiti = createJiti(import.meta.url, { interopDefault: true });
  const loader = jiti(join(scriptsDir, "load-framework-theme-defaults.mjs"));
  const defaults = loader.loadFrameworkThemeDefaults(scriptsDir);
  const source = loader.buildThemeScaffoldConfig(defaults, { configType: "IUIConfig" });

  assert.match(source, /shellBoot/);
  assert.match(source, /neutral\.set/);
  assert.match(source, /includeThemeGrayScale:\s*true/);
  assert.doesNotMatch(source, /neutral\.base/);
  assert.doesNotMatch(source, /buildDocsShellBoot/);
  assert.doesNotMatch(source, /docs-theme/);
});
