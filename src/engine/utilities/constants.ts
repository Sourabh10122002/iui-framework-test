/**
 * IUI Design System - Utility Constants
 * Constants for utility builder system
 */

import { TokenCategory } from '../../utilities/class-utilities';

/**
 * Shared special values to avoid object recreation
 */
export const SPECIAL_VALUES = {
  // Common sizing values
  sizing: {
    'auto': 'auto',
    'full': '100%',
    'min': 'min-content',
    'max': 'max-content',
    'fit': 'fit-content'
  },
  
  // Width-specific values
  width: {
    'auto': 'auto',
    'full': '100%',
    'screen': '100vw',
    'min': 'min-content',
    'max': 'max-content',
    'fit': 'fit-content',
    // Dynamic / large / small viewport units (Tailwind-style: full viewport on that axis)
    'dvw': '100dvw',
    'dvh': '100dvh',
    'lvw': '100lvw',
    'lvh': '100lvh',
    'svw': '100svw',
    'svh': '100svh'
  },
  
  // Height-specific values
  height: {
    'auto': 'auto',
    'full': '100%',
    'screen': '100vh',
    'min': 'min-content',
    'max': 'max-content',
    'fit': 'fit-content',
    'dvw': '100dvw',
    'dvh': '100dvh',
    'lvw': '100lvw',
    'lvh': '100lvh',
    'svw': '100svw',
    'svh': '100svh'
  },
  
  // Max-width specific values
  maxWidth: {
    'none': 'none',
    // CSS does not allow max-width: auto; alias invalid TW-style name to none
    'auto': 'none',
    'full': '100%',
    'min': 'min-content',
    'max': 'max-content',
    'fit': 'fit-content',
    'prose': '65ch',
    'xs': '20rem',
    'sm': '24rem',
    'md': '28rem',
    'lg': '32rem',
    'xl': '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    'screen-sm': '640px',
    'screen-md': '768px',
    'screen-lg': '1024px',
    'screen-xl': '1280px',
    'screen-2xl': '1536px',
    // Bare max-w-screen — cap to viewport width (Tailwind-aligned)
    'screen': '100vw',
    // Viewport tokens for max-width: width-axis (dvh/lvh/svh map to dvw/lvw/svw — see viewportLengthForMinMaxWidth)
    'dvw': '100dvw',
    'dvh': '100dvw',
    'lvw': '100lvw',
    'lvh': '100lvw',
    'svw': '100svw',
    'svh': '100svw'
  },
  
  // Max-height specific values
  maxHeight: {
    'auto': 'auto',
    'full': '100%',
    'screen': '100vh',
    'min': 'min-content',
    'max': 'max-content',
    'fit': 'fit-content',
    'none': 'none',
    // Viewport tokens for max-height: height-axis (dvw/lvw/svw map to dvh/lvh/svh — see viewportLengthForMinMaxHeight)
    'dvw': '100dvh',
    'dvh': '100dvh',
    'lvw': '100lvh',
    'lvh': '100lvh',
    'svw': '100svh',
    'svh': '100svh'
  }
} as const;

/**
 * Unified transform recipe for translate / rotate (X,Y,Z) / skew / scale utilities.
 * Same string is emitted on every transform utility so cascade merges `--iui-*` fragments (Tailwind-style composition).
 * Order: translate → rotate X/Y/Z → skew → scale.
 */
export const IUI_TRANSFORM_VAR_TEMPLATE =
  "translateX(var(--iui-translate-x, 0)) translateY(var(--iui-translate-y, 0)) rotateX(var(--iui-rotate-x, 0deg)) rotateY(var(--iui-rotate-y, 0deg)) rotateZ(var(--iui-rotate-z, 0deg)) skewX(var(--iui-skew-x, 0deg)) skewY(var(--iui-skew-y, 0deg)) scaleX(var(--iui-scale-x, 1)) scaleY(var(--iui-scale-y, 1))";

/**
 * Pre-compiled regex patterns for better performance
 * Avoids repeated regex compilation during parsing
 */
export const COMPILED_PATTERNS = {
  TEXT_SIZE: /^text-(2xs|xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
  BORDER_WIDTH: /^border-(0|1|2|3|4|5|6|7|8)$/,
  BORDER_STYLE: /^border-(solid|dashed|dotted|double|groove|ridge|inset|outset|none|hidden)$/,
  FLEX_DIRECTION: /^flex-(row|row-reverse|col|col-reverse)$/,
  FLEX_WRAP: /^flex-(wrap|wrap-reverse|nowrap)$/,
  FLEX_VALUE: /^flex-(1|auto|initial|none)$/,
  FLEX_GROW: /^grow-(0|1|\d+(\.\d+)?)$/,
  FLEX_SHRINK: /^shrink-(0|1|\d+(\.\d+)?)$/,
  BACKGROUND_GRADIENT:
    /^bg-(none|radial|conic|conic-\d+(?:\.\d+)?(?:deg)?|gradient-to-t|gradient-to-b|gradient-to-s|gradient-to-e|gradient-to-l|gradient-to-r|gradient-to-ts|gradient-to-te|gradient-to-bs|gradient-to-be|gradient-to-tl|gradient-to-tr|gradient-to-bl|gradient-to-br)$/,
  MARGIN: /^(-?)m([tbesxy]?)-(.+)$/,
  PADDING: /^(-?)p([tbesxy]?)-(.+)$/,
  BORDER_WIDTH_DIRECTIONAL: /^border-([tbsexy])-(0|1|2|3|4|5|6|7|8)$/,
} as const;

// CSS property mappings for each token category
export const CSS_PROPERTY_MAP: Partial<Record<TokenCategory, string[]>> = {
  // Text Colors
  'text-color': ['color'],
  // bg-color sets both background-color AND --iui-text-bg-color for text gradient compatibility
  'bg-color': ['background-color', '--iui-text-bg-color'],
  'border-color': ['border-color'],
  'border-t-color': ['border-top-color'],
  'border-b-color': ['border-bottom-color'],
  'border-inline-start-color': ['border-inline-start-color'],
  'border-inline-end-color': ['border-inline-end-color'],
  'border-block-start-color': ['border-block-start-color'],
  'border-block-end-color': ['border-block-end-color'],
  'border-x-color': ['border-inline-color'],
  'border-y-color': ['border-block-color'],
  'accent-color': ['accent-color'],
  'caret-color': ['caret-color'],
  'decoration-color': ['text-decoration-color'],
  'ring-color': ['--iui-ring-color'], // Ring color maps to CSS custom property
  'ring-offset-color': ['--iui-ring-offset-color'], // Ring offset color maps to CSS custom property
  'ring-width': ['--iui-ring-offset-shadow', '--iui-ring-shadow', 'box-shadow'], // Ring width generates box-shadow and custom properties
  'ring': ['--iui-ring-offset-shadow', '--iui-ring-shadow', 'box-shadow'], // Default ring utility
  'ring-offset-width': ['--iui-ring-offset-shadow'], // Ring offset affects offset shadow custom property
  'ring-t': ['--iui-ring-shadow', 'box-shadow'],
  'ring-b': ['--iui-ring-shadow', 'box-shadow'],
  'ring-s': ['--iui-ring-shadow', 'box-shadow'],
  'ring-e': ['--iui-ring-shadow', 'box-shadow'],
  'ring-bs': ['--iui-ring-shadow', 'box-shadow'],
  'ring-be': ['--iui-ring-shadow', 'box-shadow'],
  'ring-x': ['--iui-ring-shadow', 'box-shadow'],
  'ring-y': ['--iui-ring-shadow', 'box-shadow'],
  
  // Divide utilities
  'divide-width': [
    '--iui-divide-x-width',
    '--iui-divide-y-width',
    'border-bottom-width',
    'border-left-width',
    'border-right-width',
    'border-top-width',
    'border-top-style',
    'border-bottom-style',
    'border-left-style',
    'border-right-style',
  ],
  'divide-x-reverse': ['--iui-divide-x-reverse'],
  'divide-y-reverse': ['--iui-divide-y-reverse'],
  'divide-color': ['border-color'],
  'divide-style': ['--iui-border-style', 'border-style'],
  
  // Space utilities
  'space-x-reverse': ['--iui-space-x-reverse'],
  'space-y-reverse': ['--iui-space-y-reverse'],
  
  // Inset utilities
  'inset-x': ['inset-inline'],
  'inset-y': ['top', 'bottom'],
  
  // Font utilities
  'font-style': ['font-style'],
  'font-variant-numeric': ['font-variant-numeric'],
  
  // Overscroll utilities
  'overscroll': ['overscroll-behavior'],
  'overscroll-x': ['overscroll-behavior-x'],
  'overscroll-y': ['overscroll-behavior-y'],
  
  // Grid utilities
  'grid-column': ['grid-column'],
  'grid-row': ['grid-row'],
  'outline-width': ['outline-width'],
  'outline-style': ['outline-style'],
  'outline-color': ['outline-color'],
  'outline-offset': ['outline-offset'],
  
  // Spacing
  'm': ['margin'],
  'mt': ['margin-top'],
  'me': ['margin-inline-end'],
  'mb': ['margin-bottom'],
  'ms': ['margin-inline-start'],
  'mbs': ['margin-block-start'],
  'mbe': ['margin-block-end'],
  'mx': ['margin-inline-start', 'margin-inline-end'],
  'my': ['margin-top', 'margin-bottom'],
  
  'p': ['padding'],
  'pt': ['padding-top'],
  'pe': ['padding-inline-end'],
  'pb': ['padding-bottom'],
  'ps': ['padding-inline-start'],
  'pbs': ['padding-block-start'],
  'pbe': ['padding-block-end'],
  'px': ['padding-inline-start', 'padding-inline-end'],
  'py': ['padding-top', 'padding-bottom'],
  
  // Sizing
  'width': ['width'],
  'height': ['height'],
  'size': ['width', 'height'],
  'min-width': ['min-width'],
  'min-height': ['min-height'],
  'max-width': ['max-width'],
  'max-height': ['max-height'],
  'inline-size': ['inline-size'],
  'min-inline-size': ['min-inline-size'],
  'max-inline-size': ['max-inline-size'],
  'block-size': ['block-size'],
  'min-block-size': ['min-block-size'],
  'max-block-size': ['max-block-size'],
  'font-stretch': ['font-stretch'],
  'font-feature-settings': ['font-feature-settings'],
  
  // Typography
  'font-size': ['font-size'],
  'font-weight': ['font-weight'],
  'font-family': ['font-family'],
  'line-height': ['line-height'],
  'letter-spacing': ['letter-spacing'],
  'text-align': ['text-align'],
  'text-decoration': ['text-decoration-line'],
  'text-decoration-style': ['text-decoration-style'],
  'text-decoration-thickness': ['text-decoration-thickness'],
  'text-underline-offset': ['text-underline-offset'],
  'text-transform': ['text-transform'],
  'text-overflow': ['text-overflow'],
  'line-clamp': [
    'overflow',
    'display',
    '-webkit-box-orient',
    '-webkit-line-clamp',
    'line-clamp',
  ],
  'font-smoothing': ['-webkit-font-smoothing', '-moz-osx-font-smoothing'],
  'overflow-wrap': ['overflow-wrap'],
  'list-style-image': ['list-style-image'],
  'text-indent': ['text-indent'],
  'vertical-align': ['vertical-align'],
  'whitespace': ['white-space'],
  'word-break': ['word-break'],
  'hyphens': ['hyphens'],
  
  // Layout
  'display': ['display'],
  'none': ['display'],
  'float': ['float'],
  'clear': ['clear'],
  'position': ['position'],
  'position-value': ['position'],
  'top': ['top'],
  'end': ['inset-inline-end'],
  'bottom': ['bottom'],
  'start': ['inset-inline-start'],
  'inset': ['inset'],
  'z-index': ['z-index'],
  'isolation': ['isolation'],
  'visibility': ['visibility'],
  'overflow': ['overflow'],
  'overflow-x': ['overflow-x'],
  'overflow-y': ['overflow-y'],
  
  // Box Model
  'box-sizing': ['box-sizing'],
  
  // Flexbox
  'flex-direction': ['flex-direction'],
  'flex-wrap': ['flex-wrap'],
  'flex': ['flex'],
  'flex-grow': ['flex-grow'],
  'flex-shrink': ['flex-shrink'],
  'grow': ['flex-grow'],
  'shrink': ['flex-shrink'],
  'flex-basis': ['flex-basis'],
  'order': ['order'],
  'justify-content': ['justify-content'],
  'justify-items': ['justify-items'],
  'justify-self': ['justify-self'],
  'align-content': ['align-content'],
  'align-items': ['align-items'],
  'align-self': ['align-self'],
  'place-content': ['place-content'],
  'place-items': ['place-items'],
  'place-self': ['place-self'],
  'gap': ['gap'],
  'gap-x': ['column-gap'],
  'gap-y': ['row-gap'],
  
  // Grid
  'grid-template-columns': ['grid-template-columns'],
  'grid-template-rows': ['grid-template-rows'],
  'grid-auto-flow': ['grid-auto-flow'],
  'grid-auto-columns': ['grid-auto-columns'],
  'grid-auto-rows': ['grid-auto-rows'],
  'grid-column-start': ['grid-column-start'],
  'grid-column-end': ['grid-column-end'],
  'grid-row-start': ['grid-row-start'],
  'grid-row-end': ['grid-row-end'],
  
  // Effects
  'box-shadow': ['--iui-shadow', 'box-shadow'],
  'shadow-color': ['--iui-shadow-color'],
  'shadow-t': ['--iui-shadow', 'box-shadow'],
  'shadow-e': ['--iui-shadow', 'box-shadow'],
  'shadow-b': ['--iui-shadow', 'box-shadow'],
  'shadow-s': ['--iui-shadow', 'box-shadow'],
  'shadow-t-color': ['--iui-shadow-t-color'],
  'shadow-e-color': ['--iui-shadow-e-color'],
  'shadow-b-color': ['--iui-shadow-b-color'],
  'shadow-s-color': ['--iui-shadow-s-color'],
  'opacity': ['opacity'],
  'mix-blend-mode': ['mix-blend-mode'],
  'background-blend-mode': ['background-blend-mode'],
  'text-shadow': ['text-shadow'],
  'mask-clip': ['mask-clip'],
  'mask-composite': ['mask-composite'],
  'mask-image': ['mask-image'],
  'mask-mode': ['mask-mode'],
  'mask-origin': ['mask-origin'],
  'mask-position': ['mask-position'],
  'mask-repeat': ['mask-repeat'],
  'mask-size': ['mask-size'],
  'mask-type': ['mask-type'],
  
  // Borders
  'border-width': ['border-width'],
  'border-t-width': ['border-top-width'],
  'border-b-width': ['border-bottom-width'],
  'border-x-width': ['border-inline-width'],
  'border-y-width': ['border-block-width'],
  'border-s-width': ['border-inline-start-width'],
  'border-e-width': ['border-inline-end-width'],
  'border-bs-width': ['border-block-start-width'],
  'border-be-width': ['border-block-end-width'],
  'border-style': ['border-style'],
  'border-t-style': ['border-top-style'],
  'border-b-style': ['border-bottom-style'],
  'border-x-style': ['border-inline-style'],
  'border-y-style': ['border-block-style'],
  'border-s-style': ['border-inline-start-style'],
  'border-e-style': ['border-inline-end-style'],
  'border-bs-style': ['border-block-start-style'],
  'border-be-style': ['border-block-end-style'],
  'border-radius': ['border-radius'],
  // Use logical radius properties (start/end) instead of left/right
  'border-radius-t': ['border-start-start-radius', 'border-start-end-radius'],
  'border-radius-b': ['border-end-start-radius', 'border-end-end-radius'],
  'border-radius-ts': ['border-start-start-radius'],
  'border-radius-te': ['border-start-end-radius'],
  'border-radius-be': ['border-end-end-radius'],
  'border-radius-bs': ['border-end-start-radius'],
  'border-radius-s': ['border-start-start-radius', 'border-end-start-radius'],
  'border-radius-e': ['border-start-end-radius', 'border-end-end-radius'],
  'border-radius-ss': ['border-start-start-radius'],
  'border-radius-se': ['border-start-end-radius'],
  'border-radius-es': ['border-end-start-radius'],
  'border-radius-ee': ['border-end-end-radius'],
  
  // Transforms
  'scale': ['transform'],
  'scale-x': ['transform'],
  'scale-y': ['transform'],
  'rotate': ['transform'],
  'rotate-x': ['transform'],
  'rotate-y': ['transform'],
  'translate-x': ['transform'],
  'translate-y': ['transform'],
  'skew-x': ['transform'],
  'skew-y': ['transform'],
  'transform-origin': ['transform-origin'],
  'transform-style': ['transform-style'],
  'backface-visibility': ['backface-visibility'],
  'perspective': ['perspective'],
  'perspective-origin': ['perspective-origin'],
  
  // Transitions & Animations
  'transition-property': ['transition-property'],
  'transition-duration': ['transition-duration'],
  'transition-timing': ['transition-timing-function', 'animation-timing-function'],
  'transition-delay': ['transition-delay'],
  'transition-behavior': ['transition-behavior'],
  'animation': ['animation'],
  'animation-duration': ['animation-duration'],
  'animation-delay': ['animation-delay'],
  'animation-iteration-count': ['animation-iteration-count'],
  'animation-direction': ['animation-direction'],
  'animation-fill-mode': ['animation-fill-mode'],
  'animation-play-state': ['animation-play-state'],
  'animation-timing-function': ['animation-timing-function'],
  
  // Background and gradients
  'background-image': ['background-image'],
  'gradient-from': ['--iui-gradient-from', '--iui-gradient-from-position'],
  'gradient-via': ['--iui-gradient-via', '--iui-gradient-via-position'],
  'gradient-to': ['--iui-gradient-to', '--iui-gradient-to-position'],
  
  // SVG
  'fill': ['fill'],
  'fill-color': ['fill'],
  'stroke': ['stroke'],
  'stroke-color': ['stroke'],
  
  // Interactivity
  'appearance': ['appearance'],
  'cursor': ['cursor'],
  'outline': ['outline'],
  'pointer-events': ['pointer-events'],
  'resize': ['resize'],
  'select': ['user-select'],
  'touch-action': ['touch-action'],
  'user-select': ['user-select'],
  'writing-mode': ['writing-mode'],
  'text-orientation': ['text-orientation'],
  
  // Spacing between children
  'space-x': ['margin-inline-start'],
  'space-y': ['margin-top'],
  
  // Aspect ratio
  'aspect-ratio': ['aspect-ratio'],
  
  // Content utilities
  'content': ['content'],
  
  // Text utilities
  'text-wrap': ['text-wrap'],
  
  // Special utilities
  'sr-only': ['position', 'width', 'height', 'padding', 'margin', 'overflow', 'clip', 'white-space', 'border'],
  'not-sr-only': ['position', 'width', 'height', 'padding', 'margin', 'overflow', 'clip', 'white-space', 'border'],
  
  // Filters
  'filter': ['filter'],
  'blur': ['filter'],
  'brightness': ['filter'],
  'contrast': ['filter'],
  'grayscale': ['filter'],
  'hue-rotate': ['filter'],
  'invert': ['filter'],
  'saturate': ['filter'],
  'sepia': ['filter'],
  'drop-shadow': ['filter'],
  
  // Backdrop filters
  'backdrop-filter': ['backdrop-filter'],
  'backdrop-blur': ['backdrop-filter'],
  'backdrop-brightness': ['backdrop-filter'],
  'backdrop-contrast': ['backdrop-filter'],
  'backdrop-grayscale': ['backdrop-filter'],
  'backdrop-hue-rotate': ['backdrop-filter'],
  'backdrop-invert': ['backdrop-filter'],
  'backdrop-opacity': ['backdrop-filter'],
  'backdrop-saturate': ['backdrop-filter'],
  'backdrop-sepia': ['backdrop-filter'],
  
  // Background properties
  'background-attachment': ['background-attachment'],
  'background-clip': ['background-clip'],
  'background-origin': ['background-origin'],
  'background-position': ['background-position'],
  'background-repeat': ['background-repeat'],
  'background-size': ['background-size'],
  
  // Scroll properties
  'scroll-behavior': ['scroll-behavior'],
  'scroll-snap-type': ['scroll-snap-type'],
  'scroll-snap-align': ['scroll-snap-align'],
  'scroll-snap-stop': ['scroll-snap-stop'],
  'scrollbar-gutter': ['scrollbar-gutter'],
  'scrollbar-width': ['scrollbar-width'],
  'scrollbar-color': ['scrollbar-color'],
  
  // Scroll spacing
  'scroll-m': ['scroll-margin'],
  'scroll-mt': ['scroll-margin-top'],
  'scroll-me': ['scroll-margin-inline-end'],
  'scroll-mb': ['scroll-margin-bottom'],
  'scroll-ms': ['scroll-margin-inline-start'],
  'scroll-mx': ['scroll-margin-inline-start', 'scroll-margin-inline-end'],
  'scroll-my': ['scroll-margin-top', 'scroll-margin-bottom'],
  'scroll-p': ['scroll-padding'],
  'scroll-pt': ['scroll-padding-top'],
  'scroll-pe': ['scroll-padding-inline-end'],
  'scroll-pb': ['scroll-padding-bottom'],
  'scroll-ps': ['scroll-padding-inline-start'],
  'scroll-px': ['scroll-padding-inline-start', 'scroll-padding-inline-end'],
  'scroll-py': ['scroll-padding-top', 'scroll-padding-bottom'],
  
  // SVG properties
  'stroke-width': ['stroke-width'],
  'stroke-linecap': ['stroke-linecap'],
  'stroke-linejoin': ['stroke-linejoin'],
  'stroke-dasharray': ['stroke-dasharray'],
  
  // Table properties
  'border-collapse': ['border-collapse'],
  'border-spacing': ['border-spacing'],
  'border-spacing-x': ['--iui-border-spacing-x', 'border-spacing'],
  'border-spacing-y': ['--iui-border-spacing-y', 'border-spacing'],
  'table-layout': ['table-layout'],
  'caption-side': ['caption-side'],
  
  // List properties (ordered / unordered categories both emit `list-style-type`)
  'list-style-type': ['list-style-type'],
  'list-style-type-ordered': ['list-style-type'],
  'list-style-type-unordered': ['list-style-type'],
  'list-marker-suffix': ['list-style-type'],
  'list-style-position': ['list-style-position'],
  
  // Sizing & Aspect Ratio
  'container': ['width'],
  'object-fit': ['object-fit'],
  'object-position': ['object-position'],
  
  // Layout Break
  'break-before': ['break-before'],
  'break-after': ['break-after'],
  'break-inside': ['break-inside'],
  
  // Columns
  'columns': ['columns'],
  'column-width': ['column-width'],
  'column-fill': ['column-fill'],
  'column-gap': ['column-gap'],
  'column-rule': ['column-rule-width'],
  'column-rule-type': ['column-rule-style'],
  'column-rule-color': ['column-rule-color'],
  'column-span': ['column-span'],
  
  // Box decoration break
  'box-decoration-break': ['box-decoration-break'],
  
  // Will change
  'will-change': ['will-change'],
  
  // Forced colors
  'forced-color-adjust': ['forced-color-adjust'],
  
  // Container queries
  'container-type': ['container-type'],
  'container-name': ['container-name'],
};


