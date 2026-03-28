---
name: tanaab-javascript-lint-format-standardizer
description: Tanaab-based standardization of JavaScript and Bun lint and format surfaces. Use when a user wants to align a repo to the shared ESLint and standalone Prettier baseline, normalize lint scripts, or standardize JS lint layers.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - javascript
---

# JavaScript Lint and Format Standardizer

## Overview

Tanaab-based standardization of JavaScript and Bun lint and format surfaces. Use when a user wants to align a repo to the shared ESLint and standalone Prettier baseline, normalize lint scripts, or standardize JS lint layers.

## When to Use

- Align a repo to the shared ESLint and standalone Prettier baseline.
- Normalize lint scripts such as `lint:eslint`, `format:check`, `format:write`, and `lint`.
- Add or standardize the TypeScript or Vue lint layer only when the repo actually needs it.
- Apply the bundled lint and format starter files when the task is specifically about this baseline.

## When Not to Use

- Do not use this skill for general JS runtime work unrelated to lint or format standardization.
- Do not use this skill for one-off formatting-only requests that do not change the repo baseline.
- Do not widen this skill into full repo-template authoring.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Use [./references/lint-format-baseline.md](./references/lint-format-baseline.md) as the local source of truth for the baseline.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for the shared ESLint-plus-Prettier default rather than re-deciding the tool stack.
- Apply the bundled starter files together when standardizing a repo instead of inventing a partial local baseline.

## Workflow

1. Confirm the request is specifically about lint or format baseline work.
2. Load the local baseline reference and the starter files needed for the target repo surface.
3. Keep ESLint and Prettier ownership explicit while standardizing only the layers the repo actually needs.
4. Validate the resulting lint and format surface with the narrowest reliable local checks.

## Bundled Resources

- [./references/lint-format-baseline.md](./references/lint-format-baseline.md): local baseline rules and expected script shape
- [./templates/eslint.config.js](./templates/eslint.config.js): shared JS/Bun ESLint base
- [./templates/prettier.config.js](./templates/prettier.config.js): shared standalone Prettier config
- [./templates/.prettierignore](./templates/.prettierignore): shared Prettier ignore baseline
- [./templates/snippets/typescript-eslint-layer.js](./templates/snippets/typescript-eslint-layer.js): optional TypeScript layer
- [./templates/snippets/vue-eslint-layer.js](./templates/snippets/vue-eslint-layer.js): optional Vue layer
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared linting and formatting defaults

## Validation

- Confirm the task stayed on the lint and format baseline surface rather than drifting into general JS runtime work.
- Confirm ESLint and Prettier ownership remain separate.
- Confirm the repo exposes the expected lint and format scripts unless an explicit repo-local reason overrides them.
- Run the narrowest repo-native lint or format checks available for the touched surface.
