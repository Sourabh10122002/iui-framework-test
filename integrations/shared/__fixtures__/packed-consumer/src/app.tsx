import { compose, stack, shade } from "@inventive-ui/framework/shade";
import { shade as rootShade, cn } from "@inventive-ui/framework";
import { STATIC_MAP } from "./maps.js";

const buttonClasses = compose({
  pattern: "interactive",
  variant: "solid",
  appearance: "strong",
  state: "default",
  channel: "full",
  palette: "brand",
  emit: { adaptive: true },
});

const stacked = stack({
  pattern: "interactive",
  variant: "outline",
  appearance: "strong",
  channel: "full",
  palette: "brand",
  emit: { adaptive: true },
});

const viaNamespace = shade.compose({
  pattern: "interactive",
  variant: "ghost",
  appearance: "soft",
  state: "default",
  channel: "full",
  palette: "neutral",
  emit: { adaptive: true },
});

const viaRoot = rootShade.compose({
  pattern: "interactive",
  variant: "solid",
  appearance: "strong",
  state: "hover",
  channel: "full",
  palette: "brand",
  emit: { adaptive: true },
});

export function App() {
  return (
    <div className={cn("flex gap-4 p-4", STATIC_MAP.card)}>
      <button type="button" className={buttonClasses}>
        Primary
      </button>
      <button type="button" className={stacked}>
        Outline
      </button>
      <span className={viaNamespace}>Ghost</span>
      <span className={viaRoot}>Hover</span>
      <span className={STATIC_MAP.badge}>Badge</span>
    </div>
  );
}
