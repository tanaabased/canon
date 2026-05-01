---
name: tanaab-vitepress-author
description: Tanaab-based authoring and standardization of VitePress 1 site surfaces. Use when a user wants to build or update a VitePress docs or static site, local subtheme wiring, docs-site page implementation, or VitePress frontend structure.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - vitepress
---

# VitePress Author

## Overview

Tanaab-based authoring and standardization of VitePress 1 site surfaces. Use when a user wants to build or update a VitePress docs or static site, local subtheme wiring, docs-site page implementation, or VitePress frontend structure.

- Keep this skill on VitePress site implementation and local subtheme wiring.
- Treat Markdown page implementation as the default and highest-frequency VitePress surface.
- Let `tanaab-vue-author` own generic Vue component work when the primary surface is not VitePress-led.

## When to Use

- Build or update a VitePress 1 docs or static site once that site surface is already chosen.
- Write or update VitePress Markdown pages, including frontmatter, page structure, examples, links, embedded components, and navigation reachability.
- Shape `.vitepress/` config, local subtheme wiring, VitePress page implementation, or VitePress-specific frontend structure when those surfaces are part of the site work.
- Apply Tanaab or non-Tanaab subtheme defaults when the site surface is already VitePress-led.
- Keep VitePress implementation coherent across docs-site pages, theme wiring, and local presentation changes.

## When Not to Use

- Do not use this skill to decide whether a repo should stay README-only or move to a docs site.
- Do not use this skill for README-only authoring or README-vs-docs-site decisions; use `tanaab-readme-author`.
- Do not use this skill for reusable Vue component API or behavior work that is not primarily VitePress-led; use `tanaab-vue-author`.
- Do not use this skill for general JS runtime or package plumbing unless the VitePress site surface is still the primary owner.
- Do not create a separate Markdown skill unless Markdown work emerges outside README writing, VitePress page implementation, and Vue component docs.
- Do not fork the upstream theme by default when a local subtheme is sufficient.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.
- Prefer VitePress 1 and SCSS defaults unless the repo or user explicitly requires another stack.
- Apply the shared VitePress Markdown page rules for Markdown-heavy docs surfaces.
- Treat page-local `<style>`, bespoke markup, and page-specific components as narrow exceptions rather than defaults.

## Change Strategy

- Use [../../references/front-end-preferences.md](../../references/front-end-preferences.md) for VitePress, SCSS, and subtheme defaults.
- Use [../../references/vitepress-markdown-pages.md](../../references/vitepress-markdown-pages.md) for Markdown page UI, embedded Vue components, global component reuse, and page-local glue limits.
- Use [../../references/readme-standards.md](../../references/readme-standards.md) only to preserve the boundary that README-vs-docs-site selection is a different owned surface.
- Keep implementation work on VitePress pages, local theme wiring, and subtheme structure rather than widening into docs policy or generic Vue ownership.
- Keep Markdown page implementation centered on existing global components and call out missing shared-system primitives instead of hiding them inside one page.

### Lifecycle Surfaces

- Markdown page implementation is the primary VitePress surface: frontmatter, headings, examples, embedded components, links, page-local glue, and navigation reachability.
- Site structure and config are secondary VitePress surfaces: `.vitepress/` config, `themeConfig`, sidebars, nav, plugins, source layout, base/site metadata, and docs routing.
- Local subtheme wiring is the frontend extension surface: theme entrypoints, layout extension, global component registration, styles, composables, and local theme overrides.
- When work crosses surfaces, keep the smallest VitePress-owned path that makes the page or site coherent instead of turning the task into generic Vue, README, or JavaScript work.

## Workflow

1. Confirm the request is VitePress-site-led and that the docs-site surface is already the chosen path.
2. Classify the active surface as Markdown page implementation, site structure/config, local subtheme wiring, or a narrow combination of those surfaces.
3. Load only the files and references needed for that surface: Markdown pages and navigation, config/theme files, or local subtheme entrypoints and styles.
4. For Markdown page work, inspect the shared Markdown-page reference for global-component reuse and page reachability before adding page-local UI.
5. Keep the change focused on VitePress pages, config, theme wiring, and subtheme implementation.
6. Validate the touched VitePress surface with the narrowest reliable repo-native checks.

## Documentation

- Treat VitePress Markdown files as the primary documentation surface this skill writes and maintains.
- Use [../../references/vitepress-markdown-pages.md](../../references/vitepress-markdown-pages.md) for docs-site Markdown page UI, embedded Vue components, global component reuse, and page-local glue limits.
- For reusable component docs pages, follow the shared reference's playground-first Usage pattern and leave reusable playground behavior to `tanaab-vue-author`.
- Use clear frontmatter, task-shaped headings, concrete examples, reachable links, and existing page conventions before adding new page structure.
- Prefer existing global components, theme styles, tokens, and layout patterns from the active theme and subthemes before solving a Markdown page locally.
- Keep page-local markup, `<style>` glue, and interactive demos narrow, content-specific, and non-repeating.
- Promote repeated or brand-significant Markdown page patterns into the shared theme, component, or style layer.
- Update sidebar, nav, index pages, or equivalent routing when adding or moving durable docs pages so the content is reachable.
- Keep config and subtheme documentation changes tied to the VitePress surface they explain; do not turn them into README-mode decisions or generic Markdown prose work.

## Testing

- Use build- and lint-first validation for the owned VitePress surface until a shared frontend test framework is standardized.
- Keep the direct validation path on the docs-site implementation surface rather than inventing a separate component-test doctrine here.
- Treat repo-native `build` and `lint` commands as the canonical direct-test mechanism when they exist.

Minimal generic example:

```bash
bun run lint
bun run build
```

## GitHub Actions Workflow

- Use a PR build workflow that installs Bun dependencies and validates the touched VitePress surface with the repo's build- and lint-first commands.
- Keep the workflow generic and centered on the same direct validation path rather than expanding into broader CI topology.
- Treat this as validation of the VitePress implementation surface, not as ownership of workflow authoring.

Minimal generic example:

```yaml
name: Site Build

on:
  pull_request:

jobs:
  build:
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

- [../../references/front-end-preferences.md](../../references/front-end-preferences.md): shared VitePress, SCSS, and subtheme defaults
- [../../references/vitepress-markdown-pages.md](../../references/vitepress-markdown-pages.md): shared VitePress Markdown page UI, global component reuse, and page-local glue rules
- [../../references/readme-standards.md](../../references/readme-standards.md): boundary between README-only docs and a VitePress docs site
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared frontend and docs-stack defaults

## Validation

- Confirm the task stayed on VitePress implementation rather than docs-surface selection or generic Vue work.
- Confirm the active surface was classified as Markdown page implementation, site structure/config, local subtheme wiring, or a narrow combination of those surfaces.
- Confirm VitePress 1 remained the site stack unless the repo or user explicitly requires another path.
- Confirm local subtheme changes were preferred over upstream theme forks when a subtheme is sufficient.
- Confirm Markdown documentation uses frontmatter, headings, examples, links, and navigation consistent with the existing VitePress site.
- Confirm Markdown page work followed the shared VitePress Markdown page reference before introducing page-local UI.
- Confirm Markdown page work inspected globally available theme and subtheme components before adding markup, styles, or new Vue.
- Confirm repeated or brand-significant Markdown page patterns were promoted or explicitly called out rather than silently embedded in one page.
- Confirm direct validation stays on build- and lint-first site checks rather than drifting into a separate frontend test doctrine.
- Confirm any GitHub Actions workflow example remains a VitePress validation path rather than a general workflow-topology pattern.
- Run the narrowest relevant lint, build, or smoke checks for the touched VitePress surface.
