/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { IUIProvider } from "./iui-provider";
import { useIUIContext } from "./iui-context";
import {
  __resetBootstrapStateForTests,
  registerBootstrapState,
} from "../bootstrap-state";
import { __resetAutoConfigForTests, initFramework } from "../auto-config";
import { clearConfigCache } from "../config-loader";

function Probe() {
  const ctx = useIUIContext();
  return (
    <div
      data-testid="probe"
      data-has-config={ctx?.config ? "yes" : "no"}
      data-direction={ctx?.config?.theme?.direction ?? "none"}
      data-component-key={
        ctx?.componentConfig &&
        typeof ctx.componentConfig === "object" &&
        "Button" in (ctx.componentConfig as object)
          ? "yes"
          : "no"
      }
    />
  );
}

describe("IUIProvider bootstrap resolution", () => {
  beforeEach(() => {
    __resetBootstrapStateForTests();
    __resetAutoConfigForTests();
    clearConfigCache();
  });

  it("uses generated bootstrap state when explicit props are omitted", () => {
    registerBootstrapState({
      frameworkConfig: { theme: { direction: "rtl" } },
      componentConfig: { Button: { default: { variant: "solid" } } },
    });

    render(
      <IUIProvider>
        <Probe />
      </IUIProvider>,
    );

    const probe = screen.getByTestId("probe");
    expect(probe.getAttribute("data-has-config")).toBe("yes");
    expect(probe.getAttribute("data-direction")).toBe("rtl");
    expect(probe.getAttribute("data-component-key")).toBe("yes");
  });

  it("prefers explicit props over bootstrap state (advanced path)", () => {
    registerBootstrapState({
      frameworkConfig: { theme: { direction: "rtl" } },
      componentConfig: { Button: {} },
    });

    render(
      <IUIProvider
        config={{ theme: { direction: "ltr" } }}
        componentConfig={{ Tag: { default: {} } }}
      >
        <Probe />
      </IUIProvider>,
    );

    const probe = screen.getByTestId("probe");
    expect(probe.getAttribute("data-direction")).toBe("ltr");
    expect(probe.getAttribute("data-component-key")).toBe("no");
  });

  it("does not re-init framework when only bootstrap state is present", () => {
    registerBootstrapState({
      frameworkConfig: { theme: { direction: "ltr" } },
    });
    initFramework({ theme: { direction: "ltr" } });

    render(
      <IUIProvider>
        <Probe />
      </IUIProvider>,
    );

    expect(screen.getByTestId("probe").getAttribute("data-direction")).toBe(
      "ltr",
    );
  });
});
