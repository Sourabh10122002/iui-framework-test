import React from "react";
import type { StorysetStyle } from "../../../core/config";
import { registerIllustrationLibrary } from "../illustrationLibrary-registry";
import { createEagerComponent } from "../async-slot";
import { mapIllustrationSlotToPackageProps } from "../map-illustration-slot-props";

/** Storyset slot payload (library-specific shape). */
export type StorysetIllustrationSlot = {
  type: "illustration";
  library: "storyset";
  name: string;
  style?: StorysetStyle;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  [key: string]: unknown;
};

declare module "../slot-types" {
  interface IllustrationLibraryMap {
    storyset: StorysetIllustrationSlot;
  }
}

const IllustrationComp = createEagerComponent<Record<string, unknown>>(
  "@inventive-ui/illustrations",
  (mod) => mod.Illustration as React.ComponentType<Record<string, unknown>>,
);

registerIllustrationLibrary("storyset", (slot) => {
  const packageProps = mapIllustrationSlotToPackageProps(
    slot as unknown as Record<string, unknown>,
    "lazy",
  );
  return <IllustrationComp {...packageProps} />;
});
