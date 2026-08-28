import { ClassValue, clsx } from "clsx";
import { type VariantProps, cva } from "class-variance-authority";
import {
  COLOR_TOKEN_SOURCE,
  COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE,
  GRADIENT_STOP_TOKEN_SOURCE,
} from "./color-token-utils";

/**
 * IUI Design System Class Utility - Similar to twmerge but for IUI tokens
 *
 * This utility provides intelligent class merging for the IUI design system,
 * automatically resolving conflicts between utility classes while preserving
 * responsive variants, state modifiers, and proper specificity.
 *
 * Features:
 * - Intelligent conflict resolution for utility classes
 * - Support for responsive breakpoints (sm:, md:, lg:, xl:, 2xl:)
 * - Support for state variants (hover:, focus:, active:, etc.)
 * - Nested variant support (sm:hover:bg-blue-500)
 * - Theme variant support (dark:, light:, high-contrast:)
 * - Component-focused utility helpers
 */

/**
 * TokenCategory defines all utility class categories in the IUI design system.
 * Based on actual analysis of all utilities.css files in the tokens folder.
 */
export type TokenCategory =
  // Colors - most comprehensive category
  | "text-color" // text-{color}-{shade}
  | "bg-color" // bg-{color}-{shade}
  | "border-color" // border-{color}-{shade} and directional variants
  | "border-t-color"
  | "border-b-color"
  | "border-inline-start-color"
  | "border-inline-end-color"
  | "border-block-start-color" // border-bs-* (Tailwind v4)
  | "border-block-end-color"
  | "border-x-color"
  | "border-y-color" // Added missing directional colors
  | "accent-color"
  | "caret-color" // Added accent and caret colors
  | "decoration-color" // Text decoration color
  | "ring-color"
  | "ring-offset-color" // Ring utilities
  | "ring" // Default ring utility

  // Typography
  | "font-size" // text-xs through text-9xl
  | "font-weight" // font-thin … font-regular … font-black, font-100 … font-900 (IUI: weight 400 = font-regular)
  | "font-family" // font-{family}
  | "font-style" // italic, not-italic
  | "font-variant-numeric" // normal-nums, ordinal, slashed-zero, etc.
  | "font-feature-settings" // font-feature-normal, font-feature-liga, … (OpenType)
  | "font-smoothing" // antialiased, subpixel-antialiased (Tailwind)
  | "line-height" // leading-*
  | "letter-spacing" // tracking-*
  | "text-align" // text-start, text-end, text-center, text-justify (no text-left / text-right)
  | "text-decoration" // underline, line-through, etc.
  | "text-decoration-style" // decoration-solid, decoration-dashed, etc.
  | "text-decoration-thickness" // decoration-auto, decoration-from-font, etc.
  | "text-underline-offset" // underline-offset-*
  | "text-transform" // text-transform-{none|uppercase|lowercase|capitalize|sentencecase}
  | "text-overflow" // truncate, text-ellipsis, text-clip
  | "line-clamp" // line-clamp-1 … line-clamp-999, line-clamp-none
  | "text-indent" // indent-*
  | "vertical-align" // align-baseline, align-top, etc.
  | "whitespace" // whitespace-*
  | "word-break" // break-normal, break-all, break-keep (Tailwind word-break)
  | "overflow-wrap" // break-words, wrap-anywhere, wrap-normal
  | "hyphens" // hyphens-none, hyphens-manual, hyphens-auto

  // Layout & Display
  | "display" // block, flex, grid, etc.
  | "position" // static, relative, absolute, etc.
  | "position-value" // position-static, position-relative, etc.
  | "top"
  | "end"
  | "bottom"
  | "start"
  | "inset" // positioning values
  | "inset-x"
  | "inset-y" // inset directional utilities
  | "float" // float-start, float-end, etc.
  | "clear" // clear-start, clear-end, etc.
  | "isolation" // isolate, isolation-auto
  | "visibility" // visible, invisible, collapse
  | "overflow" // overflow-visible, overflow-hidden, etc.
  | "overflow-x"
  | "overflow-y" // directional overflow
  | "writing-mode" // writing-horizontal-tb, writing-vertical-es, writing-sideways-es, etc.
  | "overscroll"
  | "overscroll-x"
  | "overscroll-y" // overscroll behavior

  // Box Model
  | "box-sizing" // box-border, box-content
  | "none" // display: none

  // Flexbox
  | "flex-direction" // flex-row, flex-column, etc.
  | "flex-wrap" // flex-wrap, flex-nowrap, etc.
  | "flex-grow"
  | "flex-shrink"
  | "flex-basis"
  | "flex"
  | "grow"
  | "shrink" // flex-grow/shrink shortcuts
  | "order" // order-*
  | "justify-content"
  | "justify-items"
  | "justify-self"
  | "align-content"
  | "align-items"
  | "align-self"
  | "place-content"
  | "place-items"
  | "place-self"
  | "gap"
  | "gap-x"
  | "gap-y"
  | "space-x-reverse"
  | "space-y-reverse" // space reverse utilities

  // Grid
  | "grid-template-columns"
  | "grid-template-rows"
  | "grid-column"
  | "grid-row"
  | "grid-auto-flow"
  | "grid-auto-columns"
  | "grid-auto-rows"
  | "grid-column-start"
  | "grid-column-end"
  | "grid-row-start"
  | "grid-row-end"

  // Spacing (based on actual token patterns)
  | "m"
  | "mt"
  | "me"
  | "mb"
  | "ms"
  | "mbs"
  | "mbe"
  | "mx"
  | "my" // margin
  | "p"
  | "pt"
  | "pe"
  | "pb"
  | "ps"
  | "pbs"
  | "pbe"
  | "px"
  | "py" // padding
  | "space-x"
  | "space-y" // space between children

  // Scroll spacing
  | "scroll-m"
  | "scroll-mt"
  | "scroll-me"
  | "scroll-mb"
  | "scroll-ms"
  | "scroll-mx"
  | "scroll-my"
  | "scroll-p"
  | "scroll-pt"
  | "scroll-pe"
  | "scroll-pb"
  | "scroll-ps"
  | "scroll-px"
  | "scroll-py"

  // Dimensions
  | "width" // w-0, w-1, etc.
  | "height" // h-0, h-1, etc.
  | "size" // size-* — width and height together
  | "min-width"
  | "max-width"
  | "min-height"
  | "max-height"
  | "inline-size"
  | "min-inline-size"
  | "max-inline-size"
  | "block-size"
  | "min-block-size"
  | "max-block-size"
  | "font-stretch"

  // Borders
  | "border-width" // border, border-0, border-2, etc.
  | "border-t-width"
  | "border-b-width"
  | "border-x-width"
  | "border-y-width" // Added missing directional widths
  | "border-s-width" // border-s-* → border-inline-start-width
  | "border-e-width" // border-e-* → border-inline-end-width
  | "border-bs-width" // border-bs-* → border-block-start-width (Tailwind v4)
  | "border-be-width"
  | "border-style" // border-solid, border-dashed, etc.
  | "border-t-style"
  | "border-b-style"
  | "border-x-style"
  | "border-y-style" // Added missing directional styles
  | "border-s-style" // border-s-solid, …
  | "border-e-style" // border-e-dashed, …
  | "border-bs-style" // border-bs-solid, …
  | "border-be-style"
  | "border-radius" // rounded, rounded-lg, etc.
  | "border-radius-t"
  | "border-radius-b"
  // Logical corners (replace physical tl/tr/bl/br)
  | "border-radius-ts" // top-start
  | "border-radius-te" // top-end
  | "border-radius-bs" // bottom-start
  | "border-radius-be" // bottom-end
  | "border-radius-s"
  | "border-radius-e" // Added logical border radius
  | "border-radius-ss" // Logical corner radius (start-start) / Tailwind v4: rounded-ss
  | "border-radius-se" // start-end
  | "border-radius-es" // end-start
  | "border-radius-ee" // end-end
  | "divide-width"
  | "divide-style"
  | "divide-color"
  | "divide-x-reverse"
  | "divide-y-reverse"
  | "ring-width"
  | "ring-offset-width" // Added ring utilities
  | "ring-t"
  | "ring-b"
  | "ring-s" // Inline-start ring
  | "ring-e" // Inline-end ring
  | "ring-bs" // Block-start ring (horizontal-tb ≈ ring-t)
  | "ring-be" // Block-end ring (≈ ring-b)
  | "ring-x" // Axis ring: inline-start + inline-end (same --iui-ring-color)
  | "ring-y" // Axis ring: top + bottom edges

  // Effects
  | "box-shadow" // shadow-sm, shadow-lg, etc.
  | "shadow-color" // shadow-{color}-{shade}
  | "shadow-t"
  | "shadow-e"
  | "shadow-b"
  | "shadow-s" // Inline-start / inline-end directional shadows
  | "shadow-t-color"
  | "shadow-e-color"
  | "shadow-b-color"
  | "shadow-s-color"
  | "opacity" // opacity-0 through opacity-100
  | "mix-blend-mode" // mix-blend-normal, mix-blend-multiply, etc.
  | "background-blend-mode"
  | "text-shadow" // text-shadow utilities
  | "mask-clip"
  | "mask-composite"
  | "mask-image"
  | "mask-mode"
  | "mask-origin"
  | "mask-position"
  | "mask-repeat"
  | "mask-size"
  | "mask-type"

  // Filters
  | "filter" // Basic filter
  | "blur"
  | "brightness"
  | "contrast"
  | "grayscale"
  | "hue-rotate"
  | "invert"
  | "saturate"
  | "sepia"
  | "drop-shadow"
  | "backdrop-filter" // Backdrop filters
  | "backdrop-blur"
  | "backdrop-brightness"
  | "backdrop-contrast"
  | "backdrop-grayscale"
  | "backdrop-hue-rotate"
  | "backdrop-invert"
  | "backdrop-opacity"
  | "backdrop-saturate"
  | "backdrop-sepia"

  // Background
  | "background-attachment" // attachment-scroll, attachment-fixed, etc.
  | "background-clip" // clip-border-box, clip-padding-box, etc.
  | "background-origin" // origin-border-box, etc.
  | "background-position"
  | "background-repeat"
  | "background-size"
  | "background-image"
  | "gradient-from"
  | "gradient-via"
  | "gradient-to"
  | "bg-gradient" // Background gradient utilities
  | "text-gradient" // Text gradient utilities

  // Transforms
  | "scale"
  | "scale-x"
  | "scale-y" // scale-0, scale-50, etc.
  | "rotate" // rotate-0, rotate-45, etc.
  | "rotate-x" // rotate-x-45 → rotateX (3D), composes with rotate-y via CSS vars
  | "rotate-y"
  | "translate-x"
  | "translate-y" // translate-x-0, translate-y-0, etc.
  | "skew-x"
  | "skew-y" // skew-x-0, skew-y-0, etc.
  | "transform-origin" // origin-center, origin-top, etc.
  | "transform-style" // style-flat, style-preserve-3d
  | "backface-visibility" // backface-visible, backface-hidden
  | "perspective" // perspective-none, perspective-{n}
  | "perspective-origin" // perspective-origin-*

  // Transitions & Animations
  | "transition-property"
  | "transition-duration"
  | "transition-timing"
  | "transition-delay"
  | "transition-behavior"
  | "animation" // animate-spin, animate-ping, etc.
  | "animation-duration" // duration-75, duration-100, etc.
  | "animation-delay" // delay-75, delay-100, etc.
  | "animation-iteration-count" // animate-iteration-1, animate-iteration-infinite, etc.
  | "animation-direction" // animate-direction-normal, animate-direction-reverse, etc.
  | "animation-fill-mode" // animate-fill-none, animate-fill-forwards, etc.
  | "animation-play-state" // animate-play-running, animate-play-paused, etc.
  | "animation-timing-function" // animate-ease-linear, animate-ease-in, etc.

  // Interactivity
  | "appearance" // appearance-none, appearance-auto, etc.
  | "cursor" // cursor-pointer, cursor-default, etc.
  | "outline" // outline-focus, outline-danger, etc. (semantic extensions)
  | "outline-hidden" // Tailwind v4: transparent outline for forced-colors
  | "outline-width"
  | "outline-style"
  | "outline-color"
  | "outline-offset"
  | "pointer-events"
  | "resize"
  | "select" // user-select
  | "touch-action"
  | "user-select"

  // SVG
  | "fill"
  | "fill-color" // fill-none, fill-current + fill-{color}-{shade}
  | "stroke"
  | "stroke-color"
  | "stroke-width"
  | "stroke-linecap"
  | "stroke-linejoin"
  | "stroke-dasharray"

  // Tables
  | "border-collapse"
  | "border-spacing"
  | "border-spacing-x"
  | "border-spacing-y"
  | "table-layout"
  | "caption-side"

  // Lists — Tailwind-aligned + IUI extensions (see list-style-contract.ts)
  | "list-style-type" // `list-style-type-*` long-form
  | "list-style-type-ordered" // `list-decimal`, `list-upper-roman`, compounds, …
  | "list-style-type-unordered" // `list-disc`, `list-none`, symbol markers
  | "list-marker-suffix" // `list-period`, `list-parentheses`, `list-double-parentheses` (compose with system)
  | "list-style-position"
  | "list-style-image" // list-image-none, list-image-[…] (arbitrary)

  // Sizing & Aspect Ratio
  | "aspect-ratio" // aspect-square, aspect-landscape, etc.
  | "container" // container-xs, container-sm, etc.
  | "object-fit"
  | "object-position"

  // Scroll
  | "scroll-behavior" // scroll-auto, scroll-smooth
  | "scroll-snap-type"
  | "scroll-snap-align"
  | "scroll-snap-stop"
  | "scrollbar-gutter"
  | "scrollbar-width"
  | "scrollbar-color"

  // Layout Break
  | "break-before"
  | "break-after"
  | "break-inside"

  // Z-index
  | "z-index" // z-0, z-10, z-20, etc.

  // Content utilities
  | "content" // content-none, content-['text']

  // Text utilities
  | "text-wrap" // text-wrap, text-nowrap, text-balance, text-pretty
  | "text-orientation" // text-orientation-mixed, text-orientation-upright, text-orientation-sideways

  // Columns (CSS Multi-column Layout)
  | "columns" // columns-1, columns-2, etc.
  | "column-width" // theme widths + spacing scale / numeric (same length tokens as gap), auto
  | "column-fill" // column-fill-auto, column-fill-balance
  | "column-gap" // gap between columns
  | "column-rule" // column-rule-{none|thin|medium|thick} → column-rule-width (none→0, not shorthand — avoids resetting style/color)
  | "column-rule-type" // column-rule-style (solid, dashed, …)
  | "column-rule-color" // column-rule-color (theme + opacity)
  | "column-span" // column-span-none, column-span-all

  // Box decoration break
  | "box-decoration-break" // decoration-slice, decoration-clone

  // Will change
  | "will-change" // will-change utilities for performance

  // Forced colors
  | "forced-color-adjust" // forced-color-adjust utilities

  // Container queries
  | "container-type" // container-type utilities
  | "container-name" // container-name utilities

  // Special utilities
  | "tooltip" // Special tooltip utilities
  | "sr-only" // Screen reader only
  | "not-sr-only";

// --- `list-*` — shared with parser; definitions in list-style-contract.ts ---

import {
  LIST_ORDERED_REST_SOURCE,
  LIST_ORDERED_SUFFIX_SOURCE,
  LIST_UNORDERED_REST_SOURCE,
  LIST_ORDERED_REST_RE,
  LIST_UNORDERED_REST_RE,
} from "../engine/utilities/list-style-contract";

export {
  LIST_ORDERED_REST_SOURCE,
  LIST_ORDERED_SUFFIX_SOURCE,
  LIST_UNORDERED_REST_SOURCE,
  LIST_ORDERED_REST_RE,
  LIST_UNORDERED_REST_RE,
};

/**
 * Token patterns define the regular expressions used to identify and categorize CSS class names.
 * Each pattern corresponds to a specific TokenCategory and matches the naming convention
 * used in our IUI design system's CSS utility classes.
 *
 * Based on comprehensive analysis of all utilities.css files in the tokens folder.
 * Patterns are optimized for the actual IUI token structure and naming conventions.
 *
 * **List markers (`list-*`) — Tailwind-aligned + IUI extensions:**
 * - **`list-style-type-unordered`** — TW: `list-none`, `list-disc`; IUI: `list-square`, symbols
 * - **`list-style-type-ordered`** — TW: `list-decimal`; IUI: `list-upper-roman`, compounds, …
 * - **`list-marker-suffix`** — composable: `list-period`, `list-parentheses`, `list-double-parentheses`
 *   (combine with a system class, e.g. `list-decimal list-parentheses`)
 * - **`list-style-position`** — TW: `list-inside`, `list-outside`
 * - **`list-style-image`** — TW: `list-image-none`
 */
const tokenPatterns: Record<TokenCategory, RegExp> = {
  // Colors - comprehensive color system with all available shades and semantic colors
  // Supports Tailwind-style opacity modifiers (e.g. slash-30, slash-50).
  // More-specific color prefixes MUST come before shorter ones so
  // `border-t-red-500` is not classified as `border-` + `t-red-500`.
  "decoration-color": new RegExp(
    `^(?:decoration-|text-decoration-color-)${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`,
  ),
  "border-t-color": new RegExp(`^border-t-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-b-color": new RegExp(`^border-b-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-inline-start-color": new RegExp(`^border-s-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-inline-end-color": new RegExp(`^border-e-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-block-start-color": new RegExp(`^border-bs-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-block-end-color": new RegExp(`^border-be-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-x-color": new RegExp(`^border-x-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-y-color": new RegExp(`^border-y-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "ring-offset-color": new RegExp(`^ring-offset-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "shadow-t-color": new RegExp(`^shadow-t-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "shadow-e-color": new RegExp(`^shadow-e-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "shadow-b-color": new RegExp(`^shadow-b-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "shadow-s-color": new RegExp(`^shadow-s-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "text-color": new RegExp(`^text-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "bg-color": new RegExp(`^bg-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "border-color": new RegExp(`^border-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "accent-color": new RegExp(`^accent-(?:auto|${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE})$`),
  "caret-color": new RegExp(`^caret-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "ring-color": new RegExp(`^ring-(?:(?:x|y|s|e|bs|be|t|b)-)?${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "shadow-color": new RegExp(`^shadow-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "ring": /^ring$/,

  // Typography
  "font-size":
    /^text-(2xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|\d+(\.\d+)?)$/,
  "font-weight":
    /^font-(thin|extralight|light|regular|medium|semibold|bold|extrabold|black|[1-9]00)$/,
  "font-family":
    /^font-(inter|arial|mono|sans|serif|system|ui|sans-serif|system-ui|ui-sans-serif)$/,
  "font-style": /^(italic|not-italic)$/,
  "font-variant-numeric":
    /^(normal-nums|ordinal|slashed-zero|lining-nums|oldstyle-nums|proportional-nums|tabular-nums|diagonal-fractions|stacked-fractions)$/,
  "font-smoothing": /^(antialiased|subpixel-antialiased)$/,
  "font-feature-settings": /^font-feature-[a-z][a-z0-9-]*$/,
  "font-stretch":
    /^font-stretch-(ultra-condensed|extra-condensed|condensed|semi-condensed|normal|semi-expanded|expanded|extra-expanded|ultra-expanded|\d+(?:\.\d+)?%)$/,
  "line-height":
    /^leading-(none|tight|snug|normal|relaxed|loose|3|4|5|6|7|8|9|10|\d+(\.\d+)?)$/,
  "letter-spacing":
    /^tracking-(tighter|tight|normal|wide|wider|widest|-?\d+(\.\d+)?)$/,
  "text-align": /^text-(center|justify|start|end)$/,
  "text-decoration": /^(underline|overline|line-through|no-underline)$/,
  "text-decoration-style": /^decoration-(solid|double|dotted|dashed|wavy)$/,
  "text-decoration-thickness": /^decoration-(auto|from-font|0|\d+(\.\d+)?)$/,
  "text-underline-offset": /^underline-offset-(auto|0|\d+(\.\d+)?)$/,
  "text-transform":
    /^text-transform-(none|uppercase|lowercase|capitalize|sentencecase)$/,
  "text-overflow": /^(truncate|text-ellipsis|text-clip)$/,
  // Integers 1–999 (same as parser); decimals invalid for -webkit-line-clamp
  "line-clamp": /^line-clamp-(none|[1-9]\d{0,2})$/,
  "overflow-wrap": /^(break-words|wrap-anywhere|wrap-normal)$/,
  "text-indent":
    /^(-?)indent-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "vertical-align":
    /^align-(baseline|top|middle|bottom|text-top|text-bottom|sub|super)$/,
  whitespace: /^whitespace-(normal|nowrap|pre|pre-line|pre-wrap|break-spaces)$/,
  "word-break": /^break-(normal|all|keep)$/,
  hyphens: /^hyphens-(none|manual|auto)$/,

  // Layout & Display - enhanced pattern
  display:
    /^(block|inline-block|inline|flex|inline-flex|table|inline-table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row-group|table-row|flow-root|grid|inline-grid|contents|list-item|hidden|none)$/,
  position: /^position-(static|fixed|absolute|relative|sticky)$/,
  "position-value": /^(static|fixed|absolute|relative|sticky)$/,
  top: /^(-?)top-(.+)$/,
  end: /^(-?)end-(.+)$/,
  bottom: /^(-?)bottom-(.+)$/,
  start: /^(-?)start-(.+)$/,
  inset: /^(-?)inset-(.+)$/,
  "inset-x": /^(-?)inset-x-(.+)$/,
  "inset-y": /^(-?)inset-y-(.+)$/,
  float: /^float-(start|end|none)$/,
  clear: /^clear-(start|end|both|none)$/,
  isolation: /^(isolate|isolation-auto)$/,
  visibility: /^(visible|invisible|collapse)$/,
  overflow: /^overflow-(type-)?(visible|hidden|clip|scroll|auto)$/,
  "overflow-x": /^overflow-x-(visible|hidden|clip|scroll|auto)$/,
  "overflow-y": /^overflow-y-(visible|hidden|clip|scroll|auto)$/,
  "writing-mode": /^writing-(horizontal-tb|vertical-es|vertical-se|sideways-es|sideways-se|vertical-rl|vertical-lr|sideways-rl|sideways-lr|initial|inherit|unset)$/,
  overscroll: /^overscroll-(auto|contain|none)$/,
  "overscroll-x":
    /^overscroll-x-(auto|contain|none)$/,
  "overscroll-y":
    /^overscroll-y-(auto|contain|none)$/,

  // Box Model
  "box-sizing": /^box-(border|content)$/,

  // Flexbox
  "flex-direction": /^flex-(row|row-reverse|column|column-reverse)$/,
  "flex-wrap": /^flex-(wrap|wrap-reverse|nowrap)$/,
  "flex-grow": /^flex-grow(-0)?$/,
  "flex-shrink": /^flex-shrink(-0)?$/,
  "flex-basis": /^basis-(auto|full|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12)$/,
  flex: /^flex-(1|auto|initial|none)$/,
  order: /^order-(none|1|2|3|4|5|6|7|8|9|10|11|12|first|last|\d+(\.\d+)?)$/,
  "justify-content":
    /^justify-(normal|start|end|end-safe|center|center-safe|between|around|evenly|stretch)$/,
  "justify-items": /^justify-items-(normal|start|end|end-safe|center|center-safe|stretch)$/,
  "justify-self": /^justify-self-(auto|normal|start|end|end-safe|center|center-safe|stretch)$/,
  "align-content":
    /^content-(normal|start|end|center|between|around|evenly|baseline|stretch)$/,
  "align-items": /^items-(start|end|end-safe|center|center-safe|baseline|baseline-last|stretch)$/,
  "align-self": /^self-(auto|start|end|end-safe|center|center-safe|stretch|baseline|baseline-last)$/,
  "place-content":
    /^place-content-(center|center-safe|start|end|end-safe|between|around|evenly|baseline|stretch)$/,
  "place-items": /^place-items-(normal|start|end|end-safe|center|center-safe|baseline|stretch)$/,
  "place-self": /^place-self-(auto|normal|start|end|end-safe|center|center-safe|stretch|baseline)$/,
  gap: /^gap-(none|normal|sm|md|lg|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "gap-x": /^gap-x-(none|normal|sm|md|lg|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "gap-y": /^gap-y-(none|normal|sm|md|lg|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "space-x-reverse": /^space-x-reverse$/,
  "space-y-reverse": /^space-y-reverse$/,

  // Grid - enhanced with subgrid
  "grid-template-columns":
    /^grid-cols-(none|subgrid|1|2|3|4|5|6|7|8|9|10|11|12|\d+)$/,
  "grid-template-rows": /^grid-rows-(none|subgrid|1|2|3|4|5|6|\d+)$/,
  "grid-column":
    /^col-(auto|span-(?:full|[1-9]\d*)|start-1|start-2|start-3|start-4|start-5|start-6|start-7|start-8|start-9|start-10|start-11|start-12|start-13|start-auto|end-1|end-2|end-3|end-4|end-5|end-6|end-7|end-8|end-9|end-10|end-11|end-12|end-13|end-auto)$/,
  "grid-row":
    /^row-(auto|span-(?:full|[1-9]\d*)|start-1|start-2|start-3|start-4|start-5|start-6|start-7|start-auto|end-1|end-2|end-3|end-4|end-5|end-6|end-7|end-auto)$/,
  // Note: col-span-[n] / row-span-[n] resolve via categoryFromDynamicUtility
  "grid-auto-flow": /^grid-flow-(row|col|dense|row-dense|col-dense)$/,
  "grid-auto-columns": /^auto-cols-(auto|min|max|fr)$/,
  "grid-auto-rows": /^auto-rows-(auto|min|max|fr)$/,
  "grid-column-start": /^col-start-(1|2|3|4|5|6|7|8|9|10|11|12|13|auto)$/,
  "grid-column-end": /^col-end-(1|2|3|4|5|6|7|8|9|10|11|12|13|auto)$/,
  "grid-row-start": /^row-start-(1|2|3|4|5|6|7|auto)$/,
  "grid-row-end": /^row-end-(1|2|3|4|5|6|7|auto)$/,

  // Spacing - using actual IUI token values (supports negative values via hyphen prefix)
  // IMPORTANT: Check directional patterns BEFORE general ones to avoid misclassification
  mt: /^(-?)mt-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  me: /^(-?)me-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  mb: /^(-?)mb-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  ms: /^(-?)ms-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  mbs: /^(-?)mbs-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  mbe: /^(-?)mbe-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  mx: /^(-?)mx-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  my: /^(-?)my-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  m: /^(-?)m-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  pt: /^pt-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  pe: /^pe-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  pb: /^pb-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  ps: /^ps-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  pbs: /^pbs-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  pbe: /^pbe-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  px: /^px-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  py: /^py-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  p: /^p-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "space-x":
    /^(-?)space-x-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|reverse|\d+(\.\d+)?)$/,
  "space-y":
    /^(-?)space-y-(px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|reverse|\d+(\.\d+)?)$/,

  // Scroll spacing
  // Scroll spacing - comprehensive coverage (negative scroll-margin supported)
  "scroll-m":
    /^(-?)scroll-m-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-mt":
    /^(-?)scroll-mt-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-me":
    /^(-?)scroll-me-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-mb":
    /^(-?)scroll-mb-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-ms":
    /^(-?)scroll-ms-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-mx":
    /^(-?)scroll-mx-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-my":
    /^(-?)scroll-my-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-p":
    /^scroll-p-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-pt":
    /^scroll-pt-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-pe":
    /^scroll-pe-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-pb":
    /^scroll-pb-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-ps":
    /^scroll-ps-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-px":
    /^scroll-px-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "scroll-py":
    /^scroll-py-(0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,

  // Dimensions - using actual IUI dimension tokens (Tailwind-style: any numeric + decimal, e.g. w-4.5, h-10.5)
  width:
    /^w-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  height:
    /^h-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  size:
    /^size-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  "min-width":
    /^min-w-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  "max-width":
    /^max-w-(none|auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|min|max|fit|prose|screen|screen-sm|screen-md|screen-lg|screen-xl|screen-2xl|dvw|dvh|lvw|lvh|svw|svh)$/,
  "min-height":
    /^min-h-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  "max-height":
    /^max-h-(none|auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  // Logical sizing (Tailwind v4): inline-*, min-inline-*, max-inline-*, block-*, min-block-*, max-block-*
  "inline-size":
    /^inline-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  "min-inline-size":
    /^min-inline-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  "max-inline-size":
    /^max-inline-(none|auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|min|max|fit|prose|screen|screen-sm|screen-md|screen-lg|screen-xl|screen-2xl|3xs|2xs|dvw|dvh|lvw|lvh|svw|svh)$/,
  "block-size":
    /^block-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  "min-block-size":
    /^min-block-(auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,
  "max-block-size":
    /^max-block-(none|auto|px|0|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|1\/12|2\/12|3\/12|4\/12|5\/12|6\/12|7\/12|8\/12|9\/12|10\/12|11\/12|full|screen|min|max|fit|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|prose|dvw|dvh|lvw|lvh|svw|svh)$/,

  // Borders — bare `border` = 1px width (Tailwind); `border-2`, `border-[3px]` share the group
  "border-width": /^border(?:-(\d+(\.\d+)?|default))?$/,
  "border-t-width": /^border-t(?:-(\d+(\.\d+)?))?$/,
  "border-b-width": /^border-b(?:-(\d+(\.\d+)?))?$/,
  "border-x-width": /^border-x(?:-(\d+(\.\d+)?))?$/,
  "border-y-width": /^border-y(?:-(\d+(\.\d+)?))?$/,
  "border-s-width": /^border-s(?:-(\d+(\.\d+)?))?$/,
  "border-e-width": /^border-e(?:-(\d+(\.\d+)?))?$/,
  "border-bs-width": /^border-bs(?:-(\d+(\.\d+)?))?$/,
  "border-be-width": /^border-be(?:-(\d+(\.\d+)?))?$/,
  "border-style":
    /^border-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-t-style":
    /^border-t-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-b-style":
    /^border-b-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-x-style":
    /^border-x-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-y-style":
    /^border-y-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-s-style":
    /^border-s-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-e-style":
    /^border-e-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-bs-style":
    /^border-bs-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-be-style":
    /^border-be-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "border-radius":
    /^rounded(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-t":
    /^rounded-t(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-b":
    /^rounded-b(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-ts":
    /^rounded-ts(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-te":
    /^rounded-te(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-bs":
    /^rounded-bs(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-be":
    /^rounded-be(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-s":
    /^rounded-s(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-e":
    /^rounded-e(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-ss":
    /^rounded-(ss|ts)(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-se":
    /^rounded-(se|te)(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-es":
    /^rounded-(es|bs)(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "border-radius-ee":
    /^rounded-(ee|be)(-none|-xs|-sm|-md|-lg|-xl|-2xl|-3xl|-4xl|-full)?$/,
  "divide-x-reverse": /^divide-x-reverse$/,
  "divide-y-reverse": /^divide-y-reverse$/,
  "divide-style":
    /^divide-(solid|dashed|dotted|double|hidden|none|(x|y)-(solid|dashed|dotted|double|hidden|none))$/,
  "divide-width": /^divide-(x|y)(-[\w.]+)?$/,
  // Any divide-* that is not width axis, reverse, or style (colors use full palette + opacity)
  "divide-color":
    /^divide-(?!x-reverse$|y-reverse$)(?!(x|y)$)(?!(x|y)-[\w.]+$)(?!(solid|dashed|dotted|double|hidden|none)$).+$/,
  "ring-width": /^(?:ring-(\d+(\.\d+)?|inset)|inset-ring)$/,
  "ring-offset-width": /^ring-offset-(\d+(\.\d+)?)$/,
  "ring-t": /^ring-t-(\d+(\.\d+)?)$/,
  "ring-b": /^ring-b-(\d+(\.\d+)?)$/,
  "ring-s": /^ring-s-(\d+(\.\d+)?)$/,
  "ring-e": /^ring-e-(\d+(\.\d+)?)$/,
  "ring-bs": /^ring-bs-(\d+(\.\d+)?)$/,
  "ring-be": /^ring-be-(\d+(\.\d+)?)$/,
  "ring-x": /^ring-x-(\d+(\.\d+)?)$/,
  "ring-y": /^ring-y-(\d+(\.\d+)?)$/,

  // Effects
  "box-shadow":
    /^shadow-(2xs|xs|sm|md|lg|xl|2xl|inset-2xs|inset-xs|inset-sm|inset-md|inset-lg|inset-xl|inset-2xl|inner|none)$/,
  "shadow-t": /^shadow-t-(2xs|xs|sm|md|lg|xl|2xl|none)$/,
  "shadow-e": /^shadow-e-(2xs|xs|sm|md|lg|xl|2xl|none)$/,
  "shadow-b": /^shadow-b-(2xs|xs|sm|md|lg|xl|2xl|none)$/,
  "shadow-s": /^shadow-s-(2xs|xs|sm|md|lg|xl|2xl|none)$/,
  opacity: /^opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100|\d+(\.\d+)?)$/,
  "mix-blend-mode":
    /^mix-blend-(normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity|plus-darker|plus-lighter)$/,
  "background-blend-mode":
    /^bg-blend-(normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity)$/,
  "text-shadow": /^text-shadow(?:-(none|sm|default|md|lg))?$/,
  "mask-clip": /^(mask-no-clip|mask-clip-(none|border|padding|content|fill|stroke|view|text))$/,
  "mask-composite": /^mask-composite-(add|subtract|intersect|exclude)$/,
  "mask-image": /^mask-image-(none)$/,
  "mask-mode": /^mask-(luminance|alpha)$/,
  "mask-origin": /^mask-origin-(border|padding|content|fill|stroke|view)$/,
  "mask-position":
    /^(mask-(top|start|center|end|bottom|top-start|top-end|bottom-start|bottom-end|ts|te|bs|be)|mask-position-.+)$/,
  "mask-repeat":
    /^(mask-repeat|mask-no-repeat|mask-repeat-x|mask-repeat-y|mask-repeat-space|mask-repeat-round|mask-repeat-.+)$/,
  "mask-size": /^mask-size-(auto|cover|contain)$/,
  "mask-type": /^mask-type-(luminance|alpha)$/,
  // perspective: named (dramatic, near, normal, midrange, distant) + none + numeric
  perspective: /^perspective-(none|dramatic|near|normal|midrange|distant|\d+(\.\d+)?)$/,

  // Filters
  filter:
    /^filter-(none|blur|brightness|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia)$/,
  blur: /^blur-(none|sm|default|md|lg|xl|2xl|3xl|\d+(\.\d+)?)$/,
  brightness:
    /^brightness-(0|50|75|90|95|100|105|110|125|150|200|\d+(\.\d+)?)$/,
  contrast: /^contrast-(0|50|75|100|125|150|200|\d+(\.\d+)?)$/,
  grayscale: /^grayscale(-0)?$/,
  "hue-rotate": /^hue-rotate-(0|15|30|60|90|180|\d+(\.\d+)?)$/,
  invert: /^invert(-0)?$/,
  saturate: /^saturate-(0|50|100|150|200|\d+(\.\d+)?)$/,
  sepia: /^sepia(-0)?$/,
  "drop-shadow": /^drop-shadow-(sm|default|md|lg|xl|2xl|none)$/,
  "backdrop-filter": /^backdrop-filter(-none)?$/,
  "backdrop-blur":
    /^backdrop-blur-(none|sm|default|md|lg|xl|2xl|3xl|\d+(\.\d+)?)$/,
  "backdrop-brightness":
    /^backdrop-brightness-(0|50|75|90|95|100|105|110|125|150|200)$/,
  "backdrop-contrast": /^backdrop-contrast-(0|50|75|100|125|150|200)$/,
  "backdrop-grayscale": /^backdrop-grayscale(-0)?$/,
  "backdrop-hue-rotate": /^backdrop-hue-rotate-(0|15|30|60|90|180)$/,
  "backdrop-invert": /^backdrop-invert(-0)?$/,
  "backdrop-opacity":
    /^backdrop-opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100|\d+(\.\d+)?)$/,
  "backdrop-saturate": /^backdrop-saturate-(0|50|100|150|200)$/,
  "backdrop-sepia": /^backdrop-sepia(-0)?$/,

  // Background
  "background-attachment":
    /^(attachment-scroll|attachment-fixed|attachment-local)$/,
  "background-clip":
    /^(clip-border-box|clip-padding-box|clip-content-box|clip-text)$/,
  "background-origin":
    /^(origin-border-box|origin-padding-box|origin-content-box)$/,
  "background-position":
    /^bg-(bottom|center|top|start|end|start-bottom|start-top|end-bottom|end-top|top-start|top-end|bottom-start|bottom-end|ts|te|bs|be)$/,
  "background-repeat":
    /^bg-(repeat|no-repeat|repeat-x|repeat-y|repeat-round|repeat-space)$/,
  "background-size": /^bg-(auto|cover|contain)$/,
  "background-image":
    /^bg-(none|radial|conic|conic-\d+(?:\.\d+)?(?:deg)?|gradient-to-t|gradient-to-b|gradient-to-s|gradient-to-e|gradient-to-l|gradient-to-r|gradient-to-ts|gradient-to-te|gradient-to-bs|gradient-to-be|gradient-to-tl|gradient-to-tr|gradient-to-bl|gradient-to-br)$/,
  "gradient-from": new RegExp(`^from-${GRADIENT_STOP_TOKEN_SOURCE}$`),
  "gradient-via": new RegExp(`^via-${GRADIENT_STOP_TOKEN_SOURCE}$`),
  "gradient-to": new RegExp(`^to-${GRADIENT_STOP_TOKEN_SOURCE}$`),
  "bg-gradient": /^bg-gradient-([\w-]+)$/,
  "text-gradient": /^text-gradient-([\w-]+)$/,

  // Transforms
  scale:
    /^(-?)scale-(0|25|50|75|90|95|100|105|110|125|150|175|200|xs|sm|md|lg|xl|2xl|3xl|4xl|\d+(\.\d+)?)$/,
  "scale-x":
    /^(-?)scale-x-(0|25|50|75|90|95|100|105|110|125|150|175|200|xs|sm|md|lg|xl|2xl|3xl|4xl|\d+(\.\d+)?)$/,
  "scale-y":
    /^(-?)scale-y-(0|25|50|75|90|95|100|105|110|125|150|175|200|xs|sm|md|lg|xl|2xl|3xl|4xl|\d+(\.\d+)?)$/,
  rotate:
    /^(-?)rotate-(0|1|2|3|6|12|15|30|45|60|90|120|135|150|180|210|225|240|270|300|315|330|360|quarter|half|three-quarter|full|\d+(\.\d+)?)$/,
  "rotate-x":
    /^(-?)rotate-x-(0|1|2|3|6|12|15|30|45|60|90|120|135|150|180|210|225|240|270|300|315|330|360|quarter|half|three-quarter|full|\d+(\.\d+)?)$/,
  "rotate-y":
    /^(-?)rotate-y-(0|1|2|3|6|12|15|30|45|60|90|120|135|150|180|210|225|240|270|300|315|330|360|quarter|half|three-quarter|full|\d+(\.\d+)?)$/,
  // translate-x/y: any numeric + decimal (e.g. 3.35, 5.2, 4.26) via spacing scale; plus fractions and full
  "translate-x":
    /^(-?)translate-x-(0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59|60|61|62|63|64|65|66|67|68|69|70|71|72|73|74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|px|0\.5|1\.5|2\.5|3\.5|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|full)$/,
  "translate-y":
    /^(-?)translate-y-(0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32|33|34|35|36|37|38|39|40|41|42|43|44|45|46|47|48|49|50|51|52|53|54|55|56|57|58|59|60|61|62|63|64|65|66|67|68|69|70|71|72|73|74|75|76|77|78|79|80|81|82|83|84|85|86|87|88|89|90|91|92|93|94|95|96|px|0\.5|1\.5|2\.5|3\.5|\d+(\.\d+)?|1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|full)$/,
  "skew-x":
    /^(-?)skew-x-(0|1|2|3|6|12|15|30|45|60|90|120|135|150|180|xs|sm|md|lg|xl|2xl|\d+(\.\d+)?)$/,
  "skew-y":
    /^(-?)skew-y-(0|1|2|3|6|12|15|30|45|60|90|120|135|150|180|xs|sm|md|lg|xl|2xl|\d+(\.\d+)?)$/,
  "transform-origin":
    /^origin-(center|top|bottom|start|end|top-start|top-end|bottom-start|bottom-end|ts|te|bs|be)$/,
  "transform-style": /^style-(flat|preserve-3d)$/,
  "backface-visibility": /^backface-(visible|hidden)$/,
  "perspective-origin":
    /^perspective-origin-(center|top|bottom|start|end|top-start|top-end|bottom-start|bottom-end|ts|te|bs|be)$/,

  // Transitions & Animations
  "transition-property":
    /^transition-(none|all|colors|opacity|shadow|transform)$/,
  "transition-duration":
    /^duration-(0|50|75|100|150|200|300|500|700|1000|1500|2000|3000|fast|normal|slow|\d+(\.\d+)?)$/,
  "transition-timing":
    /^ease-(linear|in|out|in-out|bounce|elastic|back)$/,
  "transition-delay":
    /^delay-(0|50|75|100|150|200|300|500|700|1000|1500|2000|3000|fast|normal|slow|\d+(\.\d+)?)$/,
  // Tailwind v4 names: transition-normal, transition-discrete (→ transition-behavior: allow-discrete)
  "transition-behavior": /^transition-(normal|discrete)$/,
  animation:
    /^animate-(none|spin|ping|pulse|bounce|fade-in|fade-out|fade-in-up|fade-in-down|fade-in-start|fade-in-end|slide-in-up|slide-in-down|slide-in-start|slide-in-end|scale-in|scale-out|scale-in-center|zoom-in|zoom-out|rotate-in|rotate-out)$/,
  "animation-duration":
    /^animate-duration-(0|50|75|100|150|200|300|500|700|1000|1500|2000|3000|fast|normal|slow|\d+(\.\d+)?)$/,
  "animation-delay":
    /^animate-delay-(0|50|75|100|150|200|300|500|700|1000|1500|2000|3000|fast|normal|slow|\d+(\.\d+)?)$/,
  "animation-iteration-count":
    /^animate-iteration-(1|2|3|4|5|6|7|8|9|10|infinite|\d+)$/,
  "animation-direction":
    /^animate-direction-(normal|reverse|alternate|alternate-reverse)$/,
  "animation-fill-mode": /^animate-fill-(none|forwards|backwards|both)$/,
  "animation-play-state": /^animate-play-(running|paused)$/,
  "animation-timing-function": /^animate-ease-(linear|in|out|in-out)$/,

  // Interactivity
  appearance:
    /^appearance-(none|auto|textfield|menulist-button|button|searchfield)$/,
  cursor:
    /^cursor-(auto|default|pointer|wait|text|move|help|not-allowed|none|context-menu|progress|cell|crosshair|vertical-text|alias|copy|no-drop|grab|grabbing|all-scroll|col-resize|row-resize|n-resize|e-resize|s-resize|w-resize|ne-resize|nw-resize|se-resize|sw-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|zoom-in|zoom-out|\[[^\]]+\])$/,
  outline: /^outline-(focus|danger|disabled|interactive)$/,
  "outline-hidden": /^outline-hidden$/,
  "outline-width": /^outline(?:-(\d+(\.\d+)?))?$/,
  "outline-style": /^outline-(solid|dashed|dotted|double|none)$/,
  "outline-color": new RegExp(`^outline-${COLOR_TOKEN_SOURCE}$`),
  "outline-offset": /^(-?)outline-offset-(\d+(\.\d+)?)$/, // Tailwind CSS standard: outline-offset-10 (positive), -outline-offset-10 (negative - minus before outline-offset)
  "pointer-events": /^pointer-events-(none|auto)$/,
  resize: /^resize-(none|both|horizontal|vertical)$/,
  select: /^select-(none|text|all|auto|contain)$/,
  "touch-action":
    /^touch-(auto|none|pan-x|pan-left|pan-right|pan-y|pan-up|pan-down|pinch-zoom|manipulation)$/,
  "user-select": /^select-(none|text|all|auto|contain)$/,

  // SVG
  fill: /^fill-(none|current|inherit|transparent)$/,
  "fill-color": new RegExp(`^fill-${COLOR_TOKEN_SOURCE}$`),
  stroke: /^stroke-(none|current|inherit|transparent)$/,
  "stroke-color": new RegExp(`^stroke-${COLOR_TOKEN_SOURCE}$`),
  "stroke-width": /^stroke-(0|1|2|4|\d+(\.\d+)?)$/,
  "stroke-linecap": /^stroke-linecap-(butt|round|square)$/,
  "stroke-linejoin": /^stroke-(miter|round|bevel)$/,
  "stroke-dasharray": /^stroke-dasharray(-none)?$/,

  // Tables
  "border-collapse": /^border-(collapse|separate)$/,
  "border-spacing":
    /^border-spacing-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px|0\.5|1\.5|2\.5|3\.5|\d+(\.\d+)?)$/,
  "border-spacing-x":
    /^border-spacing-x-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px|0\.5|1\.5|2\.5|3\.5|\d+(\.\d+)?)$/,
  "border-spacing-y":
    /^border-spacing-y-(0|1|2|3|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|px|0\.5|1\.5|2\.5|3\.5|\d+(\.\d+)?)$/,
  "table-layout": /^table-(auto|fixed)$/,
  "caption-side": /^caption-(top|bottom)$/,

  // Lists (Tailwind + IUI — see list-style-contract.ts)
  "list-marker-suffix": new RegExp(`^list-(${LIST_ORDERED_SUFFIX_SOURCE})$`),
  "list-style-type-ordered": new RegExp(`^list-(${LIST_ORDERED_REST_SOURCE})$`),
  "list-style-type-unordered": new RegExp(`^list-(${LIST_UNORDERED_REST_SOURCE})$`),
  // Long-form `list-style-type-{custom}` (custom marker names; not the `list-*` shorthand).
  "list-style-type": /^list-style-type-[a-z][a-z0-9-]*$/,
  "list-style-position": /^list-(inside|outside)$/,
  "list-style-image": /^list-image-none$/,

  // Sizing & Aspect Ratio (Tailwind: auto, square, video, {ratio}, decimals → {n} / 1)
  "aspect-ratio":
    /^aspect-(auto|square|video|landscape|portrait|golden|ultrawide|\d+\/\d+|\d+(\.\d+)?)$/,
  container: /^container-(xs|sm|md|lg|xl|2xl|full)$/,
  "object-fit": /^(object-(contain|cover|fill|none|scale-down)|object-fit-(contain|cover|fill|none|scale-down))$/,
  "object-position":
    /^(object-(bottom|center|start|start-bottom|start-top|end|end-bottom|end-top|top)|object-position-(bottom|center|start|start-bottom|start-top|end|end-bottom|end-top|top))$/,

  // Scroll
  "scroll-behavior":
    /^scroll-(auto|smooth|inherit|initial|revert|revert-layer|unset)$/,
  "scroll-snap-type": /^scroll-snap-(none|x|y|both|mandatory|proximity)$/,
  "scroll-snap-align": /^scroll-snap-(start|end|center|none)$/,
  "scroll-snap-stop": /^scroll-snap-(normal|always)$/,
  "scrollbar-gutter":
    /^scrollbar-gutter-(auto|stable|both-edges|stable-both-edges|inherit)$/,
  "scrollbar-width": /^scrollbar-width-(auto|thin|none)$/,
  "scrollbar-color": /^scrollbar-color-(auto|dark|light)$/,

  // Layout Break
  "break-before":
    /^break-before-(auto|avoid|avoid-page|avoid-column|page|column|left|right|all)$/,
  "break-after":
    /^break-after-(auto|avoid|avoid-page|avoid-column|page|column|left|right|all)$/,
  "break-inside": /^break-inside-(auto|avoid|avoid-page|avoid-column)$/,

  // Z-index
  "z-index": /^(-?)z-(0|10|20|30|40|50|auto|\d+(\.\d+)?)$/,

  // Container queries (class names: container-type-*, container-name-*)
  "container-type": /^container-type-(normal|inline-size|size)$/,
  "container-name": /^container-name-([a-zA-Z][a-zA-Z0-9_-]*)$/,

  // Content utilities
  content:
    /^content-(none|normal|\\['[^']*'\\]|\\["[^"]*"\\])$/,

  // Text utilities
  "text-wrap": /^text-(wrap|nowrap|balance|pretty)$/,
  "text-orientation": /^text-orientation-(mixed|upright|sideways)$/,

  // Columns (CSS Multi-column Layout)
  columns:
    /^columns-(1|2|3|4|5|6|7|8|9|10|11|12|auto|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|\d+)$/,
  "column-width":
    /^column-width-(auto|3xs|2xs|xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "column-fill": /^column-fill-(auto|balance|balance-all)$/,
  "column-gap":
    /^column-gap-(normal|none|sm|md|lg|0|px|0\.5|1|1\.5|2|2\.5|3|3\.5|4|5|6|7|8|9|10|11|12|14|16|20|24|28|32|36|40|44|48|52|56|60|64|72|80|96|\d+(\.\d+)?)$/,
  "column-rule": /^column-rule-(none|thin|medium|thick)$/,
  "column-rule-type":
    /^column-rule-type-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  "column-rule-color": new RegExp(`^column-rule-color-${COLOR_TOKEN_WITH_OPTIONAL_OPACITY_SOURCE}$`),
  "column-span": /^column-span-(none|all)$/,

  // Box decoration break
  "box-decoration-break": /^decoration-(slice|clone)$/,

  // Will change
  "will-change":
    /^will-change-(auto|scroll|contents|transform|opacity|left|right|top|bottom)$/,

  // Forced colors
  "forced-color-adjust": /^forced-color-adjust-(auto|none)$/,

  // Special utilities
  tooltip:
    /^(p-(sm|md|lg)-(padding|fontsize|maxwidth)|text-(sm|md|lg)-(padding|fontsize|maxwidth)|max-w-(sm|md|lg)-(padding|fontsize|maxwidth))$/,
  "sr-only": /^sr-only$/,
  "not-sr-only": /^not-sr-only$/,
  none: /^none$/,
  // Tailwind: grow | grow-0 | grow-1 | grow-[n]
  grow: /^grow(-0|-1)?$/,
  shrink: /^shrink(-0|-1)?$/,
};

/**
 * Helper function to extract responsive breakpoint prefix from a class name
 * e.g., 'sm:flex' returns { breakpoint: 'sm', baseClassName: 'flex' }
 */
function extractBreakpoint(className: string): {
  breakpoint: string | null;
  baseClassName: string;
} {
  const breakpoints = ["sm", "md", "lg", "xl", "2xl"];

  for (const bp of breakpoints) {
    if (className.startsWith(`${bp}:`)) {
      return {
        breakpoint: bp,
        baseClassName: className.substring(bp.length + 1),
      };
    }
  }

  return {
    breakpoint: null,
    baseClassName: className,
  };
}

/**
 * Helper function to extract state variant prefix from a class name
 * e.g., 'hover:bg-blue-500' returns { variant: 'hover', baseClassName: 'bg-blue-500' }
 */
function extractStateVariant(className: string): {
  variant: string | null;
  baseClassName: string;
} {
  const stateVariants = [
    "hover",
    "focus",
    "active",
    "disabled",
    "visited",
    "checked",
    "required",
    "invalid",
    "first-child",
    "last-child",
    "only-child",
    "nth-child-odd",
    "nth-child-even",
    "group-hover",
    "peer-focus",
    "before",
    "after",
    "placeholder",
    "selection",
    "first-letter",
    "first-line",
    "focus-within",
    "focus-visible",
    "target",
    "empty",
    "enabled",
    "indeterminate",
    "valid",
    "in-range",
    "out-of-range",
    "data-loading",
  ];

  for (const variant of stateVariants) {
    if (className.startsWith(`${variant}:`)) {
      return {
        variant,
        baseClassName: className.substring(variant.length + 1),
      };
    }
  }

  return {
    variant: null,
    baseClassName: className,
  };
}

/**
 * Helper function to extract theme variant prefix from a class name
 * e.g., 'dark:bg-gray-900' returns { theme: 'dark', baseClassName: 'bg-gray-900' }
 */
function extractThemeVariant(className: string): {
  theme: string | null;
  baseClassName: string;
} {
  const themeVariants = [
    "dark",
    "light",
    "high-contrast",
    "print",
    "motion-safe",
    "motion-reduce",
  ];

  for (const theme of themeVariants) {
    if (className.startsWith(`${theme}:`)) {
      return {
        theme,
        baseClassName: className.substring(theme.length + 1),
      };
    }
  }

  return {
    theme: null,
    baseClassName: className,
  };
}

/**
 * Helper function to extract all nested variants (e.g., sm:hover:dark:text-red-500)
 * Returns all variants in order from outermost to innermost
 */
function extractNestedVariants(className: string): {
  variants: string[];
  baseClassName: string;
  breakpoint?: string;
  state?: string;
  theme?: string;
} {
  const variants: string[] = [];
  let currentClassName = className;
  let hasChanged = true;
  let breakpoint: string | undefined;
  let state: string | undefined;
  let theme: string | undefined;

  // Extract all nested variants iteratively
  while (hasChanged) {
    hasChanged = false;

    // Check for theme variants first (outermost)
    const { theme: themeVariant, baseClassName: themeBaseClassName } =
      extractThemeVariant(currentClassName);
    if (themeVariant) {
      variants.push(themeVariant);
      theme = theme || themeVariant;
      currentClassName = themeBaseClassName;
      hasChanged = true;
      continue;
    }

    // Check for responsive variants
    const { breakpoint: bpVariant, baseClassName: bpBaseClassName } =
      extractBreakpoint(currentClassName);
    if (bpVariant) {
      variants.push(bpVariant);
      breakpoint = breakpoint || bpVariant;
      currentClassName = bpBaseClassName;
      hasChanged = true;
      continue;
    }

    // Check for state variants (innermost)
    const { variant: stateVariant, baseClassName: stateBaseClassName } =
      extractStateVariant(currentClassName);
    if (stateVariant) {
      variants.push(stateVariant);
      state = state || stateVariant;
      currentClassName = stateBaseClassName;
      hasChanged = true;
      continue;
    }
  }

  return {
    variants,
    baseClassName: currentClassName,
    breakpoint,
    state,
    theme,
  };
}

/**
 * Classify arbitrary / CSS-var values for ambiguous prefixes (`text-*`, `font-*`,
 * `border-*`, …) — same approach as tailwind-merge validators.
 */
function unwrapDynamicValue(raw: string): string {
  if (raw.startsWith("[") && raw.endsWith("]")) return raw.slice(1, -1);
  if (raw.startsWith("(") && raw.endsWith(")")) return raw.slice(1, -1);
  return raw;
}

function isColorLikeValue(value: string): boolean {
  const v = unwrapDynamicValue(value).trim();
  if (!v) return false;
  if (/^(#|rgb|hsl|hwb|lab|lch|oklab|oklch|color)\b/i.test(v)) return true;
  if (/^(currentColor|transparent|inherit|current)$/i.test(v)) return true;
  if (/^var\(--/i.test(v) && /color|fill|stroke|tint|hue/i.test(v)) return true;
  // CSS data-type label (Tailwind): text-[color:…]
  if (/^(color|hue):/i.test(v)) return true;
  return false;
}

function isLengthLikeValue(value: string): boolean {
  const v = unwrapDynamicValue(value).trim();
  if (!v) return false;
  if (/^(length|size):/i.test(v)) return true;
  if (
    /^-?\d+(\.\d+)?(px|rem|em|%|vh|vw|vmin|vmax|dvh|dvw|lvh|lvw|svh|svw|ch|ex|cqw|cqh|cqi|cqb|cm|mm|in|pt|pc)$/i.test(
      v,
    )
  ) {
    return true;
  }
  if (/^calc\(/i.test(v) || /^min\(/i.test(v) || /^max\(/i.test(v) || /^clamp\(/i.test(v)) {
    return true;
  }
  if (/^var\(--/i.test(v) && !isColorLikeValue(value)) return true;
  return false;
}

function isNumberLikeValue(value: string): boolean {
  const v = unwrapDynamicValue(value).trim();
  if (/^(number|weight):/i.test(v)) return true;
  return /^-?\d+(\.\d+)?$/.test(v);
}

function isImageLikeValue(value: string): boolean {
  const v = unwrapDynamicValue(value).trim();
  return /^(url|image|linear-gradient|radial-gradient|conic-gradient|repeating-)/i.test(
    v,
  );
}

function isShadowLikeValue(value: string): boolean {
  const v = unwrapDynamicValue(value).trim();
  if (/^shadow:/i.test(v)) return true;
  // 0_1px_2px_#000 / 0 1px 2px #000 / inset …
  return /^(inset[_\s])?-?\d/.test(v) && /[_\s,]/.test(v);
}

function isFamilyNameValue(value: string): boolean {
  const v = unwrapDynamicValue(value).trim();
  return /^(family-name):/i.test(v) || /^["'].*["']$/.test(v);
}

/**
 * Ambiguous `text-*`: length → font-size, color → text-color, bare number → font-size.
 */
function resolveTextDynamic(value: string): TokenCategory {
  if (isColorLikeValue(value)) return "text-color";
  if (isLengthLikeValue(value) || isNumberLikeValue(value)) return "font-size";
  // Default unlabeled arbitrary `text-[…]` to color (tailwind-merge default)
  return "text-color";
}

/**
 * Ambiguous `font-*`: weight vs family (labels + heuristics; weight is default).
 */
function resolveFontDynamic(value: string): TokenCategory {
  if (isFamilyNameValue(value)) return "font-family";
  if (isNumberLikeValue(value) || /^(weight|number):/i.test(unwrapDynamicValue(value))) {
    return "font-weight";
  }
  // Named family tokens without label (font-[Inter])
  if (/^[a-zA-Z][\w\s-]*$/.test(unwrapDynamicValue(value))) return "font-family";
  return "font-weight";
}

/**
 * Ambiguous `border-*` (no directional segment): length → width, color → color.
 */
function resolveBorderDynamic(value: string): TokenCategory {
  if (isColorLikeValue(value)) return "border-color";
  if (isLengthLikeValue(value) || isNumberLikeValue(value)) return "border-width";
  return "border-color";
}

function resolveBgDynamic(value: string): TokenCategory {
  if (isImageLikeValue(value)) return "background-image";
  if (isLengthLikeValue(value)) return "background-size";
  return "bg-color";
}

function resolveGradientFromDynamic(_value: string): TokenCategory {
  return "gradient-from";
}

function resolveGradientViaDynamic(_value: string): TokenCategory {
  return "gradient-via";
}

function resolveGradientToDynamic(_value: string): TokenCategory {
  return "gradient-to";
}

/**
 * TBSE corner aliases (rounded-ts/te/bs/be) share CSS with Tailwind v4 logical
 * corners (rounded-ss/se/es/ee). Normalize for iuimerge conflict resolution.
 */
const BORDER_RADIUS_CANONICAL_CATEGORY: Partial<
  Record<TokenCategory, TokenCategory>
> = {
  "border-radius-ts": "border-radius-ss",
  "border-radius-te": "border-radius-se",
  "border-radius-bs": "border-radius-es",
  "border-radius-be": "border-radius-ee",
};

function borderRadiusMergeCategory(
  category: TokenCategory,
): TokenCategory {
  return BORDER_RADIUS_CANONICAL_CATEGORY[category] ?? category;
}

/** Tailwind: from-/via-/to- color stops vs percentage positions share a prefix but not merge conflicts. */
function gradientStopMergeSuffix(className: string): string {
  const base = className.startsWith("!") ? className.slice(1) : className;
  if (/^(from|via|to)-(\[[^\]]+\]|\d+(\.\d+)?%)$/.test(base)) {
    return ":position";
  }
  if (/^(from|via|to)-/.test(base)) {
    return ":color";
  }
  return "";
}

function resolveDecorationDynamic(value: string): TokenCategory {
  if (isColorLikeValue(value)) return "decoration-color";
  if (isLengthLikeValue(value) || isNumberLikeValue(value)) {
    return "text-decoration-thickness";
  }
  return "decoration-color";
}

function resolveOutlineDynamic(value: string): TokenCategory {
  if (isColorLikeValue(value)) return "outline-color";
  if (isLengthLikeValue(value) || isNumberLikeValue(value)) return "outline-width";
  return "outline-color";
}

function resolveRingDynamic(value: string): TokenCategory {
  if (isColorLikeValue(value)) return "ring-color";
  if (isLengthLikeValue(value) || isNumberLikeValue(value)) return "ring-width";
  return "ring-color";
}

function resolveShadowDynamic(value: string): TokenCategory {
  if (isColorLikeValue(value) && !isShadowLikeValue(value)) return "shadow-color";
  return "box-shadow";
}

function resolveFillDynamic(value: string): TokenCategory {
  return isColorLikeValue(value) || !isNumberLikeValue(value) ? "fill-color" : "fill";
}

function resolveStrokeDynamic(value: string): TokenCategory {
  if (isLengthLikeValue(value) || isNumberLikeValue(value)) return "stroke-width";
  return "stroke-color";
}

type DynamicPrefixRule =
  | { kind: "category"; category: TokenCategory }
  | { kind: "resolve"; resolve: (value: string) => TokenCategory };

/**
 * Longest-prefix-first map: arbitrary (`p-[13px]`), CSS-var (`w-(--token)`),
 * and open numeric scales (`text-17`) share conflict groups with named tokens.
 * Mirrors tailwind-merge class-group membership for dynamic values.
 */
const DYNAMIC_PREFIX_RULES: ReadonlyArray<
  readonly [string, DynamicPrefixRule]
> = [
  // Ambiguous (value-typed)
  ["text-decoration-color", { kind: "category", category: "decoration-color" }],
  ["underline-offset", { kind: "category", category: "text-underline-offset" }],
  ["ring-offset", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "ring-offset-color" : "ring-offset-width"
  }],
  ["outline-offset", { kind: "category", category: "outline-offset" }],
  ["backdrop-blur", { kind: "category", category: "backdrop-blur" }],
  ["backdrop-brightness", { kind: "category", category: "backdrop-brightness" }],
  ["backdrop-contrast", { kind: "category", category: "backdrop-contrast" }],
  ["backdrop-grayscale", { kind: "category", category: "backdrop-grayscale" }],
  ["backdrop-hue-rotate", { kind: "category", category: "backdrop-hue-rotate" }],
  ["backdrop-invert", { kind: "category", category: "backdrop-invert" }],
  ["backdrop-opacity", { kind: "category", category: "backdrop-opacity" }],
  ["backdrop-saturate", { kind: "category", category: "backdrop-saturate" }],
  ["backdrop-sepia", { kind: "category", category: "backdrop-sepia" }],
  ["hue-rotate", { kind: "category", category: "hue-rotate" }],
  ["drop-shadow", { kind: "category", category: "drop-shadow" }],
  ["translate-x", { kind: "category", category: "translate-x" }],
  ["translate-y", { kind: "category", category: "translate-y" }],
  ["scale-x", { kind: "category", category: "scale-x" }],
  ["scale-y", { kind: "category", category: "scale-y" }],
  ["rotate-x", { kind: "category", category: "rotate-x" }],
  ["rotate-y", { kind: "category", category: "rotate-y" }],
  ["skew-x", { kind: "category", category: "skew-x" }],
  ["skew-y", { kind: "category", category: "skew-y" }],
  ["min-inline", { kind: "category", category: "min-inline-size" }],
  ["max-inline", { kind: "category", category: "max-inline-size" }],
  ["min-block", { kind: "category", category: "min-block-size" }],
  ["max-block", { kind: "category", category: "max-block-size" }],
  ["scroll-mt", { kind: "category", category: "scroll-mt" }],
  ["scroll-me", { kind: "category", category: "scroll-me" }],
  ["scroll-mb", { kind: "category", category: "scroll-mb" }],
  ["scroll-ms", { kind: "category", category: "scroll-ms" }],
  ["scroll-mx", { kind: "category", category: "scroll-mx" }],
  ["scroll-my", { kind: "category", category: "scroll-my" }],
  ["scroll-m", { kind: "category", category: "scroll-m" }],
  ["scroll-pt", { kind: "category", category: "scroll-pt" }],
  ["scroll-pe", { kind: "category", category: "scroll-pe" }],
  ["scroll-pb", { kind: "category", category: "scroll-pb" }],
  ["scroll-ps", { kind: "category", category: "scroll-ps" }],
  ["scroll-px", { kind: "category", category: "scroll-px" }],
  ["scroll-py", { kind: "category", category: "scroll-py" }],
  ["scroll-p", { kind: "category", category: "scroll-p" }],
  ["space-x", { kind: "category", category: "space-x" }],
  ["space-y", { kind: "category", category: "space-y" }],
  ["gap-x", { kind: "category", category: "gap-x" }],
  ["gap-y", { kind: "category", category: "gap-y" }],
  ["col-span", { kind: "category", category: "grid-column" }],
  ["row-span", { kind: "category", category: "grid-row" }],
  ["grid-cols", { kind: "category", category: "grid-template-columns" }],
  ["grid-rows", { kind: "category", category: "grid-template-rows" }],
  ["auto-cols", { kind: "category", category: "grid-auto-columns" }],
  ["auto-rows", { kind: "category", category: "grid-auto-rows" }],
  ["line-clamp", { kind: "category", category: "line-clamp" }],
  ["font-stretch", { kind: "category", category: "font-stretch" }],
  ["font-feature", { kind: "category", category: "font-feature-settings" }],
  ["min-w", { kind: "category", category: "min-width" }],
  ["max-w", { kind: "category", category: "max-width" }],
  ["min-h", { kind: "category", category: "min-height" }],
  ["max-h", { kind: "category", category: "max-height" }],
  ["border-t", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-t-color" : "border-t-width"
  }],
  ["border-b", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-b-color" : "border-b-width"
  }],
  ["border-x", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-x-color" : "border-x-width"
  }],
  ["border-y", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-y-color" : "border-y-width"
  }],
  ["border-s", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-inline-start-color" : "border-s-width"
  }],
  ["border-e", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-inline-end-color" : "border-e-width"
  }],
  ["border-bs", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-block-start-color" : "border-bs-width"
  }],
  ["border-be", { kind: "resolve", resolve: (value: string) =>
    isColorLikeValue(value) ? "border-block-end-color" : "border-be-width"
  }],
  ["rounded-ts", { kind: "category", category: "border-radius-ts" }],
  ["rounded-te", { kind: "category", category: "border-radius-te" }],
  ["rounded-bs", { kind: "category", category: "border-radius-bs" }],
  ["rounded-be", { kind: "category", category: "border-radius-be" }],
  ["rounded-ss", { kind: "category", category: "border-radius-ss" }],
  ["rounded-se", { kind: "category", category: "border-radius-se" }],
  ["rounded-es", { kind: "category", category: "border-radius-es" }],
  ["rounded-ee", { kind: "category", category: "border-radius-ee" }],
  ["rounded-t", { kind: "category", category: "border-radius-t" }],
  ["rounded-b", { kind: "category", category: "border-radius-b" }],
  ["rounded-s", { kind: "category", category: "border-radius-s" }],
  ["rounded-e", { kind: "category", category: "border-radius-e" }],
  ["rounded", { kind: "category", category: "border-radius" }],
  ["tracking", { kind: "category", category: "letter-spacing" }],
  ["leading", { kind: "category", category: "line-height" }],
  ["indent", { kind: "category", category: "text-indent" }],
  ["opacity", { kind: "category", category: "opacity" }],
  ["shadow", { kind: "resolve", resolve: resolveShadowDynamic }],
  ["border", { kind: "resolve", resolve: resolveBorderDynamic }],
  ["outline", { kind: "resolve", resolve: resolveOutlineDynamic }],
  ["decoration", { kind: "resolve", resolve: resolveDecorationDynamic }],
  ["ring", { kind: "resolve", resolve: resolveRingDynamic }],
  ["fill", { kind: "resolve", resolve: resolveFillDynamic }],
  ["stroke", { kind: "resolve", resolve: resolveStrokeDynamic }],
  ["text", { kind: "resolve", resolve: resolveTextDynamic }],
  ["font", { kind: "resolve", resolve: resolveFontDynamic }],
  ["bg", { kind: "resolve", resolve: resolveBgDynamic }],
  ["bg-radial", { kind: "category", category: "background-image" }],
  ["bg-conic", { kind: "category", category: "background-image" }],
  ["from", { kind: "resolve", resolve: resolveGradientFromDynamic }],
  ["via", { kind: "resolve", resolve: resolveGradientViaDynamic }],
  ["to", { kind: "resolve", resolve: resolveGradientToDynamic }],
  ["blur", { kind: "category", category: "blur" }],
  ["brightness", { kind: "category", category: "brightness" }],
  ["contrast", { kind: "category", category: "contrast" }],
  ["grayscale", { kind: "category", category: "grayscale" }],
  ["invert", { kind: "category", category: "invert" }],
  ["saturate", { kind: "category", category: "saturate" }],
  ["sepia", { kind: "category", category: "sepia" }],
  ["scale", { kind: "category", category: "scale" }],
  ["rotate", { kind: "category", category: "rotate" }],
  ["basis", { kind: "category", category: "flex-basis" }],
  ["order", { kind: "category", category: "order" }],
  ["grow", { kind: "category", category: "grow" }],
  ["shrink", { kind: "category", category: "shrink" }],
  ["gap", { kind: "category", category: "gap" }],
  ["size", { kind: "category", category: "size" }],
  ["inline", { kind: "category", category: "inline-size" }],
  ["block", { kind: "category", category: "block-size" }],
  ["aspect", { kind: "category", category: "aspect-ratio" }],
  ["columns", { kind: "category", category: "columns" }],
  ["z", { kind: "category", category: "z-index" }],
  ["w", { kind: "category", category: "width" }],
  ["h", { kind: "category", category: "height" }],
  ["pbs", { kind: "category", category: "pbs" }],
  ["pbe", { kind: "category", category: "pbe" }],
  ["mbs", { kind: "category", category: "mbs" }],
  ["mbe", { kind: "category", category: "mbe" }],
  ["pt", { kind: "category", category: "pt" }],
  ["pe", { kind: "category", category: "pe" }],
  ["pb", { kind: "category", category: "pb" }],
  ["ps", { kind: "category", category: "ps" }],
  ["px", { kind: "category", category: "px" }],
  ["py", { kind: "category", category: "py" }],
  ["mt", { kind: "category", category: "mt" }],
  ["me", { kind: "category", category: "me" }],
  ["mb", { kind: "category", category: "mb" }],
  ["ms", { kind: "category", category: "ms" }],
  ["mx", { kind: "category", category: "mx" }],
  ["my", { kind: "category", category: "my" }],
  ["p", { kind: "category", category: "p" }],
  ["m", { kind: "category", category: "m" }],
];

/**
 * Resolve dynamic utilities (arbitrary brackets, CSS-var parens, open numerics)
 * onto the same conflict category as scale / named tokens.
 */
function categoryFromDynamicUtility(baseClassName: string): TokenCategory | null {
  const base = baseClassName.startsWith("!")
    ? baseClassName.slice(1)
    : baseClassName;

  // prefix-[…] | prefix-(…)
  const bracketOrParen = base.match(/^(-?)([\w-]+)-(\[[\s\S]+\]|\([^)]+\))$/);
  if (bracketOrParen) {
    const prefix = bracketOrParen[2];
    const value = bracketOrParen[3];
    for (const [candidate, rule] of DYNAMIC_PREFIX_RULES) {
      if (prefix === candidate) {
        return rule.kind === "category" ? rule.category : rule.resolve(value);
      }
    }
    return null;
  }

  // Open numeric / fraction scales for named-only groups (e.g. text-17, tracking-0.05)
  const numeric = base.match(/^(-?)([\w-]+)-(\d+(\.\d+)?)$/);
  if (numeric) {
    const prefix = numeric[2];
    const value = numeric[3];
    // Only apply where scale patterns are named-token-only (or ambiguous text)
    if (prefix === "text") return "font-size";
    if (prefix === "tracking") return "letter-spacing";
    if (prefix === "brightness") return "brightness";
    if (prefix === "contrast") return "contrast";
    if (prefix === "saturate") return "saturate";
    if (prefix === "grow") return "grow";
    if (prefix === "shrink") return "shrink";
    for (const [candidate, rule] of DYNAMIC_PREFIX_RULES) {
      if (prefix === candidate && rule.kind === "category") {
        // Spacing / size prefixes already match via tokenPatterns `\d+`;
        // still safe to map for consistency.
        return rule.category;
      }
    }
    void value;
  }

  return null;
}

/**
 * Helper function to get the category of a class name
 */
function getTokenCategory(className: string): {
  category: TokenCategory | null;
  variants: string[];
  breakpoint?: string;
  state?: string;
  theme?: string;
} {
  const { variants, baseClassName, breakpoint, state, theme } =
    extractNestedVariants(className);

  const utilityBase = baseClassName.startsWith("!")
    ? baseClassName.slice(1)
    : baseClassName;

  // Check patterns in order of specificity to avoid conflicts
  for (const [category, pattern] of Object.entries(tokenPatterns) as [
    TokenCategory,
    RegExp,
  ][]) {
    if (pattern.test(utilityBase)) {
      return {
        category,
        variants,
        breakpoint,
        state,
        theme,
      };
    }
  }

  const dynamicCategory = categoryFromDynamicUtility(utilityBase);
  if (dynamicCategory) {
    return {
      category: dynamicCategory,
      variants,
      breakpoint,
      state,
      theme,
    };
  }

  return {
    category: null,
    variants,
    breakpoint,
    state,
    theme,
  };
}

/**
 * IUI Merge - The main utility function similar to twmerge but for IUI design system
 *
 * Intelligently merges className strings and handles conflicting utility classes.
 * Later classes override earlier ones within the same category and variant context.
 *
 * @param inputs - Class values to merge (strings, arrays, objects, etc.)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * iuimerge('text-red-500', 'text-blue-500') // 'text-blue-500'
 * iuimerge('hover:text-red-500', 'hover:text-blue-500') // 'hover:text-blue-500'
 * iuimerge('sm:text-red-500', 'md:text-blue-500') // 'sm:text-red-500 md:text-blue-500'
 */
export function iuimerge(...inputs: ClassValue[]): string {
  const mergedClassList = clsx(inputs).split(" ").filter(Boolean);

  // Group classes by their full variant context + category
  // Key format: "theme:breakpoint:state:category"
  const categoryMap = new Map<string, string>();

  // Classes that don't match any pattern are preserved
  const preservedClasses: string[] = [];

  mergedClassList.forEach((cls: string) => {
    if (!cls) return;

    // Normalize underscores→spaces only for category detection (Tailwind convention).
    // Keep the original class string in the output so HTML class attributes stay valid.
    let categoryProbe = cls;
    if (cls.includes("[") && cls.includes("]") && cls.includes("_")) {
      const match = cls.match(/^([^[]+)\[([^\]]+)\]$/);
      if (match) {
        const [, prefix, value] = match;
        let processedValue = value;
        const escapedUnderscorePlaceholder = "___ESCAPEDUNDERSCORE___";
        const hasEscapedUnderscore = processedValue.includes("\\_");
        if (hasEscapedUnderscore) {
          processedValue = processedValue.replace(
            /\\_/g,
            escapedUnderscorePlaceholder,
          );
        }

        processedValue = processedValue.replace(
          /(\w+\([^)]*?)_([^)]*?\))/g,
          (_m, before, after) => before + " " + after,
        );
        processedValue = processedValue.replace(/_/g, " ");

        if (hasEscapedUnderscore) {
          processedValue = processedValue.replace(
            new RegExp(escapedUnderscorePlaceholder, "g"),
            "_",
          );
        }

        categoryProbe = `${prefix}[${processedValue}]`;
      }
    }

    const { category, breakpoint, state, theme } =
      getTokenCategory(categoryProbe);

    // If the class doesn't match any pattern, preserve it
    if (category === null) {
      preservedClasses.push(cls);
      return;
    }

    // Create a compound key that includes all variant context
    const gradientSuffix =
      category === "gradient-from" ||
      category === "gradient-via" ||
      category === "gradient-to"
        ? gradientStopMergeSuffix(categoryProbe)
        : "";
    const mergeCategory = borderRadiusMergeCategory(category);
    const categoryKey = [
      theme || "",
      breakpoint || "",
      state || "",
      mergeCategory + gradientSuffix,
    ].join(":");

    // Last class wins within the same category and variant context
    categoryMap.set(categoryKey, cls);
  });

  // Handle conflicts between general margin/padding utilities and directional ones
  // When both m-4 and mt-0 are present, mt-0 should override the top margin from m-4
  // We need to expand m-4 to only set the sides not overridden by directional utilities
  const resolvedClasses = resolveMarginPaddingConflicts(categoryMap);

  // Combine preserved classes with categorized classes, then filter with clsx
  const finalClasses = [
    ...preservedClasses,
    ...Array.from(resolvedClasses.values()),
  ].join(" ");
  return clsx(finalClasses);
}

/**
 * Resolves conflicts between general margin/padding utilities (m-, p-) and directional ones (mt-, mb-, pt-, pb-, etc.)
 * When a general utility conflicts with directional utilities, it's expanded to only set the sides not overridden.
 *
 * @example
 * Input: m-4, mt-0 -> Output: mb-4, me-4, ms-4, mt-0 (m-4 expanded, mt-0 kept)
 * Input: p-4, pt-2, pb-2 -> Output: pe-4, ps-4, pt-2, pb-2 (p-4 expanded, pt-2 and pb-2 kept)
 */
function resolveMarginPaddingConflicts(
  categoryMap: Map<string, string>,
): Map<string, string> {
  const resolvedMap = new Map<string, string>(categoryMap);
  const generalCategories = ["m", "p"] as const;
  const directionalCategories = {
    m: ["mt", "me", "mb", "ms", "mbs", "mbe", "mx", "my"] as const,
    p: ["pt", "pe", "pb", "ps", "pbs", "pbe", "px", "py"] as const,
  } as const;

  // Check each general category
  for (const generalCat of generalCategories) {
    const directions = directionalCategories[generalCat];

    // Group classes by variant context (theme:breakpoint:state)
    const variantGroups = new Map<
      string,
      {
        general?: { key: string; className: string; value: string };
        directionals: Map<string, { key: string; className: string }>;
      }
    >();

    // First pass: find all general and directional utilities with same variant context
    resolvedMap.forEach((className, key) => {
      const parts = key.split(":");
      const category = parts[parts.length - 1];
      const variantKey = parts.slice(0, -1).join(":"); // Everything except category

      if (category === generalCat) {
        // Extract value from class name (e.g., 'm-4' -> '4', '-m-4' -> '4', 'hover:m-4' -> '4')
        // Handle optional negative sign and variant prefixes
        // Note: With directional patterns checked first, this should only match genuine general utilities
        const match = className.match(
          new RegExp(`(?:^|:)-?${generalCat}-(.+?)(?:\\s|$)`),
        );
        if (match) {
          const value = match[1];
          if (!variantGroups.has(variantKey)) {
            variantGroups.set(variantKey, { directionals: new Map() });
          }
          const group = variantGroups.get(variantKey)!;
          group.general = { key, className, value };
        }
      } else if ((directions as readonly string[]).includes(category)) {
        if (!variantGroups.has(variantKey)) {
          variantGroups.set(variantKey, { directionals: new Map() });
        }
        const group = variantGroups.get(variantKey)!;
        group.directionals.set(category, { key, className });
      }
    });

    // Second pass: resolve conflicts by expanding general utilities
    variantGroups.forEach((group) => {
      if (!group.general) return; // No general utility to resolve
      // Keep the general utility as-is - CSS will naturally handle overrides
      // The directional utilities will override the specific sides in CSS
      // This matches how padding works and is the expected behavior
      // Example: m-10 mt-2 will generate:
      //   margin: var(--iui-spacing-10);
      //   margin-top: var(--iui-spacing-2);
      // The margin-top will override the top value from the margin shorthand
      return; // Keep both general and directional utilities, don't expand
    });
  }
  return resolvedMap;
}

/**
 * Alias for iuimerge - shorter name for convenience
 */
export const cn = iuimerge;

/**
 * Create conditional classes based on boolean conditions
 * @param classMap Object mapping class names to boolean conditions
 * @example
 * conditionalClasses({
 *   'bg-blue-500': isActive,
 *   'text-white': isActive,
 *   'bg-gray-200': !isActive,
 *   'opacity-50': isDisabled
 * })
 */
export function conditionalClasses(classMap: Record<string, boolean>): string {
  return Object.entries(classMap)
    .filter(([_, condition]) => Boolean(condition))
    .map(([className]) => className)
    .join(" ");
}

/**
 * Apply state variants to a base class
 * @param baseClass Base class name
 * @param variants Object containing state variant classes
 * @example
 * withStateVariants('bg-blue-500', {
 *   hover: 'bg-blue-600',
 *   focus: 'ring-2 ring-blue-300',
 *   active: 'bg-blue-700'
 * })
 * // Returns: 'bg-blue-500 hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 active:bg-blue-700'
 */
export function withStateVariants(
  baseClass: string,
  variants: {
    hover?: string;
    focus?: string;
    active?: string;
    disabled?: string;
    visited?: string;
    checked?: string;
    required?: string;
    invalid?: string;
    "first-child"?: string;
    "last-child"?: string;
    "only-child"?: string;
    "group-hover"?: string;
    "peer-focus"?: string;
    before?: string;
    after?: string;
    placeholder?: string;
    selection?: string;
    "focus-within"?: string;
    "focus-visible"?: string;
    [key: string]: string | undefined;
  },
): string {
  let result = baseClass;

  Object.entries(variants).forEach(([state, value]) => {
    if (value) {
      const stateClasses = value
        .split(" ")
        .map((cls) => (cls ? `${state}:${cls}` : ""))
        .filter(Boolean)
        .join(" ");

      result = `${result} ${stateClasses}`;
    }
  });

  return result;
}

/**
 * Apply responsive variants to a base class
 * @param baseClass Base class name
 * @param variants Object containing responsive variant classes
 * @example
 * withResponsiveVariants('text-center', {
 *   sm: 'text-start',
 *   md: 'text-end',
 *   lg: 'text-justify'
 * })
 * // Returns: 'text-center sm:text-start md:text-end lg:text-justify'
 */
export function withResponsiveVariants(
  baseClass: string,
  variants: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    "2xl"?: string;
  },
): string {
  let result = baseClass;

  Object.entries(variants).forEach(([breakpoint, value]) => {
    if (value) {
      const responsiveClasses = value
        .split(" ")
        .map((cls) => (cls ? `${breakpoint}:${cls}` : ""))
        .filter(Boolean)
        .join(" ");

      result = `${result} ${responsiveClasses}`;
    }
  });

  return result;
}

/**
 * Apply theme variants to a base class
 * @param baseClass Base class name
 * @param variants Object containing theme variant classes
 * @example
 * withThemeVariants('bg-white text-black', {
 *   dark: 'bg-gray-900 text-white',
 *   'high-contrast': 'bg-black text-white border-2 border-yellow-400'
 * })
 */
export function withThemeVariants(
  baseClass: string,
  variants: {
    dark?: string;
    light?: string;
    "high-contrast"?: string;
    print?: string;
    "motion-safe"?: string;
    "motion-reduce"?: string;
    [key: string]: string | undefined;
  },
): string {
  let result = baseClass;

  Object.entries(variants).forEach(([theme, value]) => {
    if (value) {
      const themeClasses = value
        .split(" ")
        .map((cls) => (cls ? `${theme}:${cls}` : ""))
        .filter(Boolean)
        .join(" ");

      result = `${result} ${themeClasses}`;
    }
  });

  return result;
}

/**
 * Combine responsive, state, and theme variants
 * @param baseClass Base class name
 * @param options Object containing all variant types
 * @example
 * withAllVariants('btn', {
 *   responsive: { sm: 'btn-sm', lg: 'btn-lg' },
 *   state: { hover: 'btn-hover', disabled: 'btn-disabled' },
 *   theme: { dark: 'btn-dark' }
 * })
 */
export function withAllVariants(
  baseClass: string,
  options: {
    responsive?: Parameters<typeof withResponsiveVariants>[1];
    state?: Parameters<typeof withStateVariants>[1];
    theme?: Parameters<typeof withThemeVariants>[1];
  },
): string {
  let result = baseClass;

  if (options.responsive) {
    result = withResponsiveVariants(result, options.responsive);
  }

  if (options.state) {
    result = withStateVariants(result, options.state);
  }

  if (options.theme) {
    result = withThemeVariants(result, options.theme);
  }

  return result;
}

/**
 * Create a component class builder with default variants
 * @param baseClasses Base classes for the component
 * @param defaultVariants Default variant configuration
 * @returns Function that accepts additional variants and merges them
 * @example
 * const buttonClasses = createComponentClasses('px-4 py-2 rounded font-medium', {
 *   state: { hover: 'opacity-90' },
 *   theme: { dark: 'bg-gray-800 text-white' }
 * });
 *
 * // Usage:
 * buttonClasses({ responsive: { sm: 'px-2 py-1' } })
 */
export function createComponentClasses(
  baseClasses: string,
  defaultVariants?: {
    responsive?: Parameters<typeof withResponsiveVariants>[1];
    state?: Parameters<typeof withStateVariants>[1];
    theme?: Parameters<typeof withThemeVariants>[1];
  },
): (additionalVariants?: typeof defaultVariants) => string {
  return (additionalVariants?: typeof defaultVariants) => {
    // Merge default and additional variants
    const mergedVariants = {
      responsive: {
        ...defaultVariants?.responsive,
        ...additionalVariants?.responsive,
      },
      state: { ...defaultVariants?.state, ...additionalVariants?.state },
      theme: { ...defaultVariants?.theme, ...additionalVariants?.theme },
    };

    return withAllVariants(baseClasses, mergedVariants);
  };
}

/**
 * IUI-specific variant creation using cva
 * Enhanced to work seamlessly with iuimerge
 */
export function createIUIVariants<
  V extends Record<string, Record<string, string>>,
>(
  baseClass: string,
  variants: V,
  defaultVariants?: { [K in keyof V]?: keyof V[K] },
) {
  return (
    props: { [K in keyof V]?: keyof V[K] | null } & { className?: string },
  ): string => {
    let classes = baseClass;

    // Apply variant props
    Object.entries(variants).forEach(([variantKey, variantOptions]) => {
      const selectedVariant =
        props[variantKey as keyof typeof props] ??
        defaultVariants?.[variantKey as keyof typeof defaultVariants];
      if (selectedVariant && variantOptions[selectedVariant as string]) {
        classes += " " + variantOptions[selectedVariant as string];
      }
    });

    // Merge with additional className using iuimerge
    return iuimerge(classes, props.className);
  };
}

/**
 * Type-safe token validator
 * Helps catch typos in class names during development
 */
export function validateIUIClass(className: string): boolean {
  const { category } = getTokenCategory(className);
  return category !== null;
}

/** All token categories that compile to the `list-style-type` CSS property. */
const LIST_STYLE_TYPE_CONFLICT_GROUP = new Set<TokenCategory>([
  "list-style-type",
  "list-style-type-ordered",
  "list-style-type-unordered",
  "list-marker-suffix",
]);

function listMarkerCategoriesConflict(
  a: TokenCategory,
  b: TokenCategory,
): boolean {
  return LIST_STYLE_TYPE_CONFLICT_GROUP.has(a) && LIST_STYLE_TYPE_CONFLICT_GROUP.has(b);
}

/**
 * Get all classes that would conflict with a given class
 * Useful for debugging class conflicts
 */
export function getConflictingClasses(
  className: string,
  allClasses: string[],
): string[] {
  const { category, breakpoint, state, theme } = getTokenCategory(className);

  if (category === null) return [];

  return allClasses.filter((cls) => {
    const {
      category: otherCategory,
      breakpoint: otherBp,
      state: otherState,
      theme: otherTheme,
    } = getTokenCategory(cls);

    if (otherCategory === null) return false;

    const sameListStyleTypeLayer =
      otherCategory === category ||
      listMarkerCategoriesConflict(category, otherCategory);

    return (
      sameListStyleTypeLayer &&
      otherBp === breakpoint &&
      otherState === state &&
      otherTheme === theme &&
      cls !== className
    );
  });
}

/**
 * Get the category of a class name - exported version
 * Useful for debugging and analysis
 */
export { getTokenCategory };

/**
 * Extract design tokens from class names
 * Useful for design system analysis and tooling
 */
export function extractDesignTokens(className: string): {
  category: TokenCategory | null;
  property: string | null;
  value: string | null;
  variants: string[];
  breakpoint?: string;
  state?: string;
  theme?: string;
} {
  const { variants, baseClassName, breakpoint, state, theme } =
    extractNestedVariants(className);
  const { category } = getTokenCategory(className);

  // Basic token extraction (can be enhanced based on specific needs)
  const parts = baseClassName.split("-");
  const property = parts[0] || null;
  const value = parts.slice(1).join("-") || null;

  return {
    category,
    property,
    value,
    variants,
    breakpoint,
    state,
    theme,
  };
}

// Re-export class-variance-authority utilities
export { cva };
export type { VariantProps };

// Legacy compatibility - keep existing function names
export { iuimerge as cn2 }; // Alternative alias
export { conditionalClasses as cx }; // Conditional classes alias
