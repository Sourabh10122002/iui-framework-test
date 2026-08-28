import { getGradientColors, getConfigLoader } from "../core/config-loader";
import { colors } from "../engine/tokens/values";
import { logger } from "./logger";

const registeredGradients = new Map<string, string>();

function isConfigInitialized(): boolean {
  try {
    getConfigLoader();
    return true;
  } catch {
    return false;
  }
}

function isHex(value: string): boolean {
  return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/.test(value.trim());
}

function resolvePaletteValue(value: string): string | undefined {
  if (!value) return undefined;
  const v = value.trim();

  // direct hex or rgba or var() or transparent/currentColor -> return as-is
  if (
    isHex(v) ||
    v.startsWith("var(") ||
    v === "transparent" ||
    v === "currentColor" ||
    v === "inherit"
  ) {
    return v;
  }

  // Check for CSS variable format with color token
  if (v.startsWith("--")) {
    return `var(${v})`;
  }

  // direct match in tokens - prefer CSS variable format for theme compatibility
  if ((colors as any)[v]) {
    const colorValue = (colors as any)[v];
    // If it's already a CSS variable, return as-is
    if (typeof colorValue === "string" && colorValue.startsWith("var(")) {
      return colorValue;
    }
    // Otherwise, use CSS variable format for theme compatibility
    return `var(--iui-color-${v})`;
  }

  // try common shade fallback e.g. 'blue' -> 'blue-500'
  // Prefer CSS variable format for theme compatibility
  const fallbackKeys = [
    `${v}-500`,
    `${v}-400`,
    `${v}-600`,
    `${v}-300`,
    `${v}-50`,
  ];
  for (const key of fallbackKeys) {
    if ((colors as any)[key]) {
      const colorValue = (colors as any)[key];
      // If it's already a CSS variable, return as-is
      if (typeof colorValue === "string" && colorValue.startsWith("var(")) {
        return colorValue;
      }
      // Use CSS variable format so gradients respond to theme changes
      return `var(--iui-color-${key})`;
    }
  }

  // Try to resolve as CSS variable (for semantic/accent colors)
  return `var(--iui-color-${v})`;
}

export function buildGradientString(
  token: { from: string; via?: string; to: string },
  direction: string,
): string {
  const from = resolvePaletteValue(token.from) || token.from;
  const via = token.via
    ? resolvePaletteValue(token.via) || token.via
    : undefined;
  const to = resolvePaletteValue(token.to) || token.to;

  const parts = via ? [from, via, to] : [from, to];
  return `linear-gradient(${direction}, ${parts.join(", ")})`;
}

function normalizeName(name: string) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-");
}

function normalizeDirection(dir?: string) {
  if (!dir) return "90deg";
  const s = String(dir).trim().toLowerCase();

  // angle-like
  if (/^-?\d+(?:\.\d+)?(?:deg|rad|turn|grad)$/.test(s)) return s;

  // already starts with 'to '
  if (s.startsWith("to ")) return s;

  const map: Record<string, string> = {
    // Physical aliases removed; use logical start/end only.
    // CSS gradients don't support inline-start, so we map start/end to left/right for behavior parity.
    start: "to left",
    end: "to right",
    "to-start": "to left",
    "to-end": "to right",
    t: "to top",
    top: "to top",
    "to-t": "to top",
    "to-top": "to top",
    b: "to bottom",
    bottom: "to bottom",
    "to-b": "to bottom",
    "to-bottom": "to bottom",
    // Two-direction logical aliases
    "top-start": "to top left",
    "top-end": "to top right",
    "bottom-start": "to bottom left",
    "bottom-end": "to bottom right",
    "to-top-start": "to top left",
    "to-top-end": "to top right",
    "to-bottom-start": "to bottom left",
    "to-bottom-end": "to bottom right",
  };

  return map[s] || s;
}

export function getGradientValue(name: string): string | undefined {
  const normalized = normalizeName(name);
  const value = registeredGradients.get(normalized);
  if (!value) {
    logger.warn(
      `Gradient '${name}' (normalized: '${normalized}') not found. Available gradients:`,
      Array.from(registeredGradients.keys()),
    );
  }
  return value;
}

export function isGradientRegistered(name: string): boolean {
  return registeredGradients.has(normalizeName(name));
}

export function initializeGradients(defaultDirection = "90deg"): void {
  try {
    // Config may not be set yet when engine initializes before IUIProvider mounts (expected)
    if (!isConfigInitialized()) {
      logger.debug(
        "Config not initialized yet. Skipping gradient initialization (will run when config is applied).",
      );
      return;
    }

    const gradients = getGradientColors();

    if (!gradients || typeof gradients !== "object") {
      logger.warn("No gradient config found or invalid format");
      return;
    }

    registeredGradients.clear();

    Object.entries(gradients).forEach(([rawName, token]) => {
      if (!token || typeof token !== "object") {
        logger.warn(`Invalid gradient token for '${rawName}':`, token);
        return;
      }
      const gradient = token as any;
      if (!gradient.from || !gradient.to) {
        logger.warn(`Missing from/to for gradient '${rawName}':`, gradient);
        return;
      }

      const name = normalizeName(rawName);
      const dir = normalizeDirection(gradient.direction || defaultDirection);
      const cssValue = buildGradientString(
        { from: gradient.from, via: gradient.via, to: gradient.to },
        dir,
      );

      registeredGradients.set(name, cssValue);

      logger.log(
        `✅ Registered gradient: ${name} -> ${cssValue.substring(0, 50)}...`,
      );
    });

    logger.log(`✅ Initialized ${registeredGradients.size} gradients`);
  } catch (e) {
    logger.error("Gradient registration error:", e);
  }
}

export function getRegisteredGradientNames(): string[] {
  return Array.from(registeredGradients.keys());
}

export function getTextGradientProperties(
  name: string,
): Record<string, string> | null {
  const gradientValue = getGradientValue(name);

  if (!gradientValue) {
    return null;
  }

  // Use multiple background layers to preserve both background-color AND background gradients:
  // Layer 1: The text gradient (clipped to text via background-clip: text)
  // Layer 2: The background layer - uses CSS variable cascade:
  //   - --iui-bg-gradient: set by bg-sunset, bg-ocean, etc. (background gradients)
  //   - --iui-text-bg-color: set by bg-blue-500, etc. (solid background colors)
  //   - Falls back to transparent if neither is set
  // This allows text-sunset to work with:
  //   - bg-sunset (background gradient)
  //   - bg-blue-500 (solid background color)
  //   - No background at all (transparent)
  return {
    "--iui-text-gradient": gradientValue,
    "background-image": `var(--iui-text-gradient), var(--iui-bg-gradient, linear-gradient(var(--iui-text-bg-color, transparent), var(--iui-text-bg-color, transparent)))`,
    "background-clip": "text, padding-box",
    "-webkit-background-clip": "text, padding-box",
    "-webkit-text-fill-color": "transparent",
    color: "transparent",
  };
}
