/**
 * @jest-environment node
 *
 * Regression suite for every color category whose matcher was switched to
 * shared dynamic token handling. Covers keywords, semantic/base palettes,
 * numbered accents, custom slot names, shade steps, opacity, and sibling
 * numeric/named utilities that must not be reclassified as colors.
 */
import type { IUIConfig } from "../../src/core/config";
import { parseUtilityClass } from "../../src/engine/core/parser";
import { UtilityCache } from "../../src/engine/core/cache";
import { generateBuildCSS } from "../../src/server/ssr-extraction";
import { collectStateUtilityClasses } from "../../src/server/generate-state-utilities";
import { getConfigPalettes } from "../../src/server/get-config-palettes";
import {
  generateDisabledCSS,
  generateFocusedCSS,
  generateLoadingCSS,
  resolveStatesConfig,
} from "../../src/core/states/resolver";
import { withTestAccentPalette } from "../helpers/test-accent-palette";
import {
  cn,
  getTokenCategory,
  type TokenCategory,
} from "../../src/utilities/class-utilities";
import {
  COLOR_SHADE_STEPS,
  GRADIENT_STOP_TOKEN_RE,
  isColorTokenWithOptionalOpacity,
  isShadedColorToken,
} from "../../src/utilities/color-token-utils";

const parserContext = { cache: new UtilityCache() };

const baseConfig = withTestAccentPalette({
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
    colors: {
      brand: { set: "#6366f1" },
      accent: {
        "accent-1": "#f59e0b",
        "accent-11": "#021c33",
        bros: "#c888f2",
        "brand-accent": "#14b8a6",
        "accent-15": "#f43f5e",
      },
    },
  },
} as IUIConfig);

type ColorPrefixCase = {
  prefix: string;
  category: TokenCategory;
  supportsOpacity: boolean;
};

/** Every class-utilities color matcher rewritten onto shared token sources. */
const COLOR_PREFIXES: ColorPrefixCase[] = [
  { prefix: "text-", category: "text-color", supportsOpacity: true },
  { prefix: "bg-", category: "bg-color", supportsOpacity: true },
  { prefix: "border-", category: "border-color", supportsOpacity: true },
  { prefix: "border-t-", category: "border-t-color", supportsOpacity: true },
  { prefix: "border-b-", category: "border-b-color", supportsOpacity: true },
  {
    prefix: "border-s-",
    category: "border-inline-start-color",
    supportsOpacity: true,
  },
  {
    prefix: "border-e-",
    category: "border-inline-end-color",
    supportsOpacity: true,
  },
  {
    prefix: "border-bs-",
    category: "border-block-start-color",
    supportsOpacity: true,
  },
  {
    prefix: "border-be-",
    category: "border-block-end-color",
    supportsOpacity: true,
  },
  { prefix: "border-x-", category: "border-x-color", supportsOpacity: true },
  { prefix: "border-y-", category: "border-y-color", supportsOpacity: true },
  { prefix: "accent-", category: "accent-color", supportsOpacity: true },
  { prefix: "caret-", category: "caret-color", supportsOpacity: true },
  { prefix: "decoration-", category: "decoration-color", supportsOpacity: true },
  {
    prefix: "text-decoration-color-",
    category: "decoration-color",
    supportsOpacity: true,
  },
  { prefix: "ring-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-t-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-b-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-s-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-e-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-x-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-y-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-bs-", category: "ring-color", supportsOpacity: true },
  { prefix: "ring-be-", category: "ring-color", supportsOpacity: true },
  {
    prefix: "ring-offset-",
    category: "ring-offset-color",
    supportsOpacity: true,
  },
  { prefix: "shadow-", category: "shadow-color", supportsOpacity: true },
  { prefix: "shadow-t-", category: "shadow-t-color", supportsOpacity: true },
  { prefix: "shadow-e-", category: "shadow-e-color", supportsOpacity: true },
  { prefix: "shadow-b-", category: "shadow-b-color", supportsOpacity: true },
  { prefix: "shadow-s-", category: "shadow-s-color", supportsOpacity: true },
  { prefix: "outline-", category: "outline-color", supportsOpacity: false },
  { prefix: "fill-", category: "fill-color", supportsOpacity: false },
  { prefix: "stroke-", category: "stroke-color", supportsOpacity: false },
  {
    prefix: "column-rule-color-",
    category: "column-rule-color",
    supportsOpacity: true,
  },
];

const COLOR_KEYWORDS = [
  "white",
  "black",
  "transparent",
  "current",
  "inherit",
] as const;

const SEMANTIC_TOKENS = [
  "brand-500",
  "success-600",
  "danger-500",
  "warning-400",
  "info-700",
  "neutral-200",
] as const;

const BASE_PALETTE_TOKENS = [
  "red-500",
  "teal-400",
  "blue-600",
  "amber-50",
  "rose-950",
] as const;

const NUMBERED_ACCENT_TOKENS = [
  "accent-1-500",
  "accent-2-600",
  "accent-11-600",
  "accent-12-950",
] as const;

const CUSTOM_SLOT_TOKENS = [
  "bros-600",
  "brand-accent-500",
  "accent-15-400",
] as const;

const LEGACY_GRAY_TOKENS = ["gray-2", "gray-12", "gray-50", "gray-98"] as const;

const ALL_COLOR_TOKENS = [
  ...COLOR_KEYWORDS,
  ...SEMANTIC_TOKENS,
  ...BASE_PALETTE_TOKENS,
  ...NUMBERED_ACCENT_TOKENS,
  ...CUSTOM_SLOT_TOKENS,
  ...LEGACY_GRAY_TOKENS,
] as const;

function categoryOf(className: string): TokenCategory | null {
  return getTokenCategory(className).category;
}

describe("shared color token matcher", () => {
  it("accepts keywords, shaded palettes, numbered accents, and custom slots", () => {
    for (const token of ALL_COLOR_TOKENS) {
      expect(isColorTokenWithOptionalOpacity(token)).toBe(true);
    }
  });

  it("accepts optional opacity on shaded and keyword tokens", () => {
    expect(isColorTokenWithOptionalOpacity("brand-500/30")).toBe(true);
    expect(isColorTokenWithOptionalOpacity("bros-600/50")).toBe(true);
    expect(isColorTokenWithOptionalOpacity("accent-11-600/0.5")).toBe(true);
    expect(isColorTokenWithOptionalOpacity("white/40")).toBe(true);
    expect(isColorTokenWithOptionalOpacity("gray-12/25")).toBe(true);
  });

  it("does not treat numeric leftovers or hex as color tokens", () => {
    expect(isColorTokenWithOptionalOpacity("2")).toBe(false);
    expect(isColorTokenWithOptionalOpacity("17")).toBe(false);
    expect(isColorTokenWithOptionalOpacity("md")).toBe(false);
    expect(isColorTokenWithOptionalOpacity("#c888f2")).toBe(false);
    expect(isColorTokenWithOptionalOpacity("accent-11")).toBe(false);
  });

  it("treats only real shade suffixes as already-shaded tokens", () => {
    expect(isShadedColorToken("brand-500")).toBe(true);
    expect(isShadedColorToken("accent-11-600")).toBe(true);
    expect(isShadedColorToken("bros-400")).toBe(true);
    expect(isShadedColorToken("accent-11")).toBe(false);
    expect(isShadedColorToken("white")).toBe(false);
    expect(isShadedColorToken("brand")).toBe(false);
  });
});

describe("changed color categories — classification", () => {
  it.each(COLOR_PREFIXES)(
    "$prefix classifies keywords, semantic, base, accent, custom, and gray tokens as $category",
    ({ prefix, category }) => {
      for (const token of ALL_COLOR_TOKENS) {
        const className = `${prefix}${token}`;
        if (
          (prefix === "fill-" || prefix === "stroke-") &&
          (token === "current" ||
            token === "inherit" ||
            token === "transparent")
        ) {
          expect(categoryOf(className)).toBe(
            prefix === "fill-" ? "fill" : "stroke",
          );
          continue;
        }
        expect(categoryOf(className)).toBe(category);
      }
    },
  );

  it.each(COLOR_PREFIXES.filter((entry) => entry.supportsOpacity))(
    "$prefix classifies opacity modifiers as $category",
    ({ prefix, category }) => {
      expect(categoryOf(`${prefix}brand-500/30`)).toBe(category);
      expect(categoryOf(`${prefix}bros-600/50`)).toBe(category);
      expect(categoryOf(`${prefix}accent-11-600/0.4`)).toBe(category);
      expect(categoryOf(`${prefix}white/25`)).toBe(category);
    },
  );

  it.each(COLOR_PREFIXES.filter((entry) => !entry.supportsOpacity))(
    "$prefix does not treat slash-opacity as $category",
    ({ prefix, category }) => {
      expect(categoryOf(`${prefix}brand-500/30`)).not.toBe(category);
    },
  );

  it("classifies every canonical shade step on text and bg", () => {
    for (const shade of COLOR_SHADE_STEPS) {
      expect(categoryOf(`text-brand-${shade}`)).toBe("text-color");
      expect(categoryOf(`bg-red-${shade}`)).toBe("bg-color");
      expect(categoryOf(`border-accent-11-${shade}`)).toBe("border-color");
    }
  });

  it("keeps accent-auto as accent-color", () => {
    expect(categoryOf("accent-auto")).toBe("accent-color");
  });
});

describe("changed color categories — sibling utilities stay non-color", () => {
  const siblingCases: Array<[string, TokenCategory]> = [
    ["text-sm", "font-size"],
    ["text-base", "font-size"],
    ["text-17", "font-size"],
    ["text-center", "text-align"],
    ["text-wrap", "text-wrap"],
    ["border-2", "border-width"],
    ["border", "border-width"],
    ["ring-2", "ring-width"],
    ["ring", "ring"],
    ["ring-t-2", "ring-t"],
    ["ring-offset-2", "ring-offset-width"],
    ["shadow-md", "box-shadow"],
    ["shadow-t-lg", "shadow-t"],
    ["outline-2", "outline-width"],
    ["outline", "outline-width"],
    ["outline-solid", "outline-style"],
    ["outline-none", "outline-style"],
    ["outline-hidden", "outline-hidden"],
    ["fill-none", "fill"],
    ["stroke-none", "stroke"],
    ["stroke-2", "stroke-width"],
    ["decoration-solid", "text-decoration-style"],
    ["decoration-2", "text-decoration-thickness"],
    ["p-4", "p"],
    ["w-17", "width"],
    ["opacity-50", "opacity"],
  ];

  it.each(siblingCases)("%s stays %s", (className, category) => {
    expect(categoryOf(className)).toBe(category);
  });
});

describe("changed color categories — merge last-wins without cross-category clobber", () => {
  it.each(COLOR_PREFIXES)(
    "$prefix later token wins within $category",
    ({ prefix }) => {
      const earlier = `${prefix}brand-500`;
      const later = `${prefix}bros-600`;
      const merged = cn(earlier, later).split(/\s+/);
      expect(merged).toContain(later);
      expect(merged).not.toContain(earlier);
    },
  );

  it("does not merge color against numeric/size siblings", () => {
    expect(cn("text-red-500", "text-sm")).toBe("text-red-500 text-sm");
    expect(cn("text-sm", "text-17")).toBe("text-17");
    expect(cn("border-red-500", "border-2")).toBe("border-red-500 border-2");
    expect(cn("ring-brand-500", "ring-2")).toBe("ring-brand-500 ring-2");
    expect(cn("ring-offset-brand-500", "ring-offset-2")).toBe(
      "ring-offset-brand-500 ring-offset-2",
    );
    expect(cn("shadow-red-500", "shadow-md")).toBe("shadow-red-500 shadow-md");
    expect(cn("outline-brand-500", "outline-2")).toBe(
      "outline-brand-500 outline-2",
    );
    expect(cn("fill-red-500", "fill-none")).toBe("fill-red-500 fill-none");
    expect(cn("stroke-red-500", "stroke-2")).toBe("stroke-red-500 stroke-2");
  });

  it("keeps arbitrary color values last-wins against named colors", () => {
    expect(cn("text-blue-500", "text-[#fff]")).toBe("text-[#fff]");
    expect(cn("bg-red-500", "bg-[#abc]")).toBe("bg-[#abc]");
    expect(cn("border-gray-200", "border-[#000]")).toBe("border-[#000]");
    expect(cn("ring-2", "ring-[5px]")).toBe("ring-[5px]");
  });

  it("does not conflict across variant contexts", () => {
    expect(cn("bg-red-500", "hover:bg-bros-600")).toBe(
      "bg-red-500 hover:bg-bros-600",
    );
    expect(cn("dark:text-brand-500", "dark:text-accent-11-600")).toBe(
      "dark:text-accent-11-600",
    );
  });
});

describe("changed color categories — parser alignment", () => {
  it.each(COLOR_PREFIXES)(
    "$prefix parser category matches classifier for representative tokens",
    ({ prefix, category }) => {
      const samples = [
        `${prefix}brand-500`,
        `${prefix}red-500`,
        `${prefix}accent-11-600`,
        `${prefix}bros-600`,
        `${prefix}white`,
      ];
      for (const className of samples) {
        const parsed = parseUtilityClass(className, parserContext);
        expect(parsed?.category).toBe(category);
        expect(categoryOf(className)).toBe(category);
      }
    },
  );

  it("parser keeps numeric siblings out of color categories", () => {
    expect(parseUtilityClass("text-17", parserContext)?.category).toBe(
      "font-size",
    );
    expect(parseUtilityClass("border-2", parserContext)?.category).toBe(
      "border-width",
    );
    expect(parseUtilityClass("ring-2", parserContext)?.category).toBe(
      "ring-width",
    );
    expect(parseUtilityClass("ring-offset-2", parserContext)?.category).toBe(
      "ring-offset-width",
    );
    expect(parseUtilityClass("outline-2", parserContext)?.category).toBe(
      "outline-width",
    );
    expect(parseUtilityClass("stroke-2", parserContext)?.category).toBe(
      "stroke-width",
    );
    expect(parseUtilityClass("shadow-md", parserContext)?.category).toBe(
      "box-shadow",
    );
  });
});

describe("changed color categories — compile CSS", () => {
  const compileSamples = [
    "text-brand-500",
    "text-red-500",
    "text-accent-1-500",
    "text-white",
    "text-gray-12",
    "bg-success-600",
    "bg-bros-600",
    "border-brand-500",
    "border-t-red-500",
    "border-s-accent-11-600",
    "accent-brand-500",
    "caret-red-500",
    "decoration-brand-500",
    "ring-brand-600",
    "ring-accent-11-600",
    "ring-bros-600",
    "ring-t-red-500",
    "ring-offset-bros-600",
    "shadow-red-500",
    "shadow-t-brand-500",
    "outline-brand-500",
    "fill-red-500",
    "stroke-brand-500",
    "column-rule-color-red-500",
    "text-17",
    "border-2",
    "ring-2",
    "outline-2",
    "w-17",
    "p-4",
  ];

  it("builds named, semantic, custom, and numeric sibling utilities", () => {
    const result = generateBuildCSS(compileSamples, baseConfig);
    const missing = compileSamples.filter(
      (className) => !result.builtClasses.includes(className),
    );
    expect(missing).toEqual([]);
    expect(result.uncoveredClasses).toEqual([]);
  });

  it("emits CSS variables for custom and numbered accent colors", () => {
    const result = generateBuildCSS(
      ["bg-bros-600", "text-accent-11-500", "ring-brand-accent-500"],
      baseConfig,
    );
    expect(result.utilitiesCSS).toMatch(/--iui-color-bros-600/);
    expect(result.utilitiesCSS).toMatch(/--iui-color-accent-11-500/);
    expect(result.utilitiesCSS).toMatch(/--iui-color-brand-accent-500/);
  });
});

describe("gradient stop tokens — config-driven palettes", () => {
  it("classifies percentage and custom accent palette stops", () => {
    expect(categoryOf("from-40%")).toBe("gradient-from");
    expect(categoryOf("via-bros-600")).toBe("gradient-via");
    expect(categoryOf("to-brand-accent-500/30")).toBe("gradient-to");
    expect(categoryOf("from-[#abc]")).toBe("gradient-from");
  });

  it("matches shared gradient stop token source without hardcoded palette names", () => {
    expect(GRADIENT_STOP_TOKEN_RE.test("bros-600")).toBe(true);
    expect(GRADIENT_STOP_TOKEN_RE.test("accent-15-400")).toBe(true);
    expect(GRADIENT_STOP_TOKEN_RE.test("danger-500/30")).toBe(true);
    expect(GRADIENT_STOP_TOKEN_RE.test("40%")).toBe(true);
  });
});

describe("states and config palettes — dynamic accent keys", () => {
  const adaptiveFocused = resolveStatesConfig({
    focused: {
      mode: "adaptive",
      shades: { light: "600", dark: "400" },
      style: {
        width: 2,
        offset: 2,
        offsetColor: { light: "white", dark: "black" },
      },
    },
  }).focused;

  it("adaptive focus rings use semantic, base, numbered, and custom keys", () => {
    expect(
      generateFocusedCSS(adaptiveFocused, { componentColor: "brand" })
        .classNames,
    ).toEqual(
      expect.arrayContaining([
        "focus-visible:ring-brand-600",
        "dark:focus-visible:ring-brand-400",
      ]),
    );
    expect(
      generateFocusedCSS(adaptiveFocused, { componentColor: "red" }).classNames,
    ).toEqual(
      expect.arrayContaining([
        "focus-visible:ring-red-600",
        "dark:focus-visible:ring-red-400",
      ]),
    );
    const accent11 = generateFocusedCSS(adaptiveFocused, {
      componentColor: "accent-11",
    }).classNames;
    expect(accent11).toContain("focus-visible:ring-accent-11-600");
    expect(accent11).not.toContain("focus-visible:ring-accent-11");
    expect(
      generateFocusedCSS(adaptiveFocused, { componentColor: "bros" }).classNames,
    ).toContain("focus-visible:ring-bros-600");
  });

  it("mute disabled/loading append shades without doubling pre-shaded tokens", () => {
    const disabled = generateDisabledCSS({
      style: "mute",
      opacity: 0.5,
      color: "accent-11",
      cursor: "not-allowed",
    });
    expect(disabled.classNames).toContain("disabled:bg-accent-11-100");

    const loading = generateLoadingCSS({
      style: "mute",
      opacity: 0.5,
      color: "bros",
      spinner: true,
      cursor: "wait",
      loader: { name: "ring", color: "currentColor" },
      label: "Loading",
    });
    expect(loading.classNames).toContain("data-loading:text-bros-600");

    const preShaded = generateDisabledCSS({
      style: "mute",
      opacity: 0.5,
      color: "neutral-400",
      cursor: "not-allowed",
    });
    expect(preShaded.classNames).toContain("disabled:bg-neutral-400");
    expect(preShaded.classNames).not.toContain("disabled:bg-neutral-400-100");
  });

  it("palette expansion keeps configured keys and ignores hex/unconfigured slots", () => {
    const palettes = getConfigPalettes(baseConfig);
    expect(palettes).toEqual(
      expect.arrayContaining(["accent-1", "accent-11", "bros", "brand-accent"]),
    );
    expect(palettes).not.toContain("#c888f2");
    expect(palettes).not.toContain("#021c33");
    expect(palettes).not.toContain("accent-12");

    const classes = collectStateUtilityClasses({
      ...baseConfig,
      states: { focused: { mode: "adaptive", color: "brand" } },
    } as IUIConfig);
    expect(classes).toContain("focus-visible:ring-bros-600");
    expect(classes).toContain("focus-visible:ring-accent-1-600");
    expect(classes).not.toContain("focus-visible:ring-accent-12-600");
    expect(classes.some((cls) => cls.includes("#"))).toBe(false);
  });
});
