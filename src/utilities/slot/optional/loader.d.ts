declare module "@inventive-ui/loaders" {
  import type { ComponentType, HTMLAttributes } from "react";
  export interface LoaderProps extends HTMLAttributes<HTMLElement> {
    name?: string;
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    [key: string]: any;
  }
  export const Loader: ComponentType<LoaderProps>;
}
