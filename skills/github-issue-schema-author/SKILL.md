---
name: tanaab-github-issue-schema-author
description: Tanaab-based read-only GitHub issue schema and repository label alignment inspection. Use when a user wants to compare one organization-backed repository's issue types, fields, pinning, visibility, and labels with the canonical task-management policy without writing to GitHub.
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

Inspect one explicit GitHub repository's issue types, organization fields, type pinning, field visibility, and repository labels against the shared Tanaab task-management schema. This first version is deliberately read-only: it reports exact drift but never changes GitHub.

## When to Use

- Use when a user wants to inspect or compare GitHub issue schema for an explicit `OWNER/REPO`.
- Use before planning issue-field, issue-type, pinning, visibility, or canonical-label alignment.
- Use to determine whether a repository is aligned, missing definitions, drifted, needs a separately authorized migration, or cannot be fully inspected.

## When Not to Use

- Do not use for authoring or normalizing an individual task; use Task Author.
- Do not use for task-completion assessment; use Task Completion Check.
- Do not create, update, rename, migrate, or delete GitHub state. This version has no apply mode.
- Do not infer a repository from the working directory. Require an explicit target.

## Prerequisites

- Require Bun and the GitHub CLI (`gh`).
- Verify GitHub CLI availability and authentication without exposing credentials.
- Treat private repositories and organization schema as permission-sensitive. Preserve partial read results and mark inaccessible surfaces unresolved.

## Inputs

- Required: one explicit `OWNER/REPO` or GitHub repository URL.
- Optional: `--json` for the complete machine-readable report.
- Canonical policy: [`../../references/task-management-schema.json`](../../references/task-management-schema.json).
- Human contract: [`../../references/task-management-contract.md`](../../references/task-management-contract.md).

## Outputs

- Return one report with `aligned`, `missing`, `drifted`, `migration_required`, or `unresolved` findings.
- Report organization issue types separately from repository-effective issue types.
- Report managed fields, options, visibility, Task/Bug/Feature pinning, canonical labels, unmanaged labels, automation-owned labels, and association counts.
- Classify GitHub's default `Effort` field as `preserved_unmanaged`. `Work size` is a distinct managed field; never rename, map, delete, or infer it from Effort.
- Report organization-default labels as `manual`: GitHub exposes the setting to humans but has no public API that lists its current definitions.
- Produce no GitHub changes and no mutation plan in this inspect-only version.

## Failure Handling

- Stop if the repository itself cannot be resolved or inspected.
- Preserve usable repository data when GitHub returns a partial GraphQL response.
- Mark a hidden field, type, or label surface `unresolved`; do not convert lack of access into a missing-schema claim.
- Mark organization field and type surfaces `not_applicable` for personal repositories while still comparing repository labels.
- Never compensate for a read failure by attempting a write or a broader authorization flow.

## Workflow

1. Resolve and validate the explicit target.
2. Read the canonical schema policy and no unrelated project canon.
3. Verify `gh` availability and authentication status.
4. Run the bundled inspection command:

   ```bash
   bun skills/github-issue-schema-author/scripts/inspect-schema.js inspect OWNER/REPO --json
   ```

5. Compare organization definitions, repository-effective definitions, fields, pinning, visibility, and all repository labels.
6. Present exact findings and preserve all unmanaged state. Explain that organization-default labels require manual inspection.
7. If changes are warranted, hand off a proposed future alignment task; do not implement it through this version.

## Optimization

Use the shared operation lenses—**keep**, **reconcile**, **deduplicate**, **consolidate/merge**, **split**, **extract**, **move**, **tighten**, and **remove**—only where they fit this integration surface; do not manufacture changes to satisfy the list.

- **Inspect:** Resolve the exact target, prerequisites, authorization, and current local or remote state through read-only operations first.
- **Compare:** Normalize current and canonical state into an exact managed diff, reconcile conflicting representations, and distinguish duplicated management paths or coupled effects while keeping unmanaged fields out of scope.
- **Recommend:** Preserve aligned and unmanaged state; prioritize confirmed drift, safe consolidation or separation of effects, tighter authorization, and removal only where the managed contract requires it.
- **Apply:** Unavailable in this inspect-only version. Create a separately reviewed implementation before enabling any mutation path.
- **Verify:** Re-run the read-only inspection after an independently authorized change and report remaining drift or remote uncertainty.

## Bundled Resources

- `scripts/inspect-schema.js`: non-interactive inspect-only entrypoint.
- `lib/github-schema-client.js`: injected read-only GraphQL boundary.
- `lib/schema-inspector.js`: deterministic comparison orchestration.
- `utils/`: target parsing, comparison, classification, status, and rendering units.
- `test/`: fake GitHub responses and deterministic schema fixtures.

## Validation

- Run `bunx mocha "skills/github-issue-schema-author/test/**/*.spec.js"`.
- Run Skill Author validation against this directory.
- Run repository test, lint, `codex:validate`, and `codex:check` gates.
- Before the first installed-cache invocation, run `bun run codex:sync` followed by `bun run codex:check`.
- Perform one live read-only inspection of an explicit repository and verify `mutatesGitHub: false` and an empty `operations` array.
