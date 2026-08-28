import { compose } from "../api";
import type {
  Appearance,
  Channel,
  Pattern,
  Scheme,
  State,
  Variant,
} from "../core/dimensions";
import { VARIANT_TOPOLOGY } from "../core/variant-topology";

const request = (
  pattern: Pattern,
  variant: Variant,
  palette: string,
  overrides: {
    appearance?: Appearance;
    state?: State;
    channel?: Channel;
    adaptive?: boolean;
    scheme?: Scheme;
  } = {},
) => ({
  pattern,
  variant,
  appearance: overrides.appearance ?? "strong",
  state: overrides.state ?? "default",
  channel: overrides.channel ?? "full",
  palette,
  emit: overrides.adaptive
    ? { adaptive: true as const }
    : {
        adaptive: false as const,
        scheme: overrides.scheme ?? ("light" as const),
      },
});

describe("active intentional shade deviations", () => {
  test.each(["interactive", "surface"] as const)(
    "DEV-001: %s full transparent uses transparent tables, not black rows",
    (pattern) => {
      const transparent = compose(request(pattern, "solid", "transparent", { adaptive: true }));
      const black = compose(request(pattern, "solid", "black", { adaptive: true }));

      expect(transparent).not.toBe(black);
      expect(transparent).toContain("bg-transparent");
      expect(transparent).toContain("text-neutral-900");
      expect(transparent).toContain("dark:bg-transparent");
      expect(transparent).toContain("dark:text-neutral-100");
      expect(transparent).not.toMatch(/\btransparent-\d+/);
    },
  );

  test("DEV-001: transparent adaptive emission covers every appearance and variant", () => {
    const appearances: Appearance[] = ["strong", "soft", "dualTone", "onColor"];
    const variants: Variant[] = [
      "solid",
      "outline",
      "solidOutline",
      "ghost",
      "underline",
      "solidUnderline",
    ];

    for (const appearance of appearances) {
      for (const variant of variants) {
        const classes = compose(
          request("interactive", variant, "transparent", {
            appearance,
            state: "pressed",
            adaptive: true,
          }),
        );
        expect(classes).toContain("dark:");
        expect(classes).not.toMatch(/\b(?:white|black|transparent)-\d+/);
      }
    }
  });

  test.each(["white", "black"] as const)(
    "DEV-001: %s full literal behavior remains leak-free",
    (palette) => {
      for (const variant of ["solid", "underline", "solidUnderline"] as const) {
        const classes = compose(
          request("interactive", variant, palette, { adaptive: true }),
        );
        expect(classes).not.toMatch(new RegExp(`\\b${palette}-\\d+`));
        expect(classes).not.toMatch(/\btransparent-\d+/);
      }
    },
  );

  test.each(["underline", "solidUnderline"] as const)(
    "DEV-002: %s emits its declared full topology and agrees with slices",
    (variant) => {
      for (const scheme of ["light", "dark"] as const) {
        const full = compose(request("interactive", variant, "brand", { scheme }));
        const slices = VARIANT_TOPOLOGY[variant].activeChannels.map((channel) =>
          compose(request("interactive", variant, "brand", { channel, scheme })),
        );

        expect(full).toBe(slices.join(" "));
        expect(full).not.toContain("text-brand ");
        expect(full).not.toContain("bg-transparent");
      }
    },
  );

  test.each(["underline", "solidUnderline"] as const)(
    "DEV-002: surface %s uses the same full/sliced token assembly",
    (variant) => {
      const full = compose(request("surface", variant, "brand"));
      const slices = VARIANT_TOPOLOGY[variant].activeChannels.map((channel) =>
        compose(request("surface", variant, "brand", { channel })),
      );
      expect(full).toBe(slices.join(" "));
    },
  );

  test("DEV-002: adaptive underline recipes replace the raw-palette fallback", () => {
    const underline = compose(
      request("interactive", "underline", "brand", { adaptive: true }),
    );
    const solidUnderline = compose(
      request("interactive", "solidUnderline", "brand", { adaptive: true }),
    );

    expect(underline).toBe(
      "text-brand-500 border-brand-500 ring-brand-500 " +
        "dark:text-brand-500 dark:border-brand-500 dark:ring-brand-500",
    );
    expect(solidUnderline).toBe(
      "bg-brand-500 text-white border-brand-800 ring-brand-800 " +
        "dark:bg-brand-400 dark:text-neutral-950 dark:border-brand-200 dark:ring-brand-200",
    );
  });
});
