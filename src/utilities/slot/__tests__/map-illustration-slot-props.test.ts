import {
  mapIllustrationSlotToPackageProps,
  toIllustrationPixelSize,
} from "../map-illustration-slot-props";

describe("mapIllustrationSlotToPackageProps", () => {
  it("never forwards Storyset family style as CSS style (lazy)", () => {
    const props = mapIllustrationSlotToPackageProps(
      {
        type: "illustration",
        library: "storyset",
        name: "1212-sale",
        style: "Amico",
        color: "brand",
        size: "md",
      },
      "lazy",
    );

    expect(props.family).toBe("amico");
    expect(props.name).toBe("1212-sale");
    expect(props.variant).toBe("detailed");
    expect(props.size).toBe(300);
    expect(props.style).toBeUndefined();
  });

  it("never forwards Storyset family style as CSS style (bound)", () => {
    const props = mapIllustrationSlotToPackageProps(
      {
        type: "illustration",
        library: "storyset",
        name: "1212-sale",
        style: "Amico",
        color: "currentColor",
        size: "lg",
      },
      "bound",
    );

    expect(props.variant).toBe("detailed");
    expect(props.size).toBe(400);
    expect(props.name).toBeUndefined();
    expect(props.family).toBeUndefined();
    expect(props.style).toBeUndefined();
    expect(props["0"]).toBeUndefined();
  });

  it("maps full illustration ids on the lazy path", () => {
    const props = mapIllustrationSlotToPackageProps(
      {
        type: "illustration",
        name: "amico-1212-sale-hidden",
        style: "Amico",
        size: "sm",
      },
      "lazy",
    );
    expect(props.id).toBe("amico-1212-sale-hidden");
    expect(props.family).toBeUndefined();
    expect(props.size).toBe(200);
    expect(props.style).toBeUndefined();
  });

  it("toIllustrationPixelSize maps tokens only", () => {
    expect(toIllustrationPixelSize("sm")).toBe(200);
    expect(toIllustrationPixelSize("md")).toBe(300);
    expect(toIllustrationPixelSize("lg")).toBe(400);
    expect(toIllustrationPixelSize(240)).toBe(240);
    expect(toIllustrationPixelSize("3xl")).toBe("3xl");
  });
});
