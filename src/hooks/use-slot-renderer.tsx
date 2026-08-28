import { useCallback } from "react";
import type { Slot } from "../utilities/slot/slot-types";
import { SlotRenderer } from "../utilities/slot/slot-registry";

export function useSlotRenderer(): (props: { slot: Slot }) => React.ReactNode {
  return useCallback(
    ({ slot }: { slot: Slot }) => <SlotRenderer slot={slot} />,
    [],
  );
}
