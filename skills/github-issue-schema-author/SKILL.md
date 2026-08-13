---
name: tanaab-github-issue-schema-author
description: Tanaab-based GitHub issue schema inspection and additive field creation. Use when a user wants to compare one repository with the canonical task-management policy or safely add its missing Work size, Complexity, Impact, and Task score organization fields.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - project-management
  openclaw:
    emoji: '🧩'
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/github-issue-schema-author'
---

# GitHub Issue Schema Author

## Overview

Inspect one explicit GitHub repository's issue types, organization fields, type pinning, field visibility, and repository labels against the shared Tanaab task-management schema. An additive mode may create only missing Work size, Complexity, Impact, and Task score fields for the repository's organization after exact digest-bound authorization and post-write verification.

This version exposes no update or delete path. Existing fields, options, visibility, type pinning, issue types, labels, and Effort always remain read-only.

## When to Use

- Use when a user wants to inspect or compare GitHub issue schema for an explicit `OWNER/REPO`.
- Use before planning issue-field, issue-type, pinning, visibility, or canonical-label alignment.
- Use to determine whether a repository is aligned, missing definitions, drifted, needs a separately authorized migration, or cannot be fully inspected.
- Use additive mode when an organization owner explicitly authorizes creation of the four missing canonical fields without changing any existing state.

## When Not to Use

- Do not use for authoring or normalizing an individual task; use Task Author.
- Do not use for task-completion assessment; use Task Completion Check.
- Do not update, rename, migrate, pin, change visibility on, or delete GitHub state.
- Do not create issue types, labels, Priority, Start date, Target date, or any field outside Work size, Complexity, Impact, and Task score.
- Do not infer a repository from the working directory. Require an explicit target.

## Prerequisites

- Require Bun and the GitHub CLI (`gh`).
- Verify GitHub CLI availability and authentication without exposing credentials.
- Treat private repositories and organization schema as permission-sensitive. Preserve partial read results and mark inaccessible surfaces unresolved.
- Additive mode requires an organization administrator or a token with organization Issue Fields write permission.

## Inputs

- Required: one explicit `OWNER/REPO` or GitHub repository URL.
- Optional: `--json` for the complete machine-readable report.
- Additive planning: `bun <skill-path>/scripts/add-fields.js plan OWNER/REPO --json`.
- Additive apply: rerun with `apply`, the exact `--approved-organization`, and the previewed `--approved-digest`.
- Canonical policy: [`../../references/task-management-schema.json`](../../references/task-management-schema.json).
- Human contract: [`../../references/task-management-contract.md`](../../references/task-management-contract.md).

## Outputs

- Return one report with `aligned`, `missing`, `drifted`, `migration_required`, or `unresolved` findings.
- Report organization issue types separately from repository-effective issue types.
- Report managed fields, options, visibility, Task/Bug/Feature pinning, canonical labels, unmanaged labels, automation-owned labels, and association counts.
- Classify GitHub's default `Effort` field as `preserved_unmanaged`. `Work size` is a distinct managed field; never rename, map, delete, or infer it from Effort.
- Report organization-default labels as `manual`: GitHub exposes the setting to humans but has no public API that lists its current definitions.
- Inspect mode produces no GitHub changes and no mutation plan.
- Additive planning returns `approval_required` with four or fewer exact POST operations, an organization-bound digest, and empty update and deletion lists.
- Additive apply returns `added` only after every created definition verifies; `partial` preserves successful additions after a later failure; `failed` means no field is known to have been created; and `aligned` is an idempotent no-op.

## Failure Handling

- Stop if the repository itself cannot be resolved or inspected.
- Preserve usable repository data when GitHub returns a partial GraphQL response.
- Mark a hidden field, type, or label surface `unresolved`; do not convert lack of access into a missing-schema claim.
- Mark organization field and type surfaces `not_applicable` for personal repositories while still comparing repository labels.
- Never compensate for a read failure by attempting a write or a broader authorization flow.
- Stop before mutation if field absence is unproven, the owner is not an organization, the organization or digest differs, or the plan contains anything except the allowed create operations.
- Stop on the first failed create. Never delete a successfully created field to simulate rollback; re-read and report partial success instead.

## Workflow

1. Resolve and validate the explicit target.
2. Read the canonical schema policy and no unrelated project canon.
3. Verify `gh` availability and authentication status.
4. For read-only inspection, run:

   ```bash
   bun skills/github-issue-schema-author/scripts/inspect-schema.js inspect OWNER/REPO --json
   ```

5. Compare organization definitions, repository-effective definitions, fields, pinning, visibility, and all repository labels.
6. Present exact findings and preserve all unmanaged state. Explain that organization-default labels require manual inspection.
7. For additive fields, run the bundled plan command and review the complete field names, descriptions, types, visibility, options, organization, digest, and explicit empty update and deletion lists.
8. After authorization for that exact organization and digest, run additive apply. It creates fields sequentially through the organization issue-field POST endpoint and stops on the first failure.
9. Re-read organization fields and verify names, descriptions, types, public visibility, and ordered select options. Report any remaining pinning, visibility, label, type, or unmanaged drift without changing it.

## Optimization

Use the shared operation lenses—**keep**, **reconcile**, **deduplicate**, **consolidate/merge**, **split**, **extract**, **move**, **tighten**, and **remove**—only where they fit this integration surface; do not manufacture changes to satisfy the list.

- **Inspect:** Resolve the exact target, prerequisites, authorization, and current local or remote state through read-only operations first.
- **Compare:** Normalize current and canonical state into an exact managed diff, reconcile conflicting representations, and distinguish duplicated management paths or coupled effects while keeping unmanaged fields out of scope.
- **Recommend:** Preserve aligned and unmanaged state; prioritize confirmed drift, safe consolidation or separation of effects, tighter authorization, and removal only where the managed contract requires it.
- **Apply:** Add only the four proven-missing canonical fields after exact authorization. Keep updates, deletions, existing-field corrections, pinning, labels, and issue types unavailable.
- **Verify:** Re-run the read-only inspection after an independently authorized change and report remaining drift or remote uncertainty.

## Bundled Resources

- `scripts/inspect-schema.js`: non-interactive inspect-only entrypoint.
- `scripts/add-fields.js`: digest-gated additive field entrypoint.
- `lib/github-schema-client.js`: injected read-only GraphQL boundary.
- `lib/github-field-addition-client.js`: narrow organization-field POST boundary.
- `lib/schema-inspector.js`: deterministic comparison orchestration.
- `lib/schema-field-adder.js`: additive planning, authorization, mutation, and verification orchestration.
- `utils/`: target parsing, comparison, classification, status, and rendering units.
- `test/`: fake GitHub responses and deterministic schema fixtures.

## Validation

- Run `bunx mocha "skills/github-issue-schema-author/test/**/*.spec.js"`.
- Run Skill Author validation against this directory.
- Run repository test, lint, `codex:validate`, and `codex:check` gates.
- Before the first installed-cache invocation, run `bun run codex:sync` followed by `bun run codex:check`.
- Perform one live read-only inspection of an explicit repository and verify `mutatesGitHub: false` and an empty `operations` array.
- Exercise live additive mode only after an organization owner explicitly authorizes the complete digest-bound plan. Confirm it contains no updates or deletions, then verify the installed skill is idempotent after creation.
