import React from "react";
import { registerIconLibrary } from "../iconLibrary-registry";
import { createEagerComponent } from "../async-slot";
import type { IconProps } from "@inventive-ui/icons-material";

type InferMaterialProps = IconProps;

export type MaterialIconsIconSlot = {
  type: "icon";
  library: "material-icons";
} & InferMaterialProps;

declare module "../slot-types" {
  interface IconLibraryMap {
    "material-icons": MaterialIconsIconSlot;
  }
}

const IconComp = createEagerComponent<InferMaterialProps>(
  "@inventive-ui/icons-material",
  (mod) => mod.Icon as React.ComponentType<InferMaterialProps>,
);

registerIconLibrary("material-icons", (slot) => {
  const { type: _type, library: _library, ...rest } = slot;
  return <IconComp {...(rest as InferMaterialProps)} />;
});
