import { compose, stack, channel, prefixInteractiveClasses } from "../api";
import {
  composeControlSelected,
  composeControlUnselected,
  composeControlIcon,
  composeControlCard,
  composeControlDot,
  composeControlCardHover,
} from "../api/control-compose";
import {
  composeSelectionRow,
  composeSelectionLabel,
  composeSelectionHighlight,
  composeSelectionInteractive,
  pickTextUtilities,
  pickFillUtilities,
} from "../api/selection-compose";
import { field, interactive, surface } from "../api/shims";
import * as publicShadeEntry from "../../../shade";

describe("shade api contract", () => {
  test("dedicated public entry exposes only stable semantic runtime primitives", () => {
    expect(Object.keys(publicShadeEntry).sort()).toEqual([
      "channel",
      "compose",
      "prefixInteractiveClasses",
      "shade",
      "slice",
      "stack",
    ]);
    expect("composeControlSelected" in publicShadeEntry).toBe(false);
    expect("composeSelectionRow" in publicShadeEntry).toBe(false);
    expect("shadeRegistry" in publicShadeEntry).toBe(false);
  });

  test("compose family exports stable call signatures", () => {
    expect(typeof compose).toBe("function");
    expect(typeof stack).toBe("function");
    expect(typeof channel).toBe("function");
    expect(typeof prefixInteractiveClasses).toBe("function");

    const classes = compose({
      pattern: "interactive",
      variant: "solid",
      appearance: "strong",
      state: "default",
      palette: "brand",
      channel: "full",
      emit: { adaptive: true },
    });
    expect(classes.length).toBeGreaterThan(0);
  });

  test("control-compose exports return class strings", () => {
    expect(composeControlSelected("brand", "solid", "strong", true).length).toBeGreaterThan(0);
    expect(composeControlUnselected("brand", "solid", "strong", true).length).toBeGreaterThan(0);
    expect(composeControlIcon("brand", "solid", "strong", true).length).toBeGreaterThan(0);
    expect(composeControlCard("brand", "solid", "strong", true).length).toBeGreaterThan(0);
    expect(composeControlDot("brand", "solid", "strong", true).length).toBeGreaterThan(0);
    expect(composeControlCardHover("brand", "solid", "strong", true).length).toBeGreaterThan(0);
  });

  test("selection-compose exports return class strings", () => {
    const row = composeSelectionRow("brand", "ghost", "soft", "default", true);
    expect(row.length).toBeGreaterThan(0);
    expect(pickTextUtilities(row).length).toBeGreaterThan(0);
    expect(pickFillUtilities(row).length).toBeGreaterThan(0);

    expect(composeSelectionLabel("brand", "soft", true).length).toBeGreaterThan(0);
    expect(composeSelectionHighlight("neutral", true).length).toBeGreaterThan(0);
    expect(
      composeSelectionInteractive("brand", "outline", "strong", true).length,
    ).toBeGreaterThan(0);
  });

  test("shim family exports return class strings", () => {
    const config = {
      paletteName: "brand",
      variant: "solid" as const,
      appearance: "strong" as const,
      adaptive: true,
    };

    expect(interactive.full(config).length).toBeGreaterThan(0);
    expect(surface(config).length).toBeGreaterThan(0);
    expect(
      field.border({
        paletteName: "brand",
        variant: "outline",
        appearance: "soft",
        adaptive: true,
        role: "default",
      }).length,
    ).toBeGreaterThan(0);
  });
});
