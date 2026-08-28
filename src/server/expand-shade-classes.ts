import { compose, stack } from "../utilities/shade/api";
import { SEMANTIC_MATRIX } from "../utilities/shade/fixtures/matrix";
import type { IUIConfig } from "../core/config";
import { getConfigPalettes } from "./get-config-palettes";

function addTokens(classString: string, target: Set<string>): void {
  classString
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((token) => target.add(token));
}

export function expandShadeClasses(config?: IUIConfig): Set<string> {
  const classes = new Set<string>();
  const palettes = getConfigPalettes(config);

  SEMANTIC_MATRIX.forEach((item) => {
    palettes.forEach((palette) => {
      const request = {
        pattern: item.pattern,
        variant: item.variant,
        appearance: item.appearance,
        state: item.state,
        channel: item.channel,
        palette,
        emit: { adaptive: item.adaptive },
      } as const;

      try {
        addTokens(compose(request), classes);
        if (item.channel === "full" && item.state === "default") {
          addTokens(stack(request), classes);
        }
      } catch {
        // Ignore invalid combinations; matrix already filters most of them.
      }
    });
  });

  return classes;
}
