---
name: tanaab-vue-author
description: Tanaab-based authoring, component testing, documentation, and npm packaging of Vue 3 components. Use when creating or updating Vue SFCs, their public behavior tests, interactive examples, or publishable component libraries.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - vue
  openclaw:
    emoji: '💚'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/vue-author
---

# Vue Author

## Overview

Tanaab-based authoring, component testing, documentation, and npm packaging of Vue 3 components. Use when creating or updating Vue SFCs, their public behavior tests, interactive examples, or publishable component libraries.

- Keep this skill on Vue components, their tests, documentation examples, and library exports.
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

- Prefer Vue 3 and SCSS defaults unless the repo or user explicitly requires another stack.
- When a component supports a VitePress or docs-site Markdown page, apply the shared VitePress Markdown page rules before normalizing a docs-only component.
- Only introduce new HTML structure or new styling when there is no obvious existing site-level choice to reuse.
- Keep component styling as bare as possible and avoid inventing a parallel visual system inside the SFC.

## Change Strategy

- Use [../../references/front-end-preferences.md](../../references/front-end-preferences.md) for Vue 3, SCSS, and subtheme defaults.
- Use [../../references/vitepress-markdown-pages.md](../../references/vitepress-markdown-pages.md) when the component is embedded in or exists primarily to support a VitePress or docs-site Markdown page.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for the broader frontend stack defaults.
- Keep component implementation, layout, and styling changes near the owning Vue surface rather than widening into docs policy or generic runtime standardization.
- Start from a small SFC shell rather than inventing the block structure case by case.
- When the component is part of a VitePress site, inspect the local site components and existing theme styles before adding new markup or SCSS.
- If the desired element has no obvious site-wide styling treatment, keep the component bare and call out the gap explicitly instead of hiding it behind one-off styling.
- When lifting lessons from a target project into canon, keep reusable structure, API shape, documentation sections, playground contracts, source-link hooks, and generated-code behavior; generalize project names, class names, paths, copy, and demo content.
- Do not copy theme-specific color, spacing, typography, focus, utility-class, control-labeling, placeholder, or brand-token choices into bundled fallback guidance.

## Preferred Tools

- **[Vitest](https://vitest.dev/) and [Vue Test Utils 2.x](https://test-utils.vuejs.org/):** Prefer a Vitest release compatible with the project's Vite toolchain, with jsdom for component behavior in Vite projects, following [Vue's testing guidance](https://vuejs.org/guide/scaling-up/testing). Preserve an effective existing suite.
- **[@tanaab/component-playground](https://github.com/tanaabased/component-playground/tree/main):** Prefer this project for interactive component documentation, live previews, and generated usage examples. Reuse stronger project-local patterns; do not vendor a second playground into Canon. The [docs example](./templates/example-component.md) uses the released root and stylesheet exports. Adopt framework adapters only when the selected package version exports them.

## Workflow

When authoring issue-backed commits, apply the shared [commit-subject convention](../../references/commit-subjects.md).

1. Confirm the request is Vue-component-led rather than VitePress-, docs-policy-, or generic-JS-led.
2. Load only the relevant Vue files plus the shared frontend canon needed for this component surface.
3. Inspect project-local component and docs examples, review [Preferred Tools](#preferred-tools), and adapt bundled examples only for missing patterns.
4. When the component supports a docs-site Markdown page, use the shared Markdown page reference to decide whether the real need is a shared primitive.
5. When adding a Vue component docs page inside a VitePress component docs surface, update the component index, sidebar, or equivalent navigation so the page is reachable.
6. Validate the touched Vue surface with the narrowest reliable repo-native checks.

### Component Shape

- Default to Vue single-file components with blocks in this order: `<template>`, `<script setup>`, `<style scoped lang="scss">`.
- Keep the first block declarative and HTML-led. Reach for render functions or JSX only when the repo already uses them or the task clearly requires them.
- Use `<script setup>` for component logic by default. Keep props, emits, computed state, and local helpers there.
- When the repo uses TypeScript, preserve or adopt `<script setup lang="ts">`, use typed props and emits, and mark type-only dependencies with `import type`; do not migrate unrelated components solely for consistency.
- Put styling in the final block and write it in SCSS whenever a style block exists.
- Prefer `scoped` styles for component-owned styling unless the repo or task clearly requires a shared or global surface.
- In a larger VitePress site, prefer existing site components or already-styled semantic elements before introducing new wrapper markup.
- Keep templates as lean as possible. Do not add extra containers, classes, or presentational hooks unless they materially serve the component.

### Accessibility

- Prefer native semantic HTML and built-in control behavior before adding ARIA.
- Add ARIA only when native semantics do not fully express the component state, relationship, or accessible name.
- Keep ARIA state synchronized with Vue state instead of using static decoration; common examples include `aria-expanded`, `aria-selected`, `aria-current`, `aria-invalid`, `aria-controls`, `aria-describedby`, and `aria-labelledby`.
- Provide real labels or accessible names for form controls, icon-only buttons, media controls, and interactive regions.
- When a component creates custom interactive controls, provide keyboard-equivalent behavior and avoid replacing native controls without a clear need.
- Preserve visible focus states and logical DOM and focus order when adding interactive markup.

### SCSS and Templating

- Treat SCSS as a thin adaptation layer, not a place to recreate site-wide styling from scratch.
- Reuse existing class hooks, CSS variables, tokens, and component conventions before creating new selectors.
- Prefer light layout or state-specific rules over fully bespoke visual treatments.
- If an element appears unstyled because the site lacks a shared treatment for it, note that gap in your response so the site-level pattern can be added deliberately later.

## Documentation

- Apply the [documentation change gate](../../references/documentation-standards.md#documentation-change-gate) before selecting documentation work.
- Prefer existing target-project components, component docs pages, playgrounds, global registration patterns, and theme styles over bundled examples.
- Document component APIs through props, meaningful public slots, boolean and enum states, a top Usage playground, generated code examples, and source links when the project has stable source paths or URLs.
- Prefer component docs pages shaped as H1 and intro copy, `<script setup>` schema, `## Usage` playground, then API sections such as Props, Slots, Variables, and focused notes.
- Use `html` fences or highlighting for component usage snippets and generated template code; reserve `vue` for full Vue single-file component examples.
- Use [./references/component-documentation-examples.md](./references/component-documentation-examples.md) and its linked fallback templates only when the project does not already have usable local examples.
- When documenting a Vue component in a VitePress surface, follow [../../references/vitepress-markdown-pages.md](../../references/vitepress-markdown-pages.md) for global-component reuse, page-local glue limits, and page reachability.
- Treat bundled examples as generic fallbacks. In target projects, follow stronger local component, playground, docs-page, and registration patterns without copying their visual doctrine into canon.

## Testing

- Use Vitest, Vue Test Utils, and jsdom for observable DOM behavior, props, slots, emitted events, and user actions. Assert the public contract rather than private methods or broad snapshots.
- Await Vue updates and interactions. Unmount wrappers, remove test-owned DOM/teleports, and restore mocks and timers when used. Add browser API shims only for APIs the component actually calls; jsdom cannot establish layout, focus rendering, or real-browser behavior.
- Keep pure-helper Mocha tests when they already work. If both runners exist, give them disjoint discovery patterns, such as Mocha `test/*.spec.js` and Vitest `test/*.test.js`.
- Run Vitest under Node when its Vite toolchain requires native Node behavior; keep Bun for dependency installation and orchestration. A minimal script is `"test:components": "node ./node_modules/vitest/vitest.mjs run"`.
- Copy the [Vitest config](./templates/vitest.config.js) to the repo root and [component test](./templates/example-component.test.js) to `test/`, adapting its component import. Declare `vitest`, `@vue/test-utils`, `jsdom`, `vite`, `@vitejs/plugin-vue`, and the component's preprocessor (such as `sass`) in development dependencies alongside Vue.
- Keep existing lint and production builds. Add browser checks only for a consequential contract that component tests or builds cannot cover.

## Deployment

- For npm component libraries, use Vite library mode, externalize Vue, and declare it as a peer dependency. Export only promised module formats and public entrypoints, including the generated stylesheet when present.
- Keep framework adapters in separate exports with optional framework peers so ordinary Vue consumers do not load VitePress or another host accidentally.
- Separate `build:package` from `build:docs`. Use [JavaScript Author](../javascript-author/SKILL.md#deployment) for npm publication and the [package example](./references/component-package-example.md) for a minimal consumer check against the prepared tarball.

## GitHub Actions

- Use [Repo Standardizer's preferred runtime setup](../javascript-repo-standardizer/SKILL.md#preferred-tools), adding Node for component tests where required.
- Project component behavior tests into `.github/workflows/pr-component-tests.yml` using the [component-test workflow](./templates/bun-pr-component-tests.yml). Keep lint and production builds in `.github/workflows/pr-build-checks.yml` using the [build-checks workflow](./templates/bun-pr-build-checks.yml).
- For published libraries, add a prepared-tarball consumer build to `.github/workflows/pr-examples-tests.yml`. Test each supported host only where its import or rendering contract differs; avoid a second equivalent release smoke suite.

## Optimization

For [Preferred Tools](#preferred-tools), apply the [shared adoption and version-freshness assessment](../../references/skill-standard.md#preferred-tools).

- **Inspect:** Inventory SFC structure, public API, local conventions, docs or playgrounds, accessibility, style reuse, tests, lint, and build health.
- **Compare:** Review [Preferred Tools](#preferred-tools) and package exports where applicable. Reconcile props, emits, behavior, docs, playgrounds, accessibility claims, styles, and tests; identify duplicated logic or styling, overloaded SFCs, misplaced shared code, and stale public API against frontend canon and local Vue patterns.
- **Recommend:** Keep cohesive components; deduplicate or consolidate repeated logic and styles; split overloaded SFCs; extract composables or child components; move shared code to its owner; tighten public API; and remove stale paths without imposing unrelated visual doctrine.
- **Apply:** After explicit authorization, make the smallest coherent component-owned operations while preserving the repository's language and design system.
- **Verify:** Run the applicable lint, build, component tests, docs or playground checks, and focused accessibility verification.

## Bundled Resources

- [./references/component-documentation-examples.md](./references/component-documentation-examples.md): short guide for fallback component documentation artifacts and canonization filtering
- [./templates/example-component.vue](./templates/example-component.vue): fallback generic Vue component SFC for projects without local component precedents
- [./templates/example-component.md](./templates/example-component.md): fallback VitePress component docs page for projects without local docs page precedents
- [../../references/front-end-preferences.md](../../references/front-end-preferences.md): shared Vue 3, SCSS, and subtheme defaults
- [../../references/vitepress-markdown-pages.md](../../references/vitepress-markdown-pages.md): shared rules for VitePress Markdown page UI and embedded component boundaries
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared frontend stack defaults
- [./templates/bun-pr-build-checks.yml](./templates/bun-pr-build-checks.yml): lint and production-build workflow
- [./templates/vitest.config.js](./templates/vitest.config.js): isolated component-test discovery
- [./templates/example-component.test.js](./templates/example-component.test.js): public props and slots test
- [./templates/bun-pr-component-tests.yml](./templates/bun-pr-component-tests.yml): component-test workflow
- [./references/component-package-example.md](./references/component-package-example.md): library exports and prepared-package consumer example

## Validation

- Confirm the task stayed on the Vue 3 component surface rather than drifting into VitePress or docs-policy work.
- Confirm Vue 3, the canonical SFC block order, and SCSS defaults remain unless the repository or user requires another path.
- Confirm project-local components, docs, playgrounds, theme styles, and shared Markdown-page patterns were preferred before bundled fallbacks or bespoke docs-only UI.
- Confirm canonized examples preserve reusable structure and public contracts while excluding target-project visual, brand, and labeling doctrine.
- Confirm component docs expose the meaningful props, slots, states, Usage playground, generated example, source link, and navigation reachability that apply without duplicating equivalent sections.
- Confirm native semantics, state-driven ARIA, accessible names, keyboard behavior, and visible focus cover the component's real interaction contract.
- Confirm missing shared styling or component patterns were surfaced instead of hidden behind one-off markup or SCSS.
- Confirm component tests cover changed public behavior and use separate discovery from helper tests; retain lint and production builds.
- For published components, confirm public imports and styles survive packing and Vue remains external. Reuse the existing npm lifecycle and avoid duplicate consumer gates.
- Run the narrowest relevant lint, test, build, or smoke checks for the touched Vue surface.
