import test from "node:test";
import assert from "node:assert/strict";
import { assertValidGeneratedCss } from "../validate-build-css.mjs";

test("assertValidGeneratedCss accepts well-formed utilities", () => {
  assert.doesNotThrow(() =>
    assertValidGeneratedCss(`
:root { --iui-color-brand-500: #6366f1; }
.bg-brand-500 { background-color: var(--iui-color-brand-500); }
.bg-success-500 { background-color: var(--iui-color-success-500); }
`),
  );
});

test("assertValidGeneratedCss rejects polluted var() quotes", () => {
  assert.throws(
    () =>
      assertValidGeneratedCss(`
.border-transparent {
  border-color: var(--iui-color-transparent";);
}
`),
    /custom property reference contains a quote|failed to parse/i,
  );
});

test("assertValidGeneratedCss rejects polluted selectors", () => {
  assert.throws(
    () =>
      assertValidGeneratedCss(`
.border-transparent\\"\\; {
  border-color: transparent;
}
`),
    /escaped quote|failed to parse/i,
  );
});

test("assertValidGeneratedCss allows quotes inside arbitrary \\[...\\] segments", () => {
  assert.doesNotThrow(() =>
    assertValidGeneratedCss(`
.font-features-\\[\\'smcp\\'\\,\\'onum\\'\\] {
  font-feature-settings: "smcp" 1, "onum" 1;
}
`),
  );
});

test("assertValidGeneratedCss allows @counter-style symbol literals with plus", () => {
  assert.doesNotThrow(() =>
    assertValidGeneratedCss(`
@counter-style iui-ul-plus {
  system: cyclic;
  symbols: "+";
  pad: 3 "\\A0";
  suffix: " ";
}
.list-plus { list-style-type: iui-ul-plus; }
`),
  );
});
