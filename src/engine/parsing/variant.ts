/**
 * IUI Design System - Variant Parser
 * Advanced parser for handling complex variant combinations like Tailwind CSS
 */

import { getAllPseudoStateKeys, getPseudoState } from './pseudo-states';

export interface ParsedVariant {
  /**
   * The base class name without any variants
   */
  baseClass: string;
  
  /**
   * Array of variant modifiers in order of application
   */
  variants: string[];
  
  /**
   * The original full class name
   */
  originalClass: string;
  
  /**
   * Whether the utility should use !important
   * Detected from ! prefix (Tailwind CSS behavior)
   */
  important?: boolean;
}

/**
 * Parse a utility class with potentially multiple variants
 * Supports combinations like: sm:hover:focus:bg-blue-500
 * 
 * @param className Full class name with variants
 * @returns Parsed variant information
 */
export function parseVariants(className: string): ParsedVariant {
  const variants: string[] = [];
  let remainingClass = className;
  let isImportant = false;
  
  // Check for ! important modifier prefix (Tailwind CSS behavior)
  // Must be checked before variants to handle cases like !sm:gap-4
  if (remainingClass.startsWith('!')) {
    isImportant = true;
    remainingClass = remainingClass.substring(1);
  }
  
  // Get all possible pseudo-state keys sorted by length (longest first)
  // This ensures we match longer variants before shorter ones (e.g., 'focus-visible' before 'focus')
  const pseudoStateKeys = getAllPseudoStateKeys();
  
  // Keep parsing variants until none are found
  let hasFoundVariant = true;
  while (hasFoundVariant) {
    hasFoundVariant = false;
    
    // Check for arbitrary media queries first: [@media(...)]:
    // This must come before standard variants to avoid conflicts
    // Supports: [@media(min-width:400px)], [@media(max-width:500px)], [@media(min-width:400px)and(max-width:800px)], etc.
    // Use a balanced parentheses approach to handle complex media queries
    if (remainingClass.startsWith('[@media(')) {
      let depth = 1; // start after the initial '('
      let endIndex = -1;
      
      // Find the matching closing parenthesis followed by ]:
      for (let i = 8; i < remainingClass.length; i++) { // Start scanning right after '[@media('
        const ch = remainingClass[i];
        if (ch === '(') {
          depth++;
        } else if (ch === ')') {
          depth--;
          // When depth returns to 0, we are at the closing ')' that matches the initial '('
          if (depth === 0 && remainingClass[i + 1] === ']' && remainingClass[i + 2] === ':') {
            endIndex = i + 1; // position of ']'
            break;
          }
        }
      }
      
      if (endIndex !== -1) {
        const arbitraryMediaQuery = remainingClass.substring(0, endIndex + 1); // Include ']'
        variants.push(arbitraryMediaQuery);
        remainingClass = remainingClass.substring(endIndex + 2); // Skip ']:'
        hasFoundVariant = true;
        continue;
      }
    }
    
    // Check standard variants
    for (const pseudoKey of pseudoStateKeys) {
      const pattern = `${pseudoKey}:`;
      if (remainingClass.startsWith(pattern)) {
        variants.push(pseudoKey);
        remainingClass = remainingClass.substring(pattern.length);
        hasFoundVariant = true;
        break;
      }
    }
  }
  
  return {
    baseClass: remainingClass,
    variants,
    originalClass: className,
    important: isImportant
  };
}

/** Theme variants applied after group/peer (Tailwind: dark:group-hover → .group:hover .util:where(.dark, .dark *)) */
const THEME_VARIANTS_FOR_SELECTOR_ORDER = new Set(["dark", "light"]);

/**
 * Parsed order follows source (dark:group-hover → dark then group-hover in array).
 * buildSelector prepends ancestors in loop order; the first variant becomes innermost.
 * Theme (dark, light) runs after group- and peer- variants so :where(.dark) wraps correctly.
 */
function sortVariantsForSelectorBuild(variants: string[]): string[] {
  const nonTheme: string[] = [];
  const theme: string[] = [];
  for (const v of variants) {
    if (THEME_VARIANTS_FOR_SELECTOR_ORDER.has(v)) theme.push(v);
    else nonTheme.push(v);
  }
  return [...nonTheme, ...theme];
}

/**
 * Split a CSS selector list on top-level commas (respects [], quotes).
 * Tailwind uses the same segmentation before wrapping lists in :is().
 */
function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let current = "";
  let bracketDepth = 0;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (quote) {
      current += ch;
      if (ch === quote && selector[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "[") {
      bracketDepth++;
      current += ch;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      current += ch;
      continue;
    }
    if (ch === "," && bracketDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) parts.push(trimmed);
      current = "";
      continue;
    }
    current += ch;
  }

  const trimmed = current.trim();
  if (trimmed) parts.push(trimmed);
  return parts;
}

function isSelectorList(selector: string): boolean {
  return splitSelectorList(selector).length > 1;
}

/** Tailwind v4: &:disabled or &:is([open], :open) for multi-alternative self variants. */
function applySelfPseudoVariant(
  currentSelector: string,
  pseudoSelector: string,
): string {
  if (isSelectorList(pseudoSelector)) {
    return `${currentSelector}:is(${pseudoSelector})`;
  }
  return `${currentSelector}${pseudoSelector}`;
}

/**
 * Tailwind group-* compound: replace & with the utility selector per branch.
 * group-disabled lists every alternative with .group and & on each branch.
 */
function applyGroupPseudoVariant(
  currentSelector: string,
  pseudoSelector: string,
): string {
  if (pseudoSelector.includes("&")) {
    return splitSelectorList(pseudoSelector)
      .map((branch) => branch.replace(/\s&$/, ` ${currentSelector}`).trim())
      .join(", ");
  }
  const groupState = pseudoSelector.replace(/^\.group:/, "").replace(/\s&$/, "");
  return `.group:${groupState} ${currentSelector}`;
}

/** Tailwind peer-* compound: same as group but with ~ combinator before &. */
function applyPeerPseudoVariant(
  currentSelector: string,
  pseudoSelector: string,
): string {
  if (pseudoSelector.includes("&")) {
    return splitSelectorList(pseudoSelector)
      .map((branch) =>
        branch.replace(/\s~\s&$/, ` ~ ${currentSelector}`).trim(),
      )
      .join(", ");
  }
  const peerState = pseudoSelector.replace(/^\.peer:/, "").replace(/\s~\s&$/, "");
  return `.peer:${peerState} ~ ${currentSelector}`;
}

/**
 * Build CSS selector from parsed variants
 * Handles proper nesting and combination of selectors
 */
export function buildSelector(baseClass: string, variants: string[]): string {
  // Escape all non word-ish characters in class names for CSS selectors.
  // Required for utilities like content-['...'] that include brackets/quotes.
  const escapedClassName = baseClass.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  let selector = `.${escapedClassName}`;
  
  if (variants.length === 0) {
    return selector;
  }
  
  const orderedVariants = sortVariantsForSelectorBuild(variants);

  // Process variants in order
  let currentSelector = selector;
  let mediaQueries: string[] = [];
  
  for (const variant of orderedVariants) {
    // Handle arbitrary media queries: [@media(min-width:400px)]
    if (variant.startsWith('[@media(') && variant.endsWith(')]')) {
      // Extract the media query condition from the bracket notation
      // [@media(min-width:400px)] -> @media (min-width:400px)
      // substring(8, length-3) extracts content between '[@media(' and ')]' excluding the closing ')'
      // For '[media(min-width:400px)]' (length 25), substring(8, 22) gives 'min-width:400px'
      const mediaQueryContent = variant.substring(8, variant.length - 3); // Remove '[@media(', ')', and ']'
      
      // The extracted content is the media query condition (without outer parentheses)
      // Wrap it in parentheses for valid CSS: min-width:400px -> (min-width:400px)
      const normalizedContent = mediaQueryContent.trim().startsWith('(') 
        ? mediaQueryContent.trim() 
        : `(${mediaQueryContent.trim()})`;
      const mediaQuery = `@media ${normalizedContent}`;
      mediaQueries.push(mediaQuery);
      continue;
    }
    
    const pseudoState = getPseudoState(variant);
    if (!pseudoState) continue;
    
    const pseudoSelector = pseudoState.selector;
    
    if (pseudoSelector.startsWith('@media')) {
      // Media queries wrap the entire selector
      mediaQueries.push(pseudoSelector);
    } else if (pseudoSelector.startsWith('.group:')) {
      currentSelector = applyGroupPseudoVariant(currentSelector, pseudoSelector);
    } else if (pseudoSelector.startsWith('.peer:')) {
      currentSelector = applyPeerPseudoVariant(currentSelector, pseudoSelector);
    } else if (pseudoSelector === '.dark' || pseudoSelector.startsWith('.dark')) {
      // Tailwind v3.4+ / v4 selector strategy: &:where(.dark, .dark *)
      // :where() contributes 0 specificity so dark:border-* does not beat border-s/b-*
      currentSelector = `${currentSelector}:where(.dark, .dark *)`;
    } else if (pseudoSelector === '.light' || pseudoSelector.startsWith('.light')) {
      currentSelector = `${currentSelector}:where(.light, .light *)`;
    } else if (pseudoSelector.startsWith(':') || pseudoSelector.startsWith('::')) {
      currentSelector = applySelfPseudoVariant(currentSelector, pseudoSelector);
    } else if (pseudoSelector.startsWith('[')) {
      // Attribute selectors
      currentSelector = `${currentSelector}${pseudoSelector}`;
    }
  }
  
  // Wrap in media queries if any
  let finalSelector = currentSelector;
  for (const mediaQuery of mediaQueries.reverse()) { // Reverse to apply outermost first
    finalSelector = `${mediaQuery} { ${finalSelector} }`;
  }
  
  return finalSelector;
}

/**
 * Append a pseudo-element/class to the innermost selector (e.g. for companion rules like ::first-letter).
 * When the selector is wrapped in `@media { … }`, the pseudo is appended inside the block.
 */
export function appendPseudoToSelector(selector: string, pseudo: string): string {
  const open = "{ ";
  const idx = selector.lastIndexOf(open);
  if (idx !== -1) {
    const closeIdx = selector.lastIndexOf(" }");
    if (closeIdx > idx + open.length) {
      const inner = selector.slice(idx + open.length, closeIdx);
      return selector.slice(0, idx + open.length) + inner + pseudo + selector.slice(closeIdx);
    }
  }
  return selector + pseudo;
}

/**
 * Generate CSS rule from parsed variants
 */
export function generateCSSRule(baseClass: string, variants: string[], cssProperties: Record<string, string>): string {
  const selector = buildSelector(baseClass, variants);
  const properties = Object.entries(cssProperties)
    .map(([prop, value]) => `  ${prop}: ${value};`)
    .join('\n');
  
  // Check if selector contains media queries
  if (selector.includes('@media')) {
    return selector.replace(' }', ` {\n${properties}\n} }`);
  } else {
    return `${selector} {\n${properties}\n}`;
  }
}