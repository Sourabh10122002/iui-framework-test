declare module "@inventive-ui/emoji" {
  import type { ComponentType } from "react";
  export interface EmojiProps {
    name?: string;
    emoji?: string;
    skinColor?: "" | "light" | "mediumLight" | "medium" | "mediumDark" | "dark";
    size?: string | number;
    className?: string;
    onClick?: (emoji: string) => void;
    ariaLabel?: string;
    imageStyle?: "apple" | "google" | "facebook" | "twitter" | "native";
  }
  export const Emoji: ComponentType<EmojiProps>;
}
