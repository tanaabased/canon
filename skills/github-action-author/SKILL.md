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

- Keep this skill on the action product surface: `action.yml`, runtime layout, committed artifact, README contract, and action-local validation.
- Let `tanaab-github-workflow-author` own workflow graphs when triggers, permissions, matrices, or reusable topology are the main artifact.

## When to Use

- Shape `action.yml`, committed runtime artifacts, or the repo-local contract of a GitHub Action.
- Standardize composite-wrapper JavaScript actions that install Bun and execute a committed `dist/index.js` runtime.
- Add or standardize GitHub Action input-helper tests when the action relies on `@actions/core` getter methods or fallback environment behavior.
- Keep a GitHub Action README aligned with the action contract, inputs, outputs, caveats, and usage.
- Add or update action-local smoke or validation workflows only when they exist to validate the action product surface itself.
- Add or update an action-local `.github/workflows/release.yml` only when it exists to release or sync the action product surface itself.

## When Not to Use

- Do not use this skill for general GitHub Actions workflow YAML work when the main task is triggers, permissions, matrices, reusable workflows, or job topology.
- Do not use this skill for generic JavaScript runtime work that is not action-led.
- Do not use this skill for CI-triage-only work.

## Prerequisites

- Confirm the repo is actually a GitHub Action or is intentionally becoming one.
- Confirm whether the action is composite-only or JavaScript-backed with a committed runtime artifact.

## Inputs

- Identify the action surface up front: `action.yml`, runtime entrypoint, build script, `dist/` artifact, README contract, smoke workflow expectations, and release workflow expectations when the repo ships a canonical `release.yml`.
- Identify whether action inputs rely on `@actions/core` getters and whether input-helper tests or `uses: ./` smoke coverage are in scope.

## Outputs

- Define the expected action contract, runtime artifact path, README mode, action-local validation shape, and release workflow shape when that surface is in scope.
- Call out any follow-up handoff when a task becomes primarily workflow-topology work or broader JS implementation work.

## Failure Handling

- Do not hide missing Bun tooling, missing committed artifacts, or drift between source and committed runtime output.
- Surface when the requested change really belongs to the workflow-authoring surface instead of the action-product surface.

## Workflow

1. Confirm the request is action-product-led rather than workflow-led or general-JS-led.
2. Load the local action conventions plus only the shared README, stack, JS, inline-doc, and input-helper canon needed for the touched surface.
3. Keep the action contract coherent across `action.yml`, runtime entrypoint, committed artifact, README, and any dedicated input-normalization helper.
4. Validate the resulting action surface with the narrowest reliable local checks and any repo-native smoke paths.

## Release Workflow

- Canonical mechanism: for JavaScript-backed action repos that ship committed artifacts or sync `CHANGELOG.md`, use a `.github/workflows/release.yml` workflow triggered by `release.published`, check out full history, install Bun, export formatted `RELEASE_DATE`, and call `tanaabased/prepare-release-action@v1`.
- Keep `Install deps and prep` only when the repo needs a final release-time lint, test, build, or smoke pass before syncing release artifacts.
- Keep `sync-tags` aligned with the incoming release tag's major version line. For example, when `${{ github.event.release.tag_name }}` is `v1.2.3`, the workflow should sync the moving alias `v1`.
- Keep release-time `commands` focused on action-product needs such as rebuilding or stamping committed `dist/` artifacts; hand broader workflow topology back to `tanaab-github-workflow-author`.
- Minimal example: [./templates/bun-javascript-action-release-workflow.yml](./templates/bun-javascript-action-release-workflow.yml)

## Bundled Resources

- [./references/javascript-action-conventions.md](./references/javascript-action-conventions.md): local product-surface rules for Bun-backed JavaScript actions
- [./references/action-input-helper-tests.md](./references/action-input-helper-tests.md): local pattern for focused GitHub Action input-helper tests
- [./templates/bun-javascript-action-smoke-workflow.yml](./templates/bun-javascript-action-smoke-workflow.yml): starter workflow for `uses: ./` smoke coverage
- [./templates/bun-javascript-action-release-workflow.yml](./templates/bun-javascript-action-release-workflow.yml): starter `release.yml` for release-published action repos that sync `CHANGELOG.md` or committed artifacts through `prepare-release-action`
- [./templates/get-inputs.spec.js](./templates/get-inputs.spec.js): starter Mocha spec for a focused action input helper
- [../../references/readme-standards.md](../../references/readme-standards.md): GitHub Action README mode rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first runtime and action repo defaults
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for action runtime code
- [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md): shared helper-shape defaults when action runtime code is in scope

## Validation

- Confirm the task stayed on the GitHub Action product surface rather than drifting into workflow-graph authoring or workflow-only validation design.
- Confirm JavaScript-backed actions use composite wrappers intentionally, keep a stable runtime artifact path such as `dist/index.js`, and keep source and committed artifacts aligned.
- Confirm input-helper tests cover both local-default and explicit GitHub Actions runtime behavior when that surface changed.
- Confirm the README matches the GitHub Action README mode when the action contract changed.
- Confirm action-local validation uses `uses: ./` and checks observable postconditions when that surface changed.
- Confirm any release workflow uses `tanaabased/prepare-release-action@v1`, includes the required formatted `RELEASE_DATE` export, keeps `sync-tags` aligned with the incoming release tag's major version alias, and keeps `Install deps and prep` only when it materially validates or rebuilds the action product surface.
