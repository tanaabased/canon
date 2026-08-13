---
name: tanaab-task-author
description: Tanaab-based GitHub-backed task drafting and read-only capability assessment. Use when a user wants to draft a Task, Bug, or Feature with canonical bodies, metadata plans, labels, and explainable scoring without writing to GitHub.
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

Draft one canonical GitHub-backed Task, Bug, or Feature and inspect the target repository's issue types, organization issue fields, and labels without writing to GitHub.

This initial capability owns only the read-only draft and preview boundary. It renders the full future creation plan while deliberately exposing no create, edit, comment, label, relationship, or schema mutation path.

## When to Use

- Draft a new Task, Bug, or Feature against one explicit GitHub repository.
- Normalize supplied evidence into the canonical body headings without inventing missing facts.
- Preview native issue type and issue-field values, fallback metadata, existing labels, relationships, score evidence, and comments.
- Inspect whether an organization-backed repository provides the canonical native metadata surfaces.
- Identify missing evidence or incomplete capabilities before any later creation workflow.

## When Not to Use

- Do not create, edit, close, or comment on an issue through this version of the skill.
- Do not apply labels or create, recolor, rename, or delete label definitions.
- Do not create or change issue types, organization issue fields, field options, milestones, dependencies, parents, or sub-issues.
- Do not use this skill to assess completion; use [Task Completion Check](../task-completion-check/SKILL.md).
- Do not infer a target from a directory name. If neither an explicit target nor one unambiguous verified GitHub binding exists, request `OWNER/REPO`.

## Prerequisites

- Require `bun` and GitHub CLI `gh`.
- Prefer an explicit `OWNER/REPO` or `OWNER/REPO#NUMBER`; otherwise accept only a repository that `gh repo view` resolves unambiguously from the active project.
- Check `gh auth status`. A failed auth probe is a visible warning because public reads may still work; never conceal a private-repository discovery failure.
- Apply [the task management contract](../../references/task-management-contract.md) and its [fixture corpus](../../references/task-management-fixtures.md). Do not independently redefine task shapes, metadata, labels, or scoring.

## Inputs

- Required for a ready draft: title, Task/Bug/Feature kind, one exact repository target or verified binding, evidence for every required body section, and checkable acceptance criteria.
- Optional canonical metadata: Priority, Work size, Complexity, Impact, Start date, and Target date.
- A Task score additionally requires Impact, Work size, Urgency, Enablement, and Confidence evidence. Unknown factors remain unset.
- Optional label signals must be explicit. `regression`, `needs reproduction`, `good first issue`, and `help wanted` still pass their canonical eligibility checks.
- Run `bun <skill-path>/scripts/draft-task.js --input <json-path>` or pipe JSON with `--input -`. Use `--help` for the stable command contract.

## Outputs

- Return `ready`, `partial`, or `needs_input` and always set `mutatesGitHub: false`.
- Show the resolved target, normalized title and body, effective metadata values, native plan, fallback-only capsule, unresolved metadata, desired/applicable/missing labels, relationships, scoring calculation, planned audit comments, capability evidence, and warnings.
- Treat `partial` as an honest discovery result, not permission to guess whether unavailable fields or labels exist.
- A missing canonical field in a successfully inspected organization schema may use fallback metadata. An unavailable inspection remains unresolved because absence was not proven.

## Failure Handling

- Stop on missing `gh`, an invalid target, or failure to read the target repository.
- Keep optional issue-type, issue-field, and label discovery failures as explicit capability warnings; do not mutate schema or assume fallback eligibility to compensate.
- Preserve underspecified external evidence, add focused questions, and propose `needs triage` only when the label is known to exist.
- Report absent requested labels as unapplied and never create their definitions.
- No rollback path is needed because this capability performs no writes.

## Workflow

1. Resolve and display one exact target. Stop if it remains ambiguous.
2. Run the bundled draft command. It checks `gh`, reads repository ownership, and reads only the applicable issue-type, organization-field, and repository-label endpoints.
3. Review missing body evidence and metadata errors. Ask focused questions instead of filling gaps with low values or generic acceptance criteria.
4. Review native versus fallback planning. Native values win; the fallback capsule includes only proven-unavailable native concepts.
5. Review canonical label intent against observed repository labels. Keep missing or unverified labels unapplied.
6. Review `task-score/v1`, its required factors, and its previewed audit comment. Keep Priority and Complexity out of the formula.
7. Return the complete draft preview and stop. A future write-capable workflow must re-read state, show the exact mutation, pass publication safety, and obtain authorization independently.

## Bundled Resources

- [../../references/task-management-contract.md](../../references/task-management-contract.md): shared semantic contract
- [../../references/task-management-fixtures.md](../../references/task-management-fixtures.md): cross-skill golden cases
- [./scripts/draft-task.js](./scripts/draft-task.js): JSON-in/read-only-preview-out Bun entrypoint
- [./lib/task-draft-author.js](./lib/task-draft-author.js): draft orchestration over an injected GitHub client
- [./lib/github-capability-client.js](./lib/github-capability-client.js): read-only `gh` discovery boundary
- [./utils/](./utils/): focused normalization, rendering, metadata, labeling, and scoring units
- [./test/](./test/): flat utility, client-boundary, and T01–T15 fixture coverage

## Validation

- Run `bun run test:unit -- --grep "Task Author"` for the focused behavior checks.
- Run `bun skills/skill-author/scripts/validate-skill.js --skill-dir skills/task-author --container codex-plugin --namespace tanaab`.
- Run the repository test, lint, Codex validation, sync, and cache checks required by the Canon repository.
- Do not add a live write scenario until Task Author deliberately gains an authorized mutation capability.
