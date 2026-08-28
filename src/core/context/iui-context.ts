import { createContext, useContext } from "react";
import type { IUIConfig } from "../config";


export interface IUIContextValue {
  componentConfig?: any;
  config?: IUIConfig | null;

}

export const IUIContext = createContext<IUIContextValue | null>(null);

export const useIUIContext = (): IUIContextValue | null => {
  const context = useContext(IUIContext);
  if (!context) {
    // Graceful fallback when no provider
    return {
      componentConfig: undefined,
      config: undefined,

    };
  }
  return context;
};
