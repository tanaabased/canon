---
name: tanaab-javascript-author
description: Tanaab-based JavaScript and Bun implementation work. Use when a user wants to modify JavaScript or Bun code, especially low-coupling ESM helpers and utility functions, in a Tanaab-managed repo.
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

Tanaab-based JavaScript and Bun implementation work. Use when a user wants to modify JavaScript or Bun code, especially low-coupling ESM helpers and utility functions, in a Tanaab-managed repo.

- Keep the broad JavaScript entrypoint for discovery, including library-shaped modules as well as helper extraction.
- Prefer thin library-facing wrappers around lower-coupling utility logic when that decomposition is honest.
- Keep heavier, more generic, more testable logic in `utils/`-level functions when it fits the existing `utils/` boundary.

## When to Use

- Modify JavaScript source, Bun runtime plumbing, or ESM module shape when the task is primarily JS-led.
- Shape library-facing JavaScript modules where a thin public class or module wraps reusable helper logic.
- Write, refactor, or extract low-coupling utility functions, especially single-file ESM helpers under `utils/` or another narrow code scope.
- Update `package.json`, `packageManager`, `engines`, `main`, or `exports` when those changes directly support the owned JS surface.
- Migrate repo-owned JS tooling from Node or npm assumptions toward Bun when the repo actually has meaningful JS surfaces.
- Change JS bundling or artifact generation when the main owned surface still remains general JavaScript implementation work.

## When Not to Use

- Do not use this skill for true package-level CLI product work; reserve that for the narrower CLI surface.
- Do not use this skill for GitHub Actions workflow topology, triggers, permissions, reusable workflows, or general workflow authoring; keep the GitHub Actions section limited to validating the owned JS surface.
- Do not use this skill for GitHub Action product-surface work once that narrower skill exists.
- Do not widen this skill into broad testing strategy, operational scenario design, or release gating when the task is no longer about validating the owned JS surface.
- Do not default to TypeScript migration unless the repo already uses TypeScript or the user explicitly asks for it.

## Constraints

- Prefer the smallest change that solves the task.
- Prefer one main exported function and a narrow file surface when a helper can be expressed that way honestly.
- Do not force `utils/` extraction when the logic is tightly coupled to surface vocabulary, orchestration, or state.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Default the implementation path toward lower-coupling functions and `utils/`-style helpers.
- For library-shaped code, keep the public class or module focused on orchestration, state, and surface-specific wrapping while extracting generic logic into utility functions when the split is honest.
- Keep repo-coupled orchestration and surface vocabulary near the owning module instead of forcing them into `utils/`.
- Treat broader package, module, and Bun-runtime edits as support work for the owned JS surface instead of the default authored pattern.
- Apply [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) when repo layout or helper extraction is in scope.
- Apply [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md) when function shape, mutation discipline, or import grouping changes.
- Apply [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) when public contracts, API docs, or inline comments change.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for Bun-first and JavaScript-first defaults instead of re-deciding the stack locally.

## Workflow

1. Confirm the request is primarily JS-runtime-led rather than CLI-, workflow-, or release-led.
2. Load only the relevant JS files plus the shared JS references that directly shape the change.
3. Prefer thin library wrappers and function-shaped extraction when the task allows that decomposition honestly.
4. Keep any required package, module, or artifact edits coherent with that owned JS surface.
5. Validate the changed JS surface with the repo's narrowest reliable checks.

## Testing

- Prefer focused Mocha tests for extracted utility logic, especially pure or mostly pure helpers and modules.
- Test thin wrappers or classes directly when they own meaningful orchestration, state, or boundary behavior.
- Keep test files narrow and adjacent in intent, usually under `test/` with names such as `test/normalize-tags.spec.js`.
- Use the module-under-test path without file extension as the `describe` value, relative to the repo root or nearest source root.
- Start Mocha test names with `should` so the spec reads as behavior rather than implementation narration.
- Utility-first tests are preferred because they reduce coupling and fixture/setup churn.
- Add `c8` only when coverage reporting or enforcement is explicitly part of the task.
- Do not merge GitHub Action input-helper testing into this skill's default path; keep that with the narrower GitHub Action surface.

Minimal generic example:

```js
import assert from 'node:assert/strict';

import normalizeTags from '../utils/normalize-tags.js';

describe('utils/normalize-tags', () => {
  it('should drop empty values and lowercase tags', () => {
    assert.deepEqual(normalizeTags([' Docs ', '', null, 'API']), ['docs', 'api']);
  });
});
```

## GitHub Actions Workflow

- When this skill's owned JS surface needs CI confirmation, use a narrow GitHub Actions workflow that validates the same direct-test surface instead of widening into workflow-topology work.
- Keep the workflow generic, Bun-first, and centered on the repo's test command.
- For developer-machine code, CLIs, and plugin tooling, prefer an Ubuntu plus current macOS runner matrix; add Windows only when Windows is an intended maintained surface.
- Treat this as a validation lifecycle for the owned JS surface, not as ownership of workflow YAML as a product surface.

Minimal generic example:

```yaml
name: Unit Tests

on:
  pull_request:

jobs:
  unit-tests:
    name: ${{ matrix.os }}
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os:
          - ubuntu-24.04
          - macos-26
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - run: bun install --frozen-lockfile --ignore-scripts
      - run: bun run test
```

## Bundled Resources

- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first, JavaScript-first runtime defaults
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for code-bearing surfaces
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): scope folders, `bin/`, `utils/`, and hoisting rules for JS repos
- [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md): function shape, mutation discipline, and import grouping
- [./references/javascript-function-tests.md](./references/javascript-function-tests.md): local direct-test defaults for helper-shaped JS code
- [./templates/transform-unit.js](./templates/transform-unit.js): starter shape for pure or mostly pure transformation helpers
- [./templates/async-boundary-unit.js](./templates/async-boundary-unit.js): starter shape for narrow boundary-reading helpers

## Validation

- Confirm the skill still reads as the broad JavaScript entrypoint while funneling implementation toward thin library wrappers and lower-coupling utility functions when the task allows it.
- Confirm the class guidance stayed a strong default rather than a hard requirement and did not imply a `classes/` folder or mandatory `utils/` hoisting.
- Confirm ESM and Bun defaults were preserved unless the repo or task explicitly requires another path.
- Confirm direct tests prioritize generic utility logic and do not absorb GitHub Action input-helper patterns.
- Confirm any GitHub Actions workflow example or wiring remains a validation path for the owned JS surface rather than drifting into workflow-topology ownership.
- Run the repo's narrowest relevant lint, build, test, or smoke checks for the touched JS surface.
- Confirm the change did not widen into CLI product, workflow YAML, or release-contract work.
