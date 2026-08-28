declare module "@inventive-ui/color-logos" {
  import type { ComponentType, HTMLAttributes } from "react";
  export interface ColorLogoProps extends HTMLAttributes<HTMLElement> {
    name?: string;
  }
  export const ColorLogo: ComponentType<ColorLogoProps>;
}
