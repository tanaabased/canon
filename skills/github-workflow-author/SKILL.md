---
name: tanaab-github-workflow-author
description: Tanaab-based authoring and standardization of GitHub Actions workflow surfaces. Use when a user wants to create or update workflow YAML where the workflow graph itself is the owned artifact, including reusable workflows, permissions, triggers, or CI job structure.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - github-actions
  openclaw:
    emoji: '🔀'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/github-workflow-author
---

# GitHub Workflow Author

## Overview

Tanaab-based authoring and standardization of GitHub Actions workflow surfaces. Use when a user wants to create or update workflow YAML where the workflow graph itself is the owned artifact, including reusable workflows, permissions, triggers, or CI job structure.

- Keep this skill focused on workflow topology, reusable boundaries, trigger shape, permissions, and gate placement.
- Treat workflow-file boundaries and resulting status-check identities as part of the topology, not as incidental file organization.
- Let coding and integration skills own their canonical surface-local validation or deployment workflows when the workflow only serves that narrower lifecycle and no independent workflow-graph decision is in scope.

## When to Use

- Create or update GitHub Actions workflow YAML, reusable workflows, permissions, triggers, or job structure.
- Standardize Bun-based workflow wiring such as `oven-sh/setup-bun`, `bun-version-file`, and `bun install --frozen-lockfile --ignore-scripts` when the workflow graph still owns the change.
- Standardize Homebrew-backed dependency installation on GitHub-hosted runners when the workflow controls automatic update behavior or runner freshness.
- Add or reshape CI gates, smoke workflows, release workflows, matrices, or reusable-workflow boundaries when the primary owned surface is the workflow graph itself.
- Update repository-local GitHub Actions workflow conventions without taking ownership of runtime code or CI triage.

## When Not to Use

- Do not use this skill for GitHub-hosted CI triage of failing checks; keep that separate from authoring.
- Do not use this skill for GitHub Action product code, `action.yml`, or committed runtime artifacts.
- Do not use this skill for a coding or integration skill's canonical surface-local validation or deployment lifecycle when the request does not introduce independent topology, permission, trigger, matrix, or reusable-workflow decisions.
- Do not use this skill for shell-step internals or application runtime changes unless the workflow surface still clearly owns the task.

## Prerequisites

- Confirm required tools, services, auth, and local setup before acting.
- State missing dependencies or access early.

## Inputs

- Identify the workflow files, job surfaces, triggers, permissions, and runner assumptions up front.
- Note when auth or `gh` access is required, but keep authoring work separate from triage work.

## Outputs

- Define the expected workflow file changes, added or removed jobs, and the intended CI or release gates.
- Note when a workflow change depends on another owned surface such as shell step logic, action runtime code, or release narrative.

## Failure Handling

- Do not hide missing auth, missing tools, or GitHub-side limitations when they block validation.
- When workflow authoring depends on another owned surface, surface the handoff explicitly instead of absorbing it here.

## Workflow

1. Confirm the request is workflow-authoring-led rather than triage- or runtime-led.
2. Load the target workflow YAML plus the Bun-first defaults from [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) when JavaScript runtime wiring matters. Load [Homebrew Freshness in GitHub Actions](references/homebrew-ci-freshness.md) when Homebrew-backed dependency installation is in scope.
3. Keep workflow ownership on independent trigger or permission design, workflow-file boundaries, status-check identity, job topology, matrix shape, reusable workflow boundaries, and CI gate placement. Preserve canonical workflow filenames named by narrower skills, apply the shared pull-request gate defaults when multiple validation surfaces are present, and preserve those skills' surface-local lifecycles.
4. Require workflows that generate or rewrite tracked files to run the applicable formatter and validation after the mutation and before committing, syncing, or pushing the result.
5. Validate the changed workflow files and surface any unverified remote behavior explicitly.

## Optimization

- **Inspect:** Inventory workflow-file boundaries, status-check identities, triggers, permissions, action versions, runtime and package-manager freshness, job topology, matrices, reusable calls, duplication, validation gates, and tracked-file mutations with their post-mutation checks.
- **Compare:** Reconcile workflow boundaries, triggers, permissions, action versions, jobs, matrices, reusable calls, and validation gates with the workflow contract; identify contradictory paths, duplicated steps, independently owned gates consolidated into one file, overloaded jobs, misplaced responsibilities, stale wiring, implicit Homebrew update behavior or disabled automatic updates without an explicit freshness check, and tracked-file mutations that lack post-mutation formatting or validation.
- **Recommend:** Keep valid workflows; split independent lint, unit-test, and other gate surfaces when their commands, runners, matrices, ownership, or status identities differ; deduplicate repeated steps; consolidate truly reusable paths; move product logic to its owner; tighten permissions and gates; and remove stale wiring without manufacturing edits.
- **Apply:** After explicit authorization, make the smallest coherent graph operations while preserving the boundaries of runtime code and GitHub Action product surfaces.
- **Verify:** Validate syntax and available local checks, then identify any behavior that can only be proven by the remote runner.

## Bundled Resources

- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first workflow defaults and GitHub Action repo defaults
- [Homebrew Freshness in GitHub Actions](references/homebrew-ci-freshness.md): Homebrew client and metadata freshness when automatic updates are disabled in CI

## Validation

- Confirm the task stayed on workflow YAML, triggers, permissions, reusable workflow boundaries, matrix or job topology, or gate placement.
- Confirm the skill did not absorb a narrower surface's canonical validation or deployment lifecycle when no independent trigger, permission, matrix, reusable-workflow, or gate-placement decision was actually in scope.
- Confirm independent pull-request gates use separate workflow files when their commands, runners, matrices, failure owners, or required-check identities differ, with any combined exception justified by shared operational ownership.
- Confirm Windows runners appear only when explicitly requested by the user or repository policy, and use a supported versioned runner label rather than `windows-latest`.
- Confirm Bun-based workflows use `oven-sh/setup-bun@v2`, `bun-version-file: .bun-version`, and `bun install --frozen-lockfile --ignore-scripts` unless the repo explicitly needs another path.
- Confirm workflows that install through Homebrew set `HOMEBREW_NO_AUTO_UPDATE` to `1` at workflow or job scope and run `brew update-if-needed` with an empty command-scoped value on every Homebrew-using runner, unless Homebrew is separately pinned or refreshed.
- Validate the changed workflow files with the narrowest reliable local or repo-native checks.
- Surface unverified runner behavior instead of pretending local inspection fully proved it.
