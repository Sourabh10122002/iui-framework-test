# Semantic Shade Vocabulary

Frozen semantic vocabulary for the centralized shade engine.

## Nouns

- `pattern`
- `variant`
- `appearance`
- `state`
- `channel`
- `palette`
- `paletteClass` (derived)
- `emit`

## Verbs

- `compose`
- `stack`
- `slice`
- `channel`

## Ownership invariants

- Token authority: `core/canonical-resolver.ts` (`resolveCanonicalTokens`)
- Composed token tables: `core/interactive-recipe.ts` (interactive + surface full-stack)
- Channel-isolated tables: `core/appearance-profile.ts`, `core/state-progression.ts`
- Literal channel-isolated tables: `core/literal-transform.ts`
- Topology owner: `core/variant-topology.ts`
- Palette-class owner: `core/palette-classify.ts`
- Composition orchestrator: `core/composer.ts`

## Component import rule

- Components must consume shade through `utilities/shade/api` (or the public `shade` facade).
- Direct imports from `utilities/shade/core/*` are reserved for internal shade modules and tests.

## Forbidden in centralized core

- Component names
- Component-shaped roles
- Literal chromatic indexing (`white-500`, `black-700`)
- Duplicate ownership across modules
