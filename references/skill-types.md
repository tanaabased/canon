# Skill Types

Use skill types to shape scaffolding and validation, not runtime routing.

## Current Types

Valid v1 types are:

- `generic`
- `coding`
- `integration`
- `workflow`
- `meta`

## Type Definitions

### `generic`

Fallback type for cases where no narrower typed overlay clearly fits.

- Keep `generic` available as an escape hatch.
- Do not default to `generic` when a specific type clearly fits.
- Uses only the shared base template with no extra type sections.

Section order:

1. `# <Display Name>`
2. `## Overview`
3. `## When to Use`
4. `## When Not to Use`
5. `## Workflow`
6. `## Bundled Resources`
7. `## Validation`

### `coding`

For skills that modify, generate, refactor, debug, or explain code.

- Bias toward minimal diffs, preserving style, and explicit validation.

Section order:

1. `# <Display Name>`
2. `## Overview`
3. `## When to Use`
4. `## When Not to Use`
5. `## Constraints`
6. `## Change Strategy`
7. `## Workflow`
8. `## Bundled Resources`
9. `## Validation`

### `integration`

For skills that operate against external tools, APIs, SaaS systems, MCP servers, CLIs, or service workflows.

- Bias toward prerequisites, setup, inputs/outputs, and failure handling.
- `Inputs` and `Outputs` are default sections for this type only.

Section order:

1. `# <Display Name>`
2. `## Overview`
3. `## When to Use`
4. `## When Not to Use`
5. `## Prerequisites`
6. `## Inputs`
7. `## Outputs`
8. `## Failure Handling`
9. `## Workflow`
10. `## Bundled Resources`
11. `## Validation`

### `workflow`

For repeatable operational processes that may span tools but are not primarily coding or integration implementation.

- Bias toward preconditions, explicit sequence, checkpoints, and completion criteria.

Section order:

1. `# <Display Name>`
2. `## Overview`
3. `## When to Use`
4. `## When Not to Use`
5. `## Preconditions`
6. `## Workflow`
7. `## Checkpoints`
8. `## Completion Criteria`
9. `## Bundled Resources`
10. `## Validation`

### `meta`

For skills that create, refine, validate, package, or audit other skills, prompts, templates, or conventions.

- Bias toward structure, consistency, and evaluation.

Section order:

1. `# <Display Name>`
2. `## Overview`
3. `## When to Use`
4. `## When Not to Use`
5. `## Evaluation Criteria`
6. `## Anti-Patterns`
7. `## Iteration Loop`
8. `## Workflow`
9. `## Bundled Resources`
10. `## Validation`

## Template Model

- Start every skill from [`../templates/skill-generic-skill.md`](../templates/skill-generic-skill.md).
- For non-`generic` types, inject the matching type section partial set defined in [`./skill-types.json`](./skill-types.json). Some types may use both pre- and post-workflow partials.
- Keep `owner` separate from `type`.
- Human-readable type guidance lives here; the machine-readable companion is [`./skill-types.json`](./skill-types.json).
- Repo helpers should load type data through `scripts/skill-types-lib.js`, not through ad hoc in-script object registries.

## Future Types

Future candidates such as `testing` or `document` should be added only after repeated real use shows they deserve their own section shape.

When adding a new type:

1. add it to the machine-readable registry in [`./skill-types.json`](./skill-types.json)
2. document it here
3. add the needed type section partial or partials
4. update `scripts/skill-types-lib.js`, validation, and smoke checks if helper behavior needs to change
