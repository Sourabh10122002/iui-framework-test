import test from "node:test";
import assert from "node:assert/strict";
import {
  generateThemeInitScriptFromConfig,
  injectThemeInitScriptIntoHtml,
  hashThemeInitScript,
} from "../generate-theme-init-script.mjs";
import { injectBuildStylesIntoHtml } from "../inject-build-styles-into-html.mjs";

test("generateThemeInitScriptFromConfig returns inline IIFE", () => {
  const script = generateThemeInitScriptFromConfig({
    theme: {
      mode: { default: "light", allowSystem: false },
      direction: "ltr",
    },
  });
  assert.match(script, /dataset\.iuiThemeInit="1"/);
  assert.match(script, /localStorage\.getItem/);
});

test("injectThemeInitScriptIntoHtml places script right after <head>", () => {
  const script = generateThemeInitScriptFromConfig(null);
  const html = injectThemeInitScriptIntoHtml(
    "<!doctype html><html><head><title>x</title></head><body></body></html>",
    script,
  );
  assert.match(html, /<script id="iui-theme-init">/);
  assert.ok(html.indexOf("iui-theme-init") < html.indexOf("<title>"));
  assert.ok(html.indexOf("</head>") > html.indexOf("iui-theme-init"));
});

test("post-order Vite HTML: theme init before /@vite/client, build CSS before body", () => {
  const script = generateThemeInitScriptFromConfig(null);
  let html = `<!doctype html><html><head>
<script type="module" src="/@vite/client"></script>
<title>x</title>
</head><body><div id="root"></div></body></html>`;
  html = injectThemeInitScriptIntoHtml(html, script);
  html = injectBuildStylesIntoHtml(html, ".flex{display:flex}");
  assert.ok(
    html.indexOf("iui-theme-init") < html.indexOf("/@vite/client"),
    "theme init must precede Vite client (zero-FOUC contract)",
  );
  assert.ok(html.indexOf("data-iui-build") < html.indexOf("<body>"));
  assert.match(html, /<style data-iui-build>\.flex\{display:flex\}<\/style>/);
});

test("generateThemeInitScript paints boot background", () => {
  const script = generateThemeInitScriptFromConfig({
    theme: { mode: { default: "dark", allowSystem: false } },
  });
  assert.match(script, /backgroundColor/);
  assert.match(script, /data-iui-boot/);
  assert.match(script, /#030712/);
});

test("hashThemeInitScript returns 12-char hex", () => {
  const hash = hashThemeInitScript("test-script");
  assert.equal(hash.length, 12);
  assert.match(hash, /^[a-f0-9]+$/);
});
