import React from "react";
import { registerSlot } from "../slot-registry";
import { createEagerComponent } from "../async-slot";
import { resolveEmojiSlot } from "../resolve-emoji-slot";
import {
  getEmojiPlaceholderProps,
  resolvePlaceholderValuesInObject,
} from "../../../core/config-loader";
import type { EmojiProps } from "@inventive-ui/emoji";

/** Slot definition; family/skinTone can come from global config. */
export type EmojiSlot = {
  type: "emoji";
} & EmojiProps;

declare module "../slot-types" {
  interface SlotMap {
    emoji: EmojiSlot;
  }
}

const Comp = createEagerComponent<Record<string, unknown>>(
  "@inventive-ui/emoji",
  (mod) => mod.Emoji as React.ComponentType<Record<string, unknown>>,
);

registerSlot("emoji", (slot) => {
  const merged = resolveEmojiSlot(slot);
  const resolved = resolvePlaceholderValuesInObject(
    merged,
    getEmojiPlaceholderProps(),
  );
  const { type: _type, ...rest } = resolved as EmojiSlot;
  return <Comp {...(rest as EmojiProps)} />;
});
