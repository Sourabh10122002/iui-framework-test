import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import {
  resolveBootstrapBridge,
  buildLegacyBootstrapShimSource,
  buildBootstrapBridgeShimSource,
  writeWebpackBootstrapShim,
} from "../bootstrap-bridge.mjs";

test("resolveBootstrapBridge prefers src/iui/bootstrap.ts", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-bridge-"));
  try {
    mkdirSync(join(root, "src", "iui"), { recursive: true });
    writeFileSync(join(root, "src", "iui", "bootstrap.ts"), 'import "x";\n');
    assert.equal(
      resolveBootstrapBridge(root),
      join(root, "src", "iui", "bootstrap.ts"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildLegacyBootstrapShimSource uses registerBootstrapState not __IUI_CONFIG__", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-legacy-shim-"));
  try {
    writeFileSync(
      join(root, "iui.config.ts"),
      "export default { theme: { direction: 'ltr' } };",
    );
    writeFileSync(
      join(root, "assets.config.json"),
      JSON.stringify({ icon: { library: "lucide" } }),
    );
    writeFileSync(
      join(root, "component.config.ts"),
      "export const componentConfig = { Button: {} };",
    );

    const source = buildLegacyBootstrapShimSource(root);
    assert.match(source, /registerBootstrapState/);
    assert.match(source, /mergeProjectConfig/);
    assert.match(source, /initFramework\(frameworkConfig\)/);
    assert.doesNotMatch(source, /__IUI_CONFIG__/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildBootstrapBridgeShimSource imports bootstrap bridge", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-bridge-shim-"));
  try {
    mkdirSync(join(root, "src", "iui"), { recursive: true });
    writeFileSync(join(root, "src", "iui", "bootstrap.ts"), 'import "x";\n');

    const source = buildBootstrapBridgeShimSource(root);
    assert.match(source, /bootstrap\.ts/);
    assert.doesNotMatch(source, /__IUI_CONFIG__/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeWebpackBootstrapShim writes .iui-bootstrap.js alias target", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-webpack-shim-"));
  try {
    mkdirSync(join(root, "src", "iui"), { recursive: true });
    writeFileSync(join(root, "src", "iui", "bootstrap.ts"), 'import "x";\n');

    const out = writeWebpackBootstrapShim(root);
    assert.equal(out, join(root, ".iui-bootstrap.js"));
    const code = fs.readFileSync(out, "utf8");
    assert.match(code, /bootstrap\.ts/);
    assert.doesNotMatch(code, /__IUI_CONFIG__/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
