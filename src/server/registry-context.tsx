/**
 * Registry context for SSR class collection (industry standard)
 * Used by IUIRegistry (Server Component) so children can register class names
 * during render. No "use client" – runs in Server Component tree.
 */

import { createContext, useContext } from "react";
import type { SSRRegistry } from "./ssr-extraction";

export const IUIRegistryContext = createContext<SSRRegistry | null>(null);

export function useIUIRegistry(): SSRRegistry | null {
  return useContext(IUIRegistryContext);
}

/** Optional: register class names from a component (e.g. IUIBox) during server render */
export function useIUIRegisterClassNames(classNames: string | undefined): void {
  const registry = useIUIRegistry();
  if (registry && classNames) {
    registry.add(classNames);
  }
}
