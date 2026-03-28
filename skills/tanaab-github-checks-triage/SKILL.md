---
name: tanaab-github-checks-triage
description: Tanaab-based triage of GitHub-hosted CI failures. Use when a user wants to inspect failing PR checks, review GitHub Actions logs, summarize the failure, and propose a focused fix plan before implementation.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - github-actions
---

# GitHub Checks Triage

## Overview

Tanaab-based triage of GitHub-hosted CI failures. Use when a user wants to inspect failing PR checks, review GitHub Actions logs, summarize the failure, and propose a focused fix plan before implementation.

## When to Use

- Inspect failing GitHub PR checks and summarize what broke.
- Pull GitHub Actions logs and extract a concise failure snippet before proposing a fix.
- Resolve the current PR or use a supplied PR number or URL, then inspect failing checks before touching code.
- Use the bundled inspection helper when the task is specifically GitHub-hosted CI triage.

## When Not to Use

- Do not use this skill for workflow authoring or YAML changes unless the task starts as triage and then explicitly approves a fix plan.
- Do not use this skill for external CI providers.
- Do not apply code changes immediately in triage mode before inspecting the failing checks and getting approval on a fix plan.

## Prerequisites

- Confirm `gh` is installed and authenticated for the target repo.
- Confirm the failing provider is GitHub Actions before attempting deep log inspection.
- Confirm the repo path and PR target before pulling logs.

## Inputs

- Accept a PR number or URL when one is supplied; otherwise resolve the current branch PR.
- Use the repo path, PR target, and optional output mode (`--json`) explicitly.
- Make the run URL, failing check name, and relevant log snippet part of the working inputs for the summary.

## Outputs

- Produce a concise triage summary with the failing check name, run URL, and a useful failure snippet.
- Draft a focused fix plan and pause for approval before implementation.
- Report missing logs or external-provider boundaries explicitly instead of guessing.

## Failure Handling

- Do not hide missing auth, missing `gh`, missing PR resolution, or missing logs.
- If the failing provider is external rather than GitHub Actions, surface the details URL and stop there.
- Treat “no failing checks detected” as a valid terminal result rather than manufacturing a fix plan.

## Workflow

1. Confirm the task is GitHub-hosted CI triage rather than workflow authoring.
2. Resolve the target PR and run the bundled inspection helper against the target repo.
3. Summarize the failing checks, run URLs, and useful failure snippets.
4. Draft a focused fix plan and stop before implementation until the user approves the next step.

## Bundled Resources

- [./scripts/inspect-pr-checks.py](./scripts/inspect-pr-checks.py): fetch failing PR checks, pull GitHub Actions logs, and extract failure snippets
- [./references/inspect-pr-checks-license.txt](./references/inspect-pr-checks-license.txt): license file for the bundled inspection helper
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first workflow defaults for reading triage context, not for replacing the triage flow itself

## Validation

- Confirm the task stayed on GitHub Actions triage rather than drifting into workflow authoring.
- Confirm the summary includes the failing check name, run URL, and useful failure snippet when available.
- Confirm no code changes are applied before approval when the task started in triage mode.
- Validate the bundled inspection helper with the narrowest reliable local check before relying on it.
