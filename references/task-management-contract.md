# Task Management Contract

Status: initial contract for phase 1 and phase 2 calibration

Contract version: `tanaab/task-management/v1`

Fallback schema: `tanaab/task-metadata/v1`

Scoring formula: `task-score/v1`

## Purpose

This reference is the shared semantic contract for GitHub-backed task authoring. Apply it with [the GitHub-backed project management model](./project-management-model.md).

The initial consumers are:

- **Task Author**, which owns one task and its directly managed values;
- **GitHub Issue Schema Author**, which owns organization issue types and fields plus repository label definitions; and
- **GitHub Issue Form Author**, which owns checked-in Task, Bug, and Feature forms.

Those skills keep separate provider, authorization, and failure boundaries. They must not restate or independently reinterpret this contract. Changes to task shapes, metadata authority, fallback keys, field options, label semantics, or scoring must update the shared [fixture corpus](./task-management-fixtures.md).

The contract is usable now, but the Complexity and Impact rubrics, body prompts, and `task-score/v1` mappings remain calibration hypotheses until the phase 1 and phase 2 convergence gate passes.

## Domain and Provider Terms

A **task** is one GitHub issue in the repository that represents its project. Task, Bug, and Feature are the initial GitHub issue types and the only initial task kinds.

Use task and project in user-facing workflows. Use repository, issue, issue type, issue field, label, milestone, sub-issue, and dependency when the GitHub representation matters.

The task owns its state and acceptance criteria. A pull request, check, or release may provide completion evidence but does not replace the task.

## Target Resolution and Authorization

Resolve one repository in this order:

1. An explicit issue URL, `OWNER/REPO#NUMBER`, or `OWNER/REPO` supplied by the user.
2. One unambiguous repository bound to the active Codex or OpenClaw project, verified from its GitHub remote.
3. Otherwise, stop and request `OWNER/REPO`.

Never infer a GitHub target from a directory name alone. If multiple repositories or remotes remain plausible, do not select one heuristically.

Before a write, show:

- the resolved `OWNER/REPO` and issue number when applicable;
- the complete proposed title and body for creation;
- native metadata, fallback metadata, labels, assignees, milestone, and relationships;
- any scoring or audit comment that will be posted; and
- an exact managed diff for revision, normalization, or schema alignment.

An explicit request to create the displayed task authorizes that exact creation. Revision, normalization, schema synchronization, relationship changes, and destructive operations require their displayed diff to be explicitly authorized. Never broaden authorization from one repository, task, or displayed mutation to another.

## Publication Safety

Treat task titles, bodies, comments, labels, and mutation reports as GitHub-facing publication surfaces.

- Do not publish secrets, credentials, private keys, access tokens, private customer data, or unrelated private context.
- If proposed text may contain sensitive material, stop before the write and request a safe redaction or private handling path.
- Do not move a security vulnerability into a public issue merely to fit the task contract. Use the repository's private security-reporting surface when appropriate.
- Preserve useful technical evidence while removing only material that cannot safely be published.

## Task Kinds and Body Shapes

Use a concise outcome- or problem-oriented title without a redundant `[Task]`, `[Bug]`, or `[Feature]` prefix. The native issue type or fallback metadata owns that classification.

Every body requires explicit, checkable acceptance criteria. Preserve material evidence from externally submitted issues even when it does not fit a preferred heading cleanly.

### Task

Use these headings in order:

```markdown
## Context

## Objective

## Scope

### In scope

### Out of scope

## Acceptance criteria

- [ ] Observable completion condition

## Constraints and notes
```

`Constraints and notes` is optional when there is no material constraint. The evidence-gathering path should establish the affected workflow, current condition, desired outcome, boundaries, known constraints, local value, urgency, enablement, and acceptance evidence.

### Bug

Use these headings in order:

```markdown
## Observed behavior

## Expected behavior

## Reproduction or evidence

## Impact

## Acceptance criteria

- [ ] Observable fix condition
```

Capture environment details beneath `Reproduction or evidence` when they affect reproducibility. Establish whether the behavior previously worked before applying `regression`. Missing reproduction evidence does not prevent preserving a credible report, but it does require `needs reproduction` until the gap is resolved.

### Feature

Use these headings in order:

```markdown
## Problem or opportunity

## Desired outcome

## Scope

### In scope

### Out of scope

## Acceptance criteria

- [ ] Observable capability condition

## Alternatives and constraints
```

`Alternatives and constraints` is optional when no material alternative or constraint is known. Establish who or what gains the capability, the recurring value, boundaries, urgency, enablement, and any compatibility implications.

### Normalization Rules

- Normalize Task Author drafts, issue-form output, and external submissions to the same headings and metadata contract.
- Do not invent missing facts, acceptance criteria, reproduction steps, dates, estimates, or scoring evidence.
- Preserve useful original evidence and discussion history.
- If the task kind or minimum actionable shape remains unknown, retain the evidence, apply `needs triage` when available, and request the missing information instead of guessing.
- A parent task or project milestone owns broad hierarchical work. Do not introduce an Epic type initially.

## Metadata Authority

Use GitHub's native representation when it exists and is writable. The fallback capsule contains only canonical values that have no available native representation for that repository.

| Canonical concept          | Native representation                | Fallback key  | Initial contract                                                                                             |
| -------------------------- | ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------------------------ |
| Task kind                  | Issue type: Task, Bug, or Feature    | `type`        | Required                                                                                                     |
| Priority                   | Priority single-select issue field   | `priority`    | Optional override; excluded from Task score                                                                  |
| Work size                  | Work size single-select issue field  | `work-size`   | Optional; `1`, `2`, `3`, `5`, `8`, `13`, or `21`                                                             |
| Complexity                 | Complexity single-select issue field | `complexity`  | Optional; stable execution-tier input                                                                        |
| Impact                     | Impact single-select issue field     | `impact`      | Optional; local value independent of Work size                                                               |
| Task score                 | Task score number issue field        | `task-score`  | Derived integer `0` through `100`; unknown remains unset                                                     |
| Planned start              | Start date issue field               | `start-date`  | Optional ISO `YYYY-MM-DD` date                                                                               |
| Target completion          | Target date issue field              | `target-date` | Optional ISO `YYYY-MM-DD` date and urgency evidence                                                          |
| Work state                 | Issue state and state reason         | None          | Do not create a Status field                                                                                 |
| Responsibility             | Assignees                            | None          | Do not create an Owner or DRI field                                                                          |
| Project outcome or timebox | Milestone                            | None          | Do not use as a base-score input                                                                             |
| Hierarchy                  | Parent issue and sub-issues          | None          | Use native relationships                                                                                     |
| Blocking                   | Dependencies plus `blocked` label    | None          | Use dependencies for GitHub task blockers and document external blockers                                     |
| Classification and intake  | Canonical repository labels          | None          | Use the approved vocabulary without duplicating issue type, fields, state, relationships, or scoring factors |

Native metadata is authoritative if a duplicate fallback value exists accidentally. Migrate the fallback value into a newly available native field, verify the native write, then remove only the migrated key. Remove the capsule when it becomes empty.

Task Author may inspect and set available values. It must not create issue types, issue fields, field options, or label definitions as a side effect of authoring one task.

### Desired Organization Schema

The initial organization schema is:

| Surface            | Type          | Options or rule                                                |
| ------------------ | ------------- | -------------------------------------------------------------- |
| Issue type         | Native type   | Task, Bug, Feature                                             |
| Priority           | Single-select | Urgent, High, Medium, Low                                      |
| Work size          | Single-select | `1`, `2`, `3`, `5`, `8`, `13`, `21`                            |
| Complexity         | Single-select | Low, Medium, High                                              |
| Impact             | Single-select | Low, Medium, High, Very high                                   |
| Task score         | Number        | Integer `0` through `100` written by a contract-aware author   |
| Start date         | Date          | Optional                                                       |
| Target date        | Date          | Optional                                                       |
| Field visibility   | Visibility    | Public; private-repository access still protects private tasks |
| Field type pinning | Type binding  | Pin every managed field to Task, Bug, and Feature              |

Renaming Effort to Work size or changing used options requires an exact value migration. Field deletion, option removal, visibility changes, and value migrations are high-risk schema operations and must be previewed separately.

## Fallback Metadata

Place fallback metadata at the end of the task body in a visible fenced YAML block:

````markdown
### Task metadata

```yaml
schema: tanaab/task-metadata/v1
mode: fallback
fallback:
  type: task
  priority: high
  work-size: 5
  complexity: medium
  impact: high
  task-score: 52
```
````

Rules:

- Include only keys whose canonical native representation is unavailable.
- Omit unset keys. Do not write explicit `null`, `unknown`, zero, or another sentinel.
- Order keys as `type`, `priority`, `work-size`, `complexity`, `impact`, `task-score`, `start-date`, and `target-date`.
- Use lowercase enum values: `task`, `bug`, `feature`; `urgent`, `high`, `medium`, `low`; and `very-high` where applicable.
- Use an integer for `work-size` and `task-score` and an ISO `YYYY-MM-DD` scalar for dates.
- Do not place labels, assignees, milestones, state, parent, sub-issues, or dependencies in the capsule. GitHub supports those natively in organization- and user-owned repositories.
- Do not retain an empty capsule.

The capsule is a portability fallback, not a universal mirror. A partial native schema produces a partial capsule.

## Estimation Rubrics

Unknown values remain unset. Do not convert missing evidence into the lowest option.

### Work Size

Work size estimates relative delivery work rather than elapsed time.

| Value | Meaning                                                                                |
| ----- | -------------------------------------------------------------------------------------- |
| `1`   | Trivial, localized change with direct validation                                       |
| `2`   | Small bounded change, usually one surface and a few checks                             |
| `3`   | Bounded multi-step change with limited integration                                     |
| `5`   | Meaningful multi-surface work or implementation plus substantial validation            |
| `8`   | Large coordinated change with several implementation and validation paths              |
| `13`  | Very large task requiring an explicit decomposition review                             |
| `21`  | Oversized task that should normally become a parent and be decomposed before execution |

### Complexity

Complexity is a model-neutral execution-tier interface. It does not estimate duration and must never name a current model.

| Option | Meaning                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------- |
| Low    | Established pattern, localized reasoning, clear evidence, and little coordination or uncertainty        |
| Medium | Multiple interacting concerns, meaningful investigation, or moderate ambiguity and coordination         |
| High   | Novel or architectural reasoning, cross-system coordination, substantial ambiguity, or high uncertainty |

Unknown complexity remains unset rather than defaulting to High. Downstream consumers own the changeable mapping from these stable tiers to current execution resources.

### Impact

Impact estimates expected local value if the task is completed and deliberately excludes delivery cost.

| Option    | Numeric mapping | Meaning                                                                                             |
| --------- | --------------- | --------------------------------------------------------------------------------------------------- |
| Low       | `0.25`          | Narrow convenience, limited maintenance reduction, or a small improvement for few consumers         |
| Medium    | `0.50`          | Material local improvement, recurring friction removed, or a meaningful workflow made more reliable |
| High      | `0.75`          | Important capability, reliability, risk, or productivity gain across a major workflow or audience   |
| Very high | `1.00`          | Broad mission-critical value, severe ongoing risk removed, or a foundational capability gap closed  |

For Tasks, examine leverage, recurring time saved, maintenance removed, work unblocked, and risk reduced. For Bugs, examine frequency, blast radius, workflow blockage, data or security exposure, and affected users. For Features, examine reach, capability gaps, recurring value, and users or agents enabled.

### Priority

Priority is an explicit human or policy override using Urgent, High, Medium, or Low. It is not derived from Task score and is not an input to it.

If Priority materially conflicts with Task score ordering, record the durable rationale in a task comment. A draft must preview that comment before creation or revision.

## Goal-Independent Task Score

`task-score/v1` ranks local task value and execution economics without a Goal field or goal-alignment factor.

### Factor Mappings

Impact uses the persisted Impact mapping above. Urgency, enablement, and confidence are calculation diagnostics rather than additional issue fields.

| Factor     | Level        | Value  | Evidence standard                                                                     |
| ---------- | ------------ | ------ | ------------------------------------------------------------------------------------- |
| Urgency    | None         | `0.00` | Evidence supports no meaningful cost of waiting                                       |
| Urgency    | Moderate     | `0.33` | Some time sensitivity, recurring cost, or scheduling reason                           |
| Urgency    | High         | `0.67` | Active pain, material recurring cost, or a near-term deadline                         |
| Urgency    | Immediate    | `1.00` | Incident, imminent deadline, severe exposure, or essential workflow currently blocked |
| Enablement | None         | `0.00` | Value is principally standalone                                                       |
| Enablement | Some         | `0.33` | Unblocks one bounded follow-up or saves occasional repeated work                      |
| Enablement | Substantial  | `0.67` | Unblocks multiple tasks or workflows, or creates significant recurring leverage       |
| Enablement | Foundational | `1.00` | Prerequisite for broad downstream work or removal of systemic risk                    |
| Confidence | Low          | `0.50` | Enough evidence to estimate, but material assumptions or unknowns remain              |
| Confidence | Medium       | `0.75` | Reasonable direct evidence with some bounded assumptions                              |
| Confidence | High         | `1.00` | Direct, reproducible, or independently validated evidence supports the estimates      |

Missing urgency or enablement evidence is not the same as None. If the factors cannot be assessed, leave Task score unset. Low confidence is the minimum scorable confidence; evidence below that threshold is insufficient.

### Formula

Use natural logarithm `ln` and round to the nearest integer:

```text
benefit = 0.60 * impact + 0.20 * urgency + 0.20 * enablement
work-size penalty = 1 + 0.15 * ln(work size)
task score = clamp(round(100 * benefit * confidence / work-size penalty), 0, 100)
```

Scoring rules:

- Require Impact, Work size, Urgency, Enablement, and Confidence assessments.
- Leave the score unset when any required factor lacks enough evidence.
- Exclude Complexity and Priority.
- A target date may provide urgency evidence but does not determine urgency by itself.
- Recompute after relevant evidence, field values, deadlines, dependencies, or the formula changes.
- Do not alter the base score merely because a task joins a milestone or a backlog is filtered through a project goal.
- Work size uses a sublinear penalty so a large, very-high-value task can still rank above small low-value work.

### Scoring Audit Comment

Whenever a score is first persisted or changes, preview and post a concise durable comment:

```markdown
Task score: 37 (`task-score/v1`)

- Impact: Medium (`0.50`) — material recurring friction is removed.
- Urgency: Moderate (`0.33`) — the cost recurs during each release.
- Enablement: Some (`0.33`) — one follow-up workflow becomes possible.
- Work size: `3`
- Confidence: High (`1.00`) — the current behavior and desired outcome are directly verified.
```

The issue field or fallback key owns the numeric score. The comment preserves its versioned calculation evidence and does not replace the source task evidence.

## Canonical Repository Labels

| Label                | Purpose                                                    | Color     |
| -------------------- | ---------------------------------------------------------- | --------- |
| `documentation`      | Documentation additions or improvements                    | `#2f81f7` |
| `breaking change`    | Requires consumer migration or coordination                | `#db2777` |
| `regression`         | Previously working behavior has degraded                   | `#e5484d` |
| `blocked`            | Cannot proceed because of a documented blocker             | `#7f1d1d` |
| `needs triage`       | Submitted but not yet normalized against the task contract | `#f59e0b` |
| `needs reproduction` | A Bug needs reproducible evidence before work can proceed  | `#f97316` |
| `good first issue`   | Well-bounded work suitable for a first contribution        | `#86e7c4` |
| `help wanted`        | Maintainers welcome outside contribution                   | `#00c88a` |

Label rules:

- `documentation` applies when documentation is a primary delivery surface, not merely because every change needs some documentation.
- `breaking change` applies when consumers must migrate or coordinate because of the delivered behavior.
- `regression` applies only to a Bug with evidence that the behavior previously worked.
- `blocked` applies while any documented blocker prevents progress. Use a native issue dependency for a GitHub task blocker; identify external blockers in the body or a comment. Remove the label when the final blocker clears.
- `needs triage` applies while task kind, actionable scope, or required evidence is unresolved. Remove it once normalization is complete.
- `needs reproduction` applies only to a Bug that lacks enough reproduction or diagnostic evidence to proceed. Remove it once the evidence exists.
- `good first issue` applies only after triage to an actionable, unblocked task with clear acceptance criteria, Low Complexity, and Work size `1`, `2`, or `3`.
- `help wanted` applies only after triage when the task is actionable and maintainers welcome outside contribution. It may cover larger work than `good first issue`.

The eight labels form the canonical human-task vocabulary. A repository may declare at most two project-specific extensions before the shared contract should be reconsidered. Automation-owned labels such as Dependabot's `dependencies` may coexist but are not canonical task labels and do not count as project-specific extensions.

Task Author may apply or remove existing canonical labels but must not create, recolor, rename, or delete label definitions. Schema inspection must distinguish canonical, project-specific, automation-owned, and unmanaged labels. Label definition deletion is never automatic because it removes the label from every associated issue and pull request.

## Task Lifecycle Operations

### Draft and Create

- Drafting is read-only and does not require a complete GitHub capability set.
- A creation preview includes the complete task and every planned native, fallback, label, relationship, and comment mutation.
- If a canonical native field is unavailable, create safely with the corresponding fallback key rather than mutating organization schema.
- If a requested canonical label definition is absent, report it as unapplied; do not create it opportunistically.

### Revise

Revise the body to represent the current task rather than accumulating an inline changelog. For a material change to objective, scope, acceptance criteria, constraints, task kind, or execution assumptions:

1. show the exact semantic diff;
2. update the current body after authorization; and
3. post a concise comment summarizing what changed and why.

Minor wording, formatting, or typo corrections do not require a history comment. Never erase earlier comments or claim that previously delivered work satisfied newly added criteria without evidence.

### Normalize

- Preserve useful original evidence.
- Move evidence into the canonical shape without manufacturing missing facts.
- Propose metadata and labels only when supported.
- Apply `needs triage` when essential classification or actionability remains unresolved.
- Remove `needs triage` only after the normalized task has a supported kind, actionable scope, and checkable acceptance criteria.

### Fallback Migration

When a canonical native representation becomes available:

1. inspect the current fallback and native values;
2. treat a conflicting native value as authoritative and report the conflict;
3. preview the exact native write and capsule removal;
4. write and re-read the native value;
5. remove only the verified fallback key; and
6. remove the capsule when empty.

### Closure

Completion assessment remains owned by Task Completion Check. This initial contract does not authorize Task Author to infer completion from a merged pull request or passing check. Use native issue state reasons rather than `duplicate`, `invalid`, or `wontfix` labels.

## Remote Mutation and Verification

Implement remote work through the narrowest GitHub API client that supports the complete managed surface. Do not rely on a successful response or returned issue URL as proof that GitHub retained every value.

For every mutation:

1. Resolve and display the exact target.
2. Inspect capabilities and current values.
3. Render the complete task or exact managed diff.
4. Pass the publication-safety gate.
5. Obtain the required authorization.
6. Apply only the authorized values.
7. Re-read title, body, type or fallback, fields or fallbacks, labels, assignees, milestone, relationships, and managed comments.
8. Compare requested and observed values.
9. Report complete success, partial success, or failure without hiding a created issue or partially applied mutation.

Silently dropped values are failures for those values. Never compensate for a failed task write by changing organization schema, widening permissions, creating labels, or making a broader second mutation.

Schema Author must separate organization type and field authorization from organization-default-label and repository-label authorization. Deletions, option removal, visibility changes, renames, and migrations require distinct high-risk previews and must not be bundled into routine alignment.

## Calibration and Change Control

Use [the task-management fixture corpus](./task-management-fixtures.md) as the common comparison surface for Task Author, GitHub Issue Form Author, and GitHub Issue Schema Author.

The phase 1 and phase 2 convergence loop may revise:

- evidence prompts and normalized body wording;
- Complexity or Impact descriptions and option granularity;
- scoring weights, factor mappings, confidence threshold, or Work size penalty; and
- fallback or label behavior when fixtures expose ambiguity.

Any scoring change requires a new formula version if it would change a persisted score for the same inputs. Do not silently redefine `task-score/v1`. Any fallback-schema change that alters key meaning or representation requires a new schema version.

Goal-aware scoring, additional task types, Severity, Area, Confidence, workflow Status, arbitrary label expansion, and GitHub Projects board fields remain deferred until repeated evidence establishes a concrete need.

## Related Canon

- [GitHub-backed project management model](./project-management-model.md)
- [Task management skills roadmap](../ideas/task-management-skills-roadmap.md)
- [Task Completion Check](../skills/task-completion-check/SKILL.md)
