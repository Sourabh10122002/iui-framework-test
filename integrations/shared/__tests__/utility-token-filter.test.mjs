import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  isStaticUtilityToken,
  hasInvalidUtilitySyntax,
  UTILITY_TOKEN_PREFIXES,
} from "../utility-token-filter.mjs";
import {
  collectUtilityPrefixesFromEngine,
  formatGeneratedModule,
} from "../../../scripts/extract-utility-prefixes.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

test("generated-utility-prefixes.mjs stays in sync with the engine", () => {
  const fresh = formatGeneratedModule(collectUtilityPrefixesFromEngine());
  const onDisk = readFileSync(
    join(root, "integrations/shared/generated-utility-prefixes.mjs"),
    "utf8",
  );
  assert.equal(
    onDisk,
    fresh,
    "Run: node scripts/extract-utility-prefixes.mjs",
  );
});

test("engine first-segments are covered by the generated prefix allowlist", () => {
  const { prefixes } = collectUtilityPrefixesFromEngine();
  const allow = new Set(UTILITY_TOKEN_PREFIXES);
  for (const p of prefixes) {
    assert.ok(allow.has(p), `missing generated prefix: ${p}`);
  }
});

test("rejects Storybook titles and prose slash paths", () => {
  assert.equal(isStaticUtilityToken("Components/Alert"), false);
  assert.equal(isStaticUtilityToken("leading/prefix"), false);
  assert.equal(isStaticUtilityToken("close/dismiss"), false);
  assert.equal(isStaticUtilityToken("background/initials"), false);
});

test("rejects bare prefixes and incomplete utilities", () => {
  assert.equal(isStaticUtilityToken("text"), false);
  assert.equal(isStaticUtilityToken("bg"), false);
  assert.equal(isStaticUtilityToken("hover:bg"), false);
  assert.equal(isStaticUtilityToken("font-"), false);
  assert.equal(isStaticUtilityToken("gap-"), false);
  assert.equal(isStaticUtilityToken("[Button]"), false);
  assert.equal(isStaticUtilityToken("hover:outline-offset-[...]"), false);
});

test("accepts real utilities including opacity and arbitrary", () => {
  assert.equal(isStaticUtilityToken("flex"), true);
  assert.equal(isStaticUtilityToken("items-center"), true);
  assert.equal(isStaticUtilityToken("bg-red-500/50"), true);
  assert.equal(isStaticUtilityToken("outline-white/40"), true);
  assert.equal(isStaticUtilityToken("w-1/2"), true);
  assert.equal(isStaticUtilityToken("dark:bg-[#141414]"), true);
  assert.equal(isStaticUtilityToken("hover:outline-offset-[-1px]"), true);
  assert.equal(isStaticUtilityToken("flex-shrink-0"), true);
  assert.equal(isStaticUtilityToken("font-normal"), true);
  assert.equal(isStaticUtilityToken("md:text-left"), true);
});

test("accepts size arbitrary and CSS-var paren shorthand", () => {
  assert.equal(isStaticUtilityToken("w-[123px]"), true);
  assert.equal(isStaticUtilityToken("h-[50%]"), true);
  assert.equal(isStaticUtilityToken("min-w-[10rem]"), true);
  assert.equal(isStaticUtilityToken("max-h-[80vh]"), true);
  assert.equal(isStaticUtilityToken("w-(--my-width)"), true);
  assert.equal(isStaticUtilityToken("h-(--my-height)"), true);
  assert.equal(isStaticUtilityToken("dark:w-(--panel-w)"), true);
});

test("accepts background-image arbitrary utilities with url()", () => {
  assert.equal(isStaticUtilityToken("bg-[url(/img.png)]"), true);
  assert.equal(isStaticUtilityToken("bg-[url(./img.png)]"), true);
  assert.equal(isStaticUtilityToken("bg-[url(../img.png)]"), true);
  assert.equal(
    isStaticUtilityToken("bg-[url(https://example.com/img.png)]"),
    true,
  );
  assert.equal(
    isStaticUtilityToken("bg-[url('https://example.com/img.png')]"),
    true,
  );
  assert.equal(
    isStaticUtilityToken("dark:bg-[url(https://cdn.example.com/bg.webp)]"),
    true,
  );
});

test("accepts engine families historically missed by hand lists", () => {
  assert.equal(isStaticUtilityToken("columns-2"), true);
  assert.equal(isStaticUtilityToken("scroll-m-4"), true);
  assert.equal(isStaticUtilityToken("scroll-px-2"), true);
  assert.equal(isStaticUtilityToken("from-red-500"), true);
  assert.equal(isStaticUtilityToken("via-blue-500"), true);
  assert.equal(isStaticUtilityToken("to-transparent"), true);
  assert.equal(isStaticUtilityToken("auto-cols-fr"), true);
  assert.equal(isStaticUtilityToken("auto-rows-min"), true);
  assert.equal(isStaticUtilityToken("place-content-center"), true);
  assert.equal(isStaticUtilityToken("backdrop-blur-sm"), true);
});

test("accepts data/aria variants used by interactive UI", () => {
  assert.equal(isStaticUtilityToken("data-[state=open]:bg-white"), true);
  assert.equal(isStaticUtilityToken("aria-[pressed=true]:text-zinc-900"), true);
  assert.equal(isStaticUtilityToken("group-data-[active=true]:scale-100"), true);
  assert.equal(isStaticUtilityToken("peer-data-[state=checked]:opacity-100"), true);
});

test("rejects incomplete axis utilities and placement enums", () => {
  assert.equal(isStaticUtilityToken("grid-cols"), false);
  assert.equal(isStaticUtilityToken("overflow-x"), false);
  assert.equal(isStaticUtilityToken("space-x"), false);
  assert.equal(isStaticUtilityToken("inset-start"), false);
  assert.equal(isStaticUtilityToken("inset-end"), false);
  assert.equal(isStaticUtilityToken("top-start"), false);
  assert.equal(isStaticUtilityToken("flex-column"), false);
  assert.equal(isStaticUtilityToken("rounded-*"), false);
});

test("accepts radius / layout utilities used by components", () => {
  assert.equal(isStaticUtilityToken("rounded-s-none"), true);
  assert.equal(isStaticUtilityToken("rounded-e-md"), true);
  assert.equal(isStaticUtilityToken("rounded-l-none"), true); // physical alias still extractable
  assert.equal(isStaticUtilityToken("rounded-0.25"), true);
  assert.equal(isStaticUtilityToken("rounded-5"), true);
  assert.equal(isStaticUtilityToken("font-inherit"), true);
  assert.equal(isStaticUtilityToken("shadow-black-800"), true);
  assert.equal(isStaticUtilityToken("transition-[height]"), true);
  assert.equal(isStaticUtilityToken("start-[-2px]"), true);
  assert.equal(isStaticUtilityToken("dark:border-e-[#0B0F19]"), true);
});

test("logical inset/spacing use start/end and s/e — not left/right or l/r", () => {
  // Positioning (inset-inline-*)
  assert.equal(isStaticUtilityToken("end-6"), true);
  assert.equal(isStaticUtilityToken("start-6"), true);
  assert.equal(isStaticUtilityToken("-end-6"), true);
  assert.equal(isStaticUtilityToken("sm:end-6"), true);
  assert.equal(isStaticUtilityToken("left-6"), false);
  assert.equal(isStaticUtilityToken("right-6"), false);
  // Spacing / border shorthand (inline-start / inline-end)
  assert.equal(isStaticUtilityToken("ps-4"), true);
  assert.equal(isStaticUtilityToken("pe-6"), true);
  assert.equal(isStaticUtilityToken("ms-2"), true);
  assert.equal(isStaticUtilityToken("me-4"), true);
  assert.equal(isStaticUtilityToken("border-e-2"), true);
  assert.equal(isStaticUtilityToken("pl-4"), false);
  assert.equal(isStaticUtilityToken("pr-6"), false);
  assert.equal(isStaticUtilityToken("ml-2"), false);
  assert.equal(isStaticUtilityToken("mr-4"), false);
});

test("accepts multi-column utilities", () => {
  assert.equal(isStaticUtilityToken("columns-1"), true);
  assert.equal(isStaticUtilityToken("columns-2"), true);
  assert.equal(isStaticUtilityToken("columns-2xs"), true);
  assert.equal(isStaticUtilityToken("column-fill-auto"), true);
  assert.equal(isStaticUtilityToken("column-fill-balance"), true);
  assert.equal(isStaticUtilityToken("column-rule-thin"), true);
  assert.equal(isStaticUtilityToken("column-rule-type-solid"), true);
  assert.equal(isStaticUtilityToken("column-rule-color-zinc-300"), true);
  assert.equal(isStaticUtilityToken("column-width-md"), true);
  assert.equal(isStaticUtilityToken("col-span-full"), true);
  assert.equal(isStaticUtilityToken("col-span-2"), true);
  assert.equal(isStaticUtilityToken("col-span-all"), false);
});

test("rejects documentation placeholders and non-utility identifiers", () => {
  assert.equal(isStaticUtilityToken("mask-[<value>]"), false);
  assert.equal(isStaticUtilityToken("col-start-N"), false);
  assert.equal(isStaticUtilityToken("transition-property"), false);
  assert.equal(isStaticUtilityToken("inline-message-description"), false);
  assert.equal(isStaticUtilityToken("min-width"), false);
  assert.equal(isStaticUtilityToken("column-w-md"), false);
  assert.equal(isStaticUtilityToken("column-rule-solid"), false);
  assert.equal(isStaticUtilityToken("column-rule-zinc-300"), false);
  assert.equal(isStaticUtilityToken("max-h-*"), false);
  assert.equal(isStaticUtilityToken("gap-child-0"), false);
  assert.equal(isStaticUtilityToken("font-italic"), false);
  assert.equal(isStaticUtilityToken("shadow-l-md"), false);
  assert.equal(isStaticUtilityToken("writing-mode"), false);
  assert.equal(isStaticUtilityToken("has-[:checked]"), false);
});

test("rejects named group markers (no CSS)", () => {
  assert.equal(isStaticUtilityToken("group/checkbox"), false);
});

test("hasInvalidUtilitySyntax catches polluted scan tokens", () => {
  assert.equal(hasInvalidUtilitySyntax('border-transparent";'), true);
  assert.equal(hasInvalidUtilitySyntax("gap-1.5"), false);
});
