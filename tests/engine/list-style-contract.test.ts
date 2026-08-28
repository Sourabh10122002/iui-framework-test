import {
  ORDERED_LIST_SUFFIXES,
  ORDERED_LIST_SYSTEMS,
  buildOrderedSuffixListProperties,
  buildOrderedSystemListProperties,
  orderedCounterStyleId,
  orderedListUtilityClass,
  orderedListUtilityMatrix,
  resolveOrderedCompoundToken,
} from "../../src/engine/utilities/list-style-contract";

describe("list-style-contract", () => {
  it("maps systems and suffixes to counter-style ids", () => {
    expect(orderedCounterStyleId("decimal", "period")).toBe("iui-ol-decimal-dot");
    expect(orderedCounterStyleId("decimal", "parentheses")).toBe(
      "iui-ol-decimal-rparen",
    );
    expect(orderedCounterStyleId("upper-roman", "double-parentheses")).toBe(
      "iui-ol-upper-roman-dparens",
    );
    expect(orderedCounterStyleId("decimal-leading-zero", "parentheses")).toBe(
      "iui-ol-decimal-leading-zero-rparen",
    );
  });

  it("resolves compound shorthand tokens", () => {
    expect(resolveOrderedCompoundToken("decimal-parentheses")).toBe(
      "iui-ol-decimal-rparen",
    );
    expect(resolveOrderedCompoundToken("decimal")).toBeNull();
  });

  it("builds composable CSS vars for TW-style system + suffix classes", () => {
    const system = buildOrderedSystemListProperties("decimal");
    expect(system["--iui-ol-counter-dot"]).toBe("iui-ol-decimal-dot");
    expect(system["list-style-type"]).toBe("var(--iui-ol-counter)");

    const suffix = buildOrderedSuffixListProperties("parentheses");
    expect(suffix["--iui-ol-counter"]).toBe(
      "var(--iui-ol-counter-rparen, var(--iui-ol-counter-dot))",
    );
    expect(suffix["list-style-type"]).toBe("var(--iui-ol-counter)");
  });

  it("exposes composable class lists (system × suffix)", () => {
    expect(ORDERED_LIST_SYSTEMS).toHaveLength(6);
    expect(ORDERED_LIST_SUFFIXES).toEqual([
      "period",
      "parentheses",
      "double-parentheses",
    ]);
    expect(orderedListUtilityClass("decimal")).toEqual(["list-decimal"]);
    expect(orderedListUtilityClass("decimal", "parentheses")).toEqual([
      "list-decimal",
      "list-parentheses",
    ]);
    expect(orderedListUtilityMatrix()).toHaveLength(18);
  });
});
