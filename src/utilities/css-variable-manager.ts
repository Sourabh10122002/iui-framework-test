/**
 * IUI Design System - CSS Variable Manager
 * 
 * This system provides a tiny internal API for writing CSS variables to a single
 * <style id="iui-root-vars"> element appended at the end of <head>.
 * 
 * FOUC Prevention:
 * - Style element is created SYNCHRONOUSLY on module load (before any React renders)
 * - Initial variables are applied immediately without batching
 * - High priority updates bypass the batch queue entirely
 * 
 * Benefits:
 * - Cleaner DOM (no inline styles on html/body)
 * - Better performance through batching (after initial load)
 * - Centralized variable management
 * - Cascade-friendly (final style element wins)
 * - No MutationObserver overhead in production
 * - Zero FOUC with synchronous initialization
 */

import { TIMING_CONFIG } from '../engine/config/performance';

interface CSSVariableUpdate {
    name: string;
    value: string;
    priority?: 'normal' | 'high';
}

// Track if this is the initial load (before first paint)
let isInitialLoad = true;

class CSSVariableManager {
    private styleElement: HTMLStyleElement | null = null;
    private pendingUpdates = new Map<string, CSSVariableUpdate>();
    private isProcessing = false;
    private batchTimeout: number | null = null;
    private highPriorityUpdates = new Map<string, CSSVariableUpdate>();
    private currentVariables = new Map<string, string>();
    private isInitialized = false;

    private readonly STYLE_ID = 'iui-root-vars';
    private readonly BATCH_DELAY = TIMING_CONFIG.CSS_VARIABLE_BATCH_DELAY;

    constructor() {
        // Initialize synchronously on construction to prevent FOUC
        this.initializeStyleElementSync();
    }

    /**
     * SYNCHRONOUS style element initialization - critical for FOUC prevention
     * This runs immediately when the module loads, before any React rendering
     */
    private initializeStyleElementSync(): void {
        if (typeof document === 'undefined') return;
        if (this.isInitialized) return;

        // Try to find existing element first
        this.styleElement = document.getElementById(this.STYLE_ID) as HTMLStyleElement;

        if (!this.styleElement) {
            this.styleElement = document.createElement('style');
            this.styleElement.id = this.STYLE_ID;
            // Insert at the beginning of head for earliest possible loading
            // but after any existing <style> elements to maintain cascade order
            const firstStyleOrLink = document.head.querySelector('style, link[rel="stylesheet"]');
            if (firstStyleOrLink) {
                document.head.insertBefore(this.styleElement, firstStyleOrLink);
            } else {
                // Prepend to head if no styles exist yet
                document.head.insertBefore(this.styleElement, document.head.firstChild);
            }
        }
        
        this.isInitialized = true;
    }

    // Legacy method - now calls sync version
    private initializeStyleElement(): void {
        this.initializeStyleElementSync();
    }

    // Sets a single CSS variable with optional priority
    setVariable(name: string, value: string, priority: 'normal' | 'high' = 'normal'): void {
        const update: CSSVariableUpdate = { name, value, priority };

        // During initial load, apply ALL updates immediately to prevent FOUC
        if (isInitialLoad || priority === 'high') {
            this.highPriorityUpdates.set(name, update);
            this.processHighPriorityUpdates();
        } else {
            this.pendingUpdates.set(name, update);
            this.scheduleBatchUpdate();
        }
    }

    // Sets multiple CSS variables at once with optional priority
    setVariables(variables: Record<string, string>, priority: 'normal' | 'high' = 'normal'): void {
        // During initial load, process all at once synchronously
        if (isInitialLoad || priority === 'high') {
            const updates: CSSVariableUpdate[] = Object.entries(variables).map(([name, value]) => ({
                name,
                value,
                priority: 'high' as const
            }));
            
            updates.forEach(update => {
                this.currentVariables.set(update.name, update.value);
            });
            
            this.applyUpdatesSync();
        } else {
            Object.entries(variables).forEach(([name, value]) => {
                this.setVariable(name, value, priority);
            });
        }
    }

    // Immediately processes and applies high priority updates
    private processHighPriorityUpdates(): void {
        if (this.highPriorityUpdates.size === 0) return;

        this.initializeStyleElement();
        if (!this.styleElement) return;

        const updates = Array.from(this.highPriorityUpdates.values());
        this.highPriorityUpdates.clear();
        this.applyUpdates(updates);
    }

    // Schedules a batch update with debouncing (only used after initial load)
    private scheduleBatchUpdate(): void {
        if (this.isProcessing || this.batchTimeout) return;

        this.batchTimeout = window.setTimeout(() => {
            this.processBatchUpdate();
        }, this.BATCH_DELAY);
    }

    // Processes all pending normal priority updates in a batch
    private processBatchUpdate(): void {
        if (this.pendingUpdates.size === 0) {
            this.batchTimeout = null;
            return;
        }

        this.isProcessing = true;
        this.batchTimeout = null;

        const updates = Array.from(this.pendingUpdates.values());
        this.pendingUpdates.clear();
        this.applyUpdates(updates);
        this.isProcessing = false;

        if (this.pendingUpdates.size > 0) {
            this.scheduleBatchUpdate();
        }
    }

    // Applies variable updates to the style element
    private applyUpdates(updates: CSSVariableUpdate[]): void {
        if (!this.styleElement) return;

        updates.forEach(update => {
            this.currentVariables.set(update.name, update.value);
        });

        this.applyUpdatesSync();
    }

    // Synchronously applies all current variables to the style element
    private applyUpdatesSync(): void {
        if (!this.styleElement) {
            this.initializeStyleElementSync();
        }
        if (!this.styleElement) return;

        const variableDeclarations = Array.from(this.currentVariables.entries())
            .map(([name, value]) => `  ${name}: ${value};`)
            .join('\n');

        this.styleElement.textContent = `:root {\n${variableDeclarations}\n}`;
    }

    // Gets the current value of a CSS variable
    getVariable(name: string): string {
        if (typeof document === 'undefined') return '';

        const pendingUpdate = this.pendingUpdates.get(name);
        if (pendingUpdate) return pendingUpdate.value;

        const highPriorityUpdate = this.highPriorityUpdates.get(name);
        if (highPriorityUpdate) return highPriorityUpdate.value;

        const currentValue = this.currentVariables.get(name);
        if (currentValue !== undefined) return currentValue;

        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // Removes a CSS variable from all queues and current state
    removeVariable(name: string): void {
        this.pendingUpdates.delete(name);
        this.highPriorityUpdates.delete(name);
        this.currentVariables.delete(name);

        if (this.currentVariables.size > 0) {
            this.applyUpdates([]);
        } else {
            if (this.styleElement) {
                this.styleElement.textContent = ':root {}';
            }
        }
    }

    // Clears all variables and resets the manager
    clear(): void {
        this.pendingUpdates.clear();
        this.highPriorityUpdates.clear();
        this.currentVariables.clear();

        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }

        if (this.styleElement) {
            this.styleElement.textContent = ':root {}';
        }
    }

    // Returns a copy of all currently set variables for debugging
    getAllVariables(): Map<string, string> {
        return new Map(this.currentVariables);
    }

    // Returns a copy of pending normal priority updates for debugging
    getPendingUpdates(): Map<string, CSSVariableUpdate> {
        return new Map(this.pendingUpdates);
    }

    // Returns a copy of pending high priority updates for debugging
    getHighPriorityUpdates(): Map<string, CSSVariableUpdate> {
        return new Map(this.highPriorityUpdates);
    }
}

export const cssVariableManager = new CSSVariableManager();

// Convenience function to set multiple variables at once
export const setRootCssVariables = (variables: Record<string, string>, priority: 'normal' | 'high' = 'normal'): void => {
    cssVariableManager.setVariables(variables, priority);
};

// Convenience function to set a single variable
export const setRootCssVariable = (name: string, value: string, priority: 'normal' | 'high' = 'normal'): void => {
    cssVariableManager.setVariable(name, value, priority);
};

// Convenience function to get a variable value
export const getRootCssVariable = (name: string): string => {
    return cssVariableManager.getVariable(name);
};

// Convenience function to remove a single variable
export const removeRootCssVariable = (name: string): void => {
    cssVariableManager.removeVariable(name);
};

// Convenience function to clear all variables
export const clearRootCssVariables = (): void => {
    cssVariableManager.clear();
};

/**
 * Mark initial load as complete - call this after the first render
 * After this, normal batching will be used for better performance
 */
export const markInitialLoadComplete = (): void => {
    isInitialLoad = false;
};

/**
 * Check if we're still in initial load phase
 */
export const isInInitialLoad = (): boolean => isInitialLoad;

export default cssVariableManager;