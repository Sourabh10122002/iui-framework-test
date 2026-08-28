import assert from "node:assert/strict";
import test from "node:test";
import { injectBuildStylesIntoHtml } from "../inject-build-styles-into-html.mjs";
import { injectBuildStylesLinkIntoHtml } from "../inject-build-styles-into-html.mjs";

test("injectBuildStylesIntoHtml places style before </head>", () => {
  const html = "<html><head><title>x</title></head><body></body></html>";
  const out = injectBuildStylesIntoHtml(html, ".flex{display:flex}");
  assert.match(out, /<style data-iui-build>/);
  assert.match(out, /\.flex\{display:flex\}/);
  assert.ok(out.indexOf("data-iui-build") < out.indexOf("<body>"));
});

test("injectBuildStylesIntoHtml replaces existing build style tag", () => {
  const html =
    '<html><head><style data-iui-build>.a{color:red}</style></head><body></body></html>';
  const out = injectBuildStylesIntoHtml(html, ".b{color:blue}");
  assert.match(out, /\.b\{color:blue\}/);
  assert.doesNotMatch(out, /\.a\{color:red\}/);
});

test("injectBuildStylesLinkIntoHtml places stylesheet before </head>", () => {
  const html = "<html><head><title>x</title></head><body></body></html>";
  const out = injectBuildStylesLinkIntoHtml(
    html,
    "/.iui/cache/styles.css?v=abc123",
  );
  assert.match(out, /<link rel="stylesheet"[^>]*data-iui-build/);
  assert.match(out, /href="\/\.iui\/cache\/styles\.css\?v=abc123"/);
});
