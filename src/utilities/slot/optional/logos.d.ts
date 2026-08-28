declare module "@inventive-ui/logos" {
  import type { ComponentType, HTMLAttributes } from "react";
  export interface LogoProps extends HTMLAttributes<HTMLElement> {
    name?: string;
  }
  export const Logo: ComponentType<LogoProps>;
  export const Brand: ComponentType<LogoProps>;
}
