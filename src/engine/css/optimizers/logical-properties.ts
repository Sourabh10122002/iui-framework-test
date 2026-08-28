/**
 * IUI Design System - CSS Logical Properties Engine
 * Industry standard CSS logical properties for RTL support (like Tailwind CSS)
 * Supports all utility types: dynamic, arbitrary, pseudo combinations, grid positioning
 */

export interface CSSLogicalPropertiesConfig {
  /** Enable CSS logical properties (default: true) */
  enabled: boolean;
  
  /** Enable RTL support (default: true) */
  enableRTL: boolean;
  
  /** Enable LTR support (default: true) */
  enableLTR: boolean;
  
  /** Enable logical margin/padding (default: true) */
  enableLogicalSpacing: boolean;
  
  /** Enable logical borders (default: true) */
  enableLogicalBorders: boolean;
  
  /** Enable logical positioning (default: true) */
  enableLogicalPositioning: boolean;
  
  /** Enable logical sizing (default: true) */
  enableLogicalSizing: boolean;
  
  /** Enable logical text alignment (default: true) */
  enableLogicalTextAlign: boolean;
  
  /** Verbose logging (default: false) */
  verbose: boolean;
}

export interface CSSLogicalPropertiesResult {
  /** Generated CSS with logical properties */
  logicalCSS: string;
  
  /** RTL-specific CSS */
  rtlCSS: string;
  
  /** LTR-specific CSS */
  ltrCSS: string;
  
  /** Logical properties mapping */
  logicalMapping: Record<string, string>;
  
  /** Processing time */
  processingTime: number;
}

/** Default CSS logical properties configuration */
export const DEFAULT_CSS_LOGICAL_CONFIG: CSSLogicalPropertiesConfig = {
  enabled: true,
  enableRTL: true,
  enableLTR: true,
  enableLogicalSpacing: true,
  enableLogicalBorders: true,
  enableLogicalPositioning: true,
  enableLogicalSizing: true,
  enableLogicalTextAlign: true,
  verbose: false,
};

/** Global CSS logical properties configuration */
let globalCSSLogicalConfig: CSSLogicalPropertiesConfig = { ...DEFAULT_CSS_LOGICAL_CONFIG };

/**
 * Update CSS logical properties configuration
 */
export function configureCSSLogicalProperties(config: Partial<CSSLogicalPropertiesConfig>): void {
  globalCSSLogicalConfig = { ...globalCSSLogicalConfig, ...config };
}

/**
 * Get current CSS logical properties configuration
 */
export function getCSSLogicalPropertiesConfig(): CSSLogicalPropertiesConfig {
  return { ...globalCSSLogicalConfig };
}

/**
 * Reset CSS logical properties configuration to defaults
 */
export function resetCSSLogicalPropertiesConfig(): void {
  globalCSSLogicalConfig = { ...DEFAULT_CSS_LOGICAL_CONFIG };
}

/**
 * CSS Logical Properties Engine
 * Converts physical properties to logical properties for RTL support
 */
export class CSSLogicalPropertiesEngine {
  private config: CSSLogicalPropertiesConfig;
  private logicalMapping: Record<string, string>;
  
  constructor(config?: Partial<CSSLogicalPropertiesConfig>) {
    this.config = { ...globalCSSLogicalConfig, ...config };
    this.logicalMapping = this.initializeLogicalMapping();
  }
  
  /**
   * Initialize logical properties mapping
   */
  private initializeLogicalMapping(): Record<string, string> {
    return {
      // Margin properties
      'margin-left': 'margin-inline-start',
      'margin-right': 'margin-inline-end',
      'margin-top': 'margin-block-start',
      'margin-bottom': 'margin-block-end',
      
      // Padding properties
      'padding-left': 'padding-inline-start',
      'padding-right': 'padding-inline-end',
      'padding-top': 'padding-block-start',
      'padding-bottom': 'padding-block-end',
      
      // Border properties
      'border-left': 'border-inline-start',
      'border-right': 'border-inline-end',
      'border-top': 'border-block-start',
      'border-bottom': 'border-block-end',
      'border-left-width': 'border-inline-start-width',
      'border-right-width': 'border-inline-end-width',
      'border-top-width': 'border-block-start-width',
      'border-bottom-width': 'border-block-end-width',
      'border-left-style': 'border-inline-start-style',
      'border-right-style': 'border-inline-end-style',
      'border-top-style': 'border-block-start-style',
      'border-bottom-style': 'border-block-end-style',
      'border-left-color': 'border-inline-start-color',
      'border-right-color': 'border-inline-end-color',
      'border-top-color': 'border-block-start-color',
      'border-bottom-color': 'border-block-end-color',
      
      // Border radius properties
      'border-top-left-radius': 'border-start-start-radius',
      'border-top-right-radius': 'border-start-end-radius',
      'border-bottom-left-radius': 'border-end-start-radius',
      'border-bottom-right-radius': 'border-end-end-radius',
      
      // Position properties (inline axis: start / end; block axis: top / bottom)
      'start': 'inset-inline-start',
      'end': 'inset-inline-end',
      'top': 'inset-block-start',
      'bottom': 'inset-block-end',
      
      // Size properties
      'width': 'inline-size',
      'height': 'block-size',
      'min-width': 'min-inline-size',
      'min-height': 'min-block-size',
      'max-width': 'max-inline-size',
      'max-height': 'max-block-size',
      
      // Text properties
      'text-align': 'text-align',
      'text-align: left': 'text-align: start',
      'text-align: right': 'text-align: end',
      
      // Float properties
      'float: left': 'float: inline-start',
      'float: right': 'float: inline-end',
      
      // Clear properties
      'clear: left': 'clear: inline-start',
      'clear: right': 'clear: inline-end',
      
      // Resize properties
      'resize: horizontal': 'resize: inline',
      'resize: vertical': 'resize: block',
      
      // Overflow properties
      'overflow-x': 'overflow-inline',
      'overflow-y': 'overflow-block',
      
      // Scroll properties
      'scroll-padding-left': 'scroll-padding-inline-start',
      'scroll-padding-right': 'scroll-padding-inline-end',
      'scroll-padding-top': 'scroll-padding-block-start',
      'scroll-padding-bottom': 'scroll-padding-block-end',
      'scroll-margin-left': 'scroll-margin-inline-start',
      'scroll-margin-right': 'scroll-margin-inline-end',
      'scroll-margin-top': 'scroll-margin-block-start',
      'scroll-margin-bottom': 'scroll-margin-block-end',
    };
  }
  
  /**
   * Convert CSS to logical properties
   */
  convertToLogicalProperties(css: string): CSSLogicalPropertiesResult {
    const startTime = performance.now();
    
    if (!this.config.enabled) {
      return {
        logicalCSS: css,
        rtlCSS: '',
        ltrCSS: '',
        logicalMapping: this.logicalMapping,
        processingTime: performance.now() - startTime,
      };
    }
    
    // Convert to logical properties
    const logicalCSS = this.convertCSS(css);
    
    const rtlCSS = this.config.enableRTL ? this.generateRTLCSS() : '';
    const ltrCSS = this.config.enableLTR ? this.generateLTRCSS() : '';
    
    const processingTime = performance.now() - startTime;
    
    return {
      logicalCSS,
      rtlCSS,
      ltrCSS,
      logicalMapping: this.logicalMapping,
      processingTime,
    };
  }
  
  /**
   * Convert CSS string to logical properties
   */
  private convertCSS(css: string): string {
    let convertedCSS = css;

    // Longer keys first so e.g. border-left-width replaces before border-left, and
    // inset-inline-* is not corrupted by bare start/end property replacements.
    const entries = Object.entries(this.logicalMapping).sort(
      (a, b) => b[0].length - a[0].length,
    );

    for (const [physical, logical] of entries) {
      if (physical.includes(':')) {
        const colonIdx = physical.indexOf(':');
        const prop = physical.slice(0, colonIdx).trim();
        const value = physical.slice(colonIdx + 1).trim();
        const regex = new RegExp(
          `${prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          'g',
        );
        convertedCSS = convertedCSS.replace(regex, `${logical}`);
      } else if (physical === 'start' || physical === 'end') {
        const escaped = physical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|[;{]\\s*)${escaped}(\\s*:)`, 'gm');
        convertedCSS = convertedCSS.replace(regex, `$1${logical}$2`);
      } else {
        const escaped = physical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`${escaped}(?=\\s*:)`, 'g');
        convertedCSS = convertedCSS.replace(regex, logical);
      }
    }

    return convertedCSS;
  }
  
  /** Static RTL snippet (logical utilities; no legacy physical L/R class mirrors). */
  private generateRTLCSS(): string {
    return `
/* RTL Support */
[dir="rtl"] {
  /* Logical properties automatically work in RTL */
}

/* RTL-specific overrides: use logical utilities (text-start/end, float-start/end, ms/me, etc.) — no legacy L/R class rules */
`;
  }

  /** Static LTR snippet (logical utilities need no physical mirror rules). */
  private generateLTRCSS(): string {
    return `
/* LTR Support */
[dir="ltr"] {
  /* Logical properties automatically work in LTR */
}

/* LTR-specific overrides: logical utilities need no L/R mirror rules */
`;
  }

  /**
   * Get logical properties mapping
   */
  getLogicalMapping(): Record<string, string> {
    return { ...this.logicalMapping };
  }
  
  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...DEFAULT_CSS_LOGICAL_CONFIG };
    this.logicalMapping = this.initializeLogicalMapping();
  }
}

/**
 * Create a new CSS logical properties engine instance
 */
export function createCSSLogicalPropertiesEngine(config?: Partial<CSSLogicalPropertiesConfig>): CSSLogicalPropertiesEngine {
  return new CSSLogicalPropertiesEngine(config);
}

/**
 * Quick CSS logical properties conversion
 */
export function convertToLogicalProperties(
  css: string,
  config?: Partial<CSSLogicalPropertiesConfig>
): CSSLogicalPropertiesResult {
  const engine = new CSSLogicalPropertiesEngine(config);
  return engine.convertToLogicalProperties(css);
}
