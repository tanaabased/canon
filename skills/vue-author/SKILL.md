---
name: tanaab-vue-author
description: Tanaab-based authoring and standardization of Vue 3 single-file components. Use when a user wants to create or update Vue components, SFC structure, composition API flows, or Vue-specific frontend implementation in a Tanaab-managed repo.
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

Tanaab-based authoring and standardization of Vue 3 single-file components. Use when a user wants to create or update Vue components, SFC structure, composition API flows, or Vue-specific frontend implementation in a Tanaab-managed repo.

- Keep this skill centered on creating and refining Vue components.
- Keep this skill on Vue component and SFC implementation surfaces.
- Let `tanaab-vitepress-author` own VitePress site implementation, even when that site includes Vue under the hood.

## When to Use

- Build or update Vue 3 components, SFC structure, or composition API flows.
- Shape Vue-specific frontend implementation such as local component state flow, props, emits, slots, or component-level styling.
- Standardize a frontend repo around Vue 3 when the main owned surface is still component implementation rather than VitePress site work or general JS runtime plumbing.
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
- When a component supports a VitePress or docs-site Markdown page, apply the shared front-end Markdown page rules before normalizing a docs-only component.
- Only introduce new HTML structure or new styling when there is no obvious existing site-level choice to reuse.
- Keep component styling as bare as possible and avoid inventing a parallel visual system inside the SFC.

## Change Strategy

- Use [../../references/front-end-preferences.md](../../references/front-end-preferences.md) for Vue 3, SCSS, and subtheme defaults.
- Use [../../references/front-end-markdown-pages.md](../../references/front-end-markdown-pages.md) when the component is embedded in or exists primarily to support a docs-site Markdown page.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for the broader frontend stack defaults.
- Keep component implementation, layout, and styling changes near the owning Vue surface rather than widening into docs policy or generic runtime standardization.
- Start from a small SFC shell rather than inventing the block structure case by case.
- When the component is part of a VitePress site, inspect the local site components and existing theme styles before adding new markup or SCSS.
- If the desired element has no obvious site-wide styling treatment, keep the component bare and call out the gap explicitly instead of hiding it behind one-off styling.

## Workflow

1. Confirm the request is Vue-component-led rather than VitePress-, docs-policy-, or generic-JS-led.
2. Load only the relevant Vue files plus the shared frontend canon needed for this component surface.
3. Inspect project-local component and docs examples before using bundled fallback examples.
4. When the component supports a docs-site Markdown page, use the shared Markdown page reference to decide whether the real need is a shared primitive.
5. When adding a Vue component docs page inside a VitePress component docs surface, update the component index, sidebar, or equivalent navigation so the page is reachable.
6. Validate the touched Vue surface with the narrowest reliable repo-native checks.

### Project-Local Examples First

- Prefer existing target-project components, component docs pages, demo wrappers, global registration patterns, and theme styles over bundled examples.
- When local component docs demos expose generated code, preserve local source-link and slot-control conventions rather than replacing them with fallback shapes.
- Use [./references/component-documentation-examples.md](./references/component-documentation-examples.md) only when the project does not already have usable local examples.
- In `@tanaabased/theme`, treat `TMSComponentDocDemo.vue`, `TMSLogo.vue`, and `tms-logo.md` as the local source patterns for component implementation and docs pages.

### Component Shape

- Default to Vue single-file components with blocks in this order: `<template>`, `<script setup>`, `<style scoped lang="scss">`.
- Keep the first block declarative and HTML-led. Reach for render functions or JSX only when the repo already uses them or the task clearly requires them.
- Use `<script setup>` for component logic by default. Keep props, emits, computed state, and local helpers there.
- Put styling in the final block and write it in SCSS whenever a style block exists.
- Prefer `scoped` styles for component-owned styling unless the repo or task clearly requires a shared or global surface.
- In a larger VitePress site, prefer existing site components or already-styled semantic elements before introducing new wrapper markup.
- Keep templates as lean as possible. Do not add extra containers, classes, or presentational hooks unless they materially serve the component.

### SCSS and Templating

- Treat SCSS as a thin adaptation layer, not a place to recreate site-wide styling from scratch.
- Reuse existing class hooks, CSS variables, tokens, and component conventions before creating new selectors.
- Prefer light layout or state-specific rules over fully bespoke visual treatments.
- If an element appears unstyled because the site lacks a shared treatment for it, note that gap in your response so the site-level pattern can be added deliberately later.

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

- [./references/component-documentation-examples.md](./references/component-documentation-examples.md): fallback component, component-doc-demo, and Markdown docs examples for projects without local precedents
- [../../references/front-end-preferences.md](../../references/front-end-preferences.md): shared Vue 3, SCSS, and subtheme defaults
- [../../references/front-end-markdown-pages.md](../../references/front-end-markdown-pages.md): shared rules for docs-site Markdown page UI and embedded component boundaries
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared frontend stack defaults

## Validation

- Confirm the task stayed on the Vue 3 component surface rather than drifting into VitePress or docs-policy work.
- Confirm Vue 3 remained the frontend framework unless the repo or user explicitly requires another path.
- Confirm project-local examples were preferred before using bundled fallback examples.
- Confirm docs-site Markdown page component work followed the shared Markdown page reference before creating bespoke docs-only components.
- Confirm missing shared patterns were called out explicitly instead of being silently invented locally.
- Confirm component docs demos cover meaningful slots as well as props when slots are part of the public API.
- Confirm generated code examples include an adjacent source-file link when the project has a stable source path or URL.
- Confirm new Vue component docs pages in VitePress component docs surfaces update the component index, sidebar, or equivalent navigation.
- Confirm the SFC block order stayed `template` then `script setup` then `style`.
- Confirm SCSS remains the styling default when a preprocessor is in play.
- Confirm direct validation stays on build- and lint-first component checks rather than drifting into a separate frontend test doctrine.
- Confirm any GitHub Actions workflow example remains a Vue validation path rather than a general workflow-topology pattern.
- Run the narrowest relevant lint, test, build, or smoke checks for the touched Vue surface.
