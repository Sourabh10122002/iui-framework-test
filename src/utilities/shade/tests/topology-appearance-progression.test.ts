import { compose } from "../api";

describe("topology and appearance ownership", () => {
  test("ghost variant does not emit border by default", () => {
    const classes = compose({
      pattern: "interactive",
      variant: "ghost",
      appearance: "strong",
      state: "default",
      channel: "full",
      palette: "brand",
      emit: { adaptive: false },
    });
    expect(classes).toContain("text-brand-500");
    expect(classes).not.toMatch(/\bborder-(?!none)/);
  });

  test("appearance changes intensity without changing active topology", () => {
    const strong = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "default",
      channel: "full",
      palette: "brand",
      emit: { adaptive: false },
    });
    const soft = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "soft",
      state: "default",
      channel: "full",
      palette: "brand",
      emit: { adaptive: false },
    });
    expect(strong).toContain("bg-brand-500");
    expect(soft).toContain("bg-brand-100");
    expect(strong).toContain("text-white");
    expect(soft).toContain("text-brand-700");
  });
});
