/**
 * CSS Modules Type Declaration
 * 
 * This file provides TypeScript type definitions for CSS modules.
 * It allows TypeScript to understand the imported CSS module structure
 * so you can use styles in a type-safe way.
 * 
 * Usage:
 * ```tsx
 * import styles from './component.module.css';
 * 
 * function Component() {
 *   return <div className={styles.container}>...</div>;
 * }
 * ```
 */

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}