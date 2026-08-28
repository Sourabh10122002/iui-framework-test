import { compose, stack, slice } from "./index";
import type {
  Appearance,
  SemanticRequest,
  State,
  Variant,
  Pattern,
  Channel,
} from "../core/dimensions";
import {
  normalizeAppearance,
  normalizePalette,
  normalizeVariant,
  toLegacyVariant,
} from "../core/dimensions";

const mapSelectionState = (state?: string): State => {
  if (state === "hover") return "hover";
  if (state === "selected") return "selected";
  if (state === "disabled") return "disabled";
  return "default";
};

type BaseOverrides = {
  palette?: string;
  paletteName?: string;
  variant?: string;
  appearance?: string;
  pattern?: Pattern;
  channel?: Channel;
  emit?: SemanticRequest["emit"];
  adaptive?: boolean;
};

const baseReq = (overrides: BaseOverrides): Omit<SemanticRequest, "state"> => {
  const palette = normalizePalette(
    overrides.paletteName ?? overrides.palette ?? "brand",
  );
  const variant = normalizeVariant((overrides.variant as string) ?? "solid");
  const appearance = normalizeAppearance((overrides.appearance as string) ?? "strong");
  return {
    pattern: (overrides.pattern as Pattern) ?? "interactive",
    variant,
    appearance,
    channel: (overrides.channel as Channel) ?? "full",
    palette,
    emit: overrides.emit ?? { adaptive: overrides.adaptive ?? true },
  };
};

export interface InteractiveFullConfig {
  paletteName?: string;
  palette?: string;
  variant?: string;
  appearance?: string;
  interactionVariant?: string;
  isActive?: boolean;
  disabled?: boolean;
  adaptive?: boolean;
  toggleSelected?: boolean;
  loading?: boolean;
  interactionColor?: string;
  interactionAppearance?: string;
  isThemeDark?: boolean;
}

export interface InteractiveStateConfig extends InteractiveFullConfig {
  state?: "default" | "hover" | "pressed" | "base" | "active";
  part?: "full" | "fill" | "text" | "border";
}

const interactiveState = (state?: InteractiveStateConfig["state"]): State => {
  if (state === "hover") return "hover";
  if (state === "pressed" || state === "active") return "pressed";
  return "default";
};

const toChannel = (
  part?: InteractiveStateConfig["part"],
): Channel => {
  if (part === "fill") return "fill";
  if (part === "text") return "text";
  if (part === "border") return "border";
  return "full";
};

export const interactive = {
  full: (
    configOrPalette: InteractiveFullConfig | string = {},
    variant?: string,
    appearance?: string,
    _interactionVariant?: string,
    _isActive?: boolean,
    _disabled?: boolean,
    adaptive?: boolean,
  ): string => {
    const config: InteractiveFullConfig =
      typeof configOrPalette === "string"
        ? {
            paletteName: configOrPalette,
            variant,
            appearance,
            adaptive,
          }
        : configOrPalette;
    return stack({
      ...baseReq({ ...config, pattern: "interactive" }),
    });
  },
  state: (config: InteractiveStateConfig = {}): string =>
    slice({
      ...baseReq({
        ...config,
        pattern: "interactive",
        channel: toChannel(config.part),
      }),
      state: interactiveState(config.state),
    }),
};

export interface SelectionConfig extends InteractiveFullConfig {
  role?: "idle" | "hover" | "selected" | "disabled";
  state?: "default" | "hover" | "selected" | "disabled";
}

export const selection = (config: SelectionConfig = {}): string =>
  slice({
    ...baseReq({ ...config, pattern: "interactive" }),
    state: mapSelectionState(config.role ?? config.state),
  });

export interface SurfaceConfig extends InteractiveFullConfig {
  part?: "full" | "fill" | "text" | "border";
}

const surfaceChannel = (part?: SurfaceConfig["part"]): Channel => {
  if (part === "fill") return "fill";
  if (part === "text") return "text";
  if (part === "border") return "border";
  return "full";
};

export const surface = Object.assign(
  (config: SurfaceConfig = {}): string =>
    slice({
      ...baseReq({
        ...config,
        pattern: "surface",
        channel: surfaceChannel(config.part),
      }),
      state: "default",
    }),
  {
    borderBox: (config: SurfaceConfig = {}): string =>
      slice({
        ...baseReq({
          ...config,
          pattern: "surface",
          channel: "border",
        }),
        state: "default",
      }),
  },
);

export interface FieldConfig extends InteractiveFullConfig {
  role?: "default" | "focus" | "error" | "soft" | "dualTone";
  state?: "default" | "focus" | "error" | "soft" | "dualTone";
}

const fieldState = (value?: string): State => {
  if (value === "focus") return "focus";
  if (value === "error") return "error";
  return "default";
};

export const field = Object.assign(
  (config: FieldConfig = {}): string =>
    slice({
      ...baseReq({
        ...config,
        pattern: "field",
      }),
      state: fieldState(config.role ?? config.state),
    }),
  {
    border: (config: FieldConfig = {}): string =>
      slice({
        ...baseReq({ ...config, pattern: "field", channel: "border" }),
        state: fieldState(config.role ?? config.state),
      }),
    fill: (config: FieldConfig = {}): string =>
      slice({
        ...baseReq({ ...config, pattern: "field", channel: "fill" }),
        state: fieldState(config.role ?? config.state),
      }),
    underline: (): string =>
      slice({
        ...baseReq({
          pattern: "field",
          variant: "underline",
          appearance: "soft",
          channel: "border",
          paletteName: "neutral",
        }),
        state: "default",
      }),
    focusRing: (config: { paletteName?: string } = {}): string =>
      slice({
        ...baseReq({
          pattern: "field",
          variant: "outline",
          appearance: "strong",
          channel: "ring",
          paletteName: config.paletteName ?? "brand",
        }),
        state: "focus",
      }),
    label: (config: { role: "neutral" | "palette" | "mask"; paletteName?: string; adaptive?: boolean }): string => {
      if (config.role === "mask") {
        return "bg-white dark:bg-gray-950";
      }
      return slice({
        ...baseReq({
          pattern: "surface",
          variant: "ghost",
          appearance: "soft",
          channel: "text",
          paletteName: config.role === "neutral" ? "neutral" : config.paletteName ?? "brand",
          adaptive: config.adaptive,
        }),
        state: "default",
      });
    },
  },
);

export const fieldAddonDivider = "border-neutral-200 dark:border-neutral-700";

export interface StatusConfig extends InteractiveFullConfig {
  role?: "dot" | "indicator" | "text" | "border";
}

export const status = Object.assign(
  (config: StatusConfig = {}): string =>
    slice({
      ...baseReq({
        ...config,
        pattern: "surface",
        channel: config.role === "text" ? "text" : config.role === "border" ? "border" : "fill",
      }),
      state: "default",
    }),
  {
    text: (config: StatusConfig = {}): string =>
      slice({
        ...baseReq({ ...config, pattern: "surface", channel: "text" }),
        state: "default",
      }),
    outline: (config: StatusConfig = {}): string =>
      slice({
        ...baseReq({ ...config, pattern: "surface", channel: "border" }),
        state: "default",
      }),
  },
);

export interface ScrollConfig {
  role?: "track" | "thumb" | "arrow";
}

export const scroll = (config: ScrollConfig = {}): string =>
  slice({
    ...baseReq({
      pattern: "chrome",
      variant: "ghost",
      appearance: "soft",
      channel: config.role ?? "thumb",
      paletteName: "neutral",
    }),
    state: "default",
  });

export interface SwatchConfig extends InteractiveFullConfig {
  role?: "bg" | "border" | "ring" | "selected";
}

const swatchChannel = (role?: SwatchConfig["role"]): Channel => {
  if (role === "border") return "border";
  if (role === "ring" || role === "selected") return "ring";
  return "fill";
};

export const swatch = Object.assign(
  (config: SwatchConfig = {}): string =>
    slice({
      ...baseReq({
        ...config,
        pattern: "interactive",
        channel: swatchChannel(config.role),
      }),
      state: config.role === "selected" ? "selected" : "default",
    }),
  {
    labelContrast: (config: {
      variant?: "solid" | "solid-outline" | "outline";
      appearance?: string;
      paletteName?: string;
      adaptive?: boolean;
    } = {}): string =>
      slice({
        ...baseReq({
          pattern: "interactive",
          variant: config.variant ? normalizeVariant(config.variant) : "solid",
          appearance: normalizeAppearance(config.appearance ?? "strong"),
          channel: "text",
          paletteName: config.paletteName ?? "brand",
          adaptive: config.adaptive,
        }),
        state: "default",
      }),
    hexLabelContrast: (hex: string): string => {
      const normalized = hex.replace("#", "");
      if (normalized.length !== 6) return "text-black";
      const r = Number.parseInt(normalized.slice(0, 2), 16);
      const g = Number.parseInt(normalized.slice(2, 4), 16);
      const b = Number.parseInt(normalized.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.6 ? "text-black" : "text-white";
    },
  },
);

export const neutral = {
  inactive: (config: { adaptive?: boolean } = {}): string =>
    slice({
      ...baseReq({
        pattern: "chrome",
        variant: "solid",
        appearance: "soft",
        channel: "track",
        paletteName: "neutral",
        adaptive: config.adaptive,
      }),
      state: "default",
    }),
};

export const overlay = (config: InteractiveFullConfig = {}): string =>
  slice({
    ...baseReq({
      ...config,
      pattern: "surface",
      variant: "solidOutline",
      appearance: config.appearance ?? "onColor",
      channel: "fill",
    }),
    state: "default",
  });

export const decorator = (config: InteractiveFullConfig & { role?: string } = {}): string =>
  slice({
    ...baseReq({
      ...config,
      pattern: "surface",
      variant: "ghost",
      appearance: "soft",
      channel: "text",
    }),
    state: "default",
  });

const mapControlState = (state?: string): State => {
  if (state === "selected") return "selected";
  if (state === "disabled") return "disabled";
  if (state === "hover") return "hover";
  if (state === "indeterminate") return "indeterminate";
  return "default";
};

const mapControlVariant = (variant?: string): Variant => {
  const normalized = normalizeVariant(variant ?? "outline");
  if (normalized === "underline" || normalized === "solidUnderline") return "outline";
  return normalized;
};

const mapControlAppearance = (appearance?: string): Appearance =>
  normalizeAppearance(appearance ?? "strong");

const markCompose = (input: {
  paletteName?: string;
  variant?: string;
  appearance?: string;
  adaptive?: boolean;
  state?: string;
  channel?: Channel;
}): string =>
  slice({
    ...baseReq({
      pattern: "mark",
      variant: mapControlVariant(input.variant),
      appearance: mapControlAppearance(input.appearance),
      channel: input.channel ?? "fill",
      paletteName: input.paletteName ?? "brand",
      adaptive: input.adaptive,
    }),
    state: mapControlState(input.state),
  });

export const control = {
  indicator: (config: {
    kind?: "checkbox" | "radio";
    palette?: string;
    paletteName?: string;
    variant?: "outline" | "solid" | "solid-outline";
    appearance?: "strong" | "soft" | "dualTone" | "onColor";
    state?: "default" | "hover" | "pressed" | "selected" | "disabled" | "focus" | "error";
    role?: "idle" | "selected";
    adaptive?: boolean;
  }): string =>
    markCompose({
      paletteName: config.paletteName ?? config.palette,
      variant: config.variant,
      appearance: config.appearance,
      adaptive: config.adaptive,
      state: config.role === "selected" ? "selected" : config.state,
      channel: "indicator",
    }),
  icon: (
    palette: string,
    variant: "outline" | "solid" | "solid-outline",
    appearance: "strong" | "soft" | "dualTone" | "onColor",
    adaptive: boolean,
    part: "text" | "bg",
  ): string =>
    markCompose({
      paletteName: palette,
      variant,
      appearance,
      adaptive,
      channel: part === "text" ? "text" : "indicator",
      state: "selected",
    }),
  card: (
    _kind: "checkbox" | "radio",
    variant: "outline" | "solid" | "solid-outline",
    palette: string,
    state: "selected" | "unselected" | "indeterminate",
    adaptive: boolean,
    appearance: "strong" | "soft" | "dualTone" | "onColor" = "soft",
  ): string =>
    markCompose({
      paletteName: palette,
      variant,
      appearance,
      adaptive,
      state: state === "unselected" ? "default" : state,
      channel: "container",
    }),
  cardHover: (
    kind: "checkbox" | "radio",
    variant: "outline" | "solid" | "solid-outline",
    palette: string,
    state: "selected" | "unselected" | "indeterminate",
    adaptive: boolean,
    appearance: "strong" | "soft" | "dualTone" | "onColor" = "soft",
  ): string =>
    control.card(kind, variant, palette, state, adaptive, appearance),
  cardFromUi: (config: {
    kind: "checkbox" | "radio";
    variant: "outline" | "solid" | "solid-outline";
    palette: string;
    state:
      | "default"
      | "hover"
      | "pressed"
      | "selected"
      | "disabled"
      | "focus"
      | "error"
      | "unselected"
      | "indeterminate";
    adaptive: boolean;
    appearance?: "strong" | "soft" | "dualTone" | "onColor";
  }): string =>
    control.card(
      config.kind,
      config.variant,
      config.palette,
      config.state === "indeterminate"
        ? "indeterminate"
        : config.state === "selected"
          ? "selected"
          : "unselected",
      config.adaptive,
      config.appearance ?? "soft",
    ),
  stripTextUtilities: (classes: string): string =>
    classes
      .split(/\s+/)
      .filter((token) => !token.startsWith("text-") && !token.startsWith("dark:text-"))
      .join(" "),
  checkboxCard: (
    variant: "outline" | "solid" | "solid-outline",
    palette: string,
    selected: boolean,
    adaptive: boolean,
    appearance: "strong" | "soft" | "dualTone" | "onColor" = "soft",
  ): string =>
    control.card("checkbox", variant, palette, selected ? "selected" : "unselected", adaptive, appearance),
  checkboxCardHover: (
    variant: "outline" | "solid" | "solid-outline",
    palette: string,
    selected: boolean,
    adaptive: boolean,
    appearance: "strong" | "soft" | "dualTone" | "onColor" = "soft",
  ): string =>
    control.checkboxCard(variant, palette, selected, adaptive, appearance),
  radioCard: (
    variant: "outline" | "solid" | "solid-outline",
    palette: string,
    selected: boolean,
    adaptive: boolean,
    appearance: "strong" | "soft" | "dualTone" | "onColor" = "soft",
  ): string =>
    control.card("radio", variant, palette, selected ? "selected" : "unselected", adaptive, appearance),
  radioCardHover: (
    variant: "outline" | "solid" | "solid-outline",
    palette: string,
    selected: boolean,
    adaptive: boolean,
    appearance: "strong" | "soft" | "dualTone" | "onColor" = "soft",
  ): string =>
    control.radioCard(variant, palette, selected, adaptive, appearance),
};

type ShadeClassSlice = "bg" | "text" | "border" | "outline";

const splitClasses = (classes: string): string[] =>
  classes.split(/\s+/).filter(Boolean);

const stripOutlineMeta = (classes: string): string =>
  splitClasses(classes)
    .filter(
      (c) =>
        !c.includes("outline-none") &&
        !c.includes("outline-offset") &&
        !/^[\w:]*outline-\d+$/.test(c),
    )
    .join(" ");

const outlineToBorder = (classes: string): string =>
  classes.replace(/([\w:-]*)outline-/g, "$1border-");

const pickBg = (classes: string): string =>
  splitClasses(classes)
    .filter((c) => c.startsWith("bg-") || c.startsWith("dark:bg-"))
    .join(" ");

const pickText = (classes: string): string =>
  splitClasses(classes)
    .filter((c) => c.startsWith("text-") || c.startsWith("dark:text-"))
    .join(" ");

const pickBorder = (classes: string): string =>
  splitClasses(classes)
    .filter(
      (c) =>
        (c.startsWith("border-") || c.startsWith("dark:border-")) &&
        c !== "border-none" &&
        c !== "dark:border-none",
    )
    .join(" ");

const omitText = (classes: string): string =>
  splitClasses(classes)
    .filter((c) => !c.includes("text-"))
    .join(" ");

const pick = (classes: string, ...slices: ShadeClassSlice[]): string => {
  const parts: string[] = [];
  if (slices.includes("bg")) parts.push(pickBg(classes));
  if (slices.includes("text")) parts.push(pickText(classes));
  if (slices.includes("border")) parts.push(pickBorder(classes));
  if (slices.includes("outline")) {
    parts.push(
      splitClasses(stripOutlineMeta(classes))
        .filter((c) => c.includes("outline-"))
        .join(" "),
    );
  }
  return parts.filter(Boolean).join(" ");
};

const omit = (classes: string, ...slices: ShadeClassSlice[]): string => {
  let result = classes;
  if (slices.includes("text")) {
    result = omitText(result);
  }
  if (slices.includes("bg")) {
    result = splitClasses(result)
      .filter((c) => !c.startsWith("bg-") && !c.startsWith("dark:bg-"))
      .join(" ");
  }
  if (slices.includes("border")) {
    result = splitClasses(result)
      .filter(
        (c) =>
          !c.startsWith("border-") &&
          !c.startsWith("dark:border-") &&
          c !== "border" &&
          c !== "border-none",
      )
      .join(" ");
  }
  if (slices.includes("outline")) {
    result = splitClasses(result)
      .filter((c) => !c.includes("outline-"))
      .join(" ");
  }
  return result.trim();
};

const toBorderBox = (
  classes: string,
  options: { bg?: boolean; text?: boolean; borderShorthand?: boolean } = {},
): string => {
  const stripped = stripOutlineMeta(classes);
  const converted = outlineToBorder(stripped);
  const parts: string[] = [];
  if (options.bg !== false) parts.push(pickBg(converted));
  if (options.text) parts.push(pickText(converted));
  parts.push(pickBorder(converted));
  if (options.borderShorthand) parts.push("border");
  return parts.filter(Boolean).join(" ");
};

const colorClass = (
  prefix: "bg" | "text" | "border" | "outline",
  token: string,
  dark = false,
): string => {
  if (!token) return "";
  return `${dark ? "dark:" : ""}${prefix}-${token}`;
};

const resolvePalette = (
  paletteName: string,
): {
  paletteName: string;
  effectivePalette: string;
  isWhite: boolean;
  isBlack: boolean;
} => {
  const normalized = normalizePalette(paletteName);
  const isWhite = normalized === "white";
  const isBlack = normalized === "black";
  return {
    paletteName: normalized,
    effectivePalette: isWhite || isBlack ? "neutral" : normalized,
    isWhite,
    isBlack,
  };
};

export const shared = {
  normalize: {
    variant: (value: string): string => toLegacyVariant(normalizeVariant(value)),
    appearance: normalizeAppearance,
    paletteName: normalizePalette,
  },
  palette: {
    colorClass,
    darkColorClass: (prefix: "bg" | "text" | "border" | "outline", token: string): string =>
      colorClass(prefix, token, true),
    resolvePalette,
  },
  postProcess: {
    stripOutlineMeta,
    outlineToBorder,
    pickBg,
    pickText,
    pickBorder,
    omitText,
    pick,
    omit,
    toBorderBox,
    stripOutlineUtilities: stripOutlineMeta,
    outlineTokensToBorder: outlineToBorder,
    extractBgClasses: pickBg,
    extractTextClasses: pickText,
    stripTextUtilities: omitText,
  },
};

export const shadeShims = {
  interactive,
  control,
  selection,
  surface,
  field,
  status,
  scroll,
  swatch,
  neutral,
  overlay,
  decorator,
  shared,
};

export const toLegacyVariantName = toLegacyVariant;
