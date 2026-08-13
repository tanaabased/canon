---
name: tanaab-github-issue-schema-author
description: Tanaab-based GitHub issue schema inspection and bounded synchronization. Use when a user wants to compare one repository with canonical task policy, add missing fields, synchronize retained option colors, align field pinning or visibility, or synchronize canonical label definitions without deletions.
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

Inspect one explicit GitHub repository's issue types, organization fields, type pinning, field visibility, option colors, and repository labels against the shared Tanaab task-management schema. Bounded modes add only missing managed fields, replace only retained option colors, set only managed-field visibility, create or update only canonical repository-label definitions, or prepare the exact managed-field associations that must be saved through GitHub's organization settings UI.

Every mutation requires exact digest-bound authorization and post-write verification. Visibility and labels are separately authorized from other schema effects. Label sync preserves associations and every noncanonical label; field modes preserve unmanaged fields, including Effort. GitHub's public APIs expose pin state but no pin-assignment mutation, so never call the private web endpoint directly. This version exposes no deletion path.

## When to Use

- Use when a user wants to inspect or compare GitHub issue schema for an explicit `OWNER/REPO`.
- Use before planning issue-field, issue-type, pinning, visibility, or canonical-label alignment.
- Use to determine whether a repository is aligned, missing definitions, drifted, needs a separately authorized migration, or cannot be fully inspected.
- Use additive mode when an organization owner explicitly authorizes creation of the four missing canonical fields without changing any existing state.
- Use color mode when an organization owner explicitly authorizes the exact canonical color diff for the three managed single-select fields.
- Use pinning mode when an organization owner explicitly authorizes the exact managed field-to-type associations for Task, Bug, and Feature.
- Use visibility mode when an organization owner explicitly authorizes only the managed fields whose visibility differs from the canonical organization-members-only policy.
- Use label mode when a repository maintainer explicitly authorizes creation or definition-only updates for the canonical repository labels.

## When Not to Use

- Do not use for authoring or normalizing an individual task; use Task Author.
- Do not use for task-completion assessment; use Task Completion Check.
- Do not rename, migrate, or delete GitHub state.
- Do not update field or option names, descriptions, types, option order, or option membership; the only update path changes colors while retaining option IDs.
- Do not change pinning for Effort or any other unmanaged field, pin managed fields to issues without a type, or change pinned-field ordering.
- Do not call GitHub's private organization-settings endpoint from a script, CLI, or copied browser request.
- Do not create issue types, Priority, Start date, Target date, or any field outside Work size, Complexity, Impact, and Task score. Label mode may create only canonical repository labels.
- Do not infer a repository from the working directory. Require an explicit target.

## Prerequisites

- Require Bun and the GitHub CLI (`gh`).
- Verify GitHub CLI availability and authentication without exposing credentials.
- Treat private repositories and organization schema as permission-sensitive. Preserve partial read results and mark inaccessible surfaces unresolved.
- Additive mode requires an organization administrator or a token with organization Issue Fields write permission.
- Field-definition changes, including visibility and pinning, require an organization owner or equivalent organization Issue Fields write permission. Applying a pinning plan also requires a signed-in browser session with that access.
- Setting a field value on an individual issue is separate from schema management and requires triage access or greater to that repository. Canonical field visibility exposes values to organization members and repository collaborators with read access or greater; it does not grant value-editing or schema-editing permission.

## Inputs

- Required: one explicit `OWNER/REPO` or GitHub repository URL.
- Optional: `--json` for the complete machine-readable report.
- Additive planning: `bun <skill-path>/scripts/add-fields.js plan OWNER/REPO --json`.
- Additive apply: rerun with `apply`, the exact `--approved-organization`, and the previewed `--approved-digest`.
- Color planning: `bun <skill-path>/scripts/recolor-fields.js plan OWNER/REPO --json`.
- Color apply: rerun with `apply`, the exact `--approved-organization`, and the previewed `--approved-digest`.
- Visibility planning and apply: use `scripts/set-field-visibility.js`, with a separate exact organization and digest approval.
- Label planning and apply: use `scripts/sync-labels.js`, with the exact `--approved-repository` and previewed digest.
- Pinning planning: `bun <skill-path>/scripts/pin-fields.js plan OWNER/REPO --json`.
- Pinning authorization: rerun with `authorize`, the exact `--approved-organization`, and the previewed `--approved-digest`; then execute only that manifest through GitHub's signed-in organization settings UI.
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
- Color planning returns `approval_required` with zero to three exact PATCH operations, empty create and deletion lists, all retained option identities, and each current-to-canonical color change.
- Color apply returns `updated` only after every field and option property verifies; `partial` preserves an earlier successful recolor after a later failure; `failed` means no field is known to have changed; and `aligned` is an idempotent no-op.
- Pinning planning returns `approval_required` with exact browser URLs, current and desired type sets, projected per-type field counts, empty create and deletion lists, and a digest bound to the complete manifest.
- Pinning authorization returns `ready_for_browser` without writing. After browser execution, a fresh plan must return `aligned`; otherwise stop and report the remaining partial drift.
- Visibility apply returns `updated` only when each complete field snapshot verifies with no change outside `visibility`.
- Label apply returns `updated` only when every canonical definition and retained association count verifies; noncanonical labels remain untouched.

## Failure Handling

- Stop if the repository itself cannot be resolved or inspected.
- Preserve usable repository data when GitHub returns a partial GraphQL response.
- Mark a hidden field, type, or label surface `unresolved`; do not convert lack of access into a missing-schema claim.
- Mark organization field and type surfaces `not_applicable` for personal repositories while still comparing repository labels.
- Never compensate for a read failure by attempting a write or a broader authorization flow.
- Stop before mutation if field absence is unproven, the owner is not an organization, the organization or digest differs, or the plan contains anything except the allowed create operations.
- Stop on the first failed create. Never delete a successfully created field to simulate rollback; re-read and report partial success instead.
- Stop color synchronization if any field is missing or has a different type, option membership, order, ID, or priority. Never use color synchronization to add, remove, recreate, or reorder an option.
- Stop on the first failed color update. Never roll back a successful update by issuing an unplanned second replacement; re-read and report partial success instead.
- Stop pinning if a managed field or Task/Bug/Feature is missing, a field migration is required, pin state is unresolved, a numeric settings-page field ID cannot be resolved, or the projected result exceeds GitHub's ten-field limit for a type.
- Stop on the first failed browser save. Do not retry through a private endpoint or change any field property outside the authorized pin selection; re-read and report partial success instead.
- Stop visibility sync if any managed field is missing or lacks a numeric REST ID. PATCH only `visibility`, stop on the first failure, and verify the entire field snapshot.
- Stop label sync when labels cannot be fully inspected. Never rename or delete a label, and verify association counts after definition updates.

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
9. Re-read organization fields and verify names, descriptions, types, organization-members-only visibility, and ordered select options. Report any remaining pinning, visibility, label, type, or unmanaged drift without changing it.
10. For canonical colors, run the bundled color plan and confirm it retains every option ID, name, description, and priority while changing only the displayed colors.
11. After authorization for that exact organization and digest, run color apply. Re-read through the organization REST field surface and verify every preserved field and option property plus each requested color.
12. For canonical pinning, run the bundled pin plan and confirm its only updates replace managed field associations with Task, Bug, and Feature, leave issues without a type unselected, preserve unmanaged pins, and project no more than ten fields per type.
13. After authorization for that exact organization and digest, rerun with `authorize`. For each operation, open its exact GitHub Settings URL in a signed-in browser, select only the planned types, save the field without changing any other control, and stop on the first failed save.
14. Rerun the pin plan. Report success only when it returns `aligned`; otherwise report the remaining partial drift and do not retry through GitHub's private web endpoint.
15. Plan visibility and labels separately. For each, show the exact bounded operations and digest, obtain its own authorization, stop on the first failed write, and re-read the complete affected surface.

## Optimization

Use the shared operation lenses—**keep**, **reconcile**, **deduplicate**, **consolidate/merge**, **split**, **extract**, **move**, **tighten**, and **remove**—only where they fit this integration surface; do not manufacture changes to satisfy the list.

- **Inspect:** Resolve the exact target, prerequisites, authorization, and current local or remote state through read-only operations first.
- **Compare:** Normalize current and canonical state into an exact managed diff, reconcile conflicting representations, and distinguish duplicated management paths or coupled effects while keeping unmanaged fields out of scope.
- **Recommend:** Preserve aligned and unmanaged state; prioritize confirmed drift, safe consolidation or separation of effects, tighter authorization, and removal only where the managed contract requires it.
- **Apply:** Add only proven-missing canonical fields, synchronize retained colors or managed visibility, synchronize canonical label definitions, or apply an exact browser-backed pin manifest after authorization. Keep deletion, renaming, option membership or order changes, issue types, unmanaged pinning, and pinned-field ordering unavailable.
- **Verify:** Re-run the read-only inspection after an independently authorized change and report remaining drift or remote uncertainty.

## Bundled Resources

- `scripts/inspect-schema.js`: non-interactive inspect-only entrypoint.
- `scripts/add-fields.js`: digest-gated additive field entrypoint.
- `scripts/recolor-fields.js`: digest-gated retained-option color entrypoint.
- `scripts/pin-fields.js`: no-write field-pinning planner and digest authorization entrypoint.
- `scripts/set-field-visibility.js`: digest-gated visibility-only field entrypoint.
- `scripts/sync-labels.js`: digest-gated canonical repository-label entrypoint.
- `lib/github-schema-client.js`: injected read-only GraphQL boundary.
- `lib/github-issue-field-client.js`: organization-field REST read, additive POST, color, and visibility PATCH boundary.
- `lib/github-label-client.js`: repository-label create and definition-only update boundary.
- `lib/schema-inspector.js`: deterministic comparison orchestration.
- `lib/schema-field-synchronizer.js`: additive, retained-option color, and visibility planning, authorization, mutation, and verification orchestration.
- `lib/schema-field-pinning-planner.js`: pin-manifest planning and authorization without a private API write.
- `utils/`: target parsing, comparison, classification, status, and rendering units.
- `test/`: fake GitHub responses and deterministic schema fixtures.

## Validation

- Run `bunx mocha "skills/github-issue-schema-author/test/**/*.spec.js"`.
- Run Skill Author validation against this directory.
- Run repository test, lint, `codex:validate`, and `codex:check` gates.
- Before the first installed-cache invocation, run `bun run codex:sync` followed by `bun run codex:check`.
- Perform one live read-only inspection of an explicit repository and verify `mutatesGitHub: false` and an empty `operations` array.
- Exercise live additive mode only after an organization owner explicitly authorizes the complete digest-bound plan. Confirm it contains no updates or deletions, then verify the installed skill is idempotent after creation.
- Exercise live color mode only after an organization owner explicitly authorizes the complete digest-bound plan. Confirm every existing option ID and non-color property is retained, then verify the installed skill is idempotent after the update.
- Exercise live pinning mode only after an organization owner explicitly authorizes the complete digest-bound manifest. Apply it through GitHub's signed-in settings UI, confirm no other field control changed, then verify the installed skill is idempotent after the update.
