# Task Management Contract

Status: canonical contract

Contract version: `tanaab/task-management/v2`

Fallback schema: `tanaab/task-metadata/v2`

## Purpose

This reference is the shared semantic contract for GitHub-backed task authoring. Apply it with [the GitHub-backed project management model](./project-management-model.md).

The initial consumers are:

- **Task Author**, which owns one task and its directly managed values;
- **Task Decomposer**, which owns keep-or-split review plus one approved shallow child-task and relationship lifecycle;
- **GitHub Issue Schema Author**, which owns organization issue types and fields plus repository label definitions;
- **GitHub Issue Form Author**, which owns checked-in Task, Bug, and Feature forms;
- **Task Completion Check**, which owns read-only assessment of acceptance and completion-pull-request evidence; and
- **Project Milestone Author**, which owns one repository milestone and explicitly selected task membership without changing task semantics.

Those skills keep separate provider, authorization, and failure boundaries. They must not restate or independently reinterpret this contract. Changes to task shapes, metadata authority, fallback keys, field options, label semantics, or completion evidence must update the shared [fixture corpus](./task-management-fixtures.md).

The Task, Bug, and Feature bodies and intake prompts are accepted. Complexity and Impact remain direct planning metadata whose rubrics may be refined through the shared convergence loop.

## Domain and Provider Terms

A **task** is one GitHub issue in the repository that represents its project. A Task may cover any bounded unit of work, including code, repository administration, research, operations, content, purchasing, scheduling, or another external outcome. Bug and Feature remain the more specific initial task kinds.

Use task and project in user-facing workflows. Use repository, issue, issue type, issue field, label, milestone, sub-issue, and dependency when the GitHub representation matters.

The task owns its state and acceptance criteria. Every task requires a linked completion pull request, but that change is the delivery and review envelope rather than a replacement for the task. A check or release may add evidence but does not prove completion by itself.

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
- any managed comment that will be posted; and
- an exact managed diff for revision, normalization, or schema alignment.

Authorization is conveyed by user intent, not by a mandatory extra conversational round trip. An unambiguous imperative to create, revise, normalize, or explicitly migrate fallback metadata for one exact task authorizes one bounded Task Author mutation when every planned effect is an ordinary consequence of the requested mode and this contract. The agent must still read current state, generate and inspect the exact plan, scan every publication surface, bind the write to the exact target and digest, apply it, and verify it. When those checks reveal no material surprise, the preview and digest-authorized write may occur in the same turn without asking the user to approve the digest separately.

Plan mode and requests such as “plan,” “draft,” “preview,” “show me the diff,” or “what would change?” are read-only. Questions and exploratory discussion do not authorize mutation. Stop for fresh direction when the target is unresolved, required evidence is missing, or the exact plan contains a material surprise outside the requested mode, such as a different target, broader scope, additional public text beyond contract-standard comments, or another consequential side effect.

Schema synchronization, relationship changes, and destructive operations retain their own authorization boundaries. An explicit fallback-migration imperative authorizes only the separately planned two-phase migration for that exact task. Never broaden authorization from one repository, task, mode, or displayed mutation to another.

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

## Outcome

## Scope

### Out of scope

## Acceptance criteria

- [ ] Observable completion condition

## Delivery and verification

## Constraints and approvals
```

`Scope` states the work, deliverables, or external actions that belong to the task. `Out of scope` is optional and appears only when an explicit boundary prevents expansion. `Delivery and verification` identifies the expected artifact or external state plus the evidence the completion pull request must provide. `Constraints and approvals` is optional and records material deadlines, budgets, access, privacy, affected people, external communication, spending, or irreversible actions.

The evidence-gathering path should establish the current condition, desired outcome, required work, acceptance evidence, delivery proof, known constraints, local value, time sensitivity, dependencies, and any human authorization boundary. Never treat task creation as approval to spend money, contact a third party, disclose private information, or perform another consequential external action.

### Bug

Use these headings in order:

```markdown
## Observed behavior

## Expected behavior

## Reproduction or evidence

## Impact

## Delivery and verification

## Acceptance criteria

- [ ] Observable fix condition

## Constraints and approvals
```

Capture the reporter's steps, environment, affected baseline, inputs, logs, and other direct evidence beneath `Reproduction or evidence`. Do not require the reporter to write a test, open a pull request, or execute risky or machine-mutating steps merely to complete intake. Establish whether the behavior previously worked before applying `regression`. Missing reproduction evidence does not prevent preserving a credible report, but it does require `needs reproduction` until the gap is resolved.

`Delivery and verification` defines the worker-owned red-to-green completion path. Plan one linked completion pull request that starts in draft. When technically feasible, its first substantive change is a regression test or reproduction harness that demonstrates the reported behavior against the affected baseline in the safest suitable disposable environment, normally existing GitHub Actions. The plan records the baseline, execution environment, expected failing evidence, the same test or harness passing with the fix, and relevant surrounding validation. It must not require execution on an agent host when reproduction could mutate that machine.

A disposable runner is not authorization to mutate external systems, consume paid services, use sensitive credentials, contact people, or cause another consequential effect. Prefer least-privilege validation without secrets. When safe automation is infeasible, record the constraint, proposed equivalent evidence, and any required approval instead of fabricating a test or performing the action. `Constraints and approvals` is optional and records those or other material boundaries.

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

## Delivery and verification

## Alternatives and constraints
```

Use Feature for one bounded new or materially expanded capability. `Problem or opportunity` establishes the affected user or workflow, current experience or workaround, recurrence, and value. `Desired outcome` describes the useful capability and primary use case without prescribing unnecessary implementation. `Scope` defines the smallest coherent delivery and requires explicit in-scope and out-of-scope boundaries. If the request cannot be assessed as one independently observable capability, keep it unready and recommend decomposition instead of treating Feature as an informal epic.

`Acceptance criteria` express the consumer-visible capability, important boundaries, and applicable compatibility, documentation, example, or migration conditions. `Delivery and verification` identifies the linked completion pull request, substantive repository artifacts, tests or executable examples, user-facing documentation, compatibility or migration evidence, relevant checks, and release evidence when applicable. A Feature does not require an intentionally failing draft check; its completion pull request remains draft during implementation and must provide green validation before it is marked ready.

`Alternatives and constraints` is optional when no material alternative or constraint is known. Record rejected approaches, dependencies, compatibility implications, security, privacy, accessibility, performance, approvals, and other meaningful boundaries without turning the issue into a speculative product specification.

### Intake Evidence and Canonical Tasks

Human intake and canonical task authoring are different representations of the same work:

- A **submission** is a low-friction evidence package. Its questions use ordinary reporter language and do not need to mirror canonical headings.
- A **canonical task** is the normalized working artifact. It uses the Task, Bug, or Feature body shape above, accepted metadata, and checkable acceptance criteria.
- GitHub Issue Form Author extracts submitted responses and the original Markdown without semantic invention. Task Author owns the later evidence assessment and canonical rewrite.

The initial Task and Feature forms use two required evidence responses plus one optional context response. The Task prompts ask what needs to be done and why, how completion will be observed, and optionally which constraints, inputs, or approvals matter. The human-facing Feature request asks for the problem or opportunity and the useful outcome, with optional examples, mockups, compatibility concerns, constraints, or dependencies; it does not require formal scope, acceptance criteria, or implementation design. The Bug form uses three required evidence responses plus one optional context response. It asks for observed behavior, expected behavior, and safe reproduction or investigation evidence; it does not ask the reporter to write a test or open a pull request. Forms must not ask reporters to estimate Priority, Work size, Complexity, Impact, labels, or scheduling commitments. Organization and personal repositories collect the same evidence; native or fallback metadata is decided only after normalization.

Required form questions establish minimum useful evidence rather than demanding a fully planned task. A Bug's investigation response may provide reproducible steps or other direct occurrence evidence because intermittent failures can be valuable even when deterministic reproduction is unavailable.

### Normalization Rules

- Preserve the complete submitted Markdown and every useful response before reshaping evidence.
- Normalize Task Author drafts, form submissions, and external submissions to the same canonical body and metadata contract, but do not require their intake headings to match it.
- Move evidence into the canonical shape without inventing missing facts, acceptance criteria, reproduction steps, dates, or estimates.
- Surface unresolved canonical sections as focused follow-up questions. Do not turn a short submission into generic filler merely to satisfy the shape.
- If the task kind or minimum actionable shape remains unknown, retain the evidence, apply `needs triage` when available, and request the missing information instead of guessing.
- Preserve discussion history and preview the exact body diff before normalizing an existing task.
- A parent task or project milestone owns broad hierarchical work. Do not introduce an Epic type initially.

### Assessment Ownership and Collaboration

Task Author performs a semantic assessment before its deterministic helper validates, renders, and gates publication. The helper does not contain an LLM estimator.

| Value                                           | Default authority                    | Collaboration rule                                                                                                                       |
| ----------------------------------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Task kind, title, body, and acceptance criteria | Human and agent                      | The agent drafts from evidence; the human authorizes the complete publication or revision plan.                                          |
| Priority                                        | Human or explicit policy             | The agent may discuss a recommendation but must not persist it as an agent estimate. Leave it unset until a human or policy supplies it. |
| Work size                                       | Agent estimate                       | Apply the delivery-scope rubric, show rationale and provenance, and permit a human override.                                             |
| Complexity                                      | Agent estimate                       | Apply the model-neutral reasoning rubric, show rationale and provenance, and permit a human override.                                    |
| Impact                                          | Agent estimate with human correction | Assess local value only when evidence is sufficient; otherwise leave it unset.                                                           |
| Start date and Target date                      | Human or explicit policy             | Preserve explicitly supplied commitments; do not invent scheduling dates from contextual evidence.                                       |

Every accepted metadata value must show its source as `agent`, `human`, `policy`, or `existing`. Agent estimates require a concise evidence-based rationale. Exact-plan authorization accepts the displayed values; changing one value requires a fresh plan. During revision, preserve existing native values by default unless the user requests reassessment or changed evidence supports a displayed change.

## Metadata Authority

Use GitHub's native representation when it exists and is writable. The fallback capsule contains only canonical values that have no available native representation for that repository.

| Canonical concept          | Native representation                | Fallback key  | Initial contract                                                                            |
| -------------------------- | ------------------------------------ | ------------- | ------------------------------------------------------------------------------------------- |
| Task kind                  | Issue type: Task, Bug, or Feature    | `type`        | Required                                                                                    |
| Priority                   | Priority single-select issue field   | `priority`    | Optional human- or policy-controlled sequencing override                                    |
| Work size                  | Work size single-select issue field  | `work-size`   | Optional; `1`, `2`, `3`, `5`, `8`, `13`, or `21`                                            |
| Complexity                 | Complexity single-select issue field | `complexity`  | Optional; stable execution-tier input                                                       |
| Impact                     | Impact single-select issue field     | `impact`      | Optional; local value independent of Work size                                              |
| Planned start              | Start date issue field               | `start-date`  | Optional ISO `YYYY-MM-DD` date                                                              |
| Target completion          | Target date issue field              | `target-date` | Optional ISO `YYYY-MM-DD` commitment                                                        |
| Work state                 | Issue state and state reason         | None          | Do not create a Status field                                                                |
| Responsibility             | Assignees                            | None          | Do not create an Owner or DRI field                                                         |
| Project outcome or timebox | Milestone                            | None          | Keep milestone context separate from task metadata                                          |
| Hierarchy                  | Parent issue and sub-issues          | None          | Use native relationships                                                                    |
| Blocking                   | Dependencies plus `blocked` label    | None          | Use dependencies for GitHub task blockers and document external blockers                    |
| Classification and intake  | Canonical repository labels          | None          | Use the approved vocabulary without duplicating issue type, fields, state, or relationships |

Native metadata is authoritative if a duplicate fallback value exists accidentally. Migrate the fallback value into a newly available native field, verify the native write, then remove only the migrated key. Remove the capsule when it becomes empty.

Task Author may inspect and set available values. It must not create issue types, issue fields, field options, or label definitions as a side effect of authoring one task.

### Desired Organization Schema

The initial organization schema is:

| Surface            | Type          | Options or rule                                                               |
| ------------------ | ------------- | ----------------------------------------------------------------------------- |
| Issue type         | Native type   | Task, Bug, Feature                                                            |
| Priority           | Single-select | Urgent, High, Medium, Low                                                     |
| Work size          | Single-select | `1`, `2`, `3`, `5`, `8`, `13`, `21`                                           |
| Complexity         | Single-select | Low, Medium, High                                                             |
| Impact             | Single-select | Low, Medium, High, Very high                                                  |
| Start date         | Date          | Optional                                                                      |
| Target date        | Date          | Optional                                                                      |
| Field visibility   | Visibility    | Organization members and repository collaborators with read access or greater |
| Field type pinning | Type binding  | Pin every managed field to Task, Bug, and Feature                             |

Canonical single-select option colors use GitHub's fixed palette as the closest semantic projection of the Tanaab brand and status colors:

| Field      | Option groups                                       |
| ---------- | --------------------------------------------------- |
| Work size  | `1`-`3` green; `5`-`8` blue; `13` yellow; `21` red  |
| Complexity | Low green; Medium yellow; High pink                 |
| Impact     | Low gray; Medium yellow; High blue; Very high green |

Work size is a separate canonical field. GitHub's default Effort field may coexist as unmanaged schema, but this contract does not rename it, map it into Work size, delete it, or use it as Task Author evidence. Changing used Work size options, field deletion, option removal, visibility changes, and value migrations are high-risk schema operations and must be previewed separately.

## Fallback Metadata

Place fallback metadata at the end of the task body in a visible fenced YAML block:

````markdown
### Task metadata

```yaml
schema: tanaab/task-metadata/v2
mode: fallback
fallback:
  type: task
  priority: high
  work-size: 5
  complexity: medium
  impact: high
```
````

Rules:

- Include only keys whose canonical native representation is unavailable.
- Omit unset keys. Do not write explicit `null`, `unknown`, zero, or another sentinel.
- Order keys as `type`, `priority`, `work-size`, `complexity`, `impact`, `start-date`, and `target-date`.
- Use lowercase enum values: `task`, `bug`, `feature`; `urgent`, `high`, `medium`, `low`; and `very-high` where applicable.
- Use an integer for `work-size` and an ISO `YYYY-MM-DD` scalar for dates.
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

| Option    | Meaning                                                                                             |
| --------- | --------------------------------------------------------------------------------------------------- |
| Low       | Narrow convenience, limited maintenance reduction, or a small improvement for few consumers         |
| Medium    | Material local improvement, recurring friction removed, or a meaningful workflow made more reliable |
| High      | Important capability, reliability, risk, or productivity gain across a major workflow or audience   |
| Very high | Broad mission-critical value, severe ongoing risk removed, or a foundational capability gap closed  |

For Tasks, examine leverage, recurring time saved, maintenance removed, work unblocked, and risk reduced. For Bugs, examine frequency, blast radius, workflow blockage, data or security exposure, and affected users. For Features, examine reach, capability gaps, recurring value, and users or agents enabled.

### Priority

Priority is an explicit human or policy override using Urgent, High, Medium, or Low. An unset Priority means no sequencing override has been supplied; it does not imply Low. Preserve its provenance and rationale in the Task Author assessment and exact publication preview.

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

Revise the body to represent the current task rather than accumulating an inline changelog. For a material change to outcome, scope, acceptance criteria, constraints, task kind, or execution assumptions:

1. show the exact semantic diff;
2. update the current body after authorization; and
3. post a concise comment summarizing what changed and why.

Minor wording, formatting, or typo corrections do not require a history comment. Never erase earlier comments or claim that previously delivered work satisfied newly added criteria without evidence.

### Normalize

- Preserve useful original evidence.
- Treat form responses and arbitrary external headings as intake evidence rather than a pre-normalized task.
- Move evidence into the canonical shape without manufacturing missing facts or requiring one-to-one heading correspondence.
- Propose metadata and labels only when supported.
- Apply `needs triage` when essential classification or actionability remains unresolved.
- Remove `needs triage` only after the normalized task has a supported kind, actionable scope, and checkable acceptance criteria.

### Decompose

- Inspect one exact canonical parent plus its metadata, comments, linked work, existing sub-issues, dependencies, and repository task candidates before proposing a split.
- Work size `13` requires explicit keep-or-decompose review and Work size `21` normally recommends decomposition; neither threshold authorizes mutation.
- Keep recommendation read-only. A decomposition requires distinct independently completable canonical children, complete non-overlapping parent-criterion coverage, retained source constraints, one shallow acyclic native relationship graph, and an exact digest-gated plan.
- Reuse an existing exact task rather than creating a duplicate. Never move a child from another parent, create depth beyond one, or treat preferred ordering as a dependency.
- Create and verify missing children and relationships in resumable order, then revise the parent into an open outcome rollup without claiming acceptance or completion.
- Preserve partial success and report completed, failed, and remaining operations. Never delete or detach created work to simulate rollback.

### Fallback Migration

When a canonical native representation becomes available:

1. inspect the current fallback and native values;
2. treat a conflicting native value as authoritative and report the conflict;
3. preview the exact native write and capsule removal;
4. write and re-read the native value;
5. remove only the verified fallback key; and
6. remove the capsule when empty.

### Completion Pull Request

Every Task, Bug, and Feature requires at least one linked pull request before it can be ready for completion. Use [the canonical completion pull-request template](../templates/task-completion-pull-request.md) as the evidence envelope.

- Keep the pull request in draft while work is in progress. Marking it ready for review requests completion assessment.
- Link it through GitHub's supported closing or development relationship so Task Completion Check can discover it.
- Map the task's acceptance criteria to safe supporting evidence in the pull-request body. The body may reference code, repository artifacts, external outcomes, checks, or approved private evidence without publishing sensitive material.
- For a Bug, use the linked draft completion pull request as the red-to-green delivery envelope. Preserve the failing regression run against the affected baseline, add the fix to the same pull request, and show the same reproduction plus relevant surrounding checks passing before marking it ready. When automated reproduction is unsafe or infeasible, document the exception and equivalent evidence in the pull-request body.
- Surface failing checks on a draft pull request but classify the path as `pending` while it remains work in progress. Once the pull request is ready for review, failing checks are `blocked` completion evidence.
- Prefer a substantive repository change or safe artifact. When the outcome is entirely external and no useful artifact belongs in the repository, an empty completion commit is acceptable only with an evidence-bearing pull-request body.
- Treat spending, external communication, account changes, legal or tax actions, and other consequential side effects as separately authorized work. A task or completion pull request never supplies missing authority.
- Do not infer completion from the existence, approval, checks, or merge of the pull request alone. The task's acceptance criteria remain authoritative.

### Closure

Completion assessment remains owned by Task Completion Check. An open task with complete acceptance criteria but no linked completion pull request remains `pending`. An already-closed issue is reported as complete provider state; that report does not prove the required pull-request gate was followed. This initial contract does not authorize Task Author to infer completion from a merged pull request or passing check. Use native issue state reasons rather than `duplicate`, `invalid`, or `wontfix` labels.

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

GitHub treats `issue_field_values` on an issue update as a replacement set rather than a partial merge. Whenever a mutation includes that property, preserve every currently observed set issue field and overlay the intended changes into one complete replacement payload. This applies to canonical, provider-managed, and unmanaged fields alike. Stop before mutation if a current set value cannot be represented safely; never send only the changed field values.

Silently dropped values are failures for those values. Never compensate for a failed task write by changing organization schema, widening permissions, creating labels, or making a broader second mutation.

Schema Author must separate organization type and field authorization from organization-default-label and repository-label authorization. Deletions, option removal, visibility changes, renames, and migrations require distinct high-risk previews and must not be bundled into routine alignment.

## Calibration and Change Control

Use [the task-management fixture corpus](./task-management-fixtures.md) as the common comparison surface for Task Author, GitHub Issue Form Author, GitHub Issue Schema Author, and the completion rules assessed by Task Completion Check.

The convergence loop may revise:

- evidence prompts and normalized body wording;
- Complexity or Impact descriptions and option granularity;
- fallback or label behavior when fixtures expose ambiguity.

Any fallback-schema change that alters key meaning or representation requires a new schema version. Task Author may read the retired `tanaab/task-metadata/v1` format only to preserve supported values and remove retired keys through an exact authorized task mutation; all newly rendered capsules use `tanaab/task-metadata/v2`.

Additional task types, Severity, Area, Confidence, workflow Status, arbitrary label expansion, and GitHub Projects board fields remain deferred until repeated evidence establishes a concrete need.

## Related Canon

- [Machine-readable task management schema](./task-management-schema.json)
- [GitHub-backed project management model](./project-management-model.md)
- [Task Completion Check](../skills/task-completion-check/SKILL.md)
