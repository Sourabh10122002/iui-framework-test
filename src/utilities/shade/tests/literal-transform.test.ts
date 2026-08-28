import { compose } from "../api";

describe("literal transform", () => {
  test("white palette never emits white-xxx", () => {
    const classes = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "default",
      channel: "full",
      palette: "white",
      emit: { adaptive: true },
    });
    expect(classes).toContain("bg-white");
    expect(classes).not.toContain("bg-white-");
  });

  test("black palette never emits black-xxx", () => {
    const classes = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "default",
      channel: "full",
      palette: "black",
      emit: { adaptive: true },
    });
    expect(classes).toContain("bg-black");
    expect(classes).not.toContain("bg-black-");
  });
});
