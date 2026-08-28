import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import { join } from "path";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import {
  resolveBootstrapBridge,
  writeNextBootstrapShim,
} from "../create-bootstrap.mjs";

test("resolveBootstrapBridge prefers src/iui/bootstrap.ts", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-next-boot-"));
  try {
    mkdirSync(join(root, "src", "iui"), { recursive: true });
    writeFileSync(join(root, "src", "iui", "bootstrap.ts"), 'import "x";\n');
    mkdirSync(join(root, ".iui", "generated"), { recursive: true });
    writeFileSync(
      join(root, ".iui", "generated", "bootstrap.generated.tsx"),
      "export {};\n",
    );
    assert.equal(
      resolveBootstrapBridge(root),
      join(root, "src", "iui", "bootstrap.ts"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeNextBootstrapShim imports bootstrap bridge not __IUI_CONFIG__", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-next-shim-"));
  try {
    mkdirSync(join(root, "src", "iui"), { recursive: true });
    writeFileSync(
      join(root, "src", "iui", "bootstrap.ts"),
      '// @iui-managed\nimport "../../.iui/generated/bootstrap.generated";\n',
    );

    const out = writeNextBootstrapShim(root, { isServer: false });
    const code = fs.readFileSync(out, "utf8");

    assert.match(code, /bootstrap\.ts/);
    assert.match(code, /manifest\.js/);
    assert.doesNotMatch(code, /__IUI_CONFIG__/);
    assert.doesNotMatch(code, /iui\.config/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("writeNextBootstrapShim includes inline CSS import on cold server boot", () => {
  const root = mkdtempSync(join(tmpdir(), "iui-next-shim-srv-"));
  try {
    mkdirSync(join(root, "src", "iui"), { recursive: true });
    writeFileSync(join(root, "src", "iui", "bootstrap.ts"), 'import "x";\n');

    const out = writeNextBootstrapShim(root, { isServer: true });
    const code = fs.readFileSync(out, "utf8");
    assert.match(code, /styles\.inline\.js/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
