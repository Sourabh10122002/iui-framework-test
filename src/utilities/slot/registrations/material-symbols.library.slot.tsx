import React from "react";
import { registerIconLibrary } from "../iconLibrary-registry";
import { createEagerComponent } from "../async-slot";
import type { IconProps } from "@inventive-ui/material-symbols";

type InferMaterialSymbolsProps = IconProps;

export type MaterialSymbolsIconSlot = {
  type: "icon";
  library: "material-symbols";
} & InferMaterialSymbolsProps;

declare module "../slot-types" {
  interface IconLibraryMap {
    "material-symbols": MaterialSymbolsIconSlot;
  }
}

const IconComp = createEagerComponent<InferMaterialSymbolsProps>(
  "@inventive-ui/material-symbols",
  (mod) => mod.Icon as React.ComponentType<InferMaterialSymbolsProps>,
);

registerIconLibrary("material-symbols", (slot) => {
  const { type: _type, library: _library, ...rest } = slot;
  return <IconComp {...(rest as InferMaterialSymbolsProps)} />;
});
