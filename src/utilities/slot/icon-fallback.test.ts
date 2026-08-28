import { resolveIconFallbackGlyph, LIBRARY_NATIVE_ICON_FALLBACK } from "./icon-fallback";

describe("resolveIconFallbackGlyph", () => {
  it("uses configured fallback when provided", () => {
    expect(resolveIconFallbackGlyph("lucide", "alert-circle")).toBe("alert-circle");
  });

  it("uses library-native default when config omits fallback", () => {
    expect(resolveIconFallbackGlyph("lucide")).toBe(LIBRARY_NATIVE_ICON_FALLBACK.lucide);
    expect(resolveIconFallbackGlyph("material-symbols")).toBe("help");
  });

  it("ignores blank configured fallback", () => {
    expect(resolveIconFallbackGlyph("phosphor", "   ")).toBe(LIBRARY_NATIVE_ICON_FALLBACK.phosphor);
  });
});
