import test from "node:test";
import assert from "node:assert/strict";
import { reorderHeadStylesBeforeModuleScripts } from "../reorder-head-assets.mjs";

test("reorderHeadStylesBeforeModuleScripts moves stylesheets before module scripts", () => {
  const html = `<!doctype html><html><head>
<script type="module" crossorigin src="/assets/index.js"></script>
<link rel="modulepreload" href="/assets/vendor.js">
<link rel="stylesheet" crossorigin href="/assets/vendor.css">
<link rel="stylesheet" crossorigin href="/assets/index.css">
<title>Docs</title>
</head><body></body></html>`;

  const out = reorderHeadStylesBeforeModuleScripts(html);
  const moduleIdx = out.indexOf('type="module"');
  const vendorCssIdx = out.indexOf("vendor.css");
  const indexCssIdx = out.indexOf("index.css");

  assert.ok(vendorCssIdx < moduleIdx, "vendor.css before module script");
  assert.ok(indexCssIdx < moduleIdx, "index.css before module script");
});

test("reorderHeadStylesBeforeModuleScripts is noop when styles already first", () => {
  const html = `<!doctype html><html><head>
<link rel="stylesheet" href="/a.css">
<script type="module" src="/index.js"></script>
</head><body></body></html>`;

  assert.equal(reorderHeadStylesBeforeModuleScripts(html), html);
});
