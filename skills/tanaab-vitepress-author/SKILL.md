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

## Change Strategy

- Use [../../references/front-end-preferences.md](../../references/front-end-preferences.md) for VitePress, SCSS, and subtheme defaults.
- Use [../../references/readme-standards.md](../../references/readme-standards.md) only to preserve the boundary that README-vs-docs-site selection is a different owned surface.
- Keep implementation work on VitePress pages, local theme wiring, and subtheme structure rather than widening into docs policy.

## Workflow

1. Confirm the request is VitePress-site-led and that the docs-site surface is already the chosen path.
2. Load only the relevant VitePress files plus the shared frontend and docs-boundary canon needed for the task.
3. Keep the change focused on VitePress pages, config, theme wiring, and subtheme implementation.
4. Validate the touched VitePress surface with the narrowest reliable repo-native checks.

## Bundled Resources

- [../../references/front-end-preferences.md](../../references/front-end-preferences.md): shared VitePress, SCSS, and subtheme defaults
- [../../references/readme-standards.md](../../references/readme-standards.md): boundary between README-only docs and a VitePress docs site
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared frontend and docs-stack defaults

## Validation

- Confirm the task stayed on VitePress implementation rather than docs-surface selection or generic Vue work.
- Confirm VitePress 1 remained the site stack unless the repo or user explicitly requires another path.
- Confirm local subtheme changes were preferred over upstream theme forks when a subtheme is sufficient.
- Run the narrowest relevant lint, build, or smoke checks for the touched VitePress surface.
