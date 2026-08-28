import test from "node:test";
import assert from "node:assert/strict";
import { minifyBuildCSS } from "../minify-build-css.mjs";

test("minifyBuildCSS strips comments and whitespace", () => {
  const input = `
    .flex {
      display: flex;
    }
    /* comment */
    .gap-4 { gap: 1rem; }
  `;
  const out = minifyBuildCSS(input);
  assert.ok(!out.includes("comment"));
  assert.ok(out.includes(".flex{display:flex}"));
  assert.ok(out.includes(".gap-4{gap:1rem}"));
});

test("minifyBuildCSS handles empty input", () => {
  assert.equal(minifyBuildCSS(""), "");
  assert.equal(minifyBuildCSS(null), "");
});

test("minifyBuildCSS preserves space-only custom property values", () => {
  const out = minifyBuildCSS(
    ".ring { --iui-ring-inset: ; --iui-ring-offset-width: 0px; box-shadow: var(--iui-ring-inset) 0 0 0 2px black; }",
  );
  assert.match(out, /--iui-ring-inset:\s;/);
  assert.ok(!out.includes("--iui-ring-inset:;"));
  assert.ok(out.includes("--iui-ring-offset-width:0px"));
});
