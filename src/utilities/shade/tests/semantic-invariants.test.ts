import { compose } from "../api";
import { validatePatternStateChannel } from "../core/patterns";

describe("semantic invariants", () => {
  test("pattern-state-channel validation rejects invalid combinations", () => {
    expect(() =>
      validatePatternStateChannel("surface", "hover", "fill"),
    ).toThrow();
  });

  test("adaptive only affects emission envelope", () => {
    const base = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "default",
      palette: "brand",
      channel: "full",
      emit: { adaptive: false, scheme: "light" },
    });
    const adaptive = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "default",
      palette: "brand",
      channel: "full",
      emit: { adaptive: true, scheme: "light" },
    });
    expect(base).toContain("bg-brand-500");
    expect(adaptive).toContain("bg-brand-500");
    expect(adaptive).toContain("dark:bg-brand-400");
  });
});
