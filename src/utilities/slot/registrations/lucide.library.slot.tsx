import React from "react";
import { registerIconLibrary } from "../iconLibrary-registry";
import { createEagerComponent } from "../async-slot";
import type { IconProps } from "@inventive-ui/icons-lucide";

type InferLucideProps = IconProps;

export type LucideIconSlot = {
  type: "icon";
  library: "lucide";
} & InferLucideProps;

declare module "../slot-types" {
  interface IconLibraryMap {
    lucide: LucideIconSlot;
  }
}

const IconComp = createEagerComponent<InferLucideProps>(
  "@inventive-ui/icons-lucide",
  (mod) => mod.Icon as React.ComponentType<InferLucideProps>,
);

registerIconLibrary("lucide", (slot) => {
  const { type: _type, library: _library, ...rest } = slot;
  return <IconComp {...(rest as InferLucideProps)} />;
});
