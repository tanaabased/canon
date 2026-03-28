---
name: tanaab-github-workflow-author
description: Tanaab-based authoring and standardization of GitHub Actions workflow surfaces. Use when a user wants to create or update workflow YAML, reusable workflows, permissions, triggers, CI job structure, or Bun-based workflow wiring.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - github-actions
---

# GitHub Workflow Author

## Overview

Tanaab-based authoring and standardization of GitHub Actions workflow surfaces. Use when a user wants to create or update workflow YAML, reusable workflows, permissions, triggers, CI job structure, or Bun-based workflow wiring.

## When to Use

- Create or update GitHub Actions workflow YAML, reusable workflows, permissions, triggers, or job structure.
- Standardize Bun-based workflow wiring such as `oven-sh/setup-bun`, `bun-version-file`, and `bun install --frozen-lockfile --ignore-scripts`.
- Add or reshape CI gates, smoke workflows, or release workflows when the primary owned surface is the workflow graph itself.
- Update repository-local GitHub Actions workflow conventions without taking ownership of runtime code or CI triage.

## When Not to Use

- Do not use this skill for GitHub-hosted CI triage of failing checks; keep that separate from authoring.
- Do not use this skill for GitHub Action product code, `action.yml`, or committed runtime artifacts.
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
2. Load the target workflow YAML plus the Bun-first defaults from [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) when JavaScript runtime wiring matters.
3. Keep workflow ownership on triggers, permissions, job topology, reusable workflow boundaries, and CI gate placement.
4. Validate the changed workflow files and surface any unverified remote behavior explicitly.

## Bundled Resources

- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first workflow defaults and GitHub Action repo defaults

## Validation

- Confirm the task stayed on workflow YAML, triggers, permissions, reusable workflow boundaries, or gate placement.
- Confirm Bun-based workflows use `oven-sh/setup-bun@v2`, `bun-version-file: .bun-version`, and `bun install --frozen-lockfile --ignore-scripts` unless the repo explicitly needs another path.
- Validate the changed workflow files with the narrowest reliable local or repo-native checks.
- Surface unverified runner behavior instead of pretending local inspection fully proved it.
