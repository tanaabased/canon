# Task Management Core Handoff

Status: active branch handoff for the phase 1 and phase 2 convergence loop

Last updated: 2026-08-14

## Resume Point

- Repository: `tanaabased/canon`
- Branch: `pirog-task-management-core`
- Pull request: [#17](https://github.com/tanaabased/canon/pull/17), currently a draft requiring review
- Base branch: `main`
- Pre-handoff implementation baseline: `eb206b0`
- Accepted Task-template slice: `a0a18bd`
- Worktree expectation: clean and synchronized with `origin/pirog-task-management-core`

On the other computer:

```bash
git fetch origin
git switch pirog-task-management-core
git pull --ff-only origin pirog-task-management-core
bun install
bun run test
bun run lint
bun run codex:validate
bun run codex:sync
bun run codex:check
```

Restart Codex after the cache sync if the refreshed plugin surfaces do not appear. Do not run live GitHub mutation commands merely to validate the checkout.

## Current Outcome

The core is a usable, separately authorized three-skill authoring system with a separate completion assessor:

- [Task Author](../skills/task-author/SKILL.md) drafts, creates, revises, normalizes, and migrates fallback metadata for one task. It owns task values, assessment provenance, `task-score/v1`, publication safety, digest authorization, and exact read-back verification.
- [GitHub Issue Schema Author](../skills/github-issue-schema-author/SKILL.md) inspects and narrowly aligns organization fields, retained option colors, field visibility, field pinning, and repository label definitions. It exposes no deletion path and preserves Effort as unmanaged.
- [GitHub Issue Form Author](../skills/github-issue-form-author/SKILL.md) renders and aligns low-friction Task, Bug, and Feature intake forms and hands lossless evidence to Task Author for semantic normalization.
- [Task Completion Check](../skills/task-completion-check/SKILL.md) assesses acceptance criteria and the required linked completion pull request without mutating the task or its delivery evidence.
- [The shared contract](../references/task-management-contract.md), [machine schema](../references/task-management-schema.json), and [fixture corpus](../references/task-management-fixtures.md) own cross-skill semantics.

The optimization pass consolidated only proven shared plumbing. The four skill surfaces retain distinct ownership and authorization boundaries. The branch's full local gate last passed with 272 tests, one expected PowerShell test pending, clean lint and formatting, clean Canon validation, all four task-management skill validators clean, and an installed cache matching source. PR #17's lint, release, Ubuntu, and macOS checks were green before this documentation handoff.

## Live Evidence

The disposable repository is `tanaabased/agent-system-test`.

- Work size, Complexity, Impact, and Task score are organization-level fields with canonical definitions, colors, Task/Bug/Feature pinning, and organization-members-only visibility.
- Priority, Effort, Start date, and Target date were preserved unchanged. Effort remains unmanaged and distinct from Work size.
- Canonical label definitions in the disposable repository are aligned. The live synchronization created five missing labels and updated three definitions without renaming, deleting, or changing existing associations. Legacy and project-specific labels remain intact.
- [Task #74](https://github.com/tanaabased/agent-system-test/issues/74) exactly verifies native Task type, Work size `3`, Complexity Low, Impact Medium, and Task score `37`.
- [Bug #75](https://github.com/tanaabased/agent-system-test/issues/75) exactly verifies native Bug type, `regression`, Work size `5`, Complexity Medium, Impact High, and Task score `47`.
- [Feature #76](https://github.com/tanaabased/agent-system-test/issues/76) exactly verifies native Feature type, `breaking change`, Work size `8`, Complexity High, Impact High, and Task score `37`.
- Those three proofs intentionally contain no fallback YAML, Priority, Start date, Target date, or public scoring-audit comment.
- The earlier live issue-form projection remains installed in the disposable repository but is superseded by the branch's intake/canonical split. Do not align it again until template calibration is accepted.

## Remaining Work on This Branch

Do this work in order:

1. Continue type-by-type template calibration. The broad Task intake and canonical body are accepted and implemented, including the required completion pull-request gate. Calibrate Bug next, then Feature, while preserving the shared evidence and metadata boundaries.
2. Run representative organization and personal-repository submissions through Issue Form Author and Task Author. Update the shared contract, schema, and fixtures first if human review exposes a real semantic change; then update both skill projections.
3. Decide whether the convergence gate requires disposable live evidence for revise, normalize, and fallback migration. The modes and fixtures exist locally; they have not received the same final live proof as native creation. A live fallback migration should use a purpose-built disposable issue and preserve partial evidence rather than deleting or rolling back it.
4. After the templates and mapping are accepted, generate a fresh Issue Form Author repository plan for `tanaabased/agent-system-test`. Review and authorize its exact repository, branch, SHA-bound operations, and digest before writing the four managed files.
5. Run the full fixture corpus, all four task-management skill validators, repository tests, lint, Codex validation, cache sync/check, and a final live read-only inspection. Update the roadmap with the convergence decision.
6. Merge PR #17 as the first discrete usable task-management core. Start Task Decomposer and milestone work on new branches rather than expanding this one.

The next collaborative step is item 1 for Bug. The Task intake, normalized body, and completion-delivery contract are accepted; Bug and Feature remain working shapes until their reviews finish.

## Guardrails

- Require a fresh plan and exact digest for every GitHub write. Never reuse the historical digests recorded during live proof.
- Keep human intake questions shorter than the canonical task representation. Task Author, not the reporter, owns semantic normalization and agent-derived assessment.
- Require a linked completion pull request for every task kind. Use an evidence-bearing body for external work and an empty commit only when no safe or useful repository artifact exists.
- Keep Priority and scheduling human- or policy-controlled. Keep Complexity model-neutral and outside `task-score/v1`.
- Prefer native GitHub issue types and fields. Use visible fallback YAML only when native metadata is proven unavailable.
- Treat public scoring-audit comments as optional explanation, not score storage or a privacy boundary.
- Do not delete, rename, or migrate labels, fields, issues, or live proof artifacts without a separately displayed and approved operation.
- Keep Project Author focused on repository policy. Issue Schema Author owns organization task schema and field pinning.
- Defer decomposition, milestones, GitHub Projects boards, goal-aware scoring, and additional task types or fields until the core convergence gate passes.

## Primary Files

- [`task-management-skills-roadmap.md`](./task-management-skills-roadmap.md): sequencing, status, and deferred work
- [`task-management-contract.md`](../references/task-management-contract.md): human-readable semantics and authority rules
- [`task-management-schema.json`](../references/task-management-schema.json): issue types, fields, colors, pinning, labels, and body-shape data
- [`task-management-fixtures.md`](../references/task-management-fixtures.md): descriptive golden cases
- [`task-management-fixtures.js`](../test/task-management-fixtures.js): shared executable fixtures
- [`task-management-equivalence.spec.js`](../test/task-management-equivalence.spec.js): cross-skill intake preservation
- [`Task Author`](../skills/task-author/SKILL.md), [`Issue Schema Author`](../skills/github-issue-schema-author/SKILL.md), [`Issue Form Author`](../skills/github-issue-form-author/SKILL.md), and [`Task Completion Check`](../skills/task-completion-check/SKILL.md): runtime contracts and bundled entrypoints
