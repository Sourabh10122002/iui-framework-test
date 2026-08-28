declare module "@inventive-ui/illustrations" {
  import type { ComponentType, HTMLAttributes } from "react";
  export interface IllustrationProps extends HTMLAttributes<HTMLElement> {
    id?: string;
    family?: string;
    name?: string;
    variant?: "detailed" | "outline" | "isometric";
    color?: string;
    size?: number | string;
  }
  export const Illustration: ComponentType<IllustrationProps>;
}
