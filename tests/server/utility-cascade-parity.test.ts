/**
 * @jest-environment node
 *
 * Tailwind cascade parity: utilities that share a CSS property must emit in
 * source order so modifiers override presets/shorthands (same specificity).
 * Batch-optimized builds merge selectors by property signature — emission order
 * is re-sorted in the optimizer (see propertyGroupCascadeEmissionRank).
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";

const baseConfig = {
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig;

/** Noise classes so batch optimizer runs (mirrors large docs builds). */
const FILLER = [
  "flex",
  "grid",
  "hidden",
  "block",
  "inline",
  "relative",
  "absolute",
  "fixed",
  "sticky",
  "static",
  "overflow-hidden",
  "overflow-auto",
  "truncate",
  "whitespace-nowrap",
  "text-sm",
  "text-lg",
  "text-xl",
  "text-2xl",
  "font-bold",
  "font-medium",
  "tracking-wide",
  "uppercase",
  "capitalize",
  "text-center",
  "text-start",
  "bg-red-500",
  "bg-blue-500",
  "text-white",
  "text-black",
  "border",
  "border-2",
  "border-red-500",
  "rounded",
  "rounded-md",
  "rounded-lg",
  "shadow",
  "shadow-md",
  "shadow-lg",
  "opacity-50",
  "opacity-75",
  "z-10",
  "z-20",
  "w-full",
  "h-full",
  "min-h-0",
  "max-w-xl",
  "gap-4",
  "gap-x-2",
  "p-2",
  "p-4",
  "px-4",
  "py-2",
  "m-2",
  "mx-auto",
  "mt-4",
  "mb-4",
  "inset-0",
  "top-0",
  "left-0",
  "translate-x-0",
  "scale-100",
  "rotate-0",
  "transition",
  "transition-colors",
  "duration-300",
  "ease-in-out",
  "animate-spin",
  "underline",
  "line-through",
  "decoration-brand-500",
  "decoration-2",
  "ring",
  "ring-2",
  "ring-offset-2",
  "divide-y",
  "divide-x",
  "divide-dashed",
  "space-y-4",
  "space-x-2",
  "from-blue-500",
  "to-pink-500",
  "via-violet-500",
  "bg-gradient-to-r",
  "list-disc",
  "list-inside",
  "cursor-pointer",
  "select-none",
  "pointer-events-none",
  "sr-only",
  "not-sr-only",
  "aspect-square",
  "object-cover",
  "object-center",
  "fill-current",
  "stroke-current",
  "backdrop-blur",
  "blur",
  "brightness-100",
  "contrast-100",
  "grayscale",
  "invert",
  "saturate-100",
  "sepia",
  "hue-rotate-0",
  "drop-shadow",
  "columns-2",
  "break-all",
  "hyphens-auto",
  "indent-4",
  "align-middle",
  "vertical-align-top",
  "table-auto",
  "border-collapse",
  "caption-top",
  "resize",
  "scroll-smooth",
  "snap-x",
  "snap-mandatory",
  "touch-pan-x",
  "will-change-transform",
  "content-center",
  "items-center",
  "justify-center",
  "self-center",
  "place-content-center",
  "order-1",
  "order-2",
  "grow",
  "shrink",
  "basis-auto",
  "flex-col",
  "flex-row",
  "flex-wrap",
  "grid-cols-2",
  "grid-rows-2",
  "col-span-2",
  "row-span-2",
  "auto-cols-auto",
  "auto-rows-auto",
];

function ruleIndex(css: string, className: string): number {
  const esc = className.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const patterns = [
    new RegExp(`\\.${esc}\\s*\\{`),
    new RegExp(`\\.${esc}(?:[^{,]|\\[[^\\]]*\\])*,`),
    new RegExp(`\\.${esc}:`),
  ];
  for (const re of patterns) {
    const m = css.match(re);
    if (m?.index != null) return m.index;
  }
  return -1;
}

/** Loser must appear earlier in the stylesheet; winner overrides at equal specificity. */
function expectCascadeOrder(
  css: string,
  loser: string,
  winner: string,
  options?: { childCombinator?: boolean },
): void {
  const loserIdx = options?.childCombinator
    ? childRuleIndex(css, loser)
    : ruleIndex(css, loser);
  const winnerIdx = options?.childCombinator
    ? childRuleIndex(css, winner)
    : ruleIndex(css, winner);
  expect(loserIdx).toBeGreaterThanOrEqual(0);
  expect(winnerIdx).toBeGreaterThanOrEqual(0);
  expect(loserIdx).toBeLessThan(winnerIdx);
}

function childRuleIndex(css: string, className: string): number {
  const esc = className.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const m = css.match(
    new RegExp(`\\.${esc}\\s*>\\s*\\*\\s*\\+\\s*\\*\\s*\\{`),
  );
  return m?.index ?? -1;
}

function buildWithFiller(...focus: string[]): string {
  const result = generateBuildCSS([...FILLER, ...focus], baseConfig);
  return result.utilitiesCSS;
}

describe("utility cascade parity (Tailwind standard)", () => {
  describe("spacing shorthands — preset before side override", () => {
    it.each([
      ["m-4", "mt-0"],
      ["p-4", "pt-0"],
      ["scroll-m-4", "scroll-mt-0"],
      ["scroll-p-4", "scroll-pt-0"],
    ] as const)("%s before %s", (shorthand, side) => {
      const css = buildWithFiller(shorthand, side);
      expectCascadeOrder(css, shorthand, side);
    });
  });

  describe("border — shorthand before per-side longhand", () => {
    it.each([
      ["border", "border-t-0"],
      ["border-2", "border-t-0"],
      ["border-red-500", "border-t-red-500"],
    ] as const)("%s before %s", (shorthand, side) => {
      const css = buildWithFiller(shorthand, side);
      expectCascadeOrder(css, shorthand, side);
    });
  });

  describe("typography — bundled preset before modifier", () => {
    it.each([
      ["text-base", "leading-snug"],
      ["text-base", "leading-none"],
      ["text-lg", "leading-relaxed"],
    ] as const)("%s before %s", (fontSize, leading) => {
      const css = buildWithFiller(fontSize, leading);
      expectCascadeOrder(css, fontSize, leading);
    });

    it.each([
      ["underline", "decoration-solid"],
      ["underline", "decoration-brand-500"],
      ["underline", "decoration-2"],
    ] as const)("%s before %s", (line, modifier) => {
      const css = buildWithFiller(line, modifier);
      expectCascadeOrder(css, line, modifier);
    });
  });

  describe("animation — preset before duration/ease modifiers", () => {
    it.each([
      ["animate-fade-in", "animate-ease-linear"],
      ["animate-fade-in", "animate-duration-1000"],
      ["animate-spin", "animate-duration-1000"],
    ] as const)("%s before %s", (preset, modifier) => {
      const css = buildWithFiller(preset, modifier);
      expectCascadeOrder(css, preset, modifier);
    });
  });

  describe("ring + shadow — variable composition (order-independent)", () => {
    it("ring and shadow-sm both use the composed box-shadow stack", () => {
      const result = generateBuildCSS(
        [...FILLER, "ring-4", "ring-brand-500", "shadow-sm"],
        baseConfig,
      );
      const ring = result.utilitiesCSS.match(/\.ring-4[^{]*\{([^}]+)\}/);
      const shadow = result.utilitiesCSS.match(/\.shadow-sm[^{]*\{([^}]+)\}/);
      expect(ring?.[1]).toMatch(/--iui-ring-shadow:/);
      expect(shadow?.[1]).toMatch(/--iui-shadow:/);
      expect(shadow?.[1]).toMatch(/var\(--iui-ring-offset-shadow/);
    });
  });

  describe("divide + space child utilities — width before reverse", () => {
    it("divide-y-2 before divide-y-reverse", () => {
      const css = buildWithFiller("divide-y-2", "divide-y-reverse");
      expectCascadeOrder(css, "divide-y-2", "divide-y-reverse", {
        childCombinator: true,
      });
    });

    it("space-x-4 before space-x-reverse", () => {
      const css = buildWithFiller("space-x-4", "space-x-reverse");
      expectCascadeOrder(css, "space-x-4", "space-x-reverse", {
        childCombinator: true,
      });
    });
  });
});
