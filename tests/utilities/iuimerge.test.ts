/**
 * @jest-environment node
 */
import { cn, iuimerge } from "../../src/utilities/class-utilities";

describe("iuimerge / cn conflict resolution", () => {
  const lastWins: Array<[string, string]> = [
    ["w-full", "w-[20%]"],
    ["h-full", "h-200"],
    ["h-full", "h-[50%]"],
    ["w-full", "w-123"],
    ["w-full", "w-(--x)"],
    ["p-4", "p-[13px]"],
    ["p-4", "p-17"],
    ["m-4", "m-[2rem]"],
    ["gap-4", "gap-[10px]"],
    ["px-4", "px-[8px]"],
    ["text-sm", "text-[18px]"],
    ["text-base", "text-17"],
    ["text-blue-500", "text-[#fff]"],
    ["leading-tight", "leading-[1.7]"],
    ["tracking-wide", "tracking-[0.05em]"],
    ["font-bold", "font-[600]"],
    ["bg-red-500", "bg-[#abc]"],
    ["border-gray-200", "border-[#000]"],
    ["border", "border-[3px]"],
    ["border-2", "border-[5px]"],
    ["rounded-md", "rounded-[12px]"],
    ["opacity-50", "opacity-[0.33]"],
    ["shadow-md", "shadow-[0_1px_2px_#000]"],
    ["z-10", "z-[999]"],
    ["top-0", "top-[12px]"],
    ["inset-0", "inset-[8px]"],
    ["scale-100", "scale-[1.05]"],
    ["rotate-45", "rotate-[17deg]"],
    ["translate-x-4", "translate-x-[10px]"],
    ["basis-full", "basis-[200px]"],
    ["basis-4", "basis-17"],
    ["outline", "outline-2"],
    ["grow", "grow-[2]"],
    ["col-span-2", "col-span-[7]"],
    ["max-w-md", "max-w-[720px]"],
    ["min-h-0", "min-h-[40vh]"],
    ["outline-1", "outline-[3px]"],
    ["ring-2", "ring-[5px]"],
    ["blur-sm", "blur-[4px]"],
    ["brightness-100", "brightness-[1.2]"],
    ["dark:bg-red-500", "dark:bg-[#111]"],
    ["hover:p-4", "hover:p-[20px]"],
  ];

  it.each(lastWins)("keeps later utility: %s + %s", (earlier, later) => {
    const merged = cn(earlier, later);
    const parts = merged.split(/\s+/);
    expect(parts).toContain(later);
    expect(parts).not.toContain(earlier);
  });

  it("preserves underscores in arbitrary class names (HTML-safe)", () => {
    expect(iuimerge("shadow-md", "shadow-[0_1px_2px_#000]")).toBe(
      "shadow-[0_1px_2px_#000]",
    );
  });

  it("does not conflict across different variant contexts", () => {
    expect(cn("p-4", "hover:p-[20px]")).toBe("p-4 hover:p-[20px]");
  });

  it("keeps gradient color and position stops together (Tailwind from-/to- behavior)", () => {
    expect(cn("from-pink-400", "from-40%", "to-fuchsia-700")).toBe(
      "from-pink-400 from-40% to-fuchsia-700",
    );
    expect(cn("from-pink-400", "from-blue-500")).toBe("from-blue-500");
    expect(cn("from-40%", "from-50%")).toBe("from-50%");
  });

  it("TBSE corner aliases conflict with logical corners (rounded-be ≡ rounded-ee)", () => {
    expect(cn("rounded-be-sm", "rounded-ee-xs")).toBe("rounded-ee-xs");
    expect(cn("rounded-ts-md", "rounded-ss-lg")).toBe("rounded-ss-lg");
  });
});
