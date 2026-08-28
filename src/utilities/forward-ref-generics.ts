import * as React from "react";

/**
 * Typed polymorphic forwardRef helper for generic components
 */
export function forwardRefWithGenerics<
  E extends React.ElementType,
  P = {}
>(
  render: (
    props: React.PropsWithChildren<P> & { as?: E },
    ref: React.ComponentPropsWithRef<E>["ref"]
  ) => React.ReactElement | null
): <
  As extends React.ElementType = E
>(
  props: React.PropsWithChildren<P> & { as?: As; ref?: React.ComponentPropsWithRef<As>["ref"] }
) => React.ReactElement | null {
  return React.forwardRef<
    E,
    React.PropsWithChildren<P> & { as?: E }
  >(render as any) as unknown as <
    As extends React.ElementType = E
  >(
    props: React.PropsWithChildren<P> & { as?: As; ref?: React.ComponentPropsWithRef<As>["ref"] }
  ) => React.ReactElement | null;
}
