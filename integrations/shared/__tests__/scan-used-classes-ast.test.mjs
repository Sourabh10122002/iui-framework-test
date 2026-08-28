import test from "node:test";
import assert from "node:assert/strict";
import { extractClassesFromSourceAST } from "../scan-used-classes-ast.mjs";
import { extractClassesFromSource } from "../scan-used-classes.mjs";

const jsxSource = `
import { cn } from "@inventive-ui/framework";

export function Card({ active }) {
  return (
    <div className={cn("flex", active && "bg-primary-500", "p-4")}>
      <span className={"text-sm font-medium"}>Title</span>
    </div>
  );
}
`;

test("AST scanner finds cn() conditional classes", () => {
  const classes = extractClassesFromSourceAST(jsxSource, "Card.tsx");
  assert.ok(classes.has("flex"));
  assert.ok(classes.has("bg-primary-500"));
  assert.ok(classes.has("p-4"));
});

test("AST scanner finds JSX string literal className", () => {
  const classes = extractClassesFromSourceAST(jsxSource, "Card.tsx");
  assert.ok(classes.has("text-sm"));
  assert.ok(classes.has("font-medium"));
});

test("AST scanner finds exported class-string constants (logical end/start)", () => {
  const source = `
    /** Viewport-fixed TOC — logical inset (end), not physical right. */
    export const DOC_ON_THIS_PAGE_FIXED_CLASS =
      "fixed end-6 top-1/2 z-20 hidden w-10 -translate-y-1/2 lg:block";
    export const DOC_ON_THIS_PAGE_ASIDE_CLASS = "w-10";
    export const DOC_PROSE_IN_TOC_ROW_CLASS = "mx-auto min-w-0 w-full max-w-[80%]";
  `;
  const classes = extractClassesFromSourceAST(source, "docs-ui-constants.ts");
  assert.ok(classes.has("end-6"), "must scan logical end-* inset utilities");
  assert.ok(classes.has("fixed"));
  assert.ok(classes.has("top-1/2"));
  assert.ok(classes.has("-translate-y-1/2"));
  assert.ok(classes.has("lg:block"));
  assert.ok(classes.has("w-10"));
  assert.ok(classes.has("max-w-[80%]"));
  assert.equal(classes.has("right-6"), false);
  assert.equal(classes.has("left-6"), false);
});

test("AST scanner finds concatenated class-string constants", () => {
  const source = `
    export const GUTTER_X = "px-1 sm:px-6 lg:px-8";
    export const PANEL_STACK = "relative z-0 mt-8 min-w-0 " + GUTTER_X;
  `;
  const classes = extractClassesFromSourceAST(source, "tabs.ts");
  assert.ok(classes.has("px-1"));
  assert.ok(classes.has("sm:px-6"));
  assert.ok(classes.has("lg:px-8"));
  assert.ok(classes.has("relative"));
  assert.ok(classes.has("mt-8"));
});

test("full extractClassesFromSource picks TOC const used via className={const}", () => {
  const source = `
    export const DOC_ON_THIS_PAGE_FIXED_CLASS =
      "fixed end-6 top-1/2 z-20 hidden w-10 -translate-y-1/2 lg:block";
    export function TocAside() {
      return <aside className={DOC_ON_THIS_PAGE_FIXED_CLASS} />;
    }
  `;
  const classes = extractClassesFromSource(source, "DocsLayout.tsx");
  assert.ok(classes.has("end-6"));
  assert.ok(classes.has("lg:block"));
});
