---
name: tanaab-github-action-author
description: Tanaab-based authoring and standardization of GitHub Action product surfaces. Use when a user wants to shape action.yml, committed runtime artifacts, JavaScript or TypeScript action source, action README contract, or workflow-driven smoke patterns for a GitHub Action repo.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - github-actions
  openclaw:
    emoji: '⚡'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/github-action-author
---

# GitHub Action Author

## Overview

Tanaab-based authoring and standardization of GitHub Action product surfaces. Use when a user wants to shape action.yml, committed runtime artifacts, JavaScript or TypeScript action source, action README contract, or workflow-driven smoke patterns for a GitHub Action repo.

- Keep this skill on the action product surface: `action.yml`, runtime layout, committed artifact, README contract, and action-local validation.
- Let `tanaab-github-workflow-author` own workflow graphs when triggers, permissions, matrices, or reusable topology are the main artifact.

## When to Use

- Shape `action.yml`, committed runtime artifacts, or the repo-local contract of a GitHub Action.
- Standardize composite-wrapper actions authored in JavaScript or TypeScript that install Bun and execute a committed `dist/index.js` runtime.
- Add or standardize GitHub Action input-helper tests when the action relies on `@actions/core` getter methods or fallback environment behavior.
- Keep a GitHub Action README aligned with the action contract, inputs, outputs, caveats, and usage.
- Add or update action-local smoke or validation workflows only when they exist to validate the action product surface itself.
- Add or update an action-local `.github/workflows/release.yml` only when it exists to release or sync the action product surface itself.

## When Not to Use

- Do not use this skill for general GitHub Actions workflow YAML work when the main task is triggers, permissions, matrices, reusable workflows, or job topology.
- Do not use this skill for generic JavaScript or TypeScript runtime work that is not action-led.
- Do not use this skill for CI-triage-only work.

## Prerequisites

- Confirm the repo is actually a GitHub Action or is intentionally becoming one.
- Confirm whether the action is composite-only or JavaScript-backed with JavaScript or TypeScript source and a committed runtime artifact.

## Inputs

- Identify the action surface up front: `action.yml`, runtime entrypoint, build script, `dist/` artifact, README contract, smoke workflow expectations, and release workflow expectations when the repo ships a canonical `release.yml`.
- Identify whether action inputs rely on `@actions/core` getters and whether input-helper tests or `uses: ./` smoke coverage are in scope.

## Outputs

- Define the expected action contract, runtime artifact path, README mode, action-local validation shape, and release workflow shape when that surface is in scope.
- Call out any follow-up handoff when a task becomes primarily workflow-topology work or broader JS implementation work.

## Failure Handling

- Do not hide missing Bun tooling, missing committed artifacts, or drift between source and committed runtime output.
- Surface when the requested change really belongs to the workflow-authoring surface instead of the action-product surface.

## Preferred Tools

- **Tanaab Actions 1.x — [setup-bun](https://github.com/tanaabased/actions/blob/v1.0.1/setup-bun/README.md) and [publish-repo](https://github.com/tanaabased/actions/blob/v1.0.1/publish-repo/README.md):** Prefer for smoke-workflow runtime setup and release-time repository publication. Retain action-local `uses: ./` smoke coverage; a repository-tag release does not imply npm publication. Use direct upstream setup when the shared wrapper cannot express required inputs.

## Workflow

When authoring issue-backed commits, apply the shared [commit-subject convention](../../references/commit-subjects.md).

1. Confirm the request is action-product-led rather than workflow-led or general-JS/TS-led.
2. Apply the [documentation change gate](../../references/readme-standards.md#documentation-change-gate) before deciding whether prose needs to change, then load the local action conventions and only the shared canon needed for the touched surface.
3. Keep the action contract coherent across `action.yml`, runtime entrypoint, committed artifact, README, and any dedicated input-normalization helper.
4. Use [preferred runtime setup](#preferred-tools) in smoke workflows while testing the action itself through `uses: ./`. Validate the resulting action surface with the narrowest reliable local checks and any repo-native smoke paths.

## Release Workflow

- Use [release destinations](../../references/release-destinations.md) to distinguish repository refs and Marketplace delivery from explicitly selected npm publication.
- For action repos that ship committed artifacts or synchronize changelog changes, use `.github/workflows/release.yml` on `release.published` with the [preferred `publish-repo` action](#preferred-tools). Check out the event commit with full history; the action owns date formatting and verified Git synchronization.
- Keep final lint, test, build, or smoke commands only where they validate the shipped action. Prepare committed artifacts in `commands`, stamp any version-bearing build inputs before building, then format and validate command-owned output before synchronization.
- Keep `sync-tags` on the release's intended moving major alias, such as `v1` for `v1.2.3`. Use the established bot credential required by repository rules; the shared action owns the synchronization identity.
- Follow [release composition](../github-workflow-author/SKILL.md#release-composition) when multiple destinations exist. The preparation hook precedes upstream package/changelog stamping; validate that path with a native dry run and preserve the stated pre-sync validation limitation.
- Minimal example: [action release workflow](./templates/bun-javascript-action-release-workflow.yml).

## Optimization

- **Inspect:** Inventory `action.yml`, JavaScript or TypeScript source, generated `dist/`, the action README contract, smoke coverage, and action-local release wiring.
- **Compare:** Compare runtime setup and repository publication with [Preferred Tools](#preferred-tools), preserving action smoke behavior and moving-tag policy. Reconcile metadata, source, generated `dist/`, documentation, tests, and action-local workflow claims; identify duplicated logic, overloaded entrypoints, misplaced product wiring, and stale artifacts against local action conventions.
- **Recommend:** Keep aligned runtime output; deduplicate or consolidate repeated contracts; extract testable units; move misplaced action-owned material; split only genuinely independent actions; and tighten or remove stale surfaces without creating unrelated workflow work.
- **Apply:** After explicit authorization, make the smallest coherent action-product operations and preserve GitHub Workflow Author ownership of broader workflow graphs.
- **Verify:** Rebuild and test the action, exercise its smoke path, and confirm committed runtime output remains aligned with source and metadata.

## Bundled Resources

- [./references/javascript-action-conventions.md](./references/javascript-action-conventions.md): local product-surface rules for Bun-backed actions authored in JavaScript or TypeScript
- [./references/action-input-helper-tests.md](./references/action-input-helper-tests.md): local pattern for focused GitHub Action input-helper tests
- [./templates/bun-javascript-action-smoke-workflow.yml](./templates/bun-javascript-action-smoke-workflow.yml): starter workflow for `uses: ./` smoke coverage
- [./templates/bun-javascript-action-release-workflow.yml](./templates/bun-javascript-action-release-workflow.yml): starter `release.yml` for action artifact and repository publication
- [./templates/get-inputs.spec.js](./templates/get-inputs.spec.js): starter Mocha spec for a focused action input helper
- [../../references/release-destinations.md](../../references/release-destinations.md): shared product-surface-to-release-destination routing
- [../../references/readme-standards.md](../../references/readme-standards.md): GitHub Action README mode rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first runtime and action repo defaults
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for action runtime code
- [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md): shared helper-shape defaults when action runtime code is in scope

## Validation

- Confirm the task stayed on the GitHub Action product surface rather than drifting into workflow-graph authoring or workflow-only validation design.
- Confirm JavaScript-backed actions use composite wrappers intentionally, keep a stable runtime artifact path such as `dist/index.js`, and keep JavaScript or TypeScript source aligned with the committed JavaScript artifact.
- Confirm input-helper tests cover both local-default and explicit GitHub Actions runtime behavior when that surface changed.
- Confirm the README matches the GitHub Action README mode when the action contract changed.
- Confirm action-local validation uses `uses: ./` and checks observable postconditions when that surface changed.
- Confirm release workflows use the preferred repository publisher, prepare from the original event commit, and keep moving tags and release commands aligned with the shipped action surface.
