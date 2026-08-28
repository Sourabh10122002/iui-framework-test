import { compose } from "../api";

describe("composition proofs", () => {
  test("interactive selected composition", () => {
    const classes = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "selected",
      channel: "full",
      palette: "brand",
      emit: { adaptive: true },
    });
    expect(classes).toContain("bg-brand-600");
    expect(classes).toContain("dark:bg-brand-300");
  });

  test("interactive neutral composition", () => {
    const classes = compose({
      pattern: "interactive",
      variant: "outline",
      appearance: "soft",
      state: "hover",
      channel: "full",
      palette: "neutral",
      emit: { adaptive: true },
    });
    expect(classes).toContain("text-neutral-700");
    expect(classes).toContain("outline-neutral-500");
  });

  test("static semantic surface composition", () => {
    const classes = compose({
      pattern: "surface",
      variant: "solidOutline",
      appearance: "soft",
      state: "default",
      channel: "full",
      palette: "success",
      emit: { adaptive: true },
    });
    expect(classes).toContain("bg-success-50");
    expect(classes).toContain("text-success-700");
    expect(classes).toContain("border border-1");
    expect(classes).toContain("border-success-300");
  });
});
