---
name: tanaab-project-milestone-author
description: Tanaab-based GitHub project milestone inspection, authoring, state, due-date, and explicit task-membership management. Use when a user wants to inspect, draft, create, revise, close, reopen, schedule, or synchronize one repository milestone through an exact verified plan.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - project-management
  openclaw:
    emoji: '🎯'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/project-milestone-author
    requires:
      bins:
        - bun
        - gh
---

# Project Milestone Author

## Overview

Use the model to understand and author one GitHub-backed project milestone, then use the bundled command only for the parts that require deterministic safety: exact target resolution, a fresh desired-state plan and digest, structured writes, selected task membership, and read-back verification.

This skill can inspect, create, revise, close, reopen, schedule, and synchronize explicitly selected task membership. It exposes no deletion path and does not decide which tasks are needed, create or rewrite tasks, or infer milestone completion.

## When to Use

- Inspect one exact milestone, including its complete description, state, due date, tasks, and pull requests.
- Draft or apply one desired milestone state using an exact repository or milestone target.
- Create a milestone with a model-authored title and complete Markdown description.
- Accept a complete read-only milestone-reframing handoff from Task Decomposer, then independently draft an exact create or revision plan.
- Revise title, description, state, or due date while preserving omitted values.
- Add or remove explicitly selected existing tasks without changing unrelated membership.
- Audit an existing milestone before an authorized alignment.

## When Not to Use

- Do not delete milestones.
- Do not determine which work a milestone needs; use [Project Milestone Planner](../project-milestone-planner/SKILL.md) for bounded completion arguments, capacity-aware coverage, and explicit task selection. The planner may hand an approved selection to this skill, but this skill independently owns the membership plan, digest, write, and verification boundary.
- Do not create, normalize, score, revise, decompose, complete, close, or relate tasks through this skill.
- Do not infer completion or a due date from task state, pull requests, checks, dates, or agent judgment.
- Do not manage GitHub Projects boards, cross-repository goals, releases, repository settings, issue schema, or labels.
- Do not select pull requests as tasks; preserve their existing milestone membership.

## Prerequisites

- Require `bun` and GitHub CLI `gh`.
- Apply [the shared GitHub CLI routing contract](../../references/github-cli-routing.md): invoke bare `gh` through the inherited `PATH`, environment, and working directory.
- Require one explicit `OWNER/REPO`, numbered milestone target, milestone URL, or repository plus exact title selector. Never infer the repository from a directory name.
- Confirm the intended GitHub identity and repository access before writes.
- Apply [the project-management model](../../references/project-management-model.md) and [the milestone contract](./references/project-milestone-contract.md).

## Inputs

- Run `bun <skill-path>/scripts/project-milestone.js <inspect|draft|apply> --input -` and send one JSON request through standard input.
- `inspect` requires only `target` and is always read-only.
- A repository-only target means create. Creation requires `desired.title` and the complete `desired.description` string.
- A numbered, URL, or exact-title target means update. Under `desired`, provide only values meant to change: `title`, complete `description`, `state` (`open` or `closed`), or `dueDate` (`YYYY-MM-DD` or `null` to clear). Omitted values are preserved.
- Optional `membership.add` and `membership.remove` contain explicit task numbers. Moving a task from another milestone requires `allowMoveFromOtherMilestones: true`.
- Milestone fields and task membership require separate drafts, digests, and approvals. Never send `desired` and `membership` in the same request, and create the milestone before planning membership.
- `apply` repeats the draft request with `publication.safetyReviewed: true`, `publication.approvedTarget`, and `publication.approvedDigest` copied from the fresh draft.
- A Task Decomposer reframe is semantic evidence, not an Author request or mutation approval. Resolve create versus revision, require an exact revision target, author the complete description from the handoff, and preserve the source task unchanged unless its disposition is separately authorized through its owning skill.
- Prefer `--input -`. If standard input is unavailable, use only a repository-local ignored scratch path after confirming it with `git check-ignore`.

## Outputs

- Inspect returns normalized milestone state plus task and pull-request members with `mutatesGitHub: false`.
- Draft returns one compact plan containing the exact before state, ordered operations, expected state, publication findings, and SHA-256 digest without writing.
- Aligned desired state returns zero operations and requires no approval.
- Apply returns `created` or `updated` only after exact read-back verification.
- Apply returns `partial` when some effect occurred but a write or verification failed, and `failed` when no effect is known to have succeeded.

## Failure Handling

- Stop without writing on missing tools, inaccessible repositories, invalid or ambiguous targets, conflicting titles, unknown or invalid request fields, combined milestone and membership changes, missing tasks, pull requests selected as tasks, or unapproved moves.
- Treat descriptions as complete opaque Markdown. Inspect first, let the model preserve any important existing content in the proposed full replacement, and expose the exact before and after strings in the plan.
- Fail closed when publication safety is not attested, the approved target differs, the digest is stale, or public title or description text resembles a credential.
- Apply only explicitly selected task membership and never create a missing task.
- Never treat a Task Decomposer handoff as approval to create or revise a milestone, change membership, or dispose of the source task.
- Treat successful responses as provisional. Re-read the milestone and every selected task, report silently dropped values, and never compensate or roll back remote state to hide partial success.
- Keep the desired-state logic behind the injected GitHub client so an Agent System transport can replace that boundary without changing authorization semantics.

## Workflow

1. Resolve and display one exact target; stop on ambiguity.
2. Inspect the current milestone when it exists. Let the model interpret the user's intent and author the complete desired description, preserving important existing text deliberately rather than through a hidden parser.
3. Run `draft` to obtain the compact before, operations, expected, target, findings, and digest report. If aligned, stop.
4. Review the exact changed fields or selected tasks. For an explicit imperative with no material surprise, bind the fresh safety attestation, target, and digest; otherwise present the draft without applying it. Draft and authorize milestone fields separately from task membership.
5. Run `apply`. It rebuilds the plan from fresh remote state, sends only the approved structured operations, and re-reads every requested value.
6. Report verified, partial, failed, or uncertain state without rollback.

## Optimization

- **Inspect:** Resolve one exact milestone and read its complete description, state, due date, and issue membership without mutation.
- **Compare:** Reconcile the requested desired state with provider-native values, distinguishing omitted, aligned, selected, and unmanaged state.
- **Recommend:** Keep aligned and unrelated state; tighten ambiguous identity or authorization; and never manufacture task, completion, deletion, or planning changes.
- **Apply:** After separate exact target, safety, and digest authorization, mutate only the planned milestone fields or explicitly selected task membership.
- **Verify:** Re-read every requested value and report verified, remaining, unavailable, or partial state without compensating rollback.

## Bundled Resources

- [../../references/project-management-model.md](../../references/project-management-model.md): domain terminology and lifecycle boundaries
- [../../references/github-cli-routing.md](../../references/github-cli-routing.md): runtime-neutral bare-`gh` transport contract
- [./references/project-milestone-contract.md](./references/project-milestone-contract.md): desired-state, membership, authorization, and verification contract
- [./scripts/project-milestone.js](./scripts/project-milestone.js): single JSON-in inspect, draft, and apply command
- [./lib/milestone-author.js](./lib/milestone-author.js): transport-neutral desired-state planning and verification
- [./lib/github-milestone-client.js](./lib/github-milestone-client.js): narrow injected GitHub REST boundary
- [./utils/normalize-milestone-target.js](./utils/normalize-milestone-target.js): exact target normalization
- [./test/](./test/): flat deterministic client, command, target, orchestration, and partial-failure coverage

## Validation

- Run `bun run test:unit -- --grep "project-milestone-author|utils/evaluate-publication"`.
- Run `bun skills/skill-author/scripts/validate-skill.js --skill-dir skills/project-milestone-author --container codex-plugin --namespace tanaab`.
- Run the repository test, lint, Codex validation, sync, and cache checks required by Canon.
- Exercise live writes only against an explicitly approved disposable repository, using a fresh draft and exact authorization. Prove creation or revision, selected task membership, idempotent reinspection, and exact read-back without deleting evidence.
