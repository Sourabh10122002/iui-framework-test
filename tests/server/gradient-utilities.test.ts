/**
 * @jest-environment node
 */
import type { IUIConfig } from "../../src/core/config";
import { generateBuildCSS } from "../../src/server/ssr-extraction";

import { withTestAccentPalette } from "../helpers/test-accent-palette";

const baseConfig = withTestAccentPalette({
  theme: {
    direction: "ltr",
    typography: { provider: "system", set: "inter" },
    radius: { set: "md" },
    spacing: { set: "standard" },
  },
} as IUIConfig);

function expectAllBuilt(
  classes: string[],
  config: IUIConfig = baseConfig,
): ReturnType<typeof generateBuildCSS> {
  const result = generateBuildCSS(classes, config);
  const uncovered = classes.filter((c) => !result.builtClasses.includes(c));
  expect(uncovered).toEqual([]);
  return result;
}

describe("radial and conic gradient utilities", () => {
  it("generates bg-radial with from/to color stops and percentage positions", () => {
    const result = expectAllBuilt([
      "bg-radial",
      "from-pink-400",
      "from-40%",
      "to-fuchsia-700",
    ]);

    expect(result.combinedCSS).toMatch(/radial-gradient/);
    expect(result.combinedCSS).toContain("--iui-gradient-from-position");
    expect(result.combinedCSS).toContain("40%");
    expect(result.combinedCSS).toContain("--iui-gradient-stops");
  });

  it("generates bg-conic with angle utility", () => {
    const result = expectAllBuilt([
      "bg-conic-180",
      "from-blue-600",
      "to-sky-400",
      "to-50%",
    ]);

    expect(result.combinedCSS).toMatch(/conic-gradient\(from 180deg/);
    expect(result.combinedCSS).toContain("--iui-gradient-to-position");
    expect(result.combinedCSS).toContain("50%");
  });

  it("generates arbitrary bg-radial position with logical start/end mapping", () => {
    const result = expectAllBuilt([
      "bg-radial-[at_top_start]",
      "from-white",
      "to-zinc-900",
      "to-75%",
    ]);

    expect(result.combinedCSS).toMatch(
      /radial-gradient\(at top left, var\(--iui-gradient-stops\)\)/,
    );
  });

  it("generates arbitrary bg-conic starting angle", () => {
    const result = expectAllBuilt([
      "bg-conic-[from_180deg]",
      "from-red-600",
      "to-red-600",
    ]);

    expect(result.combinedCSS).toMatch(
      /conic-gradient\(from 180deg, var\(--iui-gradient-stops\)\)/,
    );
  });

  it("generates full arbitrary radial-gradient via bg-[…]", () => {
    const cls = "bg-[radial-gradient(circle_at_50%_75%,#fff,#000)]";
    const result = expectAllBuilt([cls]);

    expect(result.combinedCSS).toMatch(/background-image/i);
    expect(result.combinedCSS).toContain(
      "radial-gradient(circle at 50% 75%,#fff,#000)",
    );
  });

  it("preserves existing linear gradient utilities with s/e directions", () => {
    const result = expectAllBuilt([
      "bg-gradient-to-e",
      "from-blue-500",
      "to-pink-500",
    ]);

    expect(result.combinedCSS).toMatch(
      /linear-gradient\(to right, var\(--iui-gradient-stops\)\)/,
    );
  });

  it("generates arbitrary from-[percentage] stop position", () => {
    const result = expectAllBuilt([
      "bg-radial",
      "from-[40%]",
      "from-pink-400",
      "to-fuchsia-700",
    ]);

    expect(result.combinedCSS).toContain("--iui-gradient-from-position: 40%");
  });
});

describe("Tailwind-aligned gradient categories", () => {
  const linearDirections = [
    ["bg-gradient-to-t", "to top"],
    ["bg-gradient-to-b", "to bottom"],
    ["bg-gradient-to-s", "to left"],
    ["bg-gradient-to-e", "to right"],
    ["bg-gradient-to-ts", "to top left"],
    ["bg-gradient-to-te", "to top right"],
    ["bg-gradient-to-bs", "to bottom left"],
    ["bg-gradient-to-be", "to bottom right"],
  ] as const;

  it.each(linearDirections)(
    "linear %s maps to %s",
    (utility, direction) => {
      const result = expectAllBuilt([utility, "from-red-500", "to-blue-500"]);
      expect(result.combinedCSS).toContain(
        `linear-gradient(${direction}, var(--iui-gradient-stops))`,
      );
    },
  );

  it("supports bg-none", () => {
    const result = expectAllBuilt(["bg-none"]);
    expect(result.combinedCSS).toContain("background-image: none");
  });

  it("supports bg-conic base utility", () => {
    const result = expectAllBuilt([
      "bg-conic",
      "from-blue-600",
      "to-sky-400",
    ]);
    expect(result.combinedCSS).toContain(
      "conic-gradient(var(--iui-gradient-stops))",
    );
  });

  it("supports via color and via percentage stops on radial gradients", () => {
    const result = expectAllBuilt([
      "bg-radial",
      "from-pink-400",
      "from-10%",
      "via-fuchsia-500",
      "via-50%",
      "to-indigo-900",
      "to-90%",
    ]);

    expect(result.combinedCSS).toContain("--iui-gradient-via-position");
    expect(result.combinedCSS).toContain("--iui-gradient-stops");
    expect(result.combinedCSS).toMatch(
      /var\(--iui-gradient-from\) var\(--iui-gradient-from-position, 0%\)/,
    );
    expect(result.combinedCSS).toMatch(
      /var\(--iui-gradient-via\) var\(--iui-gradient-via-position, 50%\)/,
    );
    expect(result.combinedCSS).toMatch(
      /var\(--iui-gradient-to, rgb\(0 0 0 \/ 0\)\) var\(--iui-gradient-to-position, 100%\)/,
    );
  });

  it("supports arbitrary conic and linear gradients via bg-[…]", () => {
    const conic = "bg-[conic-gradient(from_180deg,red,blue)]";
    const linear = "bg-[linear-gradient(to_right,red,blue)]";
    const result = expectAllBuilt([conic, linear]);

    expect(result.combinedCSS).toContain(
      "conic-gradient(from 180deg,red,blue)",
    );
    expect(result.combinedCSS).toContain("linear-gradient(to right,red,blue)");
  });

  it("supports arbitrary color stops on linear gradients", () => {
    const result = expectAllBuilt([
      "bg-gradient-to-e",
      "from-[#ff0000]",
      "to-[#0000ff]",
    ]);

    expect(result.combinedCSS).toContain("--iui-gradient-from: #ff0000");
    expect(result.combinedCSS).toContain("--iui-gradient-to: #0000ff");
  });

  it("supports opacity modifiers on gradient color stops", () => {
    const result = expectAllBuilt([
      "bg-radial",
      "from-black/60",
      "to-white/30",
    ]);

    expect(result.combinedCSS).toMatch(/--iui-gradient-from:/);
    expect(result.combinedCSS).toMatch(/--iui-gradient-to:/);
    expect(result.combinedCSS).toMatch(/\/ 0\.6|color-mix|rgb\(/i);
  });

  it("supports bg-radial arbitrary percentage position", () => {
    const result = expectAllBuilt([
      "bg-radial-[at_50%_75%]",
      "from-sky-200",
      "to-indigo-900",
    ]);

    expect(result.combinedCSS).toMatch(
      /radial-gradient\(at 50% 75%, var\(--iui-gradient-stops\)\)/,
    );
  });
});
