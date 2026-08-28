
import React from 'react';

// =================================================================
// 1. SHARED/COMMON PROPS
// =================================================================

/**
 * Defines standard sizes for components.
 * - 'xs': Extra Small
 * - 'sm': Small
 * - 'md': Medium
 * - 'lg': Large
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg';

/**
 * Defines the visual style variant of a component.
 * - 'filled': Solid background color
 * - 'filled+outlined': Solid background with a prominent border
 * - 'outlined': Transparent background with a border
 * - 'ghost': Transparent background and border
 */
export type ComponentVariant = 'filled' | 'filled+outlined' | 'outlined' | 'ghost';

/**
 * Defines the intensity/appearance of a component.
 * Controls how dark/light the palette shades are applied.
 * - 'soft': Light shades (e.g., 100-300 range)
 * - 'classic': Medium shades (e.g., 500-600 range)  
 * - 'strong': Dark shades (e.g., 600-800 range)
 */
export type ComponentAppearance = 'soft' | 'classic' | 'strong';

/**
 * Defines semantic colors that can be mapped to theme-specific color values.
 * This allows for consistent color usage across the application.
 * The actual color values are resolved by the theme system.
 */

export type SemanticColor = 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'neutral' | string;

export type ComponentState = 'success' | 'warning' | 'danger' | 'info'

export type ComponentColor = 'brand' | 'neutral' | string;

export type Disabled = boolean

/**
 * Interface for common props shared across multiple components.
 * This ensures consistency and reduces prop duplication.
 */
export interface CommonProps {
    /** The size of the component */
    size?: ComponentSize;
    /** The visual style variant of the component */
    variant?: ComponentVariant;
    /** The intensity/appearance of the component */
    appearance?: ComponentAppearance;
    /** The state of the component, based on semantic color names */
    state?: ComponentState;
    /** The color theme of the component, based on semantic color names */
    color?: ComponentColor;
    /** Additional CSS classes to apply to the component */
    class?: string;
    /** Adaptiveness for component */
    adaptive?: boolean;
}


// =================================================================
// 2. POLYMORPHIC "as" PROP - NEW IMPLEMENTATION
// =================================================================

/**
 * Helper type for the 'as' prop.
 */
type AsProp<E extends React.ElementType> = {
    as?: E;
};

/**
 * The props for a polymorphic component, excluding the 'ref'.
 * It combines the component's own props `P` with the props of the
 * element it is being rendered as (`E`), while omitting conflicting props.
 * It also includes `children`.
 */
export type PolymorphicProps<E extends React.ElementType, P = {}> =
    React.PropsWithChildren<P & AsProp<E>> &
    Omit<React.ComponentPropsWithoutRef<E>, keyof (P & AsProp<E>)>;

/**
 * The type of the 'ref' for a polymorphic component.
 */
export type PolymorphicRef<E extends React.ElementType> =
    React.ComponentPropsWithRef<E>["ref"];

/**
 * The complete props for a polymorphic component, including the 'ref'.
 */
export type PolymorphicPropsWithRef<E extends React.ElementType, P = {}> =
    PolymorphicProps<E, P> & { ref?: PolymorphicRef<E> };


// =================================================================
// 3. PROP FORWARDING (...props)
// =================================================================

/**
 * Prop forwarding is a pattern where components pass down props
 * they do not explicitly handle to their child elements.
 * This is crucial for flexibility, allowing consumers to add any standard
 * HTML attributes (like 'id', 'aria-label', etc.) to the underlying element.
 *
 * This is typically handled directly in the component's signature:
 *
 * const MyComponent = ({ as: Component = 'div', ...props }: MyComponentProps) => {
 *   return <Component {...props} />;
 * };
 *
 * The `PolymorphicProps` type is designed to correctly type these forwarded props.
 */


// =================================================================
// 4. NAMING CONVENTIONS / UNION TYPES
// =================================================================

/**
 * This file establishes clear naming conventions for shared types:
 * - `ComponentSize`, `ComponentVariant`, `ComponentAppearance`, `SemanticColor`
 *   are used for union types to ensure consistency.
 * - `CommonProps` groups shared properties into a single interface.
 * - `PolymorphicProps` and `AsProp` provide a standard for creating
 *   polymorphic components.
 *
 * Using union types instead of enums or strings provides type safety
 * and autocompletion benefits without the runtime overhead of enums.
 */