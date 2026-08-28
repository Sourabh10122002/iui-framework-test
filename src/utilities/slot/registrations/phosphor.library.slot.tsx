import React from "react";
import { registerIconLibrary } from "../iconLibrary-registry";
import { createEagerComponent } from "../async-slot";
import type { IconProps } from "@inventive-ui/icons-phosphor";

type InferPhosphorProps = IconProps;

export type PhosphorIconSlot = {
  type: "icon";
  library: "phosphor";
} & InferPhosphorProps;

declare module "../slot-types" {
  interface IconLibraryMap {
    phosphor: PhosphorIconSlot;
  }
}

const IconComp = createEagerComponent<InferPhosphorProps>(
  "@inventive-ui/icons-phosphor",
  (mod) => mod.Icon as React.ComponentType<InferPhosphorProps>,
);

registerIconLibrary("phosphor", (slot) => {
  const { type: _type, library: _library, ...rest } = slot;
  return <IconComp {...(rest as InferPhosphorProps)} />;
});
