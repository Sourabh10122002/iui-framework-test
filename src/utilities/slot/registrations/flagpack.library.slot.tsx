import React from "react";
import { registerFlagLibrary } from "../flagLibrary-registry";
import { createEagerComponent } from "../async-slot";

/** Flagpack slot payload (library-specific shape). */
export type FlagpackFlagSlot = {
  type: "flag";
  library: "flagpack";
  code: string;
  size?: "sm" | "md" | "lg";
  [key: string]: unknown;
};

declare module "../slot-types" {
  interface FlagLibraryMap {
    flagpack: FlagpackFlagSlot;
  }
}

const FlagComp = createEagerComponent<{ code: string; [key: string]: unknown }>(
  "@inventive-ui/flags",
  (mod) => mod.Flag as React.ComponentType<{ code: string; [key: string]: unknown }>,
);

registerFlagLibrary("flagpack", (slot) => {
  const { type: _t, library: _l, code, ...rest } = slot;
  return <FlagComp code={code?.toUpperCase() ?? ""} {...rest} />;
});
