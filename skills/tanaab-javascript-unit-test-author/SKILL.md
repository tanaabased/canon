---
name: tanaab-javascript-unit-test-author
description: Tanaab-based authoring and standardization of JavaScript and Bun unit-test surfaces. Use when a user wants focused Mocha-based unit tests, c8 coverage wiring, JS helper regression coverage, or action-input helper tests.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - testing
---

# JavaScript Unit Test Author

## Overview

Tanaab-based authoring and standardization of JavaScript and Bun unit-test surfaces. Use when a user wants focused Mocha-based unit tests, c8 coverage wiring, JS helper regression coverage, or action-input helper tests.

## When to Use

- Add or standardize focused Mocha-based unit tests for JS or Bun repos.
- Add `c8` coverage wiring when coverage reporting or enforcement is actually needed.
- Shape helper regression tests under `test/` for JS modules and `utils/` functions.
- Add or standardize GitHub Action input-helper tests when the target surface is still unit-level, not end-to-end workflow smoke coverage.

## When Not to Use

- Do not use this skill for Leia-backed operational scenarios or destructive example coverage.
- Do not use this skill for general test-gate workflow wiring once the primary owned surface becomes CI topology.
- Do not widen this skill into broad testing strategy or release gating.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Use [./references/javascript-unit-templates.md](./references/javascript-unit-templates.md) for the default unit starter shapes.
- Use [./references/action-input-helper-tests.md](./references/action-input-helper-tests.md) when the test surface is a GitHub Action input helper.
- Use [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md) when helper shape and import grouping matter.

## Workflow

1. Confirm the request is specifically about JS or Bun unit-test authoring rather than operational scenarios or workflow gates.
2. Load the touched unit surface plus only the shared and local test canon needed for that module or helper.
3. Keep the tests focused on the owned unit surface instead of expanding into unrelated integration coverage.
4. Validate with the narrowest reliable local test command for the touched unit surface.

## Bundled Resources

- [./references/javascript-unit-templates.md](./references/javascript-unit-templates.md): local unit starter shapes for transform and boundary tests
- [./references/action-input-helper-tests.md](./references/action-input-helper-tests.md): local pattern for GitHub Action input-helper tests
- [./templates/transform-unit.js](./templates/transform-unit.js): starter for pure or mostly pure unit tests
- [./templates/async-boundary-unit.js](./templates/async-boundary-unit.js): starter for boundary-reading unit tests
- [./templates/get-inputs.spec.js](./templates/get-inputs.spec.js): starter for GitHub Action input-helper tests
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared Mocha and optional `c8` defaults
- [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md): shared helper-shape defaults for JS units

## Validation

- Confirm the task stayed on focused JS or Bun unit tests rather than operational scenarios or workflow gates.
- Confirm `Mocha` remains the unit-test path unless the repo explicitly uses something else.
- Confirm `c8` is added only when coverage reporting or enforcement is actually part of the task.
- Confirm GitHub Action input-helper tests cover both local-default and GitHub Actions runtime behavior when that surface changed.
