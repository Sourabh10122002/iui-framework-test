/**
 * IUI Design System - CSS Root Manager
 * Manages runtime CSS injection, deduplication, and FOUC prevention
 */

import { getCSSOptimizationConfig } from './optimization';
import { IUI_PREFLIGHT_RULE } from './iui-preflight';

/**
 * Defines `iui-ol-*` counter styles emitted by VALUE_GETTERS for ordered lists.
 *
 * Base tokens (`list-decimal`, `list-upper-roman`, …) route through
 * `iui-ol-<system>-dot` so the marker/content gap is explicit and identical
 * to the `-period` variant — not implementation-defined by the browser.
 * The `leading-zero` counter extends `decimal-leading-zero` so the same
 * `01.`, `02.`, … `10.`, `11.` progression keeps a `suffix: ". "`.
 *
 * Suffix variants (`period`, `parentheses`, `double-parentheses`) declare
 * the prefix/suffix explicitly so ordered and unordered lists share the
 * same single-space gap between visible marker and content.
 *
 * ### Why `pad: 2 "\2007"` is applied everywhere
 *
 * Without padding, `1.` (1 char) and `01.` (2 chars) render with DIFFERENT
 * marker-box widths in `list-outside` mode — the wider `01.` marker extends
 * its left edge further into the margin, so sibling `<ol>`s visually
 * misalign (the user reported `01` "sticking out" past `1`, `A`, `I`, …).
 *
 * `pad: 2 "\2007"` reserves a 2-character minimum width using figure space
 * (U+2007), which matches digit width in most fonts so `␣1.` and `01.` share
 * the same marker-box width for values ≤ 9. NBSP (U+00A0) was too narrow in
 * practice and caused `list-decimal` markers to sit further right than
 * `list-decimal-leading-zero`.
 *
 * Lists with 10+ items or Roman numerals > VII still grow past 2 chars;
 * `pad` is a minimum width, not a clip — those markers widen consistently
 * for every entry in that list.
 *
 * ### Marker gutter (list-outside is the CSS default — we don't override it)
 *
 * Common resets (`* { padding: 0 }`) remove the UA default `padding-inline-start`
 * on `<ol>` / `<ul>`, so outside markers bleed into the left margin/container
 * edge instead of sitting inside it. `buildListMarkerGutterCSS()` restores that
 * gutter with a width computed FROM these exact `pad`/`suffix` descriptors
 * (in `ch`, i.e. digit-width units) rather than a guessed constant — so the
 * gutter is always exactly as wide as the widest marker it needs to contain.
 */
function buildIuiOrderedListCounterStyleSheet(): string {
  const pad = '"\\2007"';
  const systems = [
    'decimal',
    'upper-roman',
    'upper-alpha',
    'lower-alpha',
    'lower-roman',
  ] as const;
  const blocks: string[] = [];
  for (const sys of systems) {
    blocks.push(`@counter-style iui-ol-${sys}-dot {
  system: extends ${sys};
  pad: 2 ${pad};
  suffix: ". ";
}`);
    blocks.push(`@counter-style iui-ol-${sys}-rparen {
  system: extends ${sys};
  pad: 2 ${pad};
  suffix: ") ";
}`);
    blocks.push(`@counter-style iui-ol-${sys}-dparens {
  system: extends ${sys};
  pad: 2 ${pad};
  prefix: "(";
  suffix: ") ";
}`);
  }
  // `decimal-leading-zero` already zero-pads via `extends`; figure-space pad
  // only applies when the representation is still shorter than 2 graphemes.
  blocks.push(`@counter-style iui-ol-decimal-leading-zero {
  system: extends decimal-leading-zero;
  pad: 2 ${pad};
  suffix: ". ";
}`);
  blocks.push(`@counter-style iui-ol-decimal-leading-zero-rparen {
  system: extends decimal-leading-zero;
  pad: 2 ${pad};
  suffix: ") ";
}`);
  blocks.push(`@counter-style iui-ol-decimal-leading-zero-dparens {
  system: extends decimal-leading-zero;
  pad: 2 ${pad};
  prefix: "(";
  suffix: ") ";
}`);
  return blocks.join('\n');
}

/**
 * Defines `iui-ul-*` counter styles for unordered markers.
 *
 * - **Base markers** (`disc`, `circle`, `square`) extend their native
 *   counter-styles so the glyph stays identical to what browsers render,
 *   but the `suffix: " "` is declared explicitly so the marker→content gap
 *   matches every other IUI list utility (ordered AND custom symbol).
 * - **Symbol markers** (`star`, `bullet`, `diamond`, arrows, …) are cyclic
 *   counter-styles built from the raw Unicode code points.
 *
 * Why this exists instead of raw string markers (`list-style-type: "★"`):
 * 1. String markers in `list-outside` mode render the glyph flush against
 *    content — adding a trailing space to the string does NOT reliably create
 *    a gap because browsers collapse it into the marker box.
 * 2. `@counter-style` rules with `suffix: " "` mirror how the ordered
 *    counters (decimal, roman, alpha) handle spacing, giving unordered
 *    markers identical spacing to `list-decimal`, `list-upper-roman`, etc.
 *
 * Entries MUST stay in sync with `symbolPresets` + base disc/circle/square
 * mapping in `value-getters.ts`.
 */
/**
 * Why `pad: 3 "\A0"` here vs `pad: 2 "\A0"` on ordered counters:
 *
 * Marker-box width = `pad` width + suffix width. We want ordered and
 * unordered markers to share the SAME total marker-box width so every
 * `<ol>` and `<ul>` starts its content at the same X position.
 *
 *   ordered:   pad(2) + ". " suffix  → 4 chars
 *   unordered: pad(3) + " "  suffix  → 4 chars
 *
 * Because the unordered `suffix` is a single space (vs ordered's period+
 * space), the pad must be one character wider to compensate. The extra
 * NBSP renders as invisible width, so `●` still appears as a single bullet
 * but sits inside a 3-char-wide reservation.
 */
function buildIuiUnorderedListCounterStyleSheet(): string {
  // Base unordered counters — extend native `disc`/`circle`/`square` so the
  // glyph is still the browser's native shape but spacing is explicit.
  const baseBlocks: string[] = (['disc', 'circle', 'square'] as const).map(
    (name) => `@counter-style iui-ul-${name} {
  system: extends ${name};
  pad: 3 "\\A0";
  suffix: " ";
}`,
  );

  const symbols: Array<[string, string]> = [
    ['star', '\\2605'],
    ['plus', '+'],
    ['minus', '\\2212'],
    ['dash', '\\2014'],
    ['check', '\\2713'],
    ['tick', '\\2714'],
    ['cross', '\\2715'],
    ['arrow-across', '\\2194'],
    ['down-arrow', '\\25BE'],
    ['diamond', '\\25C6'],
    ['diamond-outline', '\\25C7'],
    ['diamond-cluster', '\\2756'],
    ['square-hollow', '\\25A1'],
    ['square-double', '\\229E'],
    ['arrowhead', '\\27A2'],
    ['smiley', '\\263A'],
    ['frown', '\\2639'],
    ['x-mark', '\\2717'],
  ];
  const symbolBlocks = symbols.map(
    ([name, glyph]) => `@counter-style iui-ul-${name} {
  system: cyclic;
  symbols: "${glyph}";
  pad: 3 "\\A0";
  suffix: " ";
}`,
  );

  return [...baseBlocks, ...symbolBlocks].join('\n');
}

/**
 * Marker-gutter width, in `ch` (≈ digit width), derived directly from the
 * `pad` + `prefix` + `suffix` descriptors above — NOT a visual guess.
 *
 *   ordered "dot"/"rparen":        pad(2) + suffix(". " | ") ", 2 chars) = 4ch
 *   ordered "dparens":             prefix("(",1) + pad(2) + suffix(") ",2) = 5ch
 *   ordered "decimal-leading-zero": pad(2) + suffix(". ", 2 chars)        = 4ch
 *   unordered base/symbol:         pad(3) + suffix(" ", 1 char)           = 4ch
 *
 * Every IUI list counter-style resolves to a 4ch marker box except the
 * "double-parentheses" ordered variants, which need 5ch for the extra `(`.
 * `list-style-position: outside` is the CSS/UA default and is intentionally
 * left untouched here — we only restore the padding a plain `* { padding: 0 }`
 * reset removes, we don't change *where* the marker sits.
 */
function buildListMarkerGutterCSS(): string {
  return `:is(ol, ul):not(.list-inside, .list-none)[class*="list-"] {
  padding-inline-start: 4ch;
}
:is(ol, ul):not(.list-inside, .list-none).list-double-parentheses,
ol:not(.list-inside, .list-none)[class*="double-parentheses"] {
  padding-inline-start: 5ch;
}`.trim();
}

/** @counter-style rules required by list-style-type utilities (build + runtime). */
export function buildListCounterStyleFoundationCSS(): string {
  return [
    buildIuiOrderedListCounterStyleSheet(),
    buildIuiUnorderedListCounterStyleSheet(),
    buildListMarkerGutterCSS(),
  ].join('\n');
}

export class CSSRootManager {
  private cssContent = '';
  private cssRuleCache = new Set<string>(); // Cache for CSS rule deduplication
  /** Injected once at the start of runtime CSS so divide utilities match Tailwind without a separate reset stylesheet. */
  private iuiPreflightInjected = false;
  /** Injected once: @counter-style rules backing `list-style-type: iui-ol-*` ordered-list utilities. */
  private orderedListCounterStylesInjected = false;
  /** Injected once: @counter-style rules backing `list-style-type: iui-ul-*` unordered-symbol utilities. */
  private unorderedListCounterStylesInjected = false;
  private isAttached = false;
  private rootElement: HTMLElement | null = null; // Deprecated: no longer used for data attribute injection
  private styleElement: HTMLStyleElement | null = null;
  private injectionMode: 'head' | 'none';
  private styleNonce: string | undefined;
  private static instance: CSSRootManager | null = null;
  
  static getInstance(): CSSRootManager {
    if (!CSSRootManager.instance) {
      CSSRootManager.instance = new CSSRootManager();
      // Synchronously initialize the style element for FOUC prevention
      CSSRootManager.instance.initializeStyleElementSync();
    }
    return CSSRootManager.instance;
  }
  
  constructor() {
    // Always enable head injection for runtime CSS
    this.injectionMode = 'head';
  }
  
  /**
   * SYNCHRONOUS style element initialization - critical for FOUC prevention
   * Creates the style element immediately when the manager is first accessed
   */
  private initializeStyleElementSync(): void {
    if (typeof document === 'undefined') return;
    if (this.styleElement) return;
    if (this.injectionMode === 'none') return;
    
    // Try to reuse existing element
    const existing = document.getElementById('iui-css-root') as HTMLStyleElement | null;
    this.styleElement = existing || document.createElement('style');
    this.styleElement.id = 'iui-css-root';
    this.styleElement.type = 'text/css';
    
    if (this.styleNonce) {
      (this.styleElement as any).nonce = this.styleNonce;
    }
    
    if (!existing) {
      // Insert after the CSS variable style element but before other styles
      const varsStyle = document.getElementById('iui-root-vars');
      if (varsStyle && varsStyle.nextSibling) {
        document.head.insertBefore(this.styleElement, varsStyle.nextSibling);
      } else if (varsStyle) {
        // Insert after vars style at the end
        document.head.appendChild(this.styleElement);
      } else {
        // Insert at beginning of head
        document.head.insertBefore(this.styleElement, document.head.firstChild);
      }
    }
    
    this.isAttached = true;
  }

  configure(options: { injectionMode?: 'head' | 'none'; nonce?: string } = {}): void {
    if (options.injectionMode) this.injectionMode = options.injectionMode;
    if (options.nonce !== undefined) this.styleNonce = options.nonce;
  }

  /**
   * Set the root element to attach CSS to
   */
  setRootElement(element: HTMLElement): void {
    // Deprecated: retained for backward compatibility, no-op in production
    this.rootElement = element;
  }
  
  /**
   * Update CSS content at root level
   */
  updateCSS(css: string): void {
    this.cssContent = css;
    this.cssRuleCache.clear(); // Clear cache when replacing content
    this.iuiPreflightInjected = false;
    this.orderedListCounterStylesInjected = false;
    this.unorderedListCounterStylesInjected = false;
    this.applyToDOM();
  }

  private ensureIuiPreflight(): void {
    if (this.iuiPreflightInjected) return;
    this.iuiPreflightInjected = true;
    const rule = IUI_PREFLIGHT_RULE;
    const hash = this.hashCSSRule(rule);
    if (!this.cssRuleCache.has(hash)) {
      this.cssRuleCache.add(hash);
    }
    this.cssContent = this.cssContent
      ? `${rule}\n${this.cssContent}`
      : rule;
  }

  private ensureOrderedListCounterStyles(): void {
    if (this.orderedListCounterStylesInjected) return;
    this.orderedListCounterStylesInjected = true;
    const sheet = buildIuiOrderedListCounterStyleSheet();
    this.cssContent = this.cssContent ? `${sheet}\n${this.cssContent}` : sheet;
  }

  private ensureUnorderedListCounterStyles(): void {
    if (this.unorderedListCounterStylesInjected) return;
    this.unorderedListCounterStylesInjected = true;
    const sheet = buildIuiUnorderedListCounterStyleSheet();
    this.cssContent = this.cssContent ? `${sheet}\n${this.cssContent}` : sheet;
  }
  
  /**
   * Append CSS content with enhanced deduplication
   */
  appendCSS(css: string): void {
    // Foundation sheets must run even when this batch produces no new rules;
    // otherwise callers that skip append on empty `generateCSS()` never inject @counter-style.
    this.ensureOrderedListCounterStyles();
    this.ensureUnorderedListCounterStyles();
    this.ensureIuiPreflight();

    const trimmed = (css ?? '').trim();
    if (!trimmed) {
      this.applyToDOM();
      return;
    }

    const config = getCSSOptimizationConfig();

    if (config.enableRuleDeduplication) {
      // Parse and deduplicate CSS rules
      const newRules = this.parseAndDeduplicateCSS(trimmed);
      if (newRules.length > 0) {
        this.cssContent += '\n' + newRules.join('\n');
        this.applyToDOM();
      } else {
        this.applyToDOM();
      }
    } else {
      // Legacy behavior - simple string-based deduplication
      if (!this.cssContent.includes(trimmed)) {
        this.cssContent += '\n' + trimmed;
        this.applyToDOM();
      } else {
        this.applyToDOM();
      }
    }
  }
  
  /**
   * Parse CSS and deduplicate at rule level
   */
  private parseAndDeduplicateCSS(css: string): string[] {
    const rules = this.extractCSSRules(css);
    const newRules: string[] = [];
    
    rules.forEach(rule => {
      const ruleHash = this.hashCSSRule(rule);
      if (!this.cssRuleCache.has(ruleHash)) {
        this.cssRuleCache.add(ruleHash);
        newRules.push(rule);
      }
    });
    
    return newRules;
  }
  
  /**
   * Extract individual CSS rules from CSS string
   */
  private extractCSSRules(css: string): string[] {
    // Simple CSS rule extraction - handles basic CSS rules and media queries
    const rules: string[] = [];
    let currentRule = '';
    let braceCount = 0;
    
    for (let i = 0; i < css.length; i++) {
      const char = css[i];
      currentRule += char;
      
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        
        if (braceCount === 0) {
          // End of a complete rule
          const trimmedRule = currentRule.trim();
          if (trimmedRule) {
            rules.push(trimmedRule);
          }
          currentRule = '';
        }
      }
    }
    
    return rules;
  }
  
  /**
   * Create hash for CSS rule deduplication
   */
  private hashCSSRule(rule: string): string {
    // Normalize whitespace and create a consistent hash
    const normalized = rule
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .replace(/{\s*/g, '{')
      .replace(/:\s*/g, ':')
      .trim();
    
    return btoa(normalized).replace(/[+/=]/g, ''); // Simple base64 hash without special chars
  }
  
  /**
   * Get current CSS content
   */
  getCSS(): string {
    return this.cssContent;
  }
  
  /**
   * Clear all CSS and cache
   */
  clear(): void {
    this.cssContent = '';
    this.cssRuleCache.clear();
    this.iuiPreflightInjected = false;
    this.orderedListCounterStylesInjected = false;
    this.unorderedListCounterStylesInjected = false;
    this.applyToDOM();
  }
  
  /**
   * Get cache statistics
   */
  getCacheStats(): { totalRules: number; cacheSize: number } {
    return {
      totalRules: this.cssContent.split('}').length - 1, // Rough rule count
      cacheSize: this.cssRuleCache.size
    };
  }
  
  /**
   * Apply CSS to DOM directly for immediate effect
   */
  private applyToDOM(): void {
    if (typeof window === 'undefined') return;
    if (this.injectionMode === 'none') {
      // No runtime DOM injection in this mode
      return;
    }
    
    // Ensure style element exists (should already be initialized synchronously)
    if (!this.styleElement) {
      this.initializeStyleElementSync();
    }
    
    if (!this.styleElement) return;
    
    // Update style content
    this.styleElement.textContent = this.cssContent;
    
    // Also dispatch event for external consumption (without exposing CSS in attributes)
    const event = new CustomEvent('iui-css-updated', {
      detail: { css: this.cssContent }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Attach to DOM and create necessary elements
   * Note: Style element is now created synchronously on first getInstance()
   * This method is kept for backwards compatibility and applying any pending CSS
   */
  attachToDOM(): void {
    if (typeof window !== 'undefined') {
      if (this.injectionMode === 'none') {
        this.isAttached = true;
        return;
      }
      
      // Ensure style element exists
      if (!this.styleElement) {
        this.initializeStyleElementSync();
      }
      
      this.isAttached = true;
      
      // Apply any pending CSS
      if (this.cssContent) {
        this.applyToDOM();
      }
    }
  }
}

// Export singleton instance
export const cssRootManager = CSSRootManager.getInstance();


