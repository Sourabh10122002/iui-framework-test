/**
 * IUI Design System - Utility Animations
 * Animation keyframes for utility builder (compile-first + optional runtime inject)
 */

import { CSSRootManager } from '../css/root-manager';
import { logger } from '../../utilities/logger';

/**
 * Standard animation keyframes CSS.
 * Must ship with compile-first stylesheets — utility rules reference these names
 * (`animation: spin …`) and do nothing if `@keyframes` are missing.
 */
export const ANIMATION_KEYFRAMES = `/*__iui-animation-keyframes__*/
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
@keyframes pulse { 50% { opacity: 0.5; } }
@keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); } 50% { transform: none; animation-timing-function: cubic-bezier(0, 0, 0.2, 1); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { transform: translateY(0); } }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { transform: translateY(0); } }
@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-20px); } to { transform: translateX(0); } }
@keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { transform: translateX(0); } }
@keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes slideInDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }
@keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
@keyframes scaleIn { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes scaleOut { from { transform: scale(1); } to { transform: scale(0); } }
@keyframes scaleInCenter { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes zoomIn { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes zoomOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.3); opacity: 0; } }
@keyframes rotateIn { from { transform: rotate(-200deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }
@keyframes rotateOut { from { transform: rotate(0deg); opacity: 1; } to { transform: rotate(200deg); opacity: 0; } }
`;

/** @returns Keyframes block for compile-first / SSR CSS strings (no DOM). */
export function getAnimationKeyframesCSS(): string {
  return ANIMATION_KEYFRAMES;
}

/**
 * True when generated utility CSS references named animations that need @keyframes.
 */
export function cssNeedsAnimationKeyframes(css: string): boolean {
  if (!css) return false;
  // Presets emit longhands (`animation-name`) — not only `animation:` shorthand.
  if (/animation-name\s*:\s*(?!none\b)/m.test(css)) return true;
  // `animation: none` does not need keyframes; named animations do.
  return /(?:^|[^-])animation\s*:\s*(?!none\b)/m.test(css);
}

/**
 * Animation keyframes manager
 * Ensures animation keyframes are injected once per application lifecycle (runtime path).
 */
export class AnimationKeyframesManager {
  private static injected = false;

  /**
   * Ensure standard animation keyframes are available once (runtime CSSRootManager).
   * Compile-first builds should use {@link getAnimationKeyframesCSS} in the stylesheet instead.
   */
  static ensureKeyframes(): void {
    if (this.injected) return;

    try {
      const manager = CSSRootManager.getInstance();
      // Avoid double-injection by checking existing CSS
      if (!manager.getCSS().includes('/*__iui-animation-keyframes__*/')) {
        manager.appendCSS(ANIMATION_KEYFRAMES);
      }
      this.injected = true;
    } catch (error) {
      // Log error in development, silently fail in production
      logger.warn('Failed to inject animation keyframes:', error);
      // Mark as injected to prevent retry loops
      this.injected = true;
    }
  }

  /**
   * Reset injection state (for testing)
   */
  static reset(): void {
    this.injected = false;
  }

  /**
   * Check if keyframes are already injected
   */
  static isInjected(): boolean {
    return this.injected;
  }
}
