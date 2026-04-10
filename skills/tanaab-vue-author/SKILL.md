---
name: tanaab-vue-author
description: Tanaab-based authoring and standardization of Vue 3 frontend surfaces. Use when a user wants to build or update Vue components, SFC structure, composition API flows, or Vue-specific frontend implementation in a Tanaab-managed repo.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - vue
---

# Vue Author

## Overview

Tanaab-based authoring and standardization of Vue 3 frontend surfaces. Use when a user wants to build or update Vue components, SFC structure, composition API flows, or Vue-specific frontend implementation in a Tanaab-managed repo.

## When to Use

- Build or update Vue 3 components, SFC structure, or composition API flows.
- Shape Vue-specific frontend implementation such as local component state flow, props, emits, slots, or component-level styling.
- Standardize a frontend repo around Vue 3 when the main owned surface is still component implementation rather than docs-site or general JS runtime plumbing.
- Apply shared frontend defaults such as Vue-first and SCSS-first only when the request is actually frontend-led.

## When Not to Use

- Do not use this skill for VitePress docs or static-site implementation; that is a separate surface.
- Do not use this skill for docs-surface selection or README-vs-docs-site decisions.
- Do not use this skill for generic JS runtime or package plumbing unless Vue components remain the primary owned surface.
- Do not choose raw CSS, Less, or Stylus by default when SCSS clearly fits the frontend surface.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.
- Prefer Vue 3 and SCSS defaults unless the repo or user explicitly requires another stack.

## Change Strategy

- Use [../../references/front-end-preferences.md](../../references/front-end-preferences.md) for Vue 3, SCSS, and subtheme defaults.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for the broader frontend stack defaults.
- Keep component implementation, layout, and styling changes near the owning Vue surface rather than widening into docs policy or generic runtime standardization.

## Workflow

1. Confirm the request is Vue-component-led rather than VitePress-, docs-policy-, or generic-JS-led.
2. Load only the relevant Vue files plus the shared frontend canon needed for this component surface.
3. Keep the change focused on component behavior, SFC structure, and local styling.
4. Validate the touched Vue surface with the narrowest reliable repo-native checks.

## Testing

- Use build- and lint-first validation for the owned Vue component surface until a shared frontend test framework is standardized.
- Keep the direct validation path on the Vue implementation surface rather than inventing a separate test-tool doctrine here.
- Treat repo-native `build` and `lint` commands as the canonical direct-test mechanism when they exist.

Minimal generic example:

```bash
bun run lint
bun run build
```

## GitHub Actions Workflow

- Use a PR build or lint workflow that installs Bun dependencies and validates the touched Vue surface with the repo's build- and lint-first commands.
- Keep the workflow generic and centered on the same direct validation path rather than expanding into broader CI topology.
- Treat this as validation of the Vue component surface, not as ownership of workflow authoring.

Minimal generic example:

```yaml
name: Frontend Checks

on:
  pull_request:

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - run: bun install --frozen-lockfile --ignore-scripts
      - run: bun run lint
      - run: bun run build
```

## Bundled Resources

- [../../references/front-end-preferences.md](../../references/front-end-preferences.md): shared Vue 3, SCSS, and subtheme defaults
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared frontend stack defaults

## Validation

- Confirm the task stayed on the Vue 3 component surface rather than drifting into VitePress or docs-policy work.
- Confirm Vue 3 remained the frontend framework unless the repo or user explicitly requires another path.
- Confirm SCSS remains the styling default when a preprocessor is in play.
- Confirm direct validation stays on build- and lint-first component checks rather than drifting into a separate frontend test doctrine.
- Confirm any GitHub Actions workflow example remains a Vue validation path rather than a general workflow-topology pattern.
- Run the narrowest relevant lint, test, build, or smoke checks for the touched Vue surface.
