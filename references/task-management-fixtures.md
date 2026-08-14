# Task Management Fixture Corpus

Status: initial cross-skill fixture baseline

Contract version: `tanaab/task-management/v1`

## Purpose

These fixtures are the shared comparison surface for Task Author, GitHub Issue Form Author, and GitHub Issue Schema Author. Their completion assertions also constrain Task Completion Check. Apply them with [the task management contract](./task-management-contract.md).

The cases are descriptive golden fixtures, not live GitHub operations. The shared executable fixture support and cross-skill equivalence spec live in the repository `test/` surface, while effect-specific fake-client coverage remains with each owning skill.

Fixture prose is illustrative. The expected task kind, body shape, metadata authority, fallback shape, labels, score, mutation boundary, and verification result are normative for the initial convergence loop.

## Shared Assertions

Every applicable fixture must satisfy these assertions:

- Resolve and display one exact `OWNER/REPO` target or stop without mutation.
- Preserve form and external-submission evidence losslessly, then produce the same canonical task semantics after Task Author normalization.
- Show source and rationale for accepted estimates; keep Priority human- or policy-controlled and Task score derived.
- Use native metadata when available and include only unavailable canonical values in fallback metadata.
- Omit unknown values instead of inventing defaults or sentinels.
- Use only existing canonical labels; never create label definitions during task authoring.
- Keep Complexity model-neutral and exclude it from Task score.
- Keep Priority out of Task score and preserve a material override rationale.
- By default, persist a collapsed advisory scoring-audit comment whenever a score is first written or its displayed inputs change; allow explicit suppression without suppressing the score.
- Preview every write and re-read every managed value afterward.
- Report partial success honestly rather than treating an issue URL as complete success.
- Require at least one linked completion pull request before an open task can become ready. Keep external or sensitive evidence safely summarized rather than publishing private material.

## Fixture Matrix

| ID  | Surface       | Task kind | Repository mode | Primary coverage                             | Expected score |
| --- | ------------- | --------- | --------------- | -------------------------------------------- | -------------- |
| T01 | Task Author   | Task      | Organization    | Complete native metadata                     | `37`           |
| T02 | Task Author   | Bug       | Organization    | Reproducible regression                      | `47`           |
| T03 | Task Author   | Feature   | Organization    | Breaking change and medium confidence        | `37`           |
| T04 | Task Author   | Task      | Personal        | Complete fallback and documentation label    | `20`           |
| T05 | Task Author   | Bug       | Personal        | Fallback Bug with regression                 | `50`           |
| T06 | Task Author   | Feature   | Personal        | Fallback Feature with contributor invitation | `52`           |
| T07 | Task Author   | Unknown   | Organization    | Underspecified external submission           | Unset          |
| T08 | Task Author   | Bug       | Organization    | Missing reproduction evidence                | Unset          |
| T09 | Task Author   | Task      | Organization    | Documented external blocker                  | `41`           |
| T10 | Task Author   | Task      | Organization    | Native task dependency and blocked lifecycle | `52`           |
| T11 | Task Author   | Task      | Organization    | Partial native schema and partial fallback   | `37`           |
| T12 | Task Author   | Task      | Ambiguous       | Conservative target resolution               | Not calculated |
| T13 | Task Author   | Task      | Organization    | Oversized, very-high-value work              | `64`           |
| T14 | Task Author   | Task      | Organization    | Material Priority override                   | `22`           |
| T15 | Task Author   | Task      | Organization    | Score boundaries and insufficient evidence   | Varies         |
| T16 | Task Author   | Task      | Organization    | Fallback-to-native migration                 | Unchanged      |
| S01 | Schema Author | All       | Organization    | Current-schema and legacy-label inspection   | Not applicable |
| F01 | Form Author   | All       | Both            | Low-friction, lossless intake handoff        | Fixture-owned  |
| R01 | Task Author   | Feature   | Organization    | Material revision history                    | Recomputed     |

## Task Author Fixtures

### T01: Organization Task with Complete Native Metadata

Input evidence:

- Explicit target: `acme/widgets`.
- Outcome: one repository health summary consolidates the existing checks.
- Scope and acceptance conditions are bounded and directly testable.
- Delivery evidence is expected in the linked completion pull request.
- The work removes recurring release friction and enables one follow-up workflow.

Expected body:

- `Context` identifies the repeated manual check sequence.
- `Outcome` names the observable consolidated summary.
- `Scope` identifies the required check consolidation and omits unrelated remediation through an optional exclusion.
- `Acceptance criteria` contains observable output and validation conditions.
- `Delivery and verification` identifies the expected pull-request artifact and observed validation results.
- No fallback capsule appears.

Expected native metadata:

| Value       | Expected |
| ----------- | -------- |
| Issue type  | Task     |
| Priority    | Medium   |
| Work size   | `3`      |
| Complexity  | Low      |
| Impact      | Medium   |
| Task score  | `37`     |
| Start date  | Unset    |
| Target date | Unset    |

Expected labels: none.

Expected score evidence:

- Impact: Medium (`0.50`).
- Urgency: Moderate (`0.33`).
- Enablement: Some (`0.33`).
- Confidence: High (`1.00`).
- Work size: `3`.
- `task-score/v1`: `37`.

Creation succeeds only after the issue and scoring comment are re-read and match the preview.

### T02: Organization Bug with Reproducible Regression

Input evidence:

- Explicit target: `acme/widgets`.
- The current release silently omits stale plugin files during cache refresh.
- The preceding release removed the files correctly.
- Reproduction steps, observed output, expected output, and affected versions are available.
- The bug affects a major release workflow but does not block unrelated work.

Expected body uses the complete Bug shape, preserves version and command evidence beneath `Reproduction or evidence`, and requires a linked draft completion pull request whose regression test runs in disposable GitHub Actions, fails against the affected baseline, and passes with the fix.

Expected native metadata:

| Value      | Expected |
| ---------- | -------- |
| Issue type | Bug      |
| Priority   | High     |
| Work size  | `5`      |
| Complexity | Medium   |
| Impact     | High     |
| Task score | `47`     |

Expected labels: `regression`.

Do not apply `needs reproduction`: the evidence is actionable. Score inputs are Impact High (`0.75`), Urgency High (`0.67`), Enablement None (`0.00`), Confidence High (`1.00`), and Work size `5`.

The reporter is not asked to write the test or open the pull request. Those are worker-owned obligations normalized into `Delivery and verification`.

### T03: Organization Feature with a Breaking Change

Input evidence:

- Explicit target: `acme/widgets`.
- The feature adds machine-readable task inspection output and replaces an incompatible experimental output shape.
- Consumers must migrate before a stated target date.
- The design crosses several surfaces and still has bounded architectural uncertainty.

Expected body:

- `Problem or opportunity` identifies the missing stable automation surface.
- `Desired outcome` describes the supported output contract.
- `Scope` separates the new contract from unrelated CLI redesign.
- `Acceptance criteria` covers schema, compatibility documentation, and migration evidence.
- `Alternatives and constraints` records the rejected compatibility approach.

Expected native metadata:

| Value       | Expected     |
| ----------- | ------------ |
| Issue type  | Feature      |
| Priority    | Medium       |
| Work size   | `8`          |
| Complexity  | High         |
| Impact      | High         |
| Task score  | `37`         |
| Target date | `2026-10-01` |

Expected labels: `breaking change`.

Score inputs are Impact High (`0.75`), Urgency Moderate (`0.33`), Enablement Substantial (`0.67`), Confidence Medium (`0.75`), and Work size `8`. Complexity does not change the score.

### T04: Personal-Repository Task with Complete Fallback

Input evidence:

- Explicit target: `octo-user/widgets`.
- The repository is user-owned and has no organization issue types or issue fields.
- The task documents local setup prerequisites.
- The task is bounded, low complexity, and removes occasional setup friction.

Expected body uses the Task shape and ends with:

```yaml
schema: tanaab/task-metadata/v1
mode: fallback
fallback:
  type: task
  priority: low
  work-size: 2
  complexity: low
  impact: low
  task-score: 20
```

Expected labels: `documentation` if that definition already exists. If it does not exist, report it as unapplied and do not create it.

Score inputs are Impact Low (`0.25`), Urgency None (`0.00`), Enablement Some (`0.33`), Confidence High (`1.00`), and Work size `2`.

Unset dates are omitted. By default, the collapsed scoring-audit comment remains planned even though the numeric score uses the fallback capsule; `publishScoringAudit: false` suppresses only the comment.

### T05: Personal-Repository Bug with Regression

Input evidence:

- Explicit target: `octo-user/widgets`.
- A retry path duplicates final output.
- Reproduction is deterministic and the prior release emitted one result.
- The defect affects a major workflow and has active recurring cost.

Expected fallback:

```yaml
schema: tanaab/task-metadata/v1
mode: fallback
fallback:
  type: bug
  priority: high
  work-size: 3
  complexity: medium
  impact: high
  task-score: 50
```

Expected labels: `regression`.

Do not apply `needs reproduction`. Score inputs are Impact High (`0.75`), Urgency High (`0.67`), Enablement None (`0.00`), Confidence High (`1.00`), and Work size `3`.

`Delivery and verification` uses the same worker-owned draft-red-to-green pull-request lifecycle as T02.

### T06: Personal-Repository Feature Open to Contributors

Input evidence:

- Explicit target: `octo-user/widgets`.
- The feature adds an exportable task summary.
- Scope, output examples, compatibility constraints, and acceptance conditions are complete.
- Maintainers explicitly welcome an outside contributor.
- The work is larger than a good first issue.

Expected fallback:

```yaml
schema: tanaab/task-metadata/v1
mode: fallback
fallback:
  type: feature
  priority: medium
  work-size: 5
  complexity: medium
  impact: high
  task-score: 52
```

Expected labels: `help wanted`.

Do not apply `good first issue` because Work size exceeds `3`. Score inputs are Impact High (`0.75`), Urgency Moderate (`0.33`), Enablement Substantial (`0.67`), Confidence High (`1.00`), and Work size `5`.

### T07: Underspecified External Submission

Existing issue input:

- Explicit target: `acme/widgets#81`.
- Title: `make sync better`.
- Body: `sync is annoying and should be improved`.
- No affected workflow, desired outcome, boundaries, acceptance criteria, or evidence supports a task kind.

Expected behavior:

- Preserve the original title and body evidence.
- Do not guess Task, Bug, or Feature.
- Do not invent Priority, Work size, Complexity, Impact, Task score, or acceptance criteria.
- Apply `needs triage` if the label definition exists.
- Produce focused questions for task kind, current condition, desired outcome, and observable acceptance.
- Do not claim normalization is complete and do not remove `needs triage`.

The expected Task score is unset. Missing evidence is not equivalent to low Impact, None urgency, or Low confidence.

### T08: Bug Missing Reproduction Evidence

Existing issue input:

- Explicit target: `acme/widgets#82`.
- The report clearly describes observed and expected behavior and material user impact.
- The reporter cannot yet supply steps, logs, versions, or another reproducible artifact.

Expected behavior:

- Normalize into the Bug body shape without fabricating reproduction steps.
- Preserve the standard safe delivery lifecycle without claiming that a failing reproduction has already been observed.
- Preserve the reporter's evidence and identify the exact missing diagnostic information.
- Set issue type Bug when available.
- Set Impact High only if the described blast radius supports it.
- Leave Work size, Complexity, and Task score unset.
- Apply `needs reproduction`.
- Apply `regression` only if separate evidence establishes previously working behavior.
- Do not apply `good first issue` or `help wanted` while the report is not actionable.

Once sufficient evidence arrives, preview removal of `needs reproduction` and estimate the previously unset values.

### T09: Task Blocked by an External Dependency

Input evidence:

- Explicit target: `acme/widgets`.
- The task cannot proceed until a vendor grants API access.
- No GitHub issue represents the vendor decision.
- The body identifies the blocker, external owner, evidence, and next review condition.

Expected native metadata:

| Value      | Expected |
| ---------- | -------- |
| Issue type | Task     |
| Priority   | High     |
| Work size  | `8`      |
| Complexity | High     |
| Impact     | High     |
| Task score | `41`     |

Expected labels: `blocked`.

Expected relationships: no fabricated GitHub dependency.

Score inputs are Impact High (`0.75`), Urgency High (`0.67`), Enablement Substantial (`0.67`), Confidence Medium (`0.75`), and Work size `8`. When access arrives, remove `blocked`, reconsider Confidence and other affected factors, and recompute the score if their evidence changes.

### T10: Task Blocked by Another GitHub Task

Input evidence:

- Explicit target: `acme/widgets`.
- `acme/widgets#42` must deliver a stable API before this task can proceed.
- The blocker exists and is verified in the same project repository.

Expected behavior:

- Create the native blocked-by relationship to `acme/widgets#42`.
- Apply `blocked` as the filterable lifecycle signal.
- Record the dependency in the preview and verify both the relationship and label after mutation.

Expected native values are Task, Priority Medium, Work size `5`, Complexity Medium, Impact High, and Task score `52`. Score inputs are Impact High (`0.75`), Urgency Moderate (`0.33`), Enablement Substantial (`0.67`), Confidence High (`1.00`), and Work size `5`.

Remove `blocked` only after the final blocker is actually resolved. Closing the related issue is evidence to inspect, not automatic proof that its required outcome exists.

### T11: Organization Repository with a Partial Native Schema

Use the task evidence and scoring factors from T01, but target a repository with these capabilities:

Capabilities:

- Task issue type exists.
- Priority and Work size fields exist.
- Complexity, Impact, and Task score fields do not exist.
- Start date and Target date exist but are unset.

Expected native metadata:

| Value      | Expected |
| ---------- | -------- |
| Issue type | Task     |
| Priority   | Medium   |
| Work size  | `3`      |

Expected body fallback:

```yaml
schema: tanaab/task-metadata/v1
mode: fallback
fallback:
  complexity: low
  impact: medium
  task-score: 37
```

Do not duplicate type, Priority, Work size, or unset dates. Do not mutate organization schema. Report the missing managed fields as a possible separate Schema Author alignment task.

### T12: Ambiguous Repository Target

Context:

- The user asks to create a Task without naming a repository.
- The active directory has two plausible GitHub remotes and no authoritative project binding selects one.

Expected behavior:

- Stop and request `OWNER/REPO`.
- Do not infer the target from the directory name, remote ordering, recent activity, or organization membership.
- Do not call a GitHub mutation endpoint.
- A provider-neutral body draft may be offered only if it is clearly marked as unbound and cannot be mistaken for an authorized GitHub write.

### T13: Oversized, Very-High-Value Task

Input evidence:

- Explicit target: `acme/widgets`.
- The task establishes a foundational capability and unblocks broad downstream work.
- Scope is understood well enough to estimate but is too broad for one execution task.

Expected native values are Task, Priority High, Work size `21`, Complexity High, Impact Very high, and Task score `64`.

Score inputs are Impact Very high (`1.00`), Urgency High (`0.67`), Enablement Foundational (`1.00`), Confidence High (`1.00`), and Work size `21`.

Expected behavior:

- Do not reduce Impact merely because delivery is large.
- Flag the mandatory decomposition recommendation in the preview.
- Do not apply `good first issue` or `help wanted`.
- Create only as an explicitly acknowledged parent or planning task; Task Author must not create child tasks itself.
- Route later decomposition to Task Decomposer.

The score remaining above smaller low-value work demonstrates the intended sublinear Work size penalty.

### T14: Material Priority Override

Input evidence:

- Explicit target: `acme/widgets`.
- The work is small and narrow but an explicit contractual sequencing policy requires Urgent Priority.
- Base local value remains Low; the policy override is not a new Impact value.

Expected native values are Task, Priority Urgent, Work size `1`, Complexity Low, Impact Low, and Task score `22`.

Score inputs are Impact Low (`0.25`), Urgency Moderate (`0.33`), Enablement None (`0.00`), Confidence High (`1.00`), and Work size `1`.

Expected behavior:

- Keep Priority out of the formula.
- Preview and post a durable comment explaining the contractual override.
- Do not inflate Impact, urgency, or enablement to make the score agree with Priority.

### T15: Score Boundaries and Insufficient Evidence

Use these calculation assertions:

| Impact    | Urgency   | Enablement   | Confidence | Work size | Expected score |
| --------- | --------- | ------------ | ---------- | --------- | -------------- |
| Very high | Immediate | Foundational | High       | `1`       | `100`          |
| Low       | None      | None         | High       | `1`       | `15`           |
| Very high | High      | Foundational | High       | `13`      | `67`           |
| Very high | High      | Foundational | High       | `21`      | `64`           |

If any required factor lacks enough evidence, the expected score is unset even if the other values would produce a number. Unknown must never be represented as zero.

### T16: Fallback-to-Native Migration

Existing state:

- An organization task body contains fallback keys for Complexity Medium, Impact High, and Task score `52`.
- Those three native fields have since become available.
- The native fields are unset.

Expected migration:

1. Preview native writes for Complexity Medium, Impact High, and Task score `52` plus removal of the three fallback keys.
2. Write and re-read all three native values.
3. Remove the verified keys from the fallback capsule.
4. Remove the entire capsule if no other fallback keys remain.
5. Preserve the existing scoring audit comment because formula inputs did not change.

If a native value already conflicts with fallback, preserve the native value, report the conflict, and do not overwrite it through automatic migration.

## GitHub Issue Schema Author Fixture

### S01: Current Organization Schema and Legacy Labels

Observed state:

- Task, Bug, and Feature exist.
- Priority options are Urgent, High, Medium, and Low.
- Effort options are High, Medium, and Low.
- Start date and Target date exist.
- Complexity, Impact, and Task score are missing.
- Repository labels include GitHub's nine defaults plus `dependencies`, `javascript`, and `github_actions`.

Expected read-only report:

- Types: aligned.
- Priority: aligned.
- Effort: unmanaged and preserved; do not rename, delete, map, or treat it as Work size evidence.
- Work size: missing managed field.
- Complexity, Impact, and Task score: missing managed fields.
- Start date and Target date: aligned except for separately reported visibility or type-pinning drift.
- Managed fields: compare organization-members-only visibility and Task, Bug, and Feature pinning with the desired contract.

Expected label classification:

- Canonical existing definitions to align: `documentation`, `good first issue`, and `help wanted`.
- Canonical missing definitions: `breaking change`, `regression`, `blocked`, `needs triage`, and `needs reproduction`.
- Legacy or unmanaged defaults: `bug`, `enhancement`, `duplicate`, `invalid`, `question`, and `wontfix`.
- Automation-owned: `dependencies`, `javascript`, and `github_actions`.

Expected mutation boundary:

- Show organization type and field changes separately from organization-default-label and repository-label changes.
- Do not bulk-map `question` to `needs reproduction`; the latter applies only to actionable Bug intake.
- Do not delete legacy labels automatically or lose their issue and pull-request associations.
- An organization-default-label synchronization affects future repositories only; existing repositories require an explicit repository-label synchronization.
- Re-read every changed definition and report remaining unmanaged labels without treating their mere existence as silent failure.

## GitHub Issue Form Author Fixture

### F01: Low-Friction Organization and Personal Intake

Generate Task, Bug, and Feature variants for both repository modes.

Organization form assertions:

- The form sets the matching top-level issue `type`.
- Task and Feature each expose two required evidence responses and one optional context response.
- Task asks what needs to be done and why, how completion will be observed, and optionally which constraints, inputs, or approvals matter.
- Bug exposes three required evidence responses and one optional context response; reproduction or other investigation evidence satisfies the third response. It does not ask the reporter to write a test, open a pull request, or execute risky or machine-mutating steps.
- The form does not ask the reporter to classify metadata, scoring diagnostics, labels, dates, or formal acceptance criteria.
- Native fields pinned to the issue type remain native and are not mirrored into submitted Markdown.

Personal form assertions:

- The form uses the same evidence questions and required-response rules as the organization variant.
- The selected form identifies Task, Bug, or Feature without asking the reporter to repeat task kind in a dropdown.
- The form does not expose unavailable issue fields as fallback controls.
- Task Author assesses supported metadata after normalization and then renders `tanaab/task-metadata/v1` fallback values where native representations are unavailable.

Handoff and convergence assertions:

For each of T01 through T06, the form handoff preserves every submitted response plus the complete original Markdown and marks semantic normalization as required. It must not claim that intake is already canonical or invent metadata, scoring diagnostics, labels, relationships, or missing evidence. After Task Author performs the semantic assessment, agent-authored, form-authored, and externally submitted evidence must converge on the same canonical body and accepted metadata semantics. Native and fallback storage may differ, but meaning may not.

## Revision Fixture

### R01: Material Feature Revision

Existing state:

- A Feature has an accepted body, native metadata, Task score, and earlier discussion.
- New compatibility evidence changes the desired outcome, removes one in-scope behavior, adds a breaking migration requirement, and increases Work size from `5` to `8`.

Expected behavior:

- Re-read the body, comments, linked work, metadata, and current score evidence.
- Show a semantic diff covering the desired outcome, scope removal, new acceptance condition, `breaking change` label, Work size change, and recomputed score.
- After authorization, update the body to the current contract rather than appending an inline changelog.
- Post a concise comment summarizing what changed and why.
- Post a new collapsed versioned scoring-audit comment if the score or its displayed inputs change, mark it as superseding the earlier assessment, and omit it when explicitly suppressed.
- Preserve all earlier comments and do not claim earlier implementation satisfied the new acceptance condition.
- Re-read and verify the body, metadata, label, and both new comments.

## Convergence Review

The fixture pass fails if any consumer:

- generates materially different body semantics for the same evidence;
- mirrors available native metadata into fallback YAML;
- guesses missing values;
- uses Complexity or Priority in Task score;
- changes score output without a new formula version;
- applies lifecycle labels beyond their evidence or fails to remove them when their conditions clear;
- creates or deletes label definitions during task authoring;
- loses fallback values, label associations, original evidence, or revision history;
- mutates an ambiguous or undisclosed target; or
- reports complete success without verifying every managed value.

After a full pass produces no material contract, template, field, label, fallback, or scoring changes, the corpus may serve as the phase 1 and phase 2 convergence gate for the three core skills.
