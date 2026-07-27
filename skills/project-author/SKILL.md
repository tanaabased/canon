---
name: tanaab-project-author
description: Tanaab-based creation and canonical settings synchronization for GitHub-backed projects. Use when a user wants to create, inspect, or synchronize the repository that represents a project.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - project-management
  openclaw:
    emoji: '🏗️'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/project-author
    requires:
      bins:
        - bun
        - gh
---

# Project Author

## Overview

Tanaab-based creation and canonical settings synchronization for GitHub-backed projects. Use when a user wants to create, inspect, or synchronize the repository that represents a project.

This skill owns one project-container policy surface implemented through GitHub repositories. Creation and synchronization are two modes over the same checked-in desired state, not separate skills.

## When to Use

- Create the explicit `OWNER/REPO` that represents a project with the canonical Tanaab GitHub settings.
- Inspect an existing repository and show only managed-setting drift.
- Synchronize an existing repository after the user reviews and confirms the exact diff.

## When Not to Use

- Do not use this skill for repository contents, templates, secrets, webhooks, environments, Actions policy, security settings, or rulesets.
- Do not create or manage tasks, project milestones, releases, or GitHub Projects boards through this skill.
- Do not change visibility, description, homepage, topics, template/archive state, Pages, other collaborators, or other unmanaged settings on an existing repository.
- Do not use it for ordinary local Git initialization or cloning without GitHub repository-policy intent.

## Prerequisites

- Require an explicit GitHub slug in `OWNER/REPO` form; never infer a mutation target from a nearby checkout.
- Confirm `gh` is installed, authenticated to the intended GitHub host, and authorized to administer the target owner and repository.
- On macOS, confirm the tool shell resolves the intended Homebrew `gh`; prefer a non-login tool shell when login startup files place stale `/usr/local/bin` tools before `/opt/homebrew/bin`.
- If sandboxed `gh auth status` disagrees with the interactive terminal, retry the read-only probe with Keychain access before declaring authentication invalid.
- Load [the checked-in policy](./references/canonical-repository-settings.json) as the only runtime source of desired settings. Do not recapture policy from the live `tanaabased/canon` repository.

## Inputs

- Required: one explicit project slug in `OWNER/REPO` form and one intent: inspect, create, or synchronize.
- Resolve [the bundled entrypoint](./scripts/repository-policy.js) relative to this `SKILL.md`, then run `bun <resolved-path> inspect OWNER/REPO --json` to get normalized state and a stable diff.
- After the user authorizes the displayed mutation, run the same entrypoint with `apply OWNER/REPO --json`; add `--initialize` only for an existing empty repository or `--rename-default` only after separate approval to rename a non-`main` default branch.
- Run the entrypoint with `create OWNER/REPO --json` only when inspection reports `missing` and creation of that exact slug is authorized.

## Outputs

- `inspect` returns `missing`, `aligned`, or `drifted`, plus sorted `current -> desired` changes and any required branch action. It never writes.
- `create` creates a public repository with an initial `README.md`, then applies and verifies the policy.
- `apply` updates only managed General settings, `tanaabot` access, and classic `main` protection, then returns a fresh aligned report.
- For user review, render every reported change before synchronization. Explicitly call out removals such as cleared required checks.

## Failure Handling

- Stop without writing on missing `gh`, failed authentication, invalid slugs, inspection errors, or missing administration access.
- If an existing non-empty repository lacks `main`, explain that renaming the current default branch affects clones and workflow references. Require separate approval before passing `--rename-default`.
- If an existing empty repository lacks `main`, require approval to create its initial `README.md` before passing `--initialize`.
- Treat a pending `tanaabot` invitation as incomplete configuration. Do not claim success or continue to branch protection until effective `write` access is visible.
- Never delete a repository to roll back partial creation. Report completed steps and the exact failure; rerun inspection and converge from the remaining drift.

## Workflow

1. Validate the explicit slug and prerequisites, then run read-only `inspect --json`.
2. If `aligned`, report that no write is needed. If the intent is audit-only, return the diff and stop.
3. If `missing`, show the public-plus-README creation preview. Treat an unambiguous request to create that exact slug as authorization; otherwise confirm before `create`.
4. If `drifted`, show every managed change and ask whether to apply it. Never invoke `apply` before this post-diff confirmation.
5. Resolve a reported branch action first and only with its dedicated flag and approval. The helper then patches General settings, grants `tanaabot` write access, applies classic protection, disables signature protection when needed, and re-inspects.
6. Finish only when the fresh report is `aligned`; otherwise return the remaining drift and partial-operation details.

## Optimization

- **Inspect:** Resolve an explicit `OWNER/REPO` and use the bundled read-only inspection path to collect managed repository settings; never infer a remote target.
- **Compare:** Reconcile normalized current state with the checked-in canonical policy and report an exact managed diff, including contradictory or extra managed values, while leaving unmanaged settings out of scope.
- **Recommend:** Keep aligned and unmanaged state; correct confirmed managed drift; remove extra managed configuration where canonical exactness requires it; and treat content deduplication, consolidation, splitting, and extraction as not applicable to this remote policy surface.
- **Apply:** After the user confirms the exact diff, mutate only approved managed fields and obtain separate confirmation for branch renames or other distinct effects.
- **Verify:** Re-inspect the repository and report aligned, remaining, pending-invitation, or partial-failure state explicitly.

## Bundled Resources

- [./references/canonical-repository-settings.json](./references/canonical-repository-settings.json): versioned desired state captured from `tanaabased/canon`
- [./scripts/repository-policy.js](./scripts/repository-policy.js): non-interactive Bun entrypoint for inspect, create, and apply operations
- [./lib/repository-policy-client.js](./lib/repository-policy-client.js): GitHub API orchestration over an injected command boundary
- [./utils/](./utils/): focused slug, diff, protection-normalization, argument, rendering, and `gh` process units
- [./test/](./test/): scope-local direct unit, library-boundary, command-wrapper, and fake-GitHub coverage

## Validation

- Confirm inspection is read-only and mutation commands never prompt on their own; the skill owns authorization.
- Confirm existing unmanaged settings and unrelated collaborators remain untouched.
- Confirm exact managed drift includes extra required checks and stricter managed protection as removals.
- Run the focused unit spec and the skill validator before broader repo checks.
- Run a read-only inspection of `tanaabased/canon`; it must report `aligned` against the checked-in policy.
