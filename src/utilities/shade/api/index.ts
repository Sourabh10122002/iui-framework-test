import type { SemanticRequest, State, Channel } from "../core/dimensions";
import { composeSemantic } from "../core/composer";

export type { SemanticRequest } from "../core/dimensions";
export {
  composeControlSelected,
  composeControlUnselected,
  composeControlIcon,
  composeControlCard,
  composeControlDot,
  composeControlCardHover,
} from "./control-compose";
export {
  composeSelectionRow,
  composeSelectionLabel,
  composeSelectionHighlight,
  composeSelectionInteractive,
  pickTextUtilities,
  pickFillUtilities,
} from "./selection-compose";

const withState = (req: Omit<SemanticRequest, "state">, state: State): SemanticRequest => ({
  ...req,
  state,
});

export const prefixInteractiveClasses = (
  classes: string,
  prefix: string,
  darkPrefix?: string,
): string => {
  const resolvedDarkPrefix = darkPrefix ?? `dark:${prefix}`;
  return classes
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      if (token.startsWith("dark:")) {
        return `${resolvedDarkPrefix}${token.slice(5)}`;
      }
      return `${prefix}${token}`;
    })
    .join(" ");
};

const prefixStateClasses = (
  req: Omit<SemanticRequest, "state">,
  state: State,
  prefix: string,
): string => {
  const classes = composeSemantic(withState(req, state))
    .split(/\s+/)
    .filter(Boolean);

  if (req.pattern === "interactive") {
    return classes
      .map((token) =>
        token.startsWith("dark:")
          ? `dark:${prefix}${token.slice(5)}`
          : `${prefix}${token}`,
      )
      .join(" ");
  }

  return classes.map((token) => `${prefix}${token}`).join(" ");
};

export const compose = (req: SemanticRequest): string => composeSemantic(req);

export const slice = (req: SemanticRequest): string => compose(req);

export const channel = (
  req: Omit<SemanticRequest, "channel"> & { channel: Channel },
): string => compose(req);

export const stack = (req: Omit<SemanticRequest, "state">): string => {
  const base = composeSemantic(withState(req, "default"));
  const hover = prefixStateClasses(req, "hover", "hover:");
  const pressed = prefixStateClasses(req, "pressed", "active:");
  return [base, hover, pressed].filter(Boolean).join(" ");
};

export const semanticApi = {
  compose,
  stack,
  slice,
  channel,
};

export type SemanticApi = typeof semanticApi;
