/**
 * Maps an illustration *slot* payload to `@inventive-ui/illustrations` package props.
 *
 * Slot contract `style` is the Storyset family token (`Amico` / `bro` / …).
 * Package React `style` is CSSProperties. Those must never be conflated —
 * spreading a family string into a DOM style object causes:
 *   "Failed to set an indexed property [0] on 'CSSStyleDeclaration'".
 *
 * Shared by the lazy storyset library path and the bound-asset path so both
 * stay aligned.
 */

const STORYSET_SIZE_PX: Record<"sm" | "md" | "lg", number> = {
  sm: 200,
  md: 300,
  lg: 400,
};

const FULL_ILLUSTRATION_ID =
  /^(amico|bro|cuate|pana|rafiki|storyset)-/i;

export function toIllustrationPixelSize(size: unknown): unknown {
  if (size === "sm" || size === "md" || size === "lg") {
    return STORYSET_SIZE_PX[size];
  }
  return size;
}

function isCssStyleObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export type MapIllustrationSlotMode = "lazy" | "bound";

/**
 * @param mode `lazy` — identity props for dynamic `Illustration` (family/name or id).
 *             `bound` — presentation-only props; scene is already selected by registry key.
 */
export function mapIllustrationSlotToPackageProps(
  slot: Record<string, unknown>,
  mode: MapIllustrationSlotMode = "lazy",
): Record<string, unknown> {
  const {
    type: _type,
    library: _library,
    name,
    style: storysetFamily,
    color,
    size,
    className,
    ...rest
  } = slot;

  // Drop any residual string `style` / mistaken `family` from rest; keep a real CSS object.
  const {
    style: maybeCssStyle,
    family: _restFamily,
    name: _restName,
    id: _restId,
    ...safeRest
  } = rest;

  const cssStyle = isCssStyleObject(maybeCssStyle) ? maybeCssStyle : undefined;
  const resolvedSize = toIllustrationPixelSize(size);

  const presentation: Record<string, unknown> = {
    color,
    size: resolvedSize,
    className,
    ...safeRest,
  };
  if (cssStyle) {
    presentation.style = cssStyle;
  }

  if (mode === "bound") {
    // Bound scene components (createIllustration) only accept presentation props.
    return {
      variant: "detailed" as const,
      ...presentation,
    };
  }

  const nameStr = typeof name === "string" ? name : "";
  const family =
    typeof storysetFamily === "string" && storysetFamily.length > 0
      ? storysetFamily.toLowerCase()
      : "amico";

  if (FULL_ILLUSTRATION_ID.test(nameStr)) {
    return { id: nameStr, ...presentation };
  }

  return {
    family,
    name: nameStr,
    variant: "detailed" as const,
    ...presentation,
  };
}
