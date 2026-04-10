---
name: tanaab-release-author
description: Tanaab-based release preparation, changelog authoring, readiness review, and release contract work. Use when a user wants release notes, CHANGELOG updates, release-facing metadata decisions, or a release readiness summary.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - release
---

# Release Author

## Overview

Tanaab-based release preparation, changelog authoring, readiness review, and release contract work. Use when a user wants release notes, CHANGELOG updates, release-facing metadata decisions, or a release readiness summary.

## When to Use

- Draft or update release notes and `CHANGELOG.md`.
- Review release readiness across implementation, testing, and workflow evidence.
- Decide which files, artifacts, or metadata belong to the release contract.
- Summarize user-visible release scope without taking ownership of implementation or workflow mechanics.

## When Not to Use

- Do not use this skill for raw implementation work that does not affect release preparation.
- Do not use this skill for workflow mechanics or deployment wiring; keep those on the workflow surface.
- Do not publish, tag, or push a release unless the user explicitly asks for it.

## Preconditions

- Confirm the target release surface: changelog, release notes, metadata, readiness, or release contract.
- Confirm which evidence already exists and which companion surfaces still need to be consulted.
- When `CHANGELOG.md` is in scope, confirm whether the repo follows the shared `prepare-release-action` contract and preserve its leading unreleased heading exactly when it does.

## Workflow

1. Confirm the task is release-led rather than implementation- or workflow-led.
2. Decide the release contract before proposing workflow or automation changes.
3. When editing `CHANGELOG.md`, preserve or create the leading `prepare-release-action` unreleased heading exactly, with `{{ UNRELEASED_VERSION }}` followed by the unreleased date token linked through `{{ UNRELEASED_LINK }}`.
4. Build the release change set from tags, commit history, and changed files.
5. Draft concise user-facing release narrative and call out any missing readiness evidence explicitly.

## Checkpoints

- Pause when release readiness depends on missing test evidence, workflow behavior, or unpublished artifacts.
- Hand implementation or workflow mechanics back to the owning skill instead of absorbing them into release narrative.

## Completion Criteria

- Define the intended release contract, the user-visible changes, and the current readiness state.
- Keep the `CHANGELOG.md` unreleased heading aligned with `prepare-release-action` when that release contract is in scope.
- Make any missing gates, approvals, or follow-up work explicit before closing.

## Bundled Resources

- No additional local canon files are required by default. Use the target repo's release inputs, changelog surface, and current change evidence.

## Validation

- Confirm the task stayed on release notes, changelog, readiness, or release contract surfaces.
- Confirm `CHANGELOG.md` keeps the leading `prepare-release-action` unreleased heading, using `{{ UNRELEASED_VERSION }}`, `{{ UNRELEASED_DATE }}`, and `{{ UNRELEASED_LINK }}` in the expected linked heading shape.
- Confirm release narrative is concise, user-facing, and free of workflow-mechanics drift.
- Confirm no publish, tag, or push action is taken unless the user explicitly requested it.
