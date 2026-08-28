import { normalizeLoaderName } from "./normalize-loader-name";

describe("normalizeLoaderName", () => {
  it("normalizes PascalCase and camelCase to kebab-case", () => {
    expect(normalizeLoaderName("Tailspin")).toBe("tailspin");
    expect(normalizeLoaderName("LineSpinner")).toBe("line-spinner");
    expect(normalizeLoaderName("DotPulse")).toBe("dot-pulse");
    expect(normalizeLoaderName("NewtonsCradle")).toBe("newtons-cradle");
  });

  it("inserts hyphens before digit suffixes", () => {
    expect(normalizeLoaderName("ring2")).toBe("ring-2");
  });

  it("leaves canonical kebab-case unchanged", () => {
    expect(normalizeLoaderName("ring")).toBe("ring");
    expect(normalizeLoaderName("dot-pulse")).toBe("dot-pulse");
    expect(normalizeLoaderName("line-spinner")).toBe("line-spinner");
  });
});
