/**
 * IUI Design System - Pseudo States
 * Complete pseudo-class and pseudo-element definitions matching Tailwind CSS
 */

export interface PseudoState {
  selector: string;
  description: string;
  category: 'interactive' | 'structural' | 'form' | 'group' | 'peer' | 'media' | 'pseudo-element' | 'file' | 'other';
}

/**
 * Complete pseudo-state definitions matching Tailwind CSS
 * Organized by category for better maintainability
 */
export const pseudoStates: Record<string, PseudoState> = {
  // === INTERACTIVE STATES ===
  'hover': {
    selector: ':hover',
    description: 'Hover state',
    category: 'interactive'
  },
  'focus': {
    selector: ':focus',
    description: 'Focus state',
    category: 'interactive'
  },
  'focus-visible': {
    selector: ':focus-visible',
    description: 'Focus visible state (keyboard focus)',
    category: 'interactive'
  },
  'focus-within': {
    selector: ':focus-within',
    description: 'Focus within state',
    category: 'interactive'
  },
  'active': {
    selector: ':active',
    description: 'Active state',
    category: 'interactive'
  },
  'visited': {
    selector: ':visited',
    description: 'Visited link state',
    category: 'interactive'
  },
  'target': {
    selector: ':target',
    description: 'Target state',
    category: 'interactive'
  },

  // === FORM STATES ===
  'checked': {
    selector: ':checked',
    description: 'Checked state',
    category: 'form'
  },
  'disabled': {
    selector: ':disabled, [disabled], [aria-disabled="true"], [data-disabled="true"]',
    description: 'Disabled state (form + non-form)',
    category: 'form'
  },
  'enabled': {
    selector: ':enabled',
    description: 'Enabled state',
    category: 'form'
  },
  'required': {
    selector: ':required',
    description: 'Required state',
    category: 'form'
  },
  'valid': {
    selector: ':valid',
    description: 'Valid state',
    category: 'form'
  },
  'invalid': {
    selector: ':invalid',
    description: 'Invalid state',
    category: 'form'
  },
  'in-range': {
    selector: ':in-range',
    description: 'In range state',
    category: 'form'
  },
  'out-of-range': {
    selector: ':out-of-range',
    description: 'Out of range state',
    category: 'form'
  },
  'placeholder-shown': {
    selector: ':placeholder-shown',
    description: 'Placeholder shown state',
    category: 'form'
  },
  'autofill': {
    selector: ':autofill',
    description: 'Autofill state',
    category: 'form'
  },
  'default': {
    selector: ':default',
    description: 'Default state',
    category: 'form'
  },
  'indeterminate': {
    selector: ':indeterminate',
    description: 'Indeterminate state',
    category: 'form'
  },
  'read-only': {
    selector: ':read-only',
    description: 'Read-only state',
    category: 'form'
  },
  'read-write': {
    selector: ':read-write',
    description: 'Read-write state',
    category: 'form'
  },

  // === STRUCTURAL PSEUDO-CLASSES ===
  'first': {
    selector: ':first-child',
    description: 'First child',
    category: 'structural'
  },
  'last': {
    selector: ':last-child',
    description: 'Last child',
    category: 'structural'
  },
  'only': {
    selector: ':only-child',
    description: 'Only child',
    category: 'structural'
  },
  'odd': {
    selector: ':nth-child(odd)',
    description: 'Odd child',
    category: 'structural'
  },
  'even': {
    selector: ':nth-child(even)',
    description: 'Even child',
    category: 'structural'
  },
  'first-of-type': {
    selector: ':first-of-type',
    description: 'First of type',
    category: 'structural'
  },
  'last-of-type': {
    selector: ':last-of-type',
    description: 'Last of type',
    category: 'structural'
  },
  'only-of-type': {
    selector: ':only-of-type',
    description: 'Only of type',
    category: 'structural'
  },
  'empty': {
    selector: ':empty',
    description: 'Empty element',
    category: 'structural'
  },

  // === GROUP STATES ===
  'group-hover': {
    selector: '.group:hover &',
    description: 'Group hover state',
    category: 'group'
  },
  'group-focus': {
    selector: '.group:focus &',
    description: 'Group focus state',
    category: 'group'
  },
  'group-focus-visible': {
    selector: '.group:focus-visible &',
    description: 'Group focus visible state',
    category: 'group'
  },
  'group-focus-within': {
    selector: '.group:focus-within &',
    description: 'Group focus within state',
    category: 'group'
  },
  'group-active': {
    selector: '.group:active &',
    description: 'Group active state',
    category: 'group'
  },
  'group-visited': {
    selector: '.group:visited &',
    description: 'Group visited state',
    category: 'group'
  },
  'group-target': {
    selector: '.group:target &',
    description: 'Group target state',
    category: 'group'
  },
  'group-first': {
    selector: '.group:first-child &',
    description: 'Group first child state',
    category: 'group'
  },
  'group-last': {
    selector: '.group:last-child &',
    description: 'Group last child state',
    category: 'group'
  },
  'group-odd': {
    selector: '.group:nth-child(odd) &',
    description: 'Group odd child state',
    category: 'group'
  },
  'group-even': {
    selector: '.group:nth-child(even) &',
    description: 'Group even child state',
    category: 'group'
  },
  'group-disabled': {
    selector: '.group:disabled &, .group[disabled] &, .group[aria-disabled="true"] &, .group[data-disabled="true"] &',
    description: 'Group disabled state (form + non-form)',
    category: 'group'
  },
  'group-checked': {
    selector: '.group:checked &',
    description: 'Group checked state',
    category: 'group'
  },
  'group-valid': {
    selector: '.group:valid &',
    description: 'Group valid state',
    category: 'group'
  },
  'group-invalid': {
    selector: '.group:invalid &',
    description: 'Group invalid state',
    category: 'group'
  },

  // === PEER STATES ===
  'peer-hover': {
    selector: '.peer:hover ~ &',
    description: 'Peer hover state',
    category: 'peer'
  },
  'peer-focus': {
    selector: '.peer:focus ~ &',
    description: 'Peer focus state',
    category: 'peer'
  },
  'peer-focus-visible': {
    selector: '.peer:focus-visible ~ &',
    description: 'Peer focus visible state',
    category: 'peer'
  },
  'peer-focus-within': {
    selector: '.peer:focus-within ~ &',
    description: 'Peer focus within state',
    category: 'peer'
  },
  'peer-active': {
    selector: '.peer:active ~ &',
    description: 'Peer active state',
    category: 'peer'
  },
  'peer-visited': {
    selector: '.peer:visited ~ &',
    description: 'Peer visited state',
    category: 'peer'
  },
  'peer-target': {
    selector: '.peer:target ~ &',
    description: 'Peer target state',
    category: 'peer'
  },
  'peer-first': {
    selector: '.peer:first-child ~ &',
    description: 'Peer first child state',
    category: 'peer'
  },
  'peer-last': {
    selector: '.peer:last-child ~ &',
    description: 'Peer last child state',
    category: 'peer'
  },
  'peer-odd': {
    selector: '.peer:nth-child(odd) ~ &',
    description: 'Peer odd child state',
    category: 'peer'
  },
  'peer-even': {
    selector: '.peer:nth-child(even) ~ &',
    description: 'Peer even child state',
    category: 'peer'
  },
  'peer-disabled': {
    selector: '.peer:disabled ~ &, .peer[disabled] ~ &, .peer[aria-disabled="true"] ~ &, .peer[data-disabled="true"] ~ &',
    description: 'Peer disabled state (form + non-form)',
    category: 'peer'
  },
  'peer-checked': {
    selector: '.peer:checked ~ &',
    description: 'Peer checked state',
    category: 'peer'
  },
  'peer-valid': {
    selector: '.peer:valid ~ &',
    description: 'Peer valid state',
    category: 'peer'
  },
  'peer-invalid': {
    selector: '.peer:invalid ~ &',
    description: 'Peer invalid state',
    category: 'peer'
  },
  'peer-required': {
    selector: '.peer:required ~ &',
    description: 'Peer required state',
    category: 'peer'
  },
  'peer-placeholder-shown': {
    selector: '.peer:placeholder-shown ~ &',
    description: 'Peer placeholder shown state',
    category: 'peer'
  },

  // === PSEUDO-ELEMENTS ===
  'before': {
    selector: '::before',
    description: 'Before pseudo-element',
    category: 'pseudo-element'
  },
  'after': {
    selector: '::after',
    description: 'After pseudo-element',
    category: 'pseudo-element'
  },
  'first-letter': {
    selector: '::first-letter',
    description: 'First letter pseudo-element',
    category: 'pseudo-element'
  },
  'first-line': {
    selector: '::first-line',
    description: 'First line pseudo-element',
    category: 'pseudo-element'
  },
  'marker': {
    selector: '::marker',
    description: 'Marker pseudo-element',
    category: 'pseudo-element'
  },
  'selection': {
    selector: '::selection',
    description: 'Selection pseudo-element',
    category: 'pseudo-element'
  },
  'placeholder': {
    selector: '::placeholder',
    description: 'Placeholder pseudo-element',
    category: 'pseudo-element'
  },
  'backdrop': {
    selector: '::backdrop',
    description: 'Backdrop pseudo-element',
    category: 'pseudo-element'
  },

  // === FILE PSEUDO-CLASS ===
  'file': {
    selector: '::file-selector-button',
    description: 'File input button',
    category: 'file'
  },

  // === MEDIA QUERIES AS PSEUDO-STATES ===
  'motion-safe': {
    selector: '@media (prefers-reduced-motion: no-preference)',
    description: 'Motion safe media query',
    category: 'media'
  },
  'motion-reduce': {
    selector: '@media (prefers-reduced-motion: reduce)',
    description: 'Motion reduce media query',
    category: 'media'
  },
  'contrast-more': {
    selector: '@media (prefers-contrast: more)',
    description: 'Contrast more media query',
    category: 'media'
  },
  'contrast-less': {
    selector: '@media (prefers-contrast: less)',
    description: 'Contrast less media query',
    category: 'media'
  },
  'high-contrast': {
    selector: '@media (prefers-contrast: high)',
    description: 'High contrast media query',
    category: 'media'
  },
  'forced-colors': {
    selector: '@media (forced-colors: active)',
    description: 'Forced colors media query',
    category: 'media'
  },
  'print': {
    selector: '@media print',
    description: 'Print media query',
    category: 'media'
  },
  'screen': {
    selector: '@media screen',
    description: 'Screen media query',
    category: 'media'
  },

  // === OTHER PSEUDO-CLASSES ===
  'open': {
    selector: '[open]',
    description: 'Open attribute state',
    category: 'other'
  },
  'data-loading': {
    selector: '[data-loading]',
    description: 'Loading attribute state',
    category: 'other'
  },
};

/**
 * Responsive breakpoints as pseudo-states
 */
export const responsiveBreakpoints: Record<string, PseudoState> = {
  'sm': {
    selector: '@media (min-width: 640px)',
    description: 'Small screen breakpoint',
    category: 'media'
  },
  'md': {
    selector: '@media (min-width: 768px)',
    description: 'Medium screen breakpoint',
    category: 'media'
  },
  'lg': {
    selector: '@media (min-width: 1024px)',
    description: 'Large screen breakpoint',
    category: 'media'
  },
  'xl': {
    selector: '@media (min-width: 1280px)',
    description: 'Extra large screen breakpoint',
    category: 'media'
  },
  '2xl': {
    selector: '@media (min-width: 1536px)',
    description: 'Extra extra large screen breakpoint',
    category: 'media'
  }
};

/**
 * Dark mode and theme variants
 */
export const themeVariants: Record<string, PseudoState> = {
  'dark': {
    // Marker only — buildSelector emits Tailwind &:where(.dark, .dark *)
    selector: '.dark',
    description: 'Dark theme (zero-specificity :where selector strategy)',
    category: 'other'
  },
  'light': {
    selector: '.light',
    description: 'Light theme (zero-specificity :where selector strategy)',
    category: 'other'
  }
};

/**
 * Get all pseudo-state keys for variant matching
 */
export function getAllPseudoStateKeys(): string[] {
  return [
    ...Object.keys(pseudoStates),
    ...Object.keys(responsiveBreakpoints),
    ...Object.keys(themeVariants)
  ].sort((a, b) => b.length - a.length); // Sort by length descending for better matching
}

/**
 * Get pseudo-state definition by key
 */
export function getPseudoState(key: string): PseudoState | undefined {
  return pseudoStates[key] || responsiveBreakpoints[key] || themeVariants[key];
}

/**
 * Check if a string is a valid pseudo-state
 */
export function isValidPseudoState(key: string): boolean {
  return !!getPseudoState(key);
}