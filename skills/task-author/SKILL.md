---
name: tanaab-task-author
description: Tanaab-based GitHub-backed task assessment, drafting, creation, revision, normalization, and fallback migration. Use when a user wants to turn supported evidence into one canonical Task, Bug, or Feature with provenance-aware estimates, native metadata, portable fallbacks, explainable scoring, digest-gated writes, and exact verification.
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

Assess, draft, create, revise, or normalize one canonical GitHub-backed Task, Bug, or Feature. Inspect the target repository's issue types, organization issue fields, and labels; show the source and rationale for accepted estimates; use native values where available; render fallback metadata only where needed; and verify every managed value after mutation.

Existing-issue modes preserve unmanaged labels and earlier comments. Ordinary revision and normalization keep existing fallback keys in fallback even when native fields later appear. The separately authorized migration mode writes and verifies native values before removing only their verified fallback keys. Task Author does not own schema definitions or relationship mutations.

## When to Use

- Draft a new Task, Bug, or Feature against one explicit GitHub repository.
- Use Task for any bounded unit of work that does not fit the more specific Bug or Feature shape, including repository, operational, administrative, research, content, purchasing, scheduling, or external work.
- Create one fully evidenced Task, Bug, or Feature after the exact publication plan is displayed and authorized.
- Treat an explicit create, revise, normalize, rescore, or fallback-migration imperative for one exact task as authorization for that bounded mode; keep planning, drafting, previewing, questions, and exploratory discussion read-only.
- Revise one material task against newly accepted evidence and preserve its earlier discussion.
- Normalize an existing external submission into canonical headings without inventing missing facts.
- Migrate verified fallback metadata into newly available native fields through a separate two-phase plan.
- Assess Work size, Complexity, Impact, Urgency, Enablement, and Confidence from supported evidence before invoking the deterministic helper.
- Preview native issue type and issue-field values, fallback metadata, existing labels, relationships, score evidence, and comments.
- Inspect whether an organization-backed repository provides the canonical native metadata surfaces.
- Identify missing evidence or incomplete capabilities before creation.

## When Not to Use

- Do not close, reopen, delete, assign, or change relationship state. Route milestone lifecycle and explicit task-membership changes to [Project Milestone Author](../project-milestone-author/SKILL.md).
- Do not create, recolor, rename, or delete label definitions; create mode may apply only observed existing canonical labels.
- Do not create or change issue types, organization issue fields, field options, milestones, dependencies, parents, or sub-issues.
- Do not set assignees through the current create mode, and do not bundle milestone membership with task creation.
- Do not create a task with requested relationship mutations; keep that preview blocked until relationship support is implemented.
- Do not use this skill to assess completion; use [Task Completion Check](../task-completion-check/SKILL.md).
- Do not infer a target from a directory name. If neither an explicit target nor one unambiguous verified GitHub binding exists, request `OWNER/REPO`.

## Prerequisites

- Require `bun` and GitHub CLI `gh`.
- Apply [the shared GitHub CLI routing contract](../../references/github-cli-routing.md): invoke bare `gh` through the inherited `PATH`, environment, and current working directory without an absolute executable or subprocess override.
- Prefer an explicit `OWNER/REPO` or `OWNER/REPO#NUMBER`; otherwise accept only a repository that `gh repo view` resolves unambiguously from the active project.
- Check `gh auth status`. A failed auth probe is a visible warning because public reads may still work; never conceal a private-repository discovery failure.
- Create mode requires GitHub Issues write access. Native type, label, and issue-field values require repository push access and may otherwise be silently dropped, so a successful create response is never sufficient verification.
- Apply [the task management contract](../../references/task-management-contract.md) and its [fixture corpus](../../references/task-management-fixtures.md). Do not independently redefine task shapes, metadata, labels, or scoring.

## Inputs

- Required for a ready draft: title, Task/Bug/Feature kind, one exact repository target or verified binding, evidence for every required body section, checkable acceptance criteria, and expected delivery and verification evidence for its completion pull request. A Task additionally requires an outcome and scoped work.
- For a Bug, keep reporter evidence separate from worker obligations. Plan one linked completion pull request that begins in draft with a regression test or reproduction harness executed in the safest suitable disposable environment, normally existing GitHub Actions. Require failing evidence against the affected baseline and the same reproduction plus relevant surrounding checks passing with the fix. Do not require host-local execution when it could mutate the agent machine; document safe exceptions and approval boundaries when automation is infeasible.
- For a Feature, require one bounded new or materially expanded capability with an identifiable consumer or workflow, useful outcome, explicit in-scope and out-of-scope boundaries, consumer-visible acceptance criteria, and applicable compatibility or migration evidence. Plan substantive artifacts, tests or executable examples, documentation, checks, and release evidence in its completion pull request. Keep an oversized or umbrella request unready and recommend decomposition rather than treating Feature as an epic.
- Optional canonical metadata: Priority, Work size, Complexity, Impact, Start date, and Target date. Priority and dates require human, policy, or existing provenance; never submit them as agent estimates.
- A Task score additionally requires Impact, Work size, Urgency, Enablement, and Confidence evidence. After reviewing all available evidence, use Urgency `None` with `policy` provenance and a concise no-cost-of-waiting rationale when no deadline, active pain, recurring cost, blockage, or other urgency signal exists. This is an evidence-aware default: if the evidence is incomplete or ambiguous, leave Urgency and Task score unset and ask a focused question. Unknown enablement or other factors remain unset.
- Every accepted metadata value and scoring diagnostic requires an `assessment` entry with `source` equal to `agent`, `human`, `policy`, or `existing`. Agent estimates require a concise evidence-based `rationale`; Task score provenance is generated as `derived`.
- `publishScoringAudit` defaults to `true`. Set it to `false` to suppress the optional public scoring-audit comment while retaining the native or fallback Task score.
- A GitHub issue-form handoff is intake evidence, not deterministic draft input. Semantically normalize its responses into supported canonical sections and assessment records first; preserve missing evidence as questions.
- Optional label signals must be explicit. `regression`, `needs reproduction`, `good first issue`, and `help wanted` still pass their canonical eligibility checks.
- For agent-owned command execution, prefer `--input -` and send the JSON request through standard input. Do not create request files in operating-system or user-level temporary directories. If the harness cannot provide standard input, use a repository-local ignored scratch path under the active workspace, verify the intended path with `git check-ignore` before writing, and do not add a tracked placeholder merely to retain the directory.
- Run `bun <skill-path>/scripts/draft-task.js --input <path|->` for a read-only draft.
- Run `bun <skill-path>/scripts/create-task.js --input <path|->` first without publication approval to obtain the exact plan and digest. If an explicit imperative already authorizes that exact bounded creation and the inspected plan contains no material surprise, rerun in the same turn with `publication.safetyReviewed: true`, the exact `publication.approvedTarget`, and the returned `publication.approvedDigest`; do not ask for a second approval solely because the digest is now known.
- Run `bun <skill-path>/scripts/update-task.js --input <path|->` with `mode` set to `revise` or `normalize`. Material revision also requires a concise `revisionSummary`; incomplete normalization may preserve raw evidence and apply lifecycle labels without claiming completion.
- Run `bun <skill-path>/scripts/migrate-fallback.js --input <path|->` only after an explicit fallback-migration imperative for the exact task. Preview its separately bounded two-phase plan first, then use the same exact publication approval fields in the same turn only when the plan contains no material surprise.
- Every command accepts `--input -`; file input is the fallback. Use `--help` for the stable command contract.

## Outputs

- Draft mode returns `ready`, `partial`, or `needs_input` and always sets `mutatesGitHub: false`.
- Create mode returns `blocked`, `publication_blocked`, or `approval_required` without mutation; `approval_required` is the deterministic input gate and does not by itself require another conversational turn when an earlier explicit imperative already authorized the bounded plan. Create mode returns `created` only after exact read-back verification, `partial` when an issue exists but any write or managed value failed verification, and `failed` when no issue is known to have been created.
- Update mode returns `updated` only after the issue, fields, labels, and new comments verify. An incomplete normalization may return `needs_input`; fallback migration returns `migrated` only after native verification followed by verified capsule cleanup.
- Show the resolved target, normalized title and body, expected delivery evidence, effective metadata values, assessment provenance and rationale, native plan, fallback-only capsule, unresolved metadata, desired/applicable/missing labels, relationships, scoring calculation, scoring-audit publication state, planned comments, capability evidence, and warnings.
- Show the complete creation payload, comments, publication digest, write results, created issue URL, and per-value verification checks.
- Treat `partial` as an honest discovery result, not permission to guess whether unavailable fields or labels exist.
- A missing canonical field in a successfully inspected organization schema may use fallback metadata. An unavailable inspection remains unresolved because absence was not proven.

## Failure Handling

- Stop on missing `gh`, an invalid target, or failure to read the target repository.
- Treat host routing, identity, credential, or policy denials as `gh` failures under the shared routing contract.
- Keep optional issue-type, issue-field, and label discovery failures as explicit capability warnings; do not mutate schema or assume fallback eligibility to compensate.
- Preserve underspecified external evidence, add focused questions, and propose `needs triage` only when the label is known to exist.
- Report absent requested labels as unapplied and never create their definitions.
- Fail closed before mutation when native-versus-fallback placement is unresolved, publication safety is not attested, credential-shaped text is detected, the target differs, or the approved digest does not match the exact plan. Treat a collapsed scoring audit as public text on a public issue; the disclosure element is not a privacy boundary.
- Do not translate Plan mode, “plan,” “draft,” “preview,” “show me the diff,” questions, or exploratory discussion into publication approval. An explicit mutation imperative authorizes only its exact target and bounded mode. Stop for fresh direction if the preview reveals a different target, missing required evidence, broader scope, nonstandard public text, or another material surprise.
- After any mutation, do not delete, close, or issue an unplanned compensating write to simulate rollback. Preserve current state and report every failed write or mismatched value.
- Treat `issue_field_values` in an issue update as a replacement set. Preserve every currently observed set field, including unmanaged values, and overlay intended changes into one complete payload; stop if any current value cannot be represented safely.
- During fallback migration, stop before body cleanup whenever a native write cannot be observed. Preserve conflicting native values and their fallback keys.

## Workflow

1. Resolve and display one exact target. Stop if it remains ambiguous.
2. Run the bundled draft or create command with JSON on standard input. If standard input is unavailable, verify one repository-local ignored scratch path with `git check-ignore` before writing the request there. Both commands check `gh`, read repository ownership, and inspect only the applicable issue-type, organization-field, and repository-label endpoints before any write.
3. Review missing body evidence, delivery proof, authorization boundaries, and metadata errors. Ask focused questions instead of filling gaps with low values or generic acceptance criteria.
4. Review assessment provenance and rationales. Keep agent estimates evidence-based and human-controlled values out of agent ownership. When a complete evidence review finds no urgency signal, use policy-sourced Urgency `None`; leave ambiguous factors unset.
5. Review native versus fallback planning. Native values win; the fallback capsule includes only proven-unavailable native concepts.
6. Review canonical label intent against observed repository labels. Keep missing or unverified labels unapplied.
7. Review `task-score/v1`, its required factors, and its optional collapsed audit comment. Keep Priority, Complexity, and scheduling fields out of both the formula and public audit. Use `publishScoringAudit: false` when the calculation should remain only in native or fallback metadata.
8. For Plan mode or planning, drafting, preview, question, and exploratory intent, return the complete read-only preview and stop without populating publication approval.
9. For create mode, first return the complete payload, comments, exact target, and digest without mutation. Screen every GitHub-facing string for publication safety. An earlier explicit imperative for that exact bounded creation supplies the user authorization; a material surprise requires fresh direction.
10. When authorized, rerun create mode in the same turn with the exact safety attestation, target, and digest. Create one issue with native type, existing labels, native field values, and fallback metadata, then post only the planned comments. Do not pause merely to ask the user to repeat the authorization after the digest is known.
11. Re-read the issue, issue-field values, labels, and comments. Return `created` only when every managed value verifies; otherwise preserve the issue URL and return `partial` with exact mismatches.
12. For revision, normalization, or rescore, re-read current state first, preserve unmanaged labels and earlier comments, avoid duplicate score audits, mark a changed audit as superseding the previous assessment, and show the complete semantic and storage diff. If an explicit imperative already authorized that exact bounded mode and the diff contains no material surprise, bind its target and digest and continue to PATCH and verification in the same turn; otherwise stop at the preview.
13. For an explicitly requested fallback migration, preview two phases and confirm the plan is limited to that mode. Write native values, re-read them, and only then remove the verified fallback keys. Keep conflicts or unavailable representations in the capsule and stop for fresh direction on any material surprise.

## Bundled Resources

- [../../references/task-management-contract.md](../../references/task-management-contract.md): shared semantic contract
- [../../references/task-management-fixtures.md](../../references/task-management-fixtures.md): cross-skill golden cases
- [./scripts/draft-task.js](./scripts/draft-task.js): JSON-in/read-only-preview-out Bun entrypoint
- [./scripts/create-task.js](./scripts/create-task.js): digest-gated JSON-in/create-and-verify Bun entrypoint
- [./scripts/update-task.js](./scripts/update-task.js): digest-gated revise/normalize entrypoint
- [./scripts/migrate-fallback.js](./scripts/migrate-fallback.js): two-phase fallback migration entrypoint
- [./lib/task-draft-author.js](./lib/task-draft-author.js): draft orchestration over an injected GitHub client
- [./lib/task-create-author.js](./lib/task-create-author.js): publication, mutation, and verification orchestration over an injected GitHub client
- [./lib/task-state-reader.js](./lib/task-state-reader.js): shared issue, field, and comment read-back normalization
- [./lib/github-capability-client.js](./lib/github-capability-client.js): read-only `gh` discovery boundary
- [./lib/github-task-client.js](./lib/github-task-client.js): narrow `gh api` create, comment, and read-back boundary
- [./utils/](./utils/): focused assessment, normalization, rendering, metadata, labeling, and scoring units
- [./test/](./test/): flat utility, client-boundary, T01–T17, and R01–R02 coverage
- [../../test/task-management-fixtures.js](../../test/task-management-fixtures.js): shared executable fixture inputs used across task-management skills

## Validation

- Run `bun run test:unit -- --grep "Task Author"` for the focused behavior checks.
- Run `bun skills/skill-author/scripts/validate-skill.js --skill-dir skills/task-author --container codex-plugin --namespace tanaab`.
- Run the repository test, lint, Codex validation, sync, and cache checks required by the Canon repository.
- Exercise a live create only against an explicitly approved disposable repository, first showing the exact digest-bound plan. Verify the live issue through the installed skill and retain any partial result for diagnosis rather than deleting evidence automatically.
