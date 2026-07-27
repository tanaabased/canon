---
name: tanaab-task-completion-check
description: Tanaab-based read-only Task completion assessment. Use when a user wants to determine whether a GitHub Issue is complete or ready to close from its acceptance criteria, linked pull requests, reviews, checks, and failure evidence.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - project-management
  openclaw:
    emoji: '🚦'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/task-completion-check
    requires:
      bins:
        - bun
        - gh
---

# Task Completion Check

## Overview

Assess whether one GitHub-backed Task is complete, ready, pending, blocked, or uncertain from its declared acceptance criteria and available delivery evidence. The workflow is read-only: the GitHub Issue remains the authority for Task state, and the skill never closes it or mutates its pull requests.

## When to Use

- Check whether an explicit GitHub Issue is ready to close.
- Review acceptance criteria, linked pull requests, reviews, merge state, and checks as one Task-completion decision.
- Inspect failing GitHub-hosted CI checks and extract useful Actions failure snippets when they block a Task.
- Distinguish a completed non-code Task from a code Task whose delivery evidence is still pending.

## When Not to Use

- Do not create, edit, label, assign, or close Tasks.
- Do not merge pull requests, approve reviews, rerun checks, or apply a proposed fix.
- Do not treat passing CI or a merged pull request as sufficient when the Task lacks usable acceptance criteria.
- Do not author workflow YAML or diagnose external CI providers through this skill.

## Preconditions

- Require one explicit Task identity as a GitHub Issue URL or `OWNER/REPO#NUMBER`; never infer the Task from a checkout or current pull request.
- Confirm `gh` is installed and authenticated with read access to the Task, linked pull requests, checks, and Actions logs.
- Resolve [the bundled command](./scripts/check-task-completion.js) relative to this `SKILL.md`, then run `bun <resolved-path> OWNER/REPO#NUMBER --json`.
- Add repeatable `--pr <value>` arguments only to supply missing or disambiguating pull request evidence. Automatic discovery remains the default.

## Workflow

1. Normalize the explicit Task target and inspect the GitHub Issue state, body, comments, and milestone without writing.
2. Extract Markdown acceptance-criteria checkboxes from the Issue body. If none exist, classify the result as `uncertain` instead of inventing criteria.
3. Discover closing and manually linked pull requests through GitHub's Issue relationship, then merge any explicit `--pr` evidence without duplicates.
4. Inspect each pull request's target branch, state, draft state, mergeability, review decision, and checks. For failing GitHub Actions checks, include the run identity and a bounded failure snippet when logs are available.
5. Classify the Task as `complete`, `ready`, `pending`, `blocked`, or `uncertain`. A closed Issue is complete; incomplete criteria or explicit failures block; active review or checks remain pending; missing or contradictory evidence is uncertain.
6. Report the normalized evidence and stop. A separate user-authorized workflow owns any fix, merge, or Task closure.

## Checkpoints

- Stop when the Task identity is missing or malformed rather than guessing from local Git state.
- Treat missing authentication or Task access as a failed prerequisite.
- Preserve `uncertain` when linked evidence cannot be queried, acceptance criteria are absent, or the available signals contradict one another.
- Treat external check providers as evidence links only; do not claim to have inspected unavailable logs.

## Completion Criteria

- The report names the exact Task and one normalized status with a concrete reason.
- Every structured acceptance criterion is shown as complete or incomplete.
- Every discovered or explicitly supplied pull request is accounted for as landed, pending, blocked, discarded, or uncertain.
- Failing GitHub Actions checks include bounded failure evidence when available.
- No GitHub state was mutated.

## Bundled Resources

- [./scripts/check-task-completion.js](./scripts/check-task-completion.js): thin Bun command for deterministic read-only assessment
- [./lib/github-task-client.js](./lib/github-task-client.js): injected `gh` command boundary for Task, pull request, check, and log reads
- [./lib/task-completion-inspector.js](./lib/task-completion-inspector.js): Task evidence orchestration and failure-log enrichment
- [./utils/](./utils/): focused target, acceptance, pull request, status, identifier, snippet, argument, and rendering units
- [./references/task-completion-check-license.txt](./references/task-completion-check-license.txt): Apache-2.0 provenance retained for the adapted GitHub checks inspection logic
- [../../references/project-management-model.md](../../references/project-management-model.md): Task ownership and GitHub-backed project lifecycle contract

## Validation

- Confirm the Task target is explicit and every GitHub operation is read-only.
- Confirm passing checks alone never produce `ready` and missing acceptance criteria produce `uncertain`.
- Confirm non-code Tasks can become `ready` without pull request evidence when their criteria are complete.
- Confirm draft, review-required, pending-check, failed-check, conflict, non-default-target, merged, and closed-unmerged pull request paths classify correctly.
- Confirm fake-client tests cover Task and pull request API failures without live GitHub calls.
- Build and smoke the bundled command, then run the skill validator and focused flat test suite.
