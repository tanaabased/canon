---
name: tanaab-github-action-author
description: Tanaab-based authoring and standardization of GitHub Action product surfaces. Use when a user wants to shape action.yml, committed runtime artifacts, JavaScript action runtime layout, action README contract, or workflow-driven smoke patterns for a GitHub Action repo.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - github-actions
---

# GitHub Action Author

## Overview

Tanaab-based authoring and standardization of GitHub Action product surfaces. Use when a user wants to shape action.yml, committed runtime artifacts, JavaScript action runtime layout, action README contract, or workflow-driven smoke patterns for a GitHub Action repo.

## When to Use

- Shape `action.yml`, committed runtime artifacts, or the repo-local contract of a GitHub Action.
- Standardize composite-wrapper JavaScript actions that install Bun and execute a committed `dist/index.js` runtime.
- Add or standardize GitHub Action input-helper tests when the action relies on `@actions/core` getter methods or fallback environment behavior.
- Keep a GitHub Action README aligned with the action contract, inputs, outputs, caveats, and usage.
- Add or update workflow-driven smoke patterns when the primary owned surface is still the action product rather than general workflow topology.

## When Not to Use

- Do not use this skill for general GitHub Actions workflow YAML work when the main task is triggers, permissions, or job topology.
- Do not use this skill for generic JavaScript runtime work that is not action-led.
- Do not use this skill for CI-triage-only work.

## Prerequisites

- Confirm the repo is actually a GitHub Action or is intentionally becoming one.
- Confirm whether the action is composite-only or JavaScript-backed with a committed runtime artifact.

## Inputs

- Identify the action surface up front: `action.yml`, runtime entrypoint, build script, `dist/` artifact, README contract, and smoke workflow expectations.
- Identify whether action inputs rely on `@actions/core` getters and whether input-helper tests or `uses: ./` smoke coverage are in scope.

## Outputs

- Define the expected action contract, runtime artifact path, README mode, and smoke coverage shape.
- Call out any follow-up handoff when a task becomes primarily workflow-topology work or broader JS implementation work.

## Failure Handling

- Do not hide missing Bun tooling, missing committed artifacts, or drift between source and committed runtime output.
- Surface when the requested change really belongs to the workflow-authoring surface instead of the action-product surface.

## Workflow

1. Confirm the request is action-product-led rather than workflow-led or general-JS-led.
2. Load the local action conventions plus only the shared README, stack, JS, and input-helper canon needed for the touched surface.
3. Keep the action contract coherent across `action.yml`, runtime entrypoint, committed artifact, README, and any dedicated input-normalization helper.
4. Validate the resulting action surface with the narrowest reliable local checks and any repo-native smoke paths.

## Bundled Resources

- [./references/javascript-action-conventions.md](./references/javascript-action-conventions.md): local product-surface rules for Bun-backed JavaScript actions
- [./references/action-input-helper-tests.md](./references/action-input-helper-tests.md): local pattern for focused GitHub Action input-helper tests
- [./templates/bun-javascript-action-smoke-workflow.yml](./templates/bun-javascript-action-smoke-workflow.yml): starter workflow for `uses: ./` smoke coverage
- [./templates/get-inputs.spec.js](./templates/get-inputs.spec.js): starter Mocha spec for a focused action input helper
- [../../references/readme-standards.md](../../references/readme-standards.md): GitHub Action README mode rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first runtime and action repo defaults
- [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md): shared helper-shape defaults when action runtime code is in scope

## Validation

- Confirm the task stayed on the GitHub Action product surface rather than drifting into general workflow topology.
- Confirm JavaScript-backed actions use composite wrappers intentionally, keep a stable runtime artifact path such as `dist/index.js`, and keep source and committed artifacts aligned.
- Confirm input-helper tests cover both local-default and explicit GitHub Actions runtime behavior when that surface changed.
- Confirm the README matches the GitHub Action README mode when the action contract changed.
- Confirm smoke coverage uses `uses: ./` and checks observable postconditions when that surface changed.
