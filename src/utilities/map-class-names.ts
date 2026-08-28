/**
 * Maps utility and pseudo token classes to their original names.
 * Handles dark: prefixed classes by keeping them as-is.
 * Filters out falsy values like `false`, `null`, or `undefined`.
 */
export function mapClassNames(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes
    .filter(Boolean)
    .map((cls) => {
      const className = cls as string;
      return className;
    })
    .join(" ");
}