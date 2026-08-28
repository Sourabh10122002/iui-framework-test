import type { Appearance, Scheme, SemanticRequest, State, Variant } from "./dimensions";
import { resolveLiteralTokens } from "./literal-transform";
import { classifyPalette, type PaletteClassification } from "./palette-classify";

type ResolvedTokens = {
  fill: string;
  text: string;
  outline?: string;
  border?: string;
  ring?: string;
};

type Step = ResolvedTokens;

const stateStep = (state: State): 0 | 1 | 2 => {
  if (state === "hover" || state === "selected" || state === "indeterminate") return 1;
  if (state === "pressed") return 2;
  return 0;
};

const pick = (steps: readonly [Step, Step, Step], state: State): ResolvedTokens =>
  steps[stateStep(state)];

const paletteToken = (palette: string, step: number | "white" | "black"): string => {
  if (step === "white" || step === "black") return step;
  return `${palette}-${step}`;
};

const neutral = (step: number): string => `neutral-${step}`;

const withUnderlineChannels = (
  steps: readonly [Step, Step, Step],
  solid: boolean,
): readonly [Step, Step, Step] =>
  steps.map((step) => {
    const decoration = step.outline ?? step.text;
    return {
      ...step,
      fill: solid ? step.fill : "transparent",
      border: decoration,
      ring: decoration,
    };
  }) as [Step, Step, Step];

const resolveChromaticSteps = (
  variant: Variant,
  appearance: Appearance,
  scheme: Scheme,
  palette: string,
  adaptive = true,
): readonly [Step, Step, Step] | null => {
  const p = palette;
  const n = (step: number) => neutral(step);

  if (variant === "underline") {
    const outline = resolveChromaticSteps("outline", appearance, scheme, palette, adaptive);
    return outline ? withUnderlineChannels(outline, false) : null;
  }

  if (variant === "solidUnderline") {
    const solidOutline = resolveChromaticSteps(
      "solidOutline",
      appearance,
      scheme,
      palette,
      adaptive,
    );
    return solidOutline ? withUnderlineChannels(solidOutline, true) : null;
  }

  if (variant === "solid" && appearance === "strong") {
    if (scheme === "light") {
      return [
        { fill: paletteToken(p, 500), text: "white" },
        { fill: paletteToken(p, 600), text: "white" },
        { fill: paletteToken(p, 700), text: "white" },
      ];
    }
    return [
      { fill: paletteToken(p, 400), text: "neutral-950" },
      { fill: paletteToken(p, 300), text: "neutral-950" },
      { fill: paletteToken(p, 200), text: "neutral-950" },
    ];
  }

  if (variant === "solid" && appearance === "soft") {
    return [
      { fill: paletteToken(p, 100), text: paletteToken(p, 700) },
      { fill: paletteToken(p, 200), text: paletteToken(p, 700) },
      { fill: paletteToken(p, 300), text: paletteToken(p, 700) },
    ];
  }

  if (variant === "solid" && appearance === "dualTone") {
    return [
      { fill: n(100), text: paletteToken(p, 700) },
      { fill: n(200), text: paletteToken(p, 700) },
      { fill: n(300), text: paletteToken(p, 700) },
    ];
  }

  if (variant === "solid" && appearance === "onColor") {
    if (scheme === "light") {
      return [
        { fill: "white", text: paletteToken(p, 500) },
        { fill: paletteToken(p, 50), text: paletteToken(p, 500) },
        { fill: paletteToken(p, 100), text: paletteToken(p, 500) },
      ];
    }
    return [
      { fill: "black", text: paletteToken(p, 400) },
      { fill: paletteToken(p, 950), text: paletteToken(p, 500) },
      { fill: paletteToken(p, 900), text: paletteToken(p, 500) },
    ];
  }

  if (variant === "solidOutline" && appearance === "strong") {
    if (scheme === "light") {
      return [
        { fill: paletteToken(p, 500), text: "white", outline: paletteToken(p, 800) },
        { fill: paletteToken(p, 600), text: "white", outline: paletteToken(p, 900) },
        { fill: paletteToken(p, 700), text: "white", outline: paletteToken(p, 950) },
      ];
    }
    return [
      { fill: paletteToken(p, 400), text: "neutral-950", outline: paletteToken(p, 200) },
      { fill: paletteToken(p, 300), text: "neutral-950", outline: paletteToken(p, 100) },
      { fill: paletteToken(p, 200), text: "neutral-950", outline: paletteToken(p, 50) },
    ];
  }

  if (variant === "solidOutline" && appearance === "soft") {
    return [
      {
        fill: paletteToken(p, 50),
        text: paletteToken(p, 700),
        outline: paletteToken(p, 300),
      },
      {
        fill: paletteToken(p, 100),
        text: paletteToken(p, 700),
        outline: paletteToken(p, 400),
      },
      {
        fill: paletteToken(p, 200),
        text: paletteToken(p, 700),
        outline: paletteToken(p, 500),
      },
    ];
  }

  if (variant === "solidOutline" && appearance === "dualTone") {
    return [
      { fill: n(50), text: paletteToken(p, 700), outline: n(300) },
      { fill: n(100), text: paletteToken(p, 700), outline: n(400) },
      { fill: n(200), text: paletteToken(p, 700), outline: n(500) },
    ];
  }

  if (variant === "solidOutline" && appearance === "onColor") {
    if (scheme === "light") {
      return [
        { fill: "white", text: paletteToken(p, 500), outline: paletteToken(p, 800) },
        { fill: paletteToken(p, 50), text: paletteToken(p, 500), outline: paletteToken(p, 700) },
        { fill: paletteToken(p, 100), text: paletteToken(p, 500), outline: paletteToken(p, 600) },
      ];
    }
    return [
      { fill: "black", text: paletteToken(p, 400), outline: paletteToken(p, 700) },
      { fill: paletteToken(p, 950), text: paletteToken(p, 500), outline: paletteToken(p, 700) },
      { fill: paletteToken(p, 900), text: paletteToken(p, 500), outline: paletteToken(p, 700) },
    ];
  }

  if (variant === "outline" && appearance === "strong") {
    if (scheme === "light") {
      return [
        { fill: "transparent", text: paletteToken(p, 500), outline: paletteToken(p, 500) },
        { fill: "transparent", text: paletteToken(p, 800), outline: paletteToken(p, 800) },
        { fill: "transparent", text: paletteToken(p, 950), outline: paletteToken(p, 950) },
      ];
    }
    return [
      { fill: "transparent", text: paletteToken(p, 500), outline: paletteToken(p, 500) },
      { fill: "transparent", text: paletteToken(p, 200), outline: paletteToken(p, 200) },
      { fill: "transparent", text: paletteToken(p, 50), outline: paletteToken(p, 50) },
    ];
  }

  if (variant === "outline" && appearance === "soft") {
    if (scheme === "light") {
      return [
        { fill: "transparent", text: paletteToken(p, 700), outline: paletteToken(p, 300) },
        { fill: "transparent", text: paletteToken(p, 700), outline: paletteToken(p, 500) },
        { fill: "transparent", text: paletteToken(p, 700), outline: paletteToken(p, 700) },
      ];
    }
    return [
      { fill: "transparent", text: paletteToken(p, 400), outline: paletteToken(p, 500) },
      { fill: "transparent", text: paletteToken(p, 200), outline: paletteToken(p, 400) },
      { fill: "transparent", text: paletteToken(p, 50), outline: paletteToken(p, 500) },
    ];
  }

  if (variant === "outline" && appearance === "dualTone") {
    return [
      { fill: "transparent", text: paletteToken(p, 700), outline: n(300) },
      { fill: "transparent", text: paletteToken(p, 700), outline: n(500) },
      { fill: "transparent", text: paletteToken(p, 700), outline: n(700) },
    ];
  }

  if (variant === "outline" && appearance === "onColor") {
    if (scheme === "light") {
      const hoverOutline = adaptive ? 50 : 100;
      return [
        { fill: "transparent", text: "white", outline: "white" },
        { fill: "transparent", text: "white", outline: paletteToken(p, hoverOutline) },
        { fill: "transparent", text: "white", outline: paletteToken(p, 100) },
      ];
    }
    return [
      { fill: "transparent", text: "neutral-500", outline: "black" },
      { fill: "transparent", text: paletteToken(p, 950), outline: "black" },
      { fill: "transparent", text: paletteToken(p, 900), outline: "black" },
    ];
  }

  if (variant === "ghost" && appearance === "strong") {
    if (scheme === "light") {
      return [
        { fill: "transparent", text: paletteToken(p, 500) },
        { fill: "transparent", text: paletteToken(p, 800) },
        { fill: "transparent", text: paletteToken(p, 950) },
      ];
    }
    return [
      { fill: "transparent", text: paletteToken(p, 500) },
      { fill: "transparent", text: paletteToken(p, 200) },
      { fill: "transparent", text: paletteToken(p, 50) },
    ];
  }

  if (variant === "ghost" && appearance === "soft") {
    return [
      { fill: "transparent", text: paletteToken(p, 500) },
      { fill: "transparent", text: paletteToken(p, 600) },
      { fill: "transparent", text: paletteToken(p, 700) },
    ];
  }

  if (variant === "ghost" && appearance === "dualTone") {
    if (scheme === "light") {
      return [
        { fill: "transparent", text: n(500) },
        { fill: "transparent", text: n(600) },
        { fill: "transparent", text: n(700) },
      ];
    }
    return [
      { fill: "transparent", text: n(500) },
      { fill: "transparent", text: n(400) },
      { fill: "transparent", text: n(300) },
    ];
  }

  if (variant === "ghost" && appearance === "onColor") {
    if (scheme === "light") {
      const hoverText = adaptive ? 50 : 100;
      return [
        { fill: "transparent", text: "white" },
        { fill: "transparent", text: paletteToken(p, hoverText) },
        { fill: "transparent", text: paletteToken(p, 100) },
      ];
    }
    return [
      { fill: "transparent", text: "neutral-500" },
      { fill: "transparent", text: paletteToken(p, 950) },
      { fill: "transparent", text: paletteToken(p, 900) },
    ];
  }

  return null;
};

const remapLiteralClassPrefix = (
  steps: readonly [Step, Step, Step],
  literal: "white" | "black",
): readonly [Step, Step, Step] =>
  steps.map((step) => ({
    ...step,
    text: step.text.replace(/^neutral-/, `${literal}-`),
    outline: step.outline?.replace(/^neutral-/, `${literal}-`),
  })) as [Step, Step, Step];

const resolveLiteralSteps = (
  variant: Variant,
  appearance: Appearance,
  scheme: Scheme,
  literal: "white" | "black",
  adaptive = true,
): readonly [Step, Step, Step] | null => {
  const isWhite = literal === "white";
  const n = (step: number) => neutral(step);

  if (
    variant === "outline" &&
    (appearance === "soft" || appearance === "dualTone")
  ) {
    if (appearance === "soft") {
      const steps = resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
      if (!steps || scheme === "light") return steps;
      return remapLiteralClassPrefix(steps, literal);
    }
    const base = resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
    if (!base) return null;
    return base.map((step) => ({ ...step, text: scheme === "light" ? n(900) : n(100) })) as [
      Step,
      Step,
      Step,
    ];
  }

  if (variant === "ghost" && appearance === "soft") {
    return resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
  }

  if (variant === "solid" && appearance === "strong") {
    if (scheme === "light") {
      const baseBg = isWhite ? "white" : "black";
      const hoverBg = isWhite ? n(100) : n(800);
      const activeBg = isWhite ? n(200) : n(900);
      const text = isWhite ? "black" : "white";
      return [
        { fill: baseBg, text },
        { fill: hoverBg, text },
        { fill: activeBg, text },
      ];
    }
    const baseBg = isWhite ? "black" : "white";
    const hoverBg = isWhite ? n(800) : n(100);
    const activeBg = isWhite ? n(900) : n(200);
    const text = isWhite ? "white" : "black";
    return [
      { fill: baseBg, text },
      { fill: hoverBg, text },
      { fill: activeBg, text },
    ];
  }

  if (variant === "solid" && appearance === "soft") {
    return resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
  }

  if (variant === "solid" && appearance === "dualTone") {
    const base = resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
    if (!base) return null;
    return base.map((step) => ({ ...step, text: scheme === "light" ? n(900) : n(100) })) as [
      Step,
      Step,
      Step,
    ];
  }

  if (variant === "solid" && appearance === "onColor") {
    if (scheme === "light") {
      const rest = isWhite ? "black" : "white";
      return [
        { fill: rest, text: isWhite ? "white" : "black" },
        { fill: isWhite ? n(900) : n(50), text: isWhite ? "white" : "black" },
        { fill: isWhite ? n(800) : n(100), text: isWhite ? "white" : "black" },
      ];
    }
    const rest = isWhite ? "white" : n(900);
    return [
      { fill: rest, text: isWhite ? n(900) : n(50) },
      { fill: isWhite ? n(50) : n(800), text: isWhite ? n(900) : n(50) },
      { fill: isWhite ? n(100) : n(700), text: isWhite ? n(900) : n(50) },
    ];
  }

  if (variant === "solidOutline" && appearance === "strong") {
    if (scheme === "light") {
      const baseBg = isWhite ? n(50) : n(950);
      const hoverBg = isWhite ? n(100) : n(800);
      const activeBg = isWhite ? n(200) : n(900);
      const outline = isWhite ? n(200) : n(800);
      const text = isWhite ? "black" : "white";
      return [
        { fill: baseBg, text, outline },
        { fill: hoverBg, text, outline },
        { fill: activeBg, text, outline },
      ];
    }
    const baseBg = isWhite ? n(950) : n(50);
    const hoverBg = isWhite ? n(800) : n(100);
    const activeBg = isWhite ? n(900) : n(200);
    const outline = isWhite ? n(700) : n(200);
    const text = isWhite ? "white" : "black";
    return [
      { fill: baseBg, text, outline },
      { fill: hoverBg, text, outline },
      { fill: activeBg, text, outline },
    ];
  }

  if (variant === "solidOutline" && appearance === "soft") {
    return resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
  }

  if (variant === "solidOutline" && appearance === "dualTone") {
    const base = resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
    if (!base) return null;
    return base.map((step) => ({ ...step, text: scheme === "light" ? n(900) : n(100) })) as [
      Step,
      Step,
      Step,
    ];
  }

  if (variant === "solidOutline" && appearance === "onColor") {
    if (scheme === "light") {
      const rest = isWhite ? n(950) : "white";
      const borderRest = isWhite ? n(700) : n(300);
      return [
        { fill: rest, text: isWhite ? "white" : "black", outline: borderRest },
        { fill: isWhite ? n(900) : n(50), text: isWhite ? "white" : "black", outline: isWhite ? n(600) : n(400) },
        { fill: isWhite ? n(800) : n(100), text: isWhite ? "white" : "black", outline: n(500) },
      ];
    }
    const rest = isWhite ? "white" : n(900);
    return [
      { fill: rest, text: isWhite ? n(900) : n(50), outline: isWhite ? n(300) : n(700) },
      { fill: isWhite ? n(50) : n(800), text: isWhite ? n(900) : n(50), outline: isWhite ? n(400) : n(600) },
      { fill: isWhite ? n(100) : n(700), text: isWhite ? n(900) : n(50), outline: n(500) },
    ];
  }

  if (variant === "outline" && appearance === "strong") {
    const color = isWhite ? "white" : "black";
    const hoverBg = isWhite ? "white/10" : "black/10";
    const activeBg = isWhite ? "white/20" : "black/20";
    if (scheme === "light") {
      return [
        { fill: "transparent", text: color, outline: color },
        { fill: hoverBg, text: color, outline: color },
        { fill: activeBg, text: color, outline: color },
      ];
    }
    const darkColor = isWhite ? "black" : "white";
    const darkHoverBg = isWhite ? "black/10" : "white/10";
    const darkActiveBg = isWhite ? "black/20" : "white/20";
    return [
      { fill: "transparent", text: darkColor, outline: darkColor },
      { fill: darkHoverBg, text: darkColor, outline: darkColor },
      { fill: darkActiveBg, text: darkColor, outline: darkColor },
    ];
  }

  if (variant === "outline" && appearance === "soft") {
    return resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
  }

  if (variant === "outline" && appearance === "dualTone") {
    const base = resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
    if (!base) return null;
    return base.map((step) => ({ ...step, text: scheme === "light" ? n(900) : n(100) })) as [
      Step,
      Step,
      Step,
    ];
  }

  if (variant === "outline" && appearance === "onColor") {
    const color = isWhite ? "black" : "white";
    if (scheme === "light") {
      return [
        { fill: "transparent", text: color, outline: color },
        { fill: "transparent", text: color, outline: isWhite ? n(800) : n(200) },
        { fill: "transparent", text: color, outline: isWhite ? n(700) : n(300) },
      ];
    }
    const darkColor = isWhite ? "white" : "black";
    return [
      { fill: "transparent", text: darkColor, outline: darkColor },
      { fill: "transparent", text: darkColor, outline: isWhite ? n(200) : n(800) },
      { fill: "transparent", text: darkColor, outline: isWhite ? n(300) : n(700) },
    ];
  }

  if (variant === "ghost" && appearance === "strong") {
    if (scheme === "light") {
      const color = isWhite ? "white" : "black";
      return [
        { fill: "transparent", text: color },
        { fill: "transparent", text: isWhite ? n(200) : n(800) },
        { fill: "transparent", text: isWhite ? n(300) : n(700) },
      ];
    }
    const color = isWhite ? "black" : "white";
    return [
      { fill: "transparent", text: color },
      { fill: "transparent", text: isWhite ? n(800) : n(200) },
      { fill: "transparent", text: isWhite ? n(700) : n(300) },
    ];
  }

  if (variant === "ghost" && appearance === "soft") {
    return resolveChromaticSteps(variant, appearance, scheme, "neutral", adaptive);
  }

  if (variant === "ghost" && appearance === "dualTone") {
    if (scheme === "light") {
      return [
        { fill: "transparent", text: n(700) },
        { fill: "transparent", text: n(800) },
        { fill: "transparent", text: n(900) },
      ];
    }
    return [
      { fill: "transparent", text: n(200) },
      { fill: "transparent", text: n(100) },
      { fill: "transparent", text: n(50) },
    ];
  }

  if (variant === "ghost" && appearance === "onColor") {
    const color = isWhite ? "black" : "white";
    if (scheme === "light") {
      return [
        { fill: "transparent", text: color },
        { fill: "transparent", text: isWhite ? n(800) : n(200) },
        { fill: "transparent", text: isWhite ? n(700) : n(300) },
      ];
    }
    const darkColor = isWhite ? "white" : "black";
    return [
      { fill: "transparent", text: darkColor },
      { fill: "transparent", text: isWhite ? n(200) : n(800) },
      { fill: "transparent", text: isWhite ? n(300) : n(700) },
    ];
  }

  return null;
};

export const shouldEmitInteractiveDark = (
  variant: Variant,
  appearance: Appearance,
): boolean => {
  // Legacy DS oracle contract (SD-001): adaptive full-channel emission only
  // carries dark: mirrors where the recipe is scheme-dependent by design.
  // soft/dualTone are scheme-agnostic (single palette ramp), except
  // outline+soft whose outline/text tokens differ per scheme.
  if (appearance === "strong" || appearance === "onColor") return true;
  if (appearance === "soft") return variant === "outline" || variant === "underline";
  return false;
};

export const resolveInteractiveTokens = (
  req: SemanticRequest,
  paletteInfo: PaletteClassification,
  scheme: Scheme,
): ResolvedTokens => {
  const adaptive = req.emit?.adaptive !== false;
  if (
    paletteInfo.paletteClass === "literal" &&
    (paletteInfo.normalized === "transparent" ||
      req.variant === "underline" ||
      req.variant === "solidUnderline")
  ) {
    return resolveLiteralTokens(
      paletteInfo.normalized as "white" | "black" | "transparent",
      req.appearance,
      req.state,
      scheme,
    );
  }

  const steps =
    paletteInfo.paletteClass === "literal"
      ? resolveLiteralSteps(
          req.variant,
          req.appearance,
          scheme,
          paletteInfo.normalized as "white" | "black",
          adaptive,
        )
      : resolveChromaticSteps(
          req.variant,
          req.appearance,
          scheme,
          paletteInfo.normalized,
          adaptive,
        );

  if (!steps) {
    return { fill: "transparent", text: paletteInfo.normalized };
  }

  return pick(steps, req.state);
};

const withPrefix = (prefix: string, token: string): string =>
  token
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${prefix}${part}`)
    .join(" ");

export const buildInteractiveClasses = (
  variant: Variant,
  tokens: ResolvedTokens,
  dark: boolean,
  options: { paletteClass?: PaletteClassification["paletteClass"]; appearance?: Appearance } = {},
): string => {
  const prefix = dark ? "dark:" : "";
  const parts: string[] = [];
  const omitBorderNone =
    variant === "solidOutline" &&
    options.paletteClass === "literal" &&
    options.appearance === "strong" &&
    !dark;

  switch (variant) {
    case "solid":
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, "outline-none"),
        withPrefix(prefix, "border-none"),
      );
      break;
    case "solidOutline":
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
      );
      if (!omitBorderNone) {
        parts.push(withPrefix(prefix, "border-none"));
      }
      parts.push(
        withPrefix(prefix, "outline-1"),
        withPrefix(prefix, `outline-${tokens.outline ?? tokens.fill}`),
      );
      break;
    case "outline":
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, "border-none"),
        withPrefix(prefix, "outline-1"),
        withPrefix(prefix, "outline-offset-[-1px]"),
        withPrefix(prefix, `outline-${tokens.outline ?? tokens.text}`),
      );
      break;
    case "ghost":
      parts.push(
        withPrefix(prefix, "bg-transparent"),
        withPrefix(prefix, "outline-none"),
        withPrefix(prefix, "border-none"),
        withPrefix(prefix, `text-${tokens.text}`),
      );
      break;
    case "underline":
      parts.push(
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, `border-${tokens.border ?? tokens.outline ?? tokens.text}`),
        withPrefix(prefix, `ring-${tokens.ring ?? tokens.outline ?? tokens.text}`),
      );
      break;
    case "solidUnderline":
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
        withPrefix(prefix, `border-${tokens.border ?? tokens.outline ?? tokens.fill}`),
        withPrefix(prefix, `ring-${tokens.ring ?? tokens.outline ?? tokens.fill}`),
      );
      break;
    default:
      parts.push(
        withPrefix(prefix, `bg-${tokens.fill}`),
        withPrefix(prefix, `text-${tokens.text}`),
      );
      break;
  }

  return parts.join(" ");
};

export const composeInteractiveSemantic = (req: SemanticRequest): string => {
  const paletteInfo = classifyPalette(req.palette);
  const lightTokens = resolveInteractiveTokens(req, paletteInfo, "light");
  const classOptions = {
    paletteClass: paletteInfo.paletteClass,
    appearance: req.appearance,
  };
  const light = buildInteractiveClasses(req.variant, lightTokens, false, classOptions);

  const emitDark =
    req.emit?.adaptive !== false &&
    (paletteInfo.normalized === "transparent" ||
      shouldEmitInteractiveDark(req.variant, req.appearance));

  if (!emitDark && req.emit?.scheme !== "dark") {
    return light;
  }

  if (req.emit?.scheme === "dark" && req.emit?.adaptive === false) {
    const darkTokens = resolveInteractiveTokens(req, paletteInfo, "dark");
    return buildInteractiveClasses(req.variant, darkTokens, true, classOptions);
  }

  if (!emitDark) {
    return light;
  }

  const darkTokens = resolveInteractiveTokens(req, paletteInfo, "dark");
  const dark = buildInteractiveClasses(req.variant, darkTokens, true, classOptions);
  return [light, dark].join(" ");
};
