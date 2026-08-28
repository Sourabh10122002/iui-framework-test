declare module "@inventive-ui/material-symbols" {
  import type { ComponentType, SVGProps } from "react";
  export interface IconProps extends SVGProps<SVGSVGElement> {
    name?: string;
  }
  export const Icon: ComponentType<IconProps>;
}
