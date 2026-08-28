import {
  composeSemantic,
  getComposerDispatchMode,
  setComposerDispatchMode,
} from "../core/composer";
import { CANONICAL_MATRIX } from "../fixtures/canonical-matrix";
import allowlist from "../fixtures/split-path-divergence-allowlist.json";

const keyOf = (entry: (typeof CANONICAL_MATRIX)[number]) => {
  const req = entry.request;
  const emitKey = req.emit?.adaptive
    ? "adaptive"
    : `scheme-${req.emit?.scheme ?? "light"}`;
  return [
    req.pattern,
    req.variant,
    req.appearance,
    req.state,
    req.channel,
    req.palette,
    emitKey,
  ].join("|");
};

const expectsPathEquivalence = (entry: (typeof CANONICAL_MATRIX)[number]): boolean => {
  const channel = entry.request.channel ?? "full";
  if (entry.request.pattern === "interactive" && channel !== "full") {
    return false;
  }
  return true;
};

describe("split-path equivalence", () => {
  afterEach(() => {
    setComposerDispatchMode("composer-only");
  });

  it("composer-only matches legacy-generic where paths should remain equivalent", () => {
    const allowed = new Set(allowlist.allowlist);
    const divergences: string[] = [];

    setComposerDispatchMode("composer-only");
    for (const entry of CANONICAL_MATRIX) {
      if (!expectsPathEquivalence(entry)) continue;

      const key = keyOf(entry);
      if (allowed.has(key)) continue;

      const composerOnly = composeSemantic(entry.request);

      setComposerDispatchMode("legacy-generic-only");
      const legacy = composeSemantic(entry.request);
      setComposerDispatchMode("composer-only");

      if (composerOnly !== legacy) {
        divergences.push(key);
      }
    }

    expect(divergences).toEqual([]);
  });

  it("defaults to composer-only dispatch mode", () => {
    expect(getComposerDispatchMode()).toBe("composer-only");
  });
});
