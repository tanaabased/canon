---
name: tanaab-javascript-repo-standardizer
description: Tanaab-based standardization of JavaScript and Bun repo baselines. Use when a user wants to align repo structure, lint and format defaults, or baseline JS/Bun scripts in a Tanaab-managed repo.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - javascript
---

# JavaScript Repo Standardizer

## Overview

Tanaab-based standardization of JavaScript and Bun repo baselines. Use when a user wants to align repo structure, lint and format defaults, or baseline JS/Bun scripts in a Tanaab-managed repo.

- Keep this skill normalization-led rather than implementation-led.
- Use it to bring a JS/Bun repo onto the shared baseline for structure, linting, formatting, and related baseline scripts while leaving runtime authorship to the broader JavaScript implementation skill.

## When to Use

- Align a repo to the shared ESLint and standalone Prettier baseline.
- Normalize JS repo structure around scope folders, `bin/`, `utils/`, and related layout decisions using the shared repo-structure canon.
- Normalize baseline scripts such as `lint:eslint`, `format:check`, `format:write`, and `lint`.
- Standardize Bun-first baseline package wiring when that work is part of repo normalization rather than feature implementation.
- Add or standardize the TypeScript or Vue lint layer only when the repo actually needs it.
- Apply the bundled baseline starter files when the task is specifically about bringing a repo onto the shared JS/Bun baseline.
- Add or refresh repo-local `AGENTS.md` lines when the repo wants the JS/Bun baseline to be durable ambient policy.

## When Not to Use

- Do not use this skill for general JS runtime work, helper extraction, or library refactors where implementation behavior is the owned surface.
- Do not use this skill for one-off formatting-only requests that do not change the repo baseline.
- Do not use this skill for ordinary day-to-day code authorship just because repo structure is nearby.
- Do not widen this skill into full repo-template authoring.

## Constraints

- Prefer the smallest change that solves the task.
- Keep the work baseline-led: structure, lint, format, and baseline script normalization.
- Do not treat repo-structure normalization as permission for broad runtime refactors.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Use [./references/lint-format-baseline.md](./references/lint-format-baseline.md) as the local source of truth for the lint and format baseline.
- Use [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) when normalizing scope folders, `bin/`, `utils/`, or hoisting decisions.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for Bun-first baseline defaults rather than re-deciding the tool stack locally.
- Apply the bundled starter files together when standardizing a repo instead of inventing a partial local baseline.

## Workflow

1. Confirm the request is specifically about JS/Bun repo baseline standardization rather than implementation authorship.
2. Load the local lint baseline reference plus the shared repo-structure canon needed for the target repo surface.
3. Keep lint, format, and repo-structure ownership explicit while standardizing only the layers the repo actually needs.
4. Validate the resulting repo baseline with the narrowest reliable local checks.

## Testing

- Treat direct lint and format commands as the canonical validation mechanism for this surface.
- When repo structure changed, add targeted inspection of folders, entrypoints, or baseline files instead of widening into runtime smoke tests.
- Keep the validation path explicit: ESLint for lint rules, Prettier for format checks, and `lint` only when it intentionally composes those commands.
- Do not add unrelated smoke or scenario layers unless the task clearly expands beyond repo baseline standardization.

Minimal generic example:

```bash
bun run lint
test -f eslint.config.js
test -f prettier.config.js
```

## GitHub Actions Workflow

- Use a Bun-first GitHub Actions workflow that installs dependencies once and runs the repo's lint and format checks.
- Keep the workflow generic and centered on the repo baseline scripts rather than inventing repo-specific CI topology in the skill.
- Treat this as validation of the repo baseline, not ownership of general workflow authoring.

Minimal generic example:

```yaml
name: Lint

on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - run: bun install --frozen-lockfile --ignore-scripts
      - run: bun run lint
```

## Bundled Resources

- [./references/lint-format-baseline.md](./references/lint-format-baseline.md): local baseline rules and expected script shape
- [./references/repo-agents-lines.md](./references/repo-agents-lines.md): optional copyable repo `AGENTS.md` lines for durable JS/Bun baseline policy
- [./templates/eslint.config.js](./templates/eslint.config.js): shared JS/Bun ESLint base
- [./templates/prettier.config.js](./templates/prettier.config.js): shared standalone Prettier config
- [./templates/.prettierignore](./templates/.prettierignore): shared Prettier ignore baseline
- [./templates/snippets/typescript-eslint-layer.js](./templates/snippets/typescript-eslint-layer.js): optional TypeScript layer
- [./templates/snippets/vue-eslint-layer.js](./templates/snippets/vue-eslint-layer.js): optional Vue layer
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): shared scope-folder, `bin/`, `utils/`, and hoisting rules for JS repos
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared linting and formatting defaults

## Validation

- Confirm the task stayed on repo baseline standardization rather than drifting into general JS runtime work or implementation refactors.
- Confirm repo-structure normalization followed [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) without turning this skill into general code authorship.
- Confirm ESLint and Prettier ownership remain separate.
- Confirm the repo exposes the expected lint and format scripts unless an explicit repo-local reason overrides them.
- Confirm direct validation stays on lint, format, and targeted baseline inspection instead of drifting into unrelated smoke or scenario mechanisms.
- Confirm any GitHub Actions workflow example remains a repo-baseline validation path rather than a general workflow-topology pattern.
- Run the narrowest repo-native lint, format, or baseline checks available for the touched surface.
