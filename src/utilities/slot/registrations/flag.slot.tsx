import { registerSlot } from "../slot-registry";
import { getFlagLibraryRenderer } from "../flagLibrary-registry";
import { resolveFlagSlot } from "../resolve-flag-slot";
import { tryRenderBoundAsset } from "../bound-asset-registry";
import type { FlagSlot, ResolvedFlagSlot } from "../slot-types";
import { logger } from "../../logger";

export type { FlagSlot } from "../slot-types";

declare module "../slot-types" {
  interface SlotMap {
    flag: FlagSlot;
  }
}

registerSlot("flag", (slot) => {
  const resolved = resolveFlagSlot(slot) as ResolvedFlagSlot;

  const bound = tryRenderBoundAsset(
    "flag",
    resolved as unknown as Record<string, unknown>,
  );
  if (bound !== undefined) {
    return bound;
  }

  const renderer = getFlagLibraryRenderer(resolved.library);

  if (!renderer) {
    logger.warn(
      `[FlagSlot] No renderer registered for "${String(resolved.library)}"`,
    );
    return null;
  }

  return renderer(resolved);
});
