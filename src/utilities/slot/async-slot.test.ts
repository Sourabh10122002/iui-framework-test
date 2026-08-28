import React from "react";
import {
  isReactComponentType,
  normalizeSlotModule,
  resolveComponentExport,
} from "./async-slot";

function FunctionComponent() {
  return null;
}

const forwardRefComponent = Object.assign(
  { $$typeof: Symbol.for("react.forward_ref"), render: FunctionComponent },
  { displayName: "ForwardRef" },
);

describe("slot module interop", () => {
  test("isReactComponentType accepts functions and forwardRef objects", () => {
    expect(isReactComponentType(FunctionComponent)).toBe(true);
    expect(isReactComponentType(forwardRefComponent)).toBe(true);
    expect(isReactComponentType({})).toBe(false);
    expect(isReactComponentType({ Button: FunctionComponent })).toBe(false);
  });

  test("normalizeSlotModule removes namespace default but keeps component default", () => {
    const namespaceDefault = { Button: FunctionComponent, Carousel: FunctionComponent };
    expect(normalizeSlotModule({ default: namespaceDefault, Button: FunctionComponent })).toEqual({
      Button: FunctionComponent,
    });
    expect(
      normalizeSlotModule({ default: FunctionComponent, Button: FunctionComponent }),
    ).toEqual({
      default: FunctionComponent,
      Button: FunctionComponent,
    });
  });

  test("resolveComponentExport prefers named export over invalid default", () => {
    const mod = {
      default: { Button: FunctionComponent },
      Button: FunctionComponent,
    };
    expect(resolveComponentExport(mod, "Button")).toBe(FunctionComponent);
    expect((mod.default ?? mod.Button) as unknown).toEqual({ Button: FunctionComponent });
  });

  test("resolveComponentExport uses valid default when named export is absent", () => {
    const mod = { default: forwardRefComponent };
    expect(resolveComponentExport(mod, "Alert")).toBe(forwardRefComponent);
  });

  test("resolveComponentExport resolves compound members via member argument", () => {
    const Label = Object.assign(forwardRefComponent, {
      Float: FunctionComponent,
    });
    const mod = { Label };
    expect(resolveComponentExport(mod, "Label", "Float")).toBe(FunctionComponent);
  });

  test("resolveComponentExport resolves compound members after normalization", () => {
    const Label = Object.assign(forwardRefComponent, {
      Float: FunctionComponent,
    });
    const mod = {
      default: { Label },
      Label,
    };
    const resolved = resolveComponentExport(mod, "Label") as unknown as typeof Label;
    expect(resolved).toBe(Label);
    expect(resolved.Float).toBe(FunctionComponent);
  });

  test("resolveComponentExport resolves namespace exports like Input and Drawer", () => {
    const Input = { Text: FunctionComponent, Search: forwardRefComponent };
    const Drawer = { Inline: FunctionComponent, Overlay: forwardRefComponent };
    const mod = { Input, Drawer };
    const resolvedInput = resolveComponentExport(mod, "Input") as unknown as typeof Input;
    const resolvedDrawer = resolveComponentExport(mod, "Drawer") as unknown as typeof Drawer;
    expect(resolvedInput).toBe(Input);
    expect(resolvedInput.Search).toBe(forwardRefComponent);
    expect(resolvedDrawer?.Inline).toBe(FunctionComponent);
  });
});
