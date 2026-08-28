/** VS Code–style file icons; consumed by the `vscode` file-type library slot. */
declare module "@inventive-ui/file-types" {
  import type { ComponentType, HTMLAttributes } from "react";
  export interface FileTypeProps extends HTMLAttributes<HTMLElement> {
    extension?: string;
  }
  export const FileType: ComponentType<FileTypeProps>;
}
