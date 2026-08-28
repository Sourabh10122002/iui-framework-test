import { composeSemantic } from "../core/composer";
import { CANONICAL_MATRIX } from "../fixtures/canonical-matrix";

type GoldenRow = {
  key: string;
  classes: string;
};

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

describe("canonical matrix golden", () => {
  it("matches canonical semantic class output baseline", () => {
    const rows: GoldenRow[] = CANONICAL_MATRIX.map((entry) => ({
      key: keyOf(entry),
      classes: composeSemantic(entry.request),
    }));

    expect(rows).toMatchSnapshot();
  });
});

