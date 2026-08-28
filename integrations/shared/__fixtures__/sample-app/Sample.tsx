import React from "react";
import { cn } from "@inventive-ui/framework";

export function SampleCard() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-primary-500 text-white">
      <span className={cn("text-sm", "font-medium")}>Hello IUI</span>
      <button className="px-4 py-2 hover:bg-primary-600 w-[120px]">Action</button>
    </div>
  );
}
