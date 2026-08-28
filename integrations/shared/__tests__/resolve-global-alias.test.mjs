import test from "node:test";
import assert from "node:assert/strict";
import { resolveGlobalAlias } from "../resolve-global-alias.mjs";

test("resolveGlobalAlias returns literal names unchanged", () => {
  assert.equal(resolveGlobalAlias("check", { check: "done" }), "check");
});

test("resolveGlobalAlias resolves mapped @alias", () => {
  assert.equal(resolveGlobalAlias("@menu", { menu: "menu" }), "menu");
});

test("resolveGlobalAlias returns null for unmapped @alias", () => {
  assert.equal(resolveGlobalAlias("@missing", { menu: "menu" }), null);
});

test("resolveGlobalAlias normalizes hyphenated alias keys", () => {
  assert.equal(resolveGlobalAlias("@check-circle", { check_circle: "check_circle" }), "check_circle");
});
