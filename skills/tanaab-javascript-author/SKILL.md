---
name: tanaab-javascript-author
description: Tanaab-based JavaScript and Bun implementation work. Use when a user wants to modify JavaScript source, Bun runtime plumbing, ESM module shape, package metadata, or bundling in a Tanaab-managed repo.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - javascript
---

# JavaScript Author

## Overview

Tanaab-based JavaScript and Bun implementation work. Use when a user wants to modify JavaScript source, Bun runtime plumbing, ESM module shape, package metadata, or bundling in a Tanaab-managed repo.

## When to Use

- Modify JavaScript source, Bun runtime plumbing, or ESM module shape.
- Update `package.json`, `packageManager`, `engines`, `main`, or `exports` when the task is primarily JS-runtime-led.
- Migrate repo-owned JS tooling from Node or npm assumptions toward Bun when the repo actually has meaningful JS surfaces.
- Change JS bundling or artifact generation when the main owned surface is still general JavaScript runtime work.

## When Not to Use

- Do not use this skill for true package-level CLI product work; reserve that for the narrower CLI surface.
- Do not use this skill for GitHub Actions workflow YAML or CI triage.
- Do not use this skill for GitHub Action product-surface work once that narrower skill exists.
- Do not default to TypeScript migration unless the repo already uses TypeScript or the user explicitly asks for it.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Apply [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) when repo layout or helper extraction is in scope.
- Apply [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md) when function shape, mutation discipline, or import grouping changes.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for Bun-first and JavaScript-first defaults instead of re-deciding the stack locally.

## Workflow

1. Confirm the request is primarily JS-runtime-led rather than CLI-, workflow-, or release-led.
2. Load only the relevant JS files plus the shared JS references that directly shape the change.
3. Keep the module, package, and artifact surface coherent while making the smallest viable change.
4. Validate the changed JS surface with the repo's narrowest reliable checks.

## Bundled Resources

- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first, JavaScript-first runtime defaults
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): scope folders, `bin/`, `utils/`, and hoisting rules for JS repos
- [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md): function shape, mutation discipline, and import grouping

## Validation

- Confirm the task stayed on the general JS runtime, package, module, or bundling surface.
- Confirm ESM and Bun defaults were preserved unless the repo or task explicitly requires another path.
- Run the repo's narrowest relevant lint, build, test, or smoke checks for the touched JS surface.
- Confirm the change did not widen into CLI product, workflow YAML, or release-contract work.
