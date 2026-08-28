import type { IUIConfig } from "./config";

export type BootstrapState = {
  frameworkConfig: IUIConfig;
  componentConfig?: unknown;
};

let bootstrapState: BootstrapState | null = null;

/**
 * Register resolved project configuration produced by CLI-generated bootstrap.
 * Standard-path apps import the generated module before rendering IUIProvider.
 */
export function registerBootstrapState(state: BootstrapState): void {
  bootstrapState = state;
}

/** Framework config resolved by generated bootstrap (standard path). */
export function getBootstrapFrameworkConfig(): IUIConfig | null {
  return bootstrapState?.frameworkConfig ?? null;
}

/** Component config resolved by generated bootstrap (standard path). */
export function getBootstrapComponentConfig(): unknown {
  return bootstrapState?.componentConfig;
}

/** @internal Test helper */
export function __resetBootstrapStateForTests(): void {
  bootstrapState = null;
}
