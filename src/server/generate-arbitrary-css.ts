/**
 * Compile-time arbitrary utility CSS generation (Node-safe).
 * Used by generateBuildCSS / SSR — no DOM or React.
 */

import { responsiveBreakpoints } from "../engine/parsing/pseudo-states";
import { parseVariants, buildSelector } from "../engine/parsing/variant";
import { DIVIDE_BETWEEN_CHILDREN_SUFFIX } from "../engine/utilities/builders";
import { IUI_TRANSFORM_VAR_TEMPLATE } from "../engine/utilities/constants";
import { getImportant } from "../core/config-loader";
import {
  buildArbitraryGradientImage,
  buildGradientColorStopProperties,
  buildGradientPositionStopProperties,
  isGradientStopPosition,
  type GradientStopKind,
} from "../engine/utilities/gradient-stops";



const CSS_UNIT_PATTERNS = {
  // Length units
  LENGTH: /^\d+(\.\d+)?(px|rem|em|ex|ch|vw|vh|vmin|vmax|cm|mm|in|pt|pc)$/,
  // Percentage
  PERCENTAGE: /^\d+(\.\d+)?%$/,
  // Angle units
  ANGLE: /^\d+(\.\d+)?(deg|rad|grad|turn)$/,
  // Time units
  TIME: /^\d+(\.\d+)?(s|ms)$/,
  // Frequency units
  FREQUENCY: /^\d+(\.\d+)?(Hz|kHz)$/,
  // Resolution units
  RESOLUTION: /^\d+(\.\d+)?(dpi|dpcm|dppx|x)$/,
  // Color patterns
  HEX_COLOR: /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
  RGB_COLOR: /^rgb\(/,
  RGBA_COLOR: /^rgba\(/,
  HSL_COLOR: /^hsl\(/,
  HSLA_COLOR: /^hsla\(/,
  // CSS Variables
  CSS_VAR: /^var\(/,
  // Named colors
  NAMED_COLOR: /^(transparent|currentColor|inherit|initial|unset)$/,
  // Keywords
  KEYWORD: /^(auto|none|inherit|initial|unset)$/
} as const;

function arbitraryGradientStopMapping(kind: GradientStopKind) {
  return (value: string): string => {
    const v = value.trim();
    if (isGradientStopPosition(v)) {
      const props = buildGradientPositionStopProperties(kind, v);
      return Object.entries(props)
        .map(([prop, val]) => `${prop}: ${val}`)
        .join("; ");
    }
    const props = buildGradientColorStopProperties(kind, v);
    return Object.entries(props)
      .map(([prop, val]) => `${prop}: ${val}`)
      .join("; ");
  };
}

function isArbitraryColorValue(value: string): boolean {
  const v = value.trim();
  return (
    CSS_UNIT_PATTERNS.HEX_COLOR.test(v) ||
    CSS_UNIT_PATTERNS.RGB_COLOR.test(v) ||
    CSS_UNIT_PATTERNS.RGBA_COLOR.test(v) ||
    CSS_UNIT_PATTERNS.HSL_COLOR.test(v) ||
    CSS_UNIT_PATTERNS.HSLA_COLOR.test(v) ||
    CSS_UNIT_PATTERNS.CSS_VAR.test(v) ||
    CSS_UNIT_PATTERNS.NAMED_COLOR.test(v)
  );
}

/** Shared arbitrary `shadow-[…]` / `shadow-s-[…]` logic (color token vs full box-shadow). */
function arbitraryShadowMapping(value: string): string {
  if (isArbitraryColorValue(value)) {
    return `--iui-shadow-color: ${value}`;
  }
  return `box-shadow: ${value}`;
}

function arbitraryBorderMapping(
  widthProperty: string,
  colorProperty: string,
): (value: string) => string {
  return (value: string) =>
    isArbitraryColorValue(value)
      ? `${colorProperty}: ${value}`
      : `${widthProperty}: ${value}`;
}

/**
 * Comprehensive Tailwind CSS arbitrary value mappings
 * Only includes categories that support arbitrary values in Tailwind
 */
const ARBITRARY_PROPERTY_MAPPINGS: Record<string, string | ((value: string) => string | null)> = {
  // === LAYOUT & SIZING 
  "w": "width",
  "h": "height", 
  "min-w": "min-width",
  "max-w": "max-width",
  "min-h": "min-height",
  "max-h": "max-height",
  "size": (value: string) => `width: ${value}; height: ${value}`,
  "top": "top",
  // IUI uses logical inline axes: start/end (not left/right)
  "right": "inset-inline-end",
  "bottom": "bottom",
  "left": "inset-inline-start",
  "start": "inset-inline-start",
  "end": "inset-inline-end",
  "inset": (value: string) => `inset: ${value}`,
  "inset-x": (value: string) => `inset-inline-start: ${value}; inset-inline-end: ${value}`,
  "inset-y": (value: string) => `top: ${value}; bottom: ${value}`,
  "z": "z-index",
  "basis": "flex-basis",
  "grow": "flex-grow",
  "shrink": "flex-shrink",
  "order": "order",
  "gap": "gap",
  "gap-x": "column-gap",
  "gap-y": "row-gap",
  "transition": "transition-property",
  "duration": "transition-duration",
  "delay": "transition-delay",
  "ease": "transition-timing-function",
  // Physical border aliases → logical inline (s/e). t/b/x/y live under BORDERS below.
  "border-r": arbitraryBorderMapping("border-inline-end-width", "border-inline-end-color"),
  "border-l": arbitraryBorderMapping("border-inline-start-width", "border-inline-start-color"),
  // Logical sizing (Tailwind v4: inline-[value], block-[value])
  "inline": "inline-size",
  "min-inline": "min-inline-size",
  "max-inline": "max-inline-size",
  "block": "block-size",
  "min-block": "min-block-size",
  "max-block": "max-block-size",

  // === SPACING ===
  // Margin
  "m": "margin",
  "mx": (value: string) => `margin-inline-start: ${value}; margin-inline-end: ${value}`,
  "my": (value: string) => `margin-top: ${value}; margin-bottom: ${value}`,
  "mt": "margin-top",
  "mb": "margin-bottom",
  "ms": "margin-inline-start",
  "me": "margin-inline-end",
  "mbs": "margin-block-start",
  "mbe": "margin-block-end",

  // Padding
  "p": "padding",
  "px": (value: string) => `padding-inline-start: ${value}; padding-inline-end: ${value}`,
  "py": (value: string) => `padding-top: ${value}; padding-bottom: ${value}`,
  "pt": "padding-top",
  "pb": "padding-bottom",
  "ps": "padding-inline-start",
  "pe": "padding-inline-end",
  "pbs": "padding-block-start",
  "pbe": "padding-block-end",

  // === FLEXBOX & GRID ===
  /** Tailwind: justify-* → justify-content — baseline omitted (invalid / unsupported here). */
  justify: (value: string) => {
    const v = value.trim();
    if (v === "baseline") return null;
    return `justify-content: ${v}`;
  },
  "justify-items": (value: string) => {
    const v = value.trim();
    if (v === "baseline") return null;
    return `justify-items: ${v}`;
  },
  "justify-self": (value: string) => {
    const v = value.trim();
    if (v === "baseline") return null;
    return `justify-self: ${v}`;
  },

  // Grid template & positioning
  "grid-cols": "grid-template-columns",
  "grid-rows": "grid-template-rows",
  /** col-span-[n] must not emit invalid `grid-column: n` (numeric span → span n / span n) */
  "col-span": (value: string) => {
    const v = value.trim();
    if (v === "auto") return "grid-column: auto";
    if (v === "full") return "grid-column: 1 / -1";
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0 && n < 10000 && String(n) === v) {
      return `grid-column: span ${n} / span ${n}`;
    }
    return `grid-column: ${v}`;
  },
  "col-start": "grid-column-start",
  "col-end": "grid-column-end",
  "row-span": (value: string) => {
    const v = value.trim();
    if (v === "auto") return "grid-row: auto";
    if (v === "full") return "grid-row: 1 / -1";
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0 && n < 10000 && String(n) === v) {
      return `grid-row: span ${n} / span ${n}`;
    }
    return `grid-row: ${v}`;
  },
  "row-start": "grid-row-start",
  "row-end": "grid-row-end",
  /** auto-cols-[min|max|fr|auto] — keyword track sizes match token utilities (minmax) */
  "auto-cols": (value: string) => {
    const v = value.trim();
    const track: Record<string, string> = {
      auto: "auto",
      min: "minmax(0, min-content)",
      max: "minmax(0, max-content)",
      fr: "minmax(0, 1fr)",
    };
    if (track[v]) return `grid-auto-columns: ${track[v]}`;
    return `grid-auto-columns: ${v}`;
  },
  "auto-rows": (value: string) => {
    const v = value.trim();
    const track: Record<string, string> = {
      auto: "auto",
      min: "minmax(0, min-content)",
      max: "minmax(0, max-content)",
      fr: "minmax(0, 1fr)",
    };
    if (track[v]) return `grid-auto-rows: ${track[v]}`;
    return `grid-auto-rows: ${v}`;
  },

  // === TYPOGRAPHY ===
  "underline-offset": "text-underline-offset",
  "decoration": (value: string) => {
    const v = value.trim();
    // Tailwind: decoration-slice / decoration-clone → box-decoration-break (not color/thickness)
    if (v === "slice" || v === "clone") {
      return `box-decoration-break: ${v}`;
    }
    // Tailwind: decoration-[3px] / decoration-[0.5rem] → thickness; decoration-[#fff] → color
    const asNum = parseFloat(value);
    const isLength = !isNaN(asNum) && value.trim() !== '' || /^\d+(\.\d+)?(px|rem|em|ex|ch|%|pt|pc|mm|cm|in)$/.test(value);
    if (isLength) {
      const thickness = /^\d+(\.\d+)?$/.test(value) ? `${value}px` : value;
      return `text-decoration-thickness: ${thickness}`;
    }
    return `text-decoration-color: ${value}`;
  },
  /** decoration-color-[#f00] — explicit text-decoration color (Tailwind-style) */
  "decoration-color": "text-decoration-color",
  "text": (value: string) => {
    // Smart detection: color vs font-size
    if (CSS_UNIT_PATTERNS.HEX_COLOR.test(value) ||
        CSS_UNIT_PATTERNS.RGB_COLOR.test(value) ||
        CSS_UNIT_PATTERNS.RGBA_COLOR.test(value) ||
        CSS_UNIT_PATTERNS.HSL_COLOR.test(value) ||
        CSS_UNIT_PATTERNS.HSLA_COLOR.test(value) ||
        CSS_UNIT_PATTERNS.CSS_VAR.test(value) ||
        CSS_UNIT_PATTERNS.NAMED_COLOR.test(value)) {
      return `color: ${value}`;
    }
    // If numeric, treat as font-size in px (add this block)
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return `font-size: ${value}px`;
    }
    // Font size for length units or percent
    if (CSS_UNIT_PATTERNS.LENGTH.test(value) || CSS_UNIT_PATTERNS.PERCENTAGE.test(value)) {
      return `font-size: ${value}`;
    }
    // Default to font-size
    return `font-size: ${value}`;
  },
  "leading": "line-height",
  "tracking": "letter-spacing",
  "indent": "text-indent",
  "font-stretch": "font-stretch",
  /** Tailwind: font-[475], font-[1.125rem], font-[system-ui] */
  "font": (value: string) => {
    const v = value.trim();
    if (CSS_UNIT_PATTERNS.LENGTH.test(v) || CSS_UNIT_PATTERNS.PERCENTAGE.test(v)) {
      return `font-size: ${v}`;
    }
    if (/^-?\d+(\.\d+)?$/.test(v)) {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0 && n <= 1000) {
        return `font-weight: ${v}`;
      }
    }
    if (
      CSS_UNIT_PATTERNS.HEX_COLOR.test(v) ||
      CSS_UNIT_PATTERNS.RGB_COLOR.test(v) ||
      CSS_UNIT_PATTERNS.RGBA_COLOR.test(v) ||
      CSS_UNIT_PATTERNS.HSL_COLOR.test(v) ||
      CSS_UNIT_PATTERNS.HSLA_COLOR.test(v) ||
      CSS_UNIT_PATTERNS.CSS_VAR.test(v)
    ) {
      return `color: ${v}`;
    }
    return `font-family: ${v}`;
  },
  "font-weight": "font-weight",
  /** text-decoration-color-[#f00] / text-decoration-color-[var(--x)] */
  "text-decoration-color": "text-decoration-color",
  /** align-[length] / align-[sub] — vertical-align (Tailwind align-* arbitrary) */
  align: "vertical-align",
  /** line-clamp-[3], line-clamp-[none] */
  "line-clamp": (value: string) => {
    if (value === "none") {
      return "overflow: visible; display: block; -webkit-box-orient: horizontal; -webkit-line-clamp: unset; line-clamp: unset";
    }
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 1 && n <= 999) {
      return `overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${n}; line-clamp: ${n}`;
    }
    return `overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: ${value}; line-clamp: ${value}`;
  },
  /** text-wrap-[balance], text-wrap-[pretty] */
  "text-wrap": "text-wrap",
  /** overflow-wrap-[anywhere], overflow-wrap-[break-word] */
  "overflow-wrap": "overflow-wrap",

  // === COLORS & BACKGROUNDS ===
  "bg": (value: string) => {
    const v = value.trim();
    // Tailwind: bg-[length:200%_100%], bg-[position:50%_50%]
    if (v.startsWith("length:")) {
      return `background-size: ${v.slice("length:".length).trim()}`;
    }
    if (v.startsWith("position:")) {
      return `background-position: ${v.slice("position:".length).trim()}`;
    }
    if (v.startsWith("repeat:")) {
      return `background-repeat: ${v.slice("repeat:".length).trim()}`;
    }
    const repeatKeywords = new Set([
      "repeat",
      "no-repeat",
      "repeat-x",
      "repeat-y",
      "round",
      "space",
    ]);
    if (repeatKeywords.has(v)) {
      return `background-repeat: ${v}`;
    }
    // Smart detection for background properties
    if (v.includes('url(') || v.includes('linear-gradient') || 
        v.includes('radial-gradient') || v.includes('conic-gradient')) {
      return `background-image: ${v}`;
    }
    if (v.includes('cover') || v.includes('contain') || 
        CSS_UNIT_PATTERNS.LENGTH.test(v)) {
      return `background-size: ${v}`;
    }
    // Default to background-color
    return `background-color: ${v}`;
  },
  "bg-radial": (value: string) => buildArbitraryGradientImage("bg-radial", value),
  "bg-conic": (value: string) => buildArbitraryGradientImage("bg-conic", value),
  "from": arbitraryGradientStopMapping("from"),
  "via": arbitraryGradientStopMapping("via"),
  "to": arbitraryGradientStopMapping("to"),

  // === BORDERS ===
  "border": arbitraryBorderMapping("border-width", "border-color"),
  "border-t": arbitraryBorderMapping("border-top-width", "border-top-color"),
  "border-b": arbitraryBorderMapping("border-bottom-width", "border-bottom-color"),
  "border-x": (value: string) =>
    isArbitraryColorValue(value)
      ? `border-inline-color: ${value}`
      : `border-inline-width: ${value}`,
  "border-y": (value: string) =>
    isArbitraryColorValue(value)
      ? `border-block-color: ${value}`
      : `border-block-width: ${value}`,
  "border-s": arbitraryBorderMapping("border-inline-start-width", "border-inline-start-color"),
  "border-e": arbitraryBorderMapping("border-inline-end-width", "border-inline-end-color"),
  "border-spacing": "border-spacing",

  // Border radius
  "rounded": "border-radius",
  // Use logical properties (start/end) instead of left/right
  "rounded-t": (value: string) =>
    `border-start-start-radius: ${value}; border-start-end-radius: ${value}`,
  "rounded-b": (value: string) =>
    `border-end-start-radius: ${value}; border-end-end-radius: ${value}`,
  "rounded-s": (value: string) => `border-start-start-radius: ${value}; border-end-start-radius: ${value}`,
  "rounded-e": (value: string) => `border-start-end-radius: ${value}; border-end-end-radius: ${value}`,
  "rounded-ts": "border-start-start-radius",
  "rounded-te": "border-start-end-radius",
  "rounded-be": "border-end-end-radius",
  "rounded-bs": "border-end-start-radius",
  "rounded-ss": "border-start-start-radius",
  "rounded-se": "border-start-end-radius",
  "rounded-ee": "border-end-end-radius",
  "rounded-es": "border-end-start-radius",

  // === EFFECTS ===
  "opacity": "opacity",
  "text-shadow": "text-shadow",
  "mask-image": "mask-image",
  "mask-size": "mask-size",
  "mask-position": "mask-position",
  "mask-clip": "mask-clip",
  "mask-origin": "mask-origin",
  "mask-repeat": "mask-repeat",
  "mask-composite": "mask-composite",
  "mask-type": "mask-type",
  "mix-blend": "mix-blend-mode",
  "shadow": arbitraryShadowMapping,
  "shadow-s": arbitraryShadowMapping,
  "shadow-e": arbitraryShadowMapping,
  "drop-shadow": "filter",

  // === FILTERS ===
  "blur": "filter",
  "brightness": "filter", 
  "contrast": "filter",
  "grayscale": "filter",
  "hue-rotate": "filter",
  "invert": "filter",
  "saturate": "filter",
  "sepia": "filter",

  // === BACKDROP FILTERS ===
  // Arbitrary: backdrop-blur-[2px], blur-[1.5rem]; TW v4 var shorthand: backdrop-blur-(--token), blur-(--token)
  "backdrop-blur": "backdrop-filter",
  "backdrop-brightness": "backdrop-filter",
  "backdrop-contrast": "backdrop-filter", 
  "backdrop-grayscale": "backdrop-filter",
  "backdrop-hue-rotate": "backdrop-filter",
  "backdrop-invert": "backdrop-filter",
  "backdrop-opacity": "backdrop-filter",
  "backdrop-saturate": "backdrop-filter",
  "backdrop-sepia": "backdrop-filter",

  // === TRANSFORMS ===
  "scale": "transform",
  "scale-x": "transform",
  "scale-y": "transform", 
  "rotate": "transform",
  "rotate-x": "transform",
  "rotate-y": "transform",
  "translate-x": "transform",
  "translate-y": "transform",
  "skew-x": "transform",
  "skew-y": "transform",
  "origin": "transform-origin",
  "perspective": "perspective",
  "perspective-origin": "perspective-origin",
  "backface": "backface-visibility",
  "style": "transform-style",

  // === ANIMATIONS ===
  "animate": "animation",
  "animate-duration": "animation-duration",
  "animate-delay": "animation-delay",
  "animate-iteration": "animation-iteration-count",
  "animate-direction": "animation-direction",
  "animate-fill": "animation-fill-mode",
  "animate-play": "animation-play-state",
  "animate-ease": "animation-timing-function",

  // === INTERACTIVITY ===
  "cursor": "cursor",
  "pointer-events": "pointer-events",
  "resize": "resize",
  "select": "user-select",
  "scroll": "scroll-behavior",
  "snap": "scroll-snap-type",
  "touch": "touch-action",

  // === LAYOUT EFFECTS ===
  "aspect": "aspect-ratio",
  "columns": "columns",
  "break": "break-after",
  "break-before": "break-before",
  "break-after": "break-after",
  "break-inside": "break-inside",
  /** overscroll-[auto], overscroll-x-[contain], overscroll-y-[none] */
  "overscroll": "overscroll-behavior",
  "overscroll-x": "overscroll-behavior-x",
  "overscroll-y": "overscroll-behavior-y",
  /** isolation-[isolate], isolation-[auto] */
  "isolation": "isolation",
  /**
   * object-[…] — Tailwind: fit keywords → object-fit; otherwise → object-position (underscores → spaces)
   */
  "object": (value: string) => {
    const v = value.trim().replace(/_/g, " ");
    if (/^(contain|cover|fill|none|scale-down)$/i.test(v)) {
      return `object-fit: ${v.toLowerCase()}`;
    }
    return `object-position: ${v}`;
  },

  // === CONTENT & LISTS ===
  "content": "content",
  "list": "list-style-type",
  "list-image": "list-style-image",
  "caption": "caption-side",

  // === TYPOGRAPHY (Tailwind v4 arbitrary) ===
  "font-features": "font-feature-settings",
  /** Same as font-features; font-feature-['liga'_1] style values */
  "font-feature": "font-feature-settings",
  "font-feature-settings": "font-feature-settings",

  // === DIVIDE (between children; same combinator as token utilities) ===
  "divide-x": (value: string) =>
    `border-left-style: var(--iui-border-style, solid); border-right-style: var(--iui-border-style, solid); --iui-divide-x-width: ${value}; --iui-divide-x-reverse: 0; border-top-width: 0; border-bottom-width: 0; border-right-width: calc(var(--iui-divide-x-width) * var(--iui-divide-x-reverse, 0)); border-left-width: calc(var(--iui-divide-x-width) * calc(1 - var(--iui-divide-x-reverse, 0)))`,
  "divide-y": (value: string) =>
    `border-top-style: var(--iui-border-style, solid); border-bottom-style: var(--iui-border-style, solid); --iui-divide-y-width: ${value}; --iui-divide-y-reverse: 0; border-left-width: 0; border-right-width: 0; border-top-width: calc(var(--iui-divide-y-width) * calc(1 - var(--iui-divide-y-reverse, 0))); border-bottom-width: calc(var(--iui-divide-y-width) * var(--iui-divide-y-reverse, 0))`,
  "divide": (value: string) => `border-color: ${value}`,

  // === SVG ===
  "stroke": "stroke",
  "stroke-w": "stroke-width",
  "fill": "fill",

  // === SCROLL ===
  "scroll-m": "scroll-margin",
  "scroll-mx": (value: string) => `scroll-margin-inline-start: ${value}; scroll-margin-inline-end: ${value}`,
  "scroll-my": (value: string) => `scroll-margin-top: ${value}; scroll-margin-bottom: ${value}`,
  "scroll-mt": "scroll-margin-top",
  "scroll-mb": "scroll-margin-bottom",
  "scroll-ms": "scroll-margin-inline-start", 
  "scroll-me": "scroll-margin-inline-end",
  "scroll-p": "scroll-padding",
  "scroll-px": (value: string) => `scroll-padding-inline-start: ${value}; scroll-padding-inline-end: ${value}`,
  "scroll-py": (value: string) => `scroll-padding-top: ${value}; scroll-padding-bottom: ${value}`,
  "scroll-pt": "scroll-padding-top",
  "scroll-pb": "scroll-padding-bottom",
  "scroll-ps": "scroll-padding-inline-start",
  "scroll-pe": "scroll-padding-inline-end",

  // === RING (FOCUS OUTLINE) ===
  "ring": "box-shadow",
  "ring-offset": (value: string) => {
    // Tailwind CSS standard: ring-offset sets --iui-ring-offset-width and box-shadow
    // Supports negative values (e.g., -ring-offset-[2rem] or ring-offset-[-2rem])
    // Return multiple properties separated by semicolons for proper formatting with addImportantToProperties
    return `--iui-ring-offset-width: ${value}; --iui-ring-offset-shadow: var(--iui-ring-inset) 0 0 0 var(--iui-ring-offset-width) var(--iui-ring-offset-color, #fff); box-shadow: var(--iui-ring-offset-shadow), var(--iui-ring-shadow, 0 0 0 calc(var(--iui-ring-width, 2px) + var(--iui-ring-offset-width)) var(--iui-ring-color, rgb(59 130 246 / 0.5)))`;
  },
  "ring-inset": "box-shadow",
  "ring-t": "box-shadow",
  "ring-b": "box-shadow",
  "ring-s": "box-shadow",
  "ring-e": "box-shadow",
  "ring-x": "box-shadow",
  "ring-y": "box-shadow",
  "ring-bs": "box-shadow",
  "ring-be": "box-shadow",

  // === ACCENT & CARET ===
  "accent": "accent-color",
  "caret": "caret-color",
  
  // === OUTLINE ===
  "outline": "outline-width",
  "outline-width": "outline-width",
  "outline-offset": "outline-offset",
  "outline-color": "outline-color",

  // === CONTAINER QUERIES ===
  "container": "container",

  // === WILL CHANGE ===
  "will-change": "will-change"
} as const;

/**
 * Optimized value processing with comprehensive unit support
 */
function processArbitraryValue(value: string): string {
  // Handle escaped underscores first - preserve them by temporarily replacing
  // Use a placeholder without underscores to avoid conversion issues
  const escapedUnderscorePlaceholder = '___ESCAPEDUNDERSCORE___';
  const hasEscapedUnderscore = value.includes('\\_');
  if (hasEscapedUnderscore) {
    value = value.replace(/\\_/g, escapedUnderscorePlaceholder);
  }
  
  // Handle underscore to space conversion (Tailwind convention)
  // Convert underscores to spaces, but preserve them in url() and CSS variables
  if (value.includes('_') && !value.includes('url(')) {
    // Check if value contains gradient functions - we want to convert underscores in these
    const hasGradientFunction = value.includes('linear-gradient') || 
                                value.includes('radial-gradient') || 
                                value.includes('conic-gradient');
    
    // Check if value contains calc() - we want to convert underscores in calc() too
    const hasCalc = value.includes('calc(');
    
    if (hasGradientFunction) {
      // For gradient functions, convert underscores to spaces
      // But preserve underscores inside var() calls (CSS variable names)
      // Strategy: temporarily replace var() content, convert, then restore
      const varPlaceholders: string[] = [];
      let varIndex = 0;
      
      // Replace var() calls with placeholders (using placeholder without underscores)
      value = value.replace(/var\([^)]+\)/g, (match) => {
        const placeholder = `___VARPLACEHOLDER${varIndex}___`;
        varPlaceholders.push(match);
        varIndex++;
        return placeholder;
      });
      
      // Convert underscores to spaces
      value = value.replace(/_/g, ' ');
      
      // Restore var() calls
      varPlaceholders.forEach((varCall, index) => {
        value = value.replace(`___VARPLACEHOLDER${index}___`, varCall);
      });
    } else if (hasCalc) {
      // For calc(), convert underscores to spaces (calc() requires spaces)
      value = value.replace(/_/g, ' ');
    } else if (!value.match(/\w+\([^)]*_[^)]*\)/)) {
      // For non-gradient functions, only convert if not inside function calls
      value = value.replace(/_/g, ' ');
    }
  }
  
  // Restore escaped underscores (convert placeholder back to underscore)
  if (hasEscapedUnderscore) {
    value = value.replace(new RegExp(escapedUnderscorePlaceholder, 'g'), '_');
  }
  
  // Handle CSS variable syntax
  if (value.startsWith('--') && !value.startsWith('var(')) {
    return `var(${value})`;
  }
  
  // Handle calc() expressions
  if (value.includes('calc(')) {
    return value;
  }
  
  // Handle color values
  if (CSS_UNIT_PATTERNS.HEX_COLOR.test(value) || 
      CSS_UNIT_PATTERNS.RGB_COLOR.test(value) || 
      CSS_UNIT_PATTERNS.HSL_COLOR.test(value)) {
    return value;
  }
  
  return value;
}

/**
 * Get media query for responsive breakpoint
 */
function getResponsiveMediaQuery(prefix: string): string | null {
  // If a complete media query string is provided, use it directly
  if (prefix.startsWith('@media')) {
    return prefix;
  }
  // Also accept bracket notation directly in case upstream passes it
  if (prefix.startsWith('[@media(') && prefix.endsWith(')]')) {
    const content = prefix.substring(8, prefix.length - 2).trim();
    const normalized = content.startsWith('(') ? content : `(${content})`;
    return `@media ${normalized}`;
  }
  // Check standard breakpoints
  const state = (responsiveBreakpoints as Record<string, { selector: string } | undefined>)[prefix];
  return state?.selector ?? null;
}

/**
 * Determine if !important should be used for arbitrary values
 * Follows Tailwind CSS behavior: only use if explicitly requested or global config enabled
 */
function shouldUseImportantForArbitrary(className: string): boolean {
  // Check for ! prefix in className (Tailwind CSS behavior)
  if (className.startsWith('!')) {
    return true;
  }
  
  // Check global config when initialized (build/SSR always passes config first)
  try {
    const importantConfig = getImportant();
    if (importantConfig === true) {
      return true;
    }
  } catch {
    // Config not initialized — default to no !important
  }

  // Default: no !important (Tailwind CSS behavior)
  return false;
}

/**
 * Add !important to each CSS property declaration in a multi-property string
 * Only if shouldUseImportantForArbitrary returns true
 */
function addImportantToProperties(cssDeclarations: string, useImportant: boolean): string {
  if (!useImportant) {
    return cssDeclarations;
  }
  
  // Split by semicolon, add !important to each property, then join
  return cssDeclarations
    .split(';')
    .map(declaration => {
      const trimmed = declaration.trim();
      if (!trimmed) return '';
      // Check if !important is already present
      if (trimmed.includes('!important')) {
        return trimmed;
      }
      return `${trimmed} !important`;
    })
    .filter(declaration => declaration.length > 0)
    .join('; ');
}

/**
 * Enhanced CSS generation with optimized filter and transform handling
 */
function generateOptimizedCSS(
  className: string,
  property: string,
  value: string,
  isArbitraryProperty = false,
  variants: string[] = [],
  important?: boolean,
): string | null {
  // Determine if !important should be used (Tailwind CSS behavior)
  // Check explicit important flag first, then className prefix, then global config
  const useImportant = important === true || shouldUseImportantForArbitrary(className);
  const importantSuffix = useImportant ? ' !important' : '';

  // Full class name (with variants) is what appears on the DOM element.
  const selector = buildSelector(className, variants);

  // Handle arbitrary properties directly
  if (isArbitraryProperty) {
    const decl = `${property}: ${value}${importantSuffix}`;
    if (selector.includes("@media")) {
      return selector.replace(/ \}(?=[^}]*$)/, ` { ${decl}; } }`);
    }
    return `${selector} { ${decl}; }`;
  }

  const propertyMapping = ARBITRARY_PROPERTY_MAPPINGS[property];
  if (!propertyMapping) {
    return null;
  }

  let cssDeclarations: string;

  if (typeof propertyMapping === 'function') {
    const result = propertyMapping(value);
    if (!result) return null;
    // For function mappings (like px, py, mx, my), conditionally add !important
    cssDeclarations = addImportantToProperties(result, useImportant);
  } else {
    // For single property mappings, conditionally add !important
    const baseCSS = generateSpecialPropertyCSS(propertyMapping, property, value);
    cssDeclarations = useImportant ? `${baseCSS} !important` : baseCSS;
  }

  let selectorCore = selector;
  if (
    !isArbitraryProperty &&
    (property === 'divide-x' ||
      property === 'divide-y' ||
      property === 'divide')
  ) {
    // Append child combinator to the innermost class selector.
    selectorCore = selector.includes('{')
      ? selector // media-wrapped: leave as-is; divide children rarely use media+arbitrary together
      : `${selector}${DIVIDE_BETWEEN_CHILDREN_SUFFIX}`;
  }

  // buildSelector already wraps media variants as `@media … { .class }`.
  // Inject declarations inside that block (same contract as generateCSSRule).
  if (selectorCore.includes("@media")) {
    return selectorCore.replace(
      / \}(?=[^}]*$)/,
      ` { ${cssDeclarations}; } }`,
    );
  }

  return `${selectorCore} { ${cssDeclarations}; }`;
}

/**
 * Generate CSS for special properties with optimized handling
 */
function generateSpecialPropertyCSS(cssProperty: string, property: string, value: string): string {
  // Transform properties
  if (property.startsWith('scale') || property.startsWith('rotate') || 
      property.startsWith('translate') || property.startsWith('skew')) {
    return generateTransformCSS(property, value);
  }
  
  // Filter properties
  if (property.startsWith('blur') || property.startsWith('brightness') || 
      property.startsWith('contrast') || property.startsWith('grayscale') ||
      property.startsWith('hue-rotate') || property.startsWith('invert') ||
      property.startsWith('saturate') || property.startsWith('sepia') ||
      property.startsWith('drop-shadow')) {
    return generateFilterCSS(property, value);
  }
  
  // Backdrop filter properties
  if (property.startsWith('backdrop-')) {
    return generateBackdropFilterCSS(property, value);
  }
  
  // Box shadow (ring utilities)
  if (property.startsWith('ring')) {
    return generateRingCSS(property, value);
  }
  
  // Animation utilities
  if (property.startsWith('animate')) {
    return generateAnimationCSS(property, value);
  }
  
  // Aspect ratio (Tailwind: aspect-[16/9], aspect-[1.5] → ratio with spaces where applicable)
  if (property === 'aspect') {
    const slash = value.trim().match(/^(\d+)\/(\d+)$/);
    if (slash) {
      return `aspect-ratio: ${slash[1]} / ${slash[2]}`;
    }
    if (value.includes("/")) {
      return `aspect-ratio: ${value.trim()}`;
    }
    return `aspect-ratio: ${value.trim()} / 1`;
  }
  
  // Grid template columns/rows: single integer → repeat(N, minmax(0,1fr)); else full template (e.g. 200px 1fr 200px)
  if (property === 'grid-cols') {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0 && String(n) === value.trim()) {
      return `grid-template-columns: repeat(${n}, minmax(0, 1fr))`;
    }
    return `grid-template-columns: ${value}`;
  }
  if (property === 'grid-rows') {
    const n = parseInt(value, 10);
    if (!isNaN(n) && n > 0 && String(n) === value.trim()) {
      return `grid-template-rows: repeat(${n}, minmax(0, 1fr))`;
    }
    return `grid-template-rows: ${value}`;
  }
  
  // Default property mapping
  return `${cssProperty}: ${value}`;
}

/**
 * Generate optimized transform CSS
 */
function generateTransformCSS(property: string, value: string): string {
  const T = IUI_TRANSFORM_VAR_TEMPLATE;

  if (property === "translate-x") {
    return `--iui-translate-x: ${value}; transform: ${T}`;
  }
  if (property === "translate-y") {
    return `--iui-translate-y: ${value}; transform: ${T}`;
  }

  if (property === "rotate-x") {
    const v = value.includes("deg") ? value : `${value}deg`;
    return `--iui-rotate-x: ${v}; transform: ${T}`;
  }
  if (property === "rotate-y") {
    const v = value.includes("deg") ? value : `${value}deg`;
    return `--iui-rotate-y: ${v}; transform: ${T}`;
  }

  if (property === "rotate") {
    const v = value.includes("deg") ? value : `${value}deg`;
    return `--iui-rotate-z: ${v}; transform: ${T}`;
  }

  if (property === "scale") {
    return `--iui-scale-x: ${value}; --iui-scale-y: ${value}; transform: ${T}`;
  }
  if (property === "scale-x") {
    return `--iui-scale-x: ${value}; transform: ${T}`;
  }
  if (property === "scale-y") {
    return `--iui-scale-y: ${value}; transform: ${T}`;
  }

  if (property === "skew-x") {
    const v = value.includes("deg") ? value : `${value}deg`;
    return `--iui-skew-x: ${v}; transform: ${T}`;
  }
  if (property === "skew-y") {
    const v = value.includes("deg") ? value : `${value}deg`;
    return `--iui-skew-y: ${v}; transform: ${T}`;
  }

  return `transform: ${value}`;
}

/**
 * Generate optimized filter CSS
 */
function generateFilterCSS(property: string, value: string): string {
  const filterMap: Record<string, string> = {
    'blur': `blur(${value})`,
    'brightness': `brightness(${value})`,
    'contrast': `contrast(${value})`,
    'grayscale': `grayscale(${value})`,
    'hue-rotate': `hue-rotate(${value.includes('deg') ? value : value + 'deg'})`,
    'invert': `invert(${value})`,
    'saturate': `saturate(${value})`,
    'sepia': `sepia(${value})`,
    'drop-shadow': `drop-shadow(${value})`
  };
  
  const filterValue = filterMap[property];
  return filterValue ? `filter: ${filterValue}` : `filter: ${value}`;
}

/**
 * Generate optimized backdrop filter CSS
 */
function generateBackdropFilterCSS(property: string, value: string): string {
  const backdropProperty = property.replace('backdrop-', '');
  const filterCSS = generateFilterCSS(backdropProperty, value);
  return filterCSS.replace('filter:', 'backdrop-filter:');
}

/**
 * Generate optimized ring CSS
 * Tailwind CSS standard implementation for ring utilities
 * Returns properly formatted CSS declarations that can be used with !important
 */
function generateRingCSS(property: string, value: string): string {
  if (property === 'ring') {
    if (isArbitraryColorValue(value)) {
      return `--iui-ring-color: ${value}; box-shadow: 0 0 0 var(--iui-ring-width, 2px) ${value}`;
    }
    return `box-shadow: 0 0 0 ${value} var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  }
  if (property === 'ring-offset') {
    // This case should not be reached since ring-offset uses function mapping
    // But keep for backward compatibility
    return `--iui-ring-offset-width: ${value}; --iui-ring-offset-shadow: var(--iui-ring-inset) 0 0 0 var(--iui-ring-offset-width) var(--iui-ring-offset-color, #fff); box-shadow: var(--iui-ring-offset-shadow), var(--iui-ring-shadow, 0 0 0 calc(var(--iui-ring-width, 2px) + var(--iui-ring-offset-width)) var(--iui-ring-color, rgb(59 130 246 / 0.5)))`;
  }
  
  // Directional ring utilities
  if (property === 'ring-t') {
    return `box-shadow: 0 -${value} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  }
  if (property === 'ring-b') {
    return `box-shadow: 0 ${value} 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  }
  if (property === 'ring-s') {
    return `box-shadow: -${value} 0 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  }
  if (property === 'ring-e') {
    return `box-shadow: ${value} 0 0 0 var(--iui-ring-color, rgb(59 130 246 / 0.5))`;
  }
  const ringC = 'var(--iui-ring-color, rgb(59 130 246 / 0.5))';
  if (property === 'ring-x') {
    return `box-shadow: -${value} 0 0 0 ${ringC}, ${value} 0 0 0 ${ringC}`;
  }
  if (property === 'ring-y') {
    return `box-shadow: 0 -${value} 0 0 ${ringC}, 0 ${value} 0 0 ${ringC}`;
  }
  if (property === 'ring-bs') {
    return `box-shadow: 0 -${value} 0 0 ${ringC}`;
  }
  if (property === 'ring-be') {
    return `box-shadow: 0 ${value} 0 0 ${ringC}`;
  }

  return `box-shadow: ${value}`;
}

/**
 * Generate animation CSS for arbitrary values
 */
function generateAnimationCSS(property: string, value: string): string {
  if (property === 'animate') {
    return `animation: ${value}`;
  }
  if (property === 'animate-duration') {
    return `animation-duration: ${value}`;
  }
  if (property === 'animate-delay') {
    return `animation-delay: ${value}`;
  }
  if (property === 'animate-iteration') {
    return `animation-iteration-count: ${value}`;
  }
  if (property === 'animate-direction') {
    return `animation-direction: ${value}`;
  }
  if (property === 'animate-fill') {
    return `animation-fill-mode: ${value}`;
  }
  if (property === 'animate-play') {
    return `animation-play-state: ${value}`;
  }
  if (property === 'animate-ease') {
    return `animation-timing-function: ${value}`;
  }
  
  return `animation: ${value}`;
}

/**
 * Parse arbitrary class name with enhanced support for responsive prefixes
 */
function parseArbitraryClass(className: string): { property: string; value: string; isArbitraryProperty?: boolean; responsivePrefix?: string; important?: boolean } | null {
  // Extract responsive prefix if present using engine's breakpoints or arbitrary media
  const breakpointKeys = Object.keys(responsiveBreakpoints);
  let responsivePrefix: string | undefined;
  let baseClassName = className;

  // 1) Arbitrary media variant: [@media(...)]
  if (baseClassName.startsWith('[@media(')) {
    // Balanced parentheses scan to find closing )]:
    let depth = 1; // initial '('
    let endIndex = -1;
    for (let i = 8; i < baseClassName.length; i++) {
      const ch = baseClassName[i];
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0 && baseClassName[i + 1] === ']' && baseClassName[i + 2] === ':') {
          endIndex = i + 1; // position of ']'
          break;
        }
      }
    }
    if (endIndex !== -1) {
      // Extract between '[@media(' and ')]:'
      // endIndex is the position of ']', so substring(8, endIndex) gives content including the closing ')'
      let mediaContent = baseClassName.substring(8, endIndex).trim();
      // Remove the closing ')' since we'll wrap it in parentheses again
      if (mediaContent.endsWith(')')) {
        mediaContent = mediaContent.slice(0, -1).trim();
      }
      // Ensure content is wrapped in parentheses
      const normalized = mediaContent.startsWith('(') ? mediaContent : `(${mediaContent})`;
      responsivePrefix = `@media ${normalized}`;
      // Skip ']:' to get the remaining class name (trim any spaces)
      baseClassName = baseClassName.substring(endIndex + 2).trim();
    }
  }

  if (!responsivePrefix) {
    for (const prefix of breakpointKeys) {
      if (baseClassName.startsWith(`${prefix}:`)) {
        responsivePrefix = prefix;
        baseClassName = baseClassName.substring(prefix.length + 1).trim();
        break;
      }
    }
  }
  
  // Trim baseClassName to ensure clean parsing
  baseClassName = baseClassName.trim();
  
  // Check for arbitrary properties first: [property:value]
  const arbitraryPropertyMatch = baseClassName.match(/^\[([a-z-]+):(.+)\]$/);
  if (arbitraryPropertyMatch) {
    const [, property, value] = arbitraryPropertyMatch;
    return { 
      property, 
      value: processArbitraryValue(value), 
      isArbitraryProperty: true,
      responsivePrefix
    };
  }
  
  // Enhanced regex for complex prefixes with negative support (Tailwind reference)
  // Tailwind canonical: prefix the class with a dash → -utility-[value] (e.g. -z-[1], -translate-x-[4px])
  // Also supported: negative inside brackets → utility-[-value] (e.g. z-[-1], outline-offset-[-2rem])
  const negativePrefix = baseClassName.startsWith('-');
  const classToMatch = negativePrefix ? baseClassName.slice(1) : baseClassName;

  const bracketMatch = classToMatch.match(/^([a-z]+(?:-[a-z]+)*)-\[(.+)\]$/);
  if (bracketMatch) {
    const [, property, rawValue] = bracketMatch;

    // Tailwind: leading dash makes value negative; both -z-[1] and z-[-1] → z-index: -1
    let value = rawValue;
    if (negativePrefix) {
      value = value.startsWith('-') ? value : '-' + value;
    }

    const processedValue = processArbitraryValue(value);

    return {
      property,
      value: processedValue,
      isArbitraryProperty: false,
      responsivePrefix,
    };
  }

  // Tailwind v4: utility-(--token) CSS variable shorthand
  // blur/backdrop-blur → blur(var(--token)); others (e.g. font-features) → var(--token)
  const parenMatch = classToMatch.match(/^([a-z]+(?:-[a-z]+)*)-\(([^)]*)\)$/);
  if (parenMatch) {
    const [, property, rawInner] = parenMatch;
    const inner = rawInner.trim();
    if (!inner) return null;

    const isBlurParen = property === "backdrop-blur" || property === "blur";
    const mapping = ARBITRARY_PROPERTY_MAPPINGS[property as keyof typeof ARBITRARY_PROPERTY_MAPPINGS];
    if (!isBlurParen && typeof mapping !== "string") return null;

    const wrapped = /^var\(/i.test(inner)
      ? inner
      : /^\d+(\.\d+)?(px|rem|em|%|vh|vw|vmin|vmax)?$/i.test(inner)
        ? inner
        : inner.startsWith("--")
          ? `var(${inner})`
          : `var(--${inner.replace(/^-+/, "")})`;
    return {
      property,
      value: wrapped,
      isArbitraryProperty: false,
      responsivePrefix,
    };
  }

  return null;
}

export function generateArbitraryCSSValue(className: string): string | null {
  // Strip dark:/hover:/md:… with the same variant parser as the utility engine,
  // then resolve arbitrary value CSS and wrap with buildSelector.
  const { baseClass, variants, important } = parseVariants(className);
  const parsed = parseArbitraryClass(baseClass);
  if (!parsed) {
    return null;
  }
  return generateOptimizedCSS(
    className,
    parsed.property,
    parsed.value,
    parsed.isArbitraryProperty,
    variants,
    important || parsed.important,
  );
}

/**
 * Manual processing function for testing/debugging
 */

export function getSupportedPrefixes(): string[] {
  return Object.keys(ARBITRARY_PROPERTY_MAPPINGS);
}

/**
 * Validate if a value is a valid CSS unit
 */
export function isValidCSSUnit(value: string): boolean {
  return Object.values(CSS_UNIT_PATTERNS).some(pattern => pattern.test(value));
}


function escapeClassName(name: string): string {
  // Escape any character that is not a letter, number, underscore, or hyphen
  // This covers @, [, ], :, ., #, %, (, ), /, commas, spaces, etc.
  return name.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

