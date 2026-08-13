---
name: tanaab-task-author
description: Tanaab-based GitHub-backed task assessment, drafting, and authorized creation. Use when a user wants to turn supported evidence into one canonical Task, Bug, or Feature with provenance-aware estimates, native metadata, portable fallbacks, explainable scoring, and exact post-write verification.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - project-management
  openclaw:
    emoji: '📝'
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/task-author'
    requires:
      bins:
        - bun
        - gh
---

# Task Author

## Overview

Assess, draft, or create one canonical GitHub-backed Task, Bug, or Feature. Inspect the target repository's issue types, organization issue fields, and labels; show the source and rationale for accepted estimates; use native values where available; render fallback metadata only where needed; and verify every managed value after creation.

Create mode owns one issue plus its initial canonical labels, field values, and scoring or Priority audit comments. It does not own schema definitions, relationships, revision, normalization, or fallback migration yet.

## When to Use

- Draft a new Task, Bug, or Feature against one explicit GitHub repository.
- Create one fully evidenced Task, Bug, or Feature after the exact publication plan is displayed and authorized.
- Normalize supplied evidence into the canonical body headings without inventing missing facts.
- Assess Work size, Complexity, Impact, Urgency, Enablement, and Confidence from supported evidence before invoking the deterministic helper.
- Preview native issue type and issue-field values, fallback metadata, existing labels, relationships, score evidence, and comments.
- Inspect whether an organization-backed repository provides the canonical native metadata surfaces.
- Identify missing evidence or incomplete capabilities before creation.

## When Not to Use

- Do not revise, normalize, close, reopen, or otherwise edit an existing issue through this version of the skill.
- Do not create, recolor, rename, or delete label definitions; create mode may apply only observed existing canonical labels.
- Do not create or change issue types, organization issue fields, field options, milestones, dependencies, parents, or sub-issues.
- Do not set assignees or milestone membership through the current create mode.
- Do not create a task with requested relationship mutations; keep that preview blocked until relationship support is implemented.
- Do not use this skill to assess completion; use [Task Completion Check](../task-completion-check/SKILL.md).
- Do not infer a target from a directory name. If neither an explicit target nor one unambiguous verified GitHub binding exists, request `OWNER/REPO`.

## Prerequisites

- Require `bun` and GitHub CLI `gh`.
- Prefer an explicit `OWNER/REPO` or `OWNER/REPO#NUMBER`; otherwise accept only a repository that `gh repo view` resolves unambiguously from the active project.
- Check `gh auth status`. A failed auth probe is a visible warning because public reads may still work; never conceal a private-repository discovery failure.
- Create mode requires GitHub Issues write access. Native type, label, and issue-field values require repository push access and may otherwise be silently dropped, so a successful create response is never sufficient verification.
- Apply [the task management contract](../../references/task-management-contract.md) and its [fixture corpus](../../references/task-management-fixtures.md). Do not independently redefine task shapes, metadata, labels, or scoring.

## Inputs

- Required for a ready draft: title, Task/Bug/Feature kind, one exact repository target or verified binding, evidence for every required body section, and checkable acceptance criteria.
- Optional canonical metadata: Priority, Work size, Complexity, Impact, Start date, and Target date. Priority and dates require human, policy, or existing provenance; never submit them as agent estimates.
- A Task score additionally requires Impact, Work size, Urgency, Enablement, and Confidence evidence. Unknown factors remain unset.
- Every accepted metadata value and scoring diagnostic requires an `assessment` entry with `source` equal to `agent`, `human`, `policy`, or `existing`. Agent estimates require a concise evidence-based `rationale`; Task score provenance is generated as `derived`.
- A GitHub issue-form handoff is intake evidence, not deterministic draft input. Semantically normalize its responses into supported canonical sections and assessment records first; preserve missing evidence as questions.
- Optional label signals must be explicit. `regression`, `needs reproduction`, `good first issue`, and `help wanted` still pass their canonical eligibility checks.
- Run `bun <skill-path>/scripts/draft-task.js --input <json-path>` for a read-only draft.
- Run `bun <skill-path>/scripts/create-task.js --input <json-path>` first without publication approval to obtain the exact plan and digest. After the displayed plan is authorized, rerun with `publication.safetyReviewed: true`, the exact `publication.approvedTarget`, and the returned `publication.approvedDigest`.
- Either command accepts `--input -`. Use `--help` for its stable command contract.

## Outputs

- Draft mode returns `ready`, `partial`, or `needs_input` and always sets `mutatesGitHub: false`.
- Create mode returns `blocked`, `publication_blocked`, or `approval_required` without mutation; `created` only after exact read-back verification; `partial` when an issue exists but any write or managed value failed verification; and `failed` when no issue is known to have been created.
- Show the resolved target, normalized title and body, effective metadata values, assessment provenance and rationale, native plan, fallback-only capsule, unresolved metadata, desired/applicable/missing labels, relationships, scoring calculation, planned audit comments, capability evidence, and warnings.
- Show the complete creation payload, comments, publication digest, write results, created issue URL, and per-value verification checks.
- Treat `partial` as an honest discovery result, not permission to guess whether unavailable fields or labels exist.
- A missing canonical field in a successfully inspected organization schema may use fallback metadata. An unavailable inspection remains unresolved because absence was not proven.

## Failure Handling

- Stop on missing `gh`, an invalid target, or failure to read the target repository.
- Keep optional issue-type, issue-field, and label discovery failures as explicit capability warnings; do not mutate schema or assume fallback eligibility to compensate.
- Preserve underspecified external evidence, add focused questions, and propose `needs triage` only when the label is known to exist.
- Report absent requested labels as unapplied and never create their definitions.
- Fail closed before mutation when native-versus-fallback placement is unresolved, publication safety is not attested, credential-shaped text is detected, the target differs, or the approved digest does not match the exact plan.
- After issue creation, do not delete or close the issue to simulate rollback. Preserve its URL, report partial success, and identify every failed write or mismatched value for deliberate follow-up.

## Workflow

1. Resolve and display one exact target. Stop if it remains ambiguous.
2. Run the bundled draft or create command. Both check `gh`, read repository ownership, and inspect only the applicable issue-type, organization-field, and repository-label endpoints before any write.
3. Review missing body evidence and metadata errors. Ask focused questions instead of filling gaps with low values or generic acceptance criteria.
4. Review assessment provenance and rationales. Keep agent estimates evidence-based, keep human-controlled values out of agent ownership, and leave uncertain values unset.
5. Review native versus fallback planning. Native values win; the fallback capsule includes only proven-unavailable native concepts.
6. Review canonical label intent against observed repository labels. Keep missing or unverified labels unapplied.
7. Review `task-score/v1`, its required factors, and its previewed audit comment. Keep Priority and Complexity out of the formula.
8. For draft mode, return the complete read-only preview and stop.
9. For create mode, first return the complete payload, comments, exact target, and digest without mutation. Screen every GitHub-facing string for publication safety and obtain authorization for that displayed plan.
10. Rerun create mode with the exact safety attestation, target, and digest. Create one issue with native type, existing labels, native field values, and fallback metadata, then post only the planned audit comments.
11. Re-read the issue, issue-field values, labels, and comments. Return `created` only when every managed value verifies; otherwise preserve the issue URL and return `partial` with exact mismatches.

## Bundled Resources

- [../../references/task-management-contract.md](../../references/task-management-contract.md): shared semantic contract
- [../../references/task-management-fixtures.md](../../references/task-management-fixtures.md): cross-skill golden cases
- [./scripts/draft-task.js](./scripts/draft-task.js): JSON-in/read-only-preview-out Bun entrypoint
- [./scripts/create-task.js](./scripts/create-task.js): digest-gated JSON-in/create-and-verify Bun entrypoint
- [./lib/task-draft-author.js](./lib/task-draft-author.js): draft orchestration over an injected GitHub client
- [./lib/task-create-author.js](./lib/task-create-author.js): publication, mutation, and verification orchestration over an injected GitHub client
- [./lib/github-capability-client.js](./lib/github-capability-client.js): read-only `gh` discovery boundary
- [./lib/github-task-client.js](./lib/github-task-client.js): narrow `gh api` create, comment, and read-back boundary
- [./utils/](./utils/): focused assessment, normalization, rendering, metadata, labeling, and scoring units
- [./test/](./test/): flat utility, client-boundary, T01–T15 draft, and T01–T06 create coverage
- [../../test/task-management-fixtures.js](../../test/task-management-fixtures.js): shared executable fixture inputs used across task-management skills

## Validation

- Run `bun run test:unit -- --grep "Task Author"` for the focused behavior checks.
- Run `bun skills/skill-author/scripts/validate-skill.js --skill-dir skills/task-author --container codex-plugin --namespace tanaab`.
- Run the repository test, lint, Codex validation, sync, and cache checks required by the Canon repository.
- Exercise a live create only against an explicitly approved disposable repository, first showing the exact digest-bound plan. Verify the live issue through the installed skill and retain any partial result for diagnosis rather than deleting evidence automatically.
