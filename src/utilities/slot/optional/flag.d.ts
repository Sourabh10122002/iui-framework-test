declare module "@inventive-ui/flags" {
  import type { ComponentType, HTMLAttributes } from "react";
  export interface FlagProps extends HTMLAttributes<HTMLElement> {
    code?: string;
  }
  export const Flag: ComponentType<FlagProps>;
}
