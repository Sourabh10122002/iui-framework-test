import React from "react";
import { render } from "@testing-library/react";
import {
  __resetSlotRegistryForTests,
  registerSlot,
  SlotRenderer,
} from "./slot-registry";

declare module "./slot-types" {
  interface SlotMap {
    "test-slot": {
      type: "test-slot";
      label?: string;
      tabIndex?: number;
    };
  }
}

describe("slot registry env bridge", () => {
  beforeEach(() => {
    __resetSlotRegistryForTests();
  });

  test("keeps legacy renderer callback shape working", () => {
    let observedSlot: { type: "test-slot" } | undefined;

    registerSlot("test-slot", (slot) => {
      observedSlot = slot;
      return <div data-testid="legacy">legacy</div>;
    });
    const { getByTestId } = render(<SlotRenderer slot={{ type: "test-slot" }} />);

    expect(getByTestId("legacy")).not.toBeNull();
    expect(observedSlot).toMatchObject({ type: "test-slot" });
  });

  test("applies env.scope as defaults and keeps explicit slot precedence", () => {
    let observedSlot: { tabIndex?: number } | undefined;
    let observedEnv: unknown;

    registerSlot("test-slot", (slot, env) => {
      observedSlot = slot;
      observedEnv = env;
      return <div data-testid="env">env</div>;
    });

    const env = { scope: { tabIndex: 1 } };
    render(
      <SlotRenderer
        slot={{ type: "test-slot", tabIndex: 0 }}
        env={env}
      />,
    );

    expect(observedSlot?.tabIndex).toBe(0);
    expect(observedEnv).toBe(env);
  });

  test("uses env.scope defaults when slot props are absent", () => {
    let observedSlot: { tabIndex?: number } | undefined;

    registerSlot("test-slot", (slot) => {
      observedSlot = slot;
      return null;
    });

    render(
      <SlotRenderer
        slot={{ type: "test-slot" }}
        env={{ scope: { tabIndex: 2 } }}
      />,
    );

    expect(observedSlot?.tabIndex).toBe(2);
  });
});
