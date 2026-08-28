import React from "react";
import { createEagerComponent } from "../async-slot";
import type { FileTypeProps } from "@inventive-ui/file-types";
import { registerFileTypeLibrary } from "../fileTypeLibrary-registry";

export type VsCodeFileTypeSlot = {
  type: "file-type";
  library: "vscode";
} & FileTypeProps;

declare module "../slot-types" {
  interface FileTypeLibraryMap {
    vscode: VsCodeFileTypeSlot;
  }
}

const Comp = createEagerComponent<Record<string, unknown>>(
  "@inventive-ui/file-types",
  (mod) => mod.FileType as React.ComponentType<Record<string, unknown>>,
);

registerFileTypeLibrary("vscode", (slot) => {
  const { type: _t, library: _l, ...rest } = slot;
  return <Comp {...(rest as FileTypeProps)} />;
});

