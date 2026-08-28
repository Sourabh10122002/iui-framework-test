import type { IllustrationLibrary, StorysetStyle } from "../../../core/config";
import { registerSlot } from "../slot-registry";
import { getIllustrationLibraryRenderer } from "../illustrationLibrary-registry";
import { resolveIllustrationSlot } from "../resolve-illustration-slot";
import { tryRenderBoundAsset } from "../bound-asset-registry";
import type {
  IllustrationSlot,
  ResolvedIllustrationSlot,
} from "../slot-types";
import { logger } from "../../logger";

/** Re-export for consumers */
export type { IllustrationLibrary, StorysetStyle };
export type { IllustrationSlot } from "../slot-types";

declare module "../slot-types" {
  interface SlotMap {
    illustration: IllustrationSlot;
  }
}

registerSlot("illustration", (slot) => {
  const resolved = resolveIllustrationSlot(slot) as ResolvedIllustrationSlot;

  const bound = tryRenderBoundAsset(
    "illustration",
    resolved as unknown as Record<string, unknown>,
  );
  if (bound !== undefined) {
    return bound;
  }

  const renderer = getIllustrationLibraryRenderer(resolved.library);

  if (!renderer) {
    logger.warn(
      `[IllustrationSlot] No renderer registered for "${String(resolved.library)}"`,
    );
    return null;
  }

  return renderer(resolved);
});
