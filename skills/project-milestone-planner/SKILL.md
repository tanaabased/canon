---
name: tanaab-project-milestone-planner
description: Tanaab-based read-only project milestone planning. Use when a user wants to compare one repository milestone with existing tasks and delivery evidence, identify gaps or overlap, and produce a reviewable proposed task graph without mutating GitHub.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - project-management
  openclaw:
    emoji: '🗺️'
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/project-milestone-planner'
    requires:
      bins:
        - bun
        - gh
---

# Project Milestone Planner

## Overview

Plan the task graph needed to achieve one repository-scoped project milestone. Read the milestone, existing tasks, checked-in plans, provider task states, and merged pull-request evidence; define a completion argument; reuse existing work; and produce one gap-and-overlap report plus a proposed task, hierarchy, dependency, and membership graph.

This version is read-only. It does not create milestones or tasks, change relationships or membership, or claim that the milestone is complete. Deterministic helpers collect and normalize GitHub evidence; the agent owns semantic comparison and plan authorship.

## When to Use

- Compare one existing project milestone with repository tasks and delivery evidence.
- Decide whether existing tasks collectively cover a bounded milestone outcome.
- Identify missing, overlapping, oversized, obsolete, or unresolved work.
- Produce a reviewable task graph that reuses existing tasks before proposing new ones.
- Prepare a later handoff to Project Milestone Author, Task Author, or Task Decomposer without invoking their mutation boundaries.

## When Not to Use

- Do not create, revise, close, or synchronize a milestone; route those changes to [Project Milestone Author](../project-milestone-author/SKILL.md).
- Do not create or revise tasks, assign milestone membership, create sub-issues, or change dependencies in this version.
- Do not decompose one oversized task as the primary request; use Task Decomposer when that skill exists.
- Do not manage a GitHub Projects board. A board is an optional view, not the project or milestone source of truth.
- Do not treat a milestone as proof that its tasks or outcome are complete.
- Do not change `task-score/v1` because a task joins a milestone or appears strategically relevant.

## Preconditions

- Require one explicit GitHub milestone URL or `OWNER/REPO#MILESTONE_NUMBER`. Do not infer a target from a directory name or recent activity.
- Apply [the project-management model](../../references/project-management-model.md) and [task-management contract](../../references/task-management-contract.md).
- Require Bun and a host-routed bare `gh` command. Apply [the GitHub CLI routing contract](../../references/github-cli-routing.md) without overriding the inherited working directory or environment.
- Treat milestone title, description, due date, state, task bodies, comments, repository plans, and delivered artifacts as evidence rather than automatically accepted intent.
- Treat issue closure as provider state and pull-request merge as delivery evidence, not proof that task acceptance or milestone completion was satisfied.
- Keep publication and relationship mutation unavailable. A read-only planning request does not authorize later materialization.

## Workflow

1. Normalize and display the explicit milestone target.
2. Collect normalized GitHub evidence without mutation:

   ```bash
   bun skills/project-milestone-planner/scripts/inspect-milestone-plan.js \
     OWNER/REPO#MILESTONE_NUMBER --json
   ```

3. Inspect checked-in repository guidance, relevant plans, and delivered artifacts that materially affect the milestone. Keep unavailable evidence unresolved.
4. State one bounded completion argument: the milestone outcome, in-scope result, completion conditions, and any real timebox. If the milestone cannot support that argument, ask focused questions before proposing work.
5. Compare the completion argument with existing open and closed tasks plus merged pull-request evidence. Treat closed issues as provider state, closed-unmerged pull requests as nondelivery, and merged pull requests as evidence that still requires comparison with task acceptance. Classify each relevant item as `covered`, `partial`, `overlap`, `too_broad`, `obsolete`, or `unresolved`, with concise evidence.
6. Reuse existing tasks wherever they provide distinct coverage. Do not restate an existing task as a proposed new task merely to make the plan look complete.
7. Identify uncovered completion conditions and propose only the missing tasks. Each proposed task needs a kind, bounded outcome, non-overlapping scope, observable acceptance criteria, and enough evidence for a later Task Author assessment; leave unsupported metadata unset.
8. Propose shallow parent/sub-issue relationships, blocked-by dependencies, and milestone membership only when the evidence requires them. Mark oversized work for a Task Decomposer handoff rather than inventing child tasks inside this workflow.
9. Return one reviewable report containing the completion argument, coverage map, reused tasks, gaps, overlaps, proposed tasks, relationship graph, membership diff, unresolved questions, and materialization handoffs.
10. Stop without writing to GitHub. Never describe the proposed graph as created, synchronized, or complete.

## Checkpoints

- Stop for clarification when the milestone lacks a bounded outcome or observable completion conditions.
- Report partial GitHub inspection instead of treating inaccessible tasks or pagination failures as absence.
- Keep tasks outside the target repository out of milestone membership; cross-project work may be cited as external evidence or a blocker.
- Keep task creation, decomposition, dependencies, membership, and milestone mutation as separate later handoffs with their own exact previews and authorization.
- Flag a proposed task graph that depends on unsupported strategic-goal assumptions; cross-project goals remain outside the current Canon model.

## Completion Criteria

- The exact repository and milestone are identified and the evidence report states `mutatesGitHub: false`.
- The milestone has one explicit completion argument or focused unresolved questions explaining why one cannot yet be formed.
- Every relevant existing task is classified with evidence, and reused work is distinguished from proposed work.
- Gaps, overlaps, oversized tasks, dependencies, and membership changes are explicit rather than buried in prose.
- Every proposed task contributes distinct milestone coverage and includes observable acceptance criteria.
- The report names the owning handoff for each proposed mutation and makes no GitHub changes.

## Bundled Resources

- `scripts/inspect-milestone-plan.js`: read-only GitHub evidence command.
- `lib/github-milestone-planner-client.js`: injected bare-`gh` repository, milestone, issue, and pull-request boundary.
- `lib/milestone-planning-evidence.js`: partial-evidence orchestration and status reporting.
- `utils/normalize-milestone-target.js`: explicit milestone identity normalization.
- `utils/build-milestone-planning-evidence.js`: deterministic evidence projection for model planning.
- `utils/parse-milestone-planner-args.js`: internal command argument parsing.
- `utils/render-milestone-planning-evidence.js`: human-readable evidence summary.
- `test/`: focused target, parsing, client, normalization, and orchestration coverage.
- [../../references/project-management-model.md](../../references/project-management-model.md): project milestone identity and ownership boundaries.
- [../../references/task-management-contract.md](../../references/task-management-contract.md): task shape, relationships, scoring, and authorization rules.
- [../../references/github-cli-routing.md](../../references/github-cli-routing.md): inherited host routing for GitHub CLI calls.

## Validation

- Run `bunx mocha "skills/project-milestone-planner/test/**/*.spec.js"`.
- Run Skill Author validation against this directory.
- Confirm the evidence command calls only read-only GitHub endpoints and always reports `mutatesGitHub: false`.
- Exercise missing `gh`, unauthenticated public reads, invalid targets, partial API evidence, empty milestones, membership, candidate tasks, closed provider state, closed-unmerged pull requests, and merged delivery evidence through injected fakes.
- Run repository tests, lint, `codex:validate`, and `codex:check`; synchronize the managed cache only when preparing installed-skill validation.
- Do not add a model-backed Leia scenario merely to test plan prose. Add an installed scenario later only when the public agent workflow or host-routing boundary exposes risk that deterministic tests cannot cover.
