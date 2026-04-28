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
- Let `tanaab-vue-author` own generic Vue component work when the primary surface is not VitePress-led.

## When to Use

- Build or update a VitePress 1 docs or static site once that site surface is already chosen.
- Shape `.vitepress/` config, local subtheme wiring, VitePress page implementation, or VitePress-specific frontend structure.
- Apply Tanaab or non-Tanaab subtheme defaults when the site surface is already VitePress-led.
- Keep VitePress implementation coherent across docs-site pages, theme wiring, and local presentation changes.

## When Not to Use

- Do not use this skill to decide whether a repo should stay README-only or move to a docs site.
- Do not use this skill for generic Vue component work that is not VitePress-led.
- Do not use this skill for general JS runtime or package plumbing unless the VitePress site surface is still the primary owner.
- Do not fork the upstream theme by default when a local subtheme is sufficient.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.
- Prefer VitePress 1 and SCSS defaults unless the repo or user explicitly requires another stack.
- Apply the shared front-end Markdown page rules for Markdown-heavy docs surfaces.
- Treat page-local `<style>`, bespoke markup, and page-specific components as narrow exceptions rather than defaults.

## Change Strategy

- Use [../../references/front-end-preferences.md](../../references/front-end-preferences.md) for VitePress, SCSS, and subtheme defaults.
- Use [../../references/front-end-markdown-pages.md](../../references/front-end-markdown-pages.md) for Markdown page UI, embedded Vue components, reusable-first decisions, and page-local glue limits.
- Use [../../references/readme-standards.md](../../references/readme-standards.md) only to preserve the boundary that README-vs-docs-site selection is a different owned surface.
- Keep implementation work on VitePress pages, local theme wiring, and subtheme structure rather than widening into docs policy or generic Vue ownership.
- Keep Markdown page implementation reusable-first and call out missing shared-system primitives instead of hiding them inside one page.

## Workflow

1. Confirm the request is VitePress-site-led and that the docs-site surface is already the chosen path.
2. Load only the relevant VitePress files plus the shared frontend and docs-boundary canon needed for the task.
3. Keep the change focused on VitePress pages, config, theme wiring, and subtheme implementation.
4. Validate the touched VitePress surface with the narrowest reliable repo-native checks.

## Documentation

- Treat VitePress Markdown pages as the primary documentation surface owned by this skill.
- Use clear frontmatter, task-shaped headings, concrete examples, reachable links, and existing page conventions before adding new page structure.
- Prefer existing global components, theme styles, tokens, and layout patterns before solving a Markdown page locally.
- Keep page-local markup, `<style>` glue, and interactive demos narrow, content-specific, and non-repeating.
- Promote repeated or brand-significant Markdown page patterns into the shared theme, component, or style layer.
- Update sidebar, nav, index pages, or equivalent routing when adding or moving durable docs pages so the content is reachable.

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
- [../../references/front-end-markdown-pages.md](../../references/front-end-markdown-pages.md): shared Markdown page UI, reusable-first, and page-local glue rules
- [../../references/readme-standards.md](../../references/readme-standards.md): boundary between README-only docs and a VitePress docs site
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared frontend and docs-stack defaults

## Validation

- Confirm the task stayed on VitePress implementation rather than docs-surface selection or generic Vue work.
- Confirm VitePress 1 remained the site stack unless the repo or user explicitly requires another path.
- Confirm local subtheme changes were preferred over upstream theme forks when a subtheme is sufficient.
- Confirm Markdown documentation uses frontmatter, headings, examples, links, and navigation consistent with the existing VitePress site.
- Confirm Markdown page work followed the shared front-end Markdown page reference before introducing page-local UI.
- Confirm repeated or brand-significant Markdown page patterns were promoted or explicitly called out rather than silently embedded in one page.
- Confirm direct validation stays on build- and lint-first site checks rather than drifting into a separate frontend test doctrine.
- Confirm any GitHub Actions workflow example remains a VitePress validation path rather than a general workflow-topology pattern.
- Run the narrowest relevant lint, build, or smoke checks for the touched VitePress surface.
