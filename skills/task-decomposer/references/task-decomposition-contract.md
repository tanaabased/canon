# Task Decomposition Contract

Contract version: `tanaab/task-decomposition/v2`

This contract defines the model-authored recommendation, milestone-reframing handoff, and deterministic decomposition-publication boundary for one canonical task. The shared [task-management contract](../../../references/task-management-contract.md) remains authoritative for every child Task, Bug, or Feature.

## Modes and Authority

- **Inspect** reads one exact parent, metadata, evidence, relationships, child depth, and a bounded set of recently updated repository task candidates. It never writes. Planning adds a targeted exact-title search for each proposed child so an older reusable issue is not missed.
- **Recommend** returns exactly one of `keep_intact`, `decompose`, or `reframe_as_milestone`. Work size `13` requires explicit review and Work size `21` normally suggests `decompose`; neither threshold authorizes mutation or supports milestone reframing by itself. Unsupported classification remains unresolved.
- **Preview** builds every child payload, relationship, parent diff, operation, publication finding, and digest without writing.
- **Publish** requires an explicit decomposition imperative for the exact target plus a fresh matching safety attestation and digest. Planning or recommendation intent never authorizes publication.

## Semantic Request

Send the request as JSON through `decompose-task.js --input -`. The model supplies semantic evidence and canonical Task Author inputs; the deterministic planner resolves storage, reuse, relationships, operation order, and digest.

```json
{
  "target": "OWNER/REPO#NUMBER",
  "recommendation": {
    "decision": "decompose",
    "rationale": ["Evidence-backed reason"],
    "explicitReviewAcknowledged": true
  },
  "analysis": {
    "gaps": [],
    "overlaps": [],
    "duplicates": []
  },
  "sharedConstraints": ["Exact observed constraint"],
  "children": [
    {
      "key": "stable-child-key",
      "task": {
        "kind": "task",
        "title": "Bounded child outcome",
        "sections": {
          "context": "Supported source context",
          "outcome": "One independently completable result",
          "scope": ["Bounded work"],
          "acceptanceCriteria": ["Observable child condition"],
          "delivery": "The linked completion pull request contains the result and evidence."
        }
      },
      "covers": ["Exact parent acceptance criterion"],
      "sourceEvidence": ["Evidence retained from the parent or discussion"]
    }
  ],
  "dependencies": [
    {
      "blocked": "downstream-child-key",
      "blockedBy": "upstream-child-key",
      "reason": "Evidence that ordering is necessary"
    }
  ],
  "parentRevision": {
    "kind": "feature",
    "title": "Parent outcome title",
    "sections": {},
    "revisionSummary": "Why the parent became a rollup."
  }
}
```

`task` accepts the same semantic child input as Task Author, including supported metadata, assessment provenance, and signals. `reuseIssueNumber` may identify one expected existing issue, but the planner still requires it to match the generated canonical child exactly.

A `keep_intact` request contains the recommendation only. It must not contain children, dependencies, a parent revision, or a milestone handoff.

A `reframe_as_milestone` request is also recommendation-only and uses this executable read-only shape:

```json
{
  "target": "OWNER/REPO#NUMBER",
  "recommendation": {
    "decision": "reframe_as_milestone",
    "rationale": ["The source describes an aggregate project outcome."],
    "explicitReviewAcknowledged": true,
    "classificationEvidence": [
      {
        "signal": "aggregate_outcome",
        "evidence": "The completion conditions require multiple independently completable tasks."
      },
      {
        "signal": "coverage_or_membership_required",
        "evidence": "Completion depends on selecting task coverage for the outcome."
      }
    ],
    "classificationUncertainties": []
  },
  "milestoneHandoff": {
    "proposedMilestone": {
      "title": "Bounded project outcome",
      "outcome": "The useful project result is delivered.",
      "scope": ["Included delivery surface"],
      "completionConditions": ["Observable aggregate condition"],
      "constraints": ["Exact source-task constraint"],
      "openQuestions": ["Decision still needed before milestone authoring"]
    }
  }
}
```

Send that request to `decompose-task.js --input -`. The result has status `reframe_as_milestone`, `mutatesGitHub: false`, no plan or publication digest, and no writes.

## Milestone Reframing Invariants

- Classify one bounded executable outcome as `keep_intact`; classify one task-shaped outcome with multiple independently completable results as `decompose`; classify an aggregate outcome or timebox that requires task coverage or membership planning as `reframe_as_milestone`.
- Every milestone reframe requires structured source evidence using `aggregate_outcome`, `multiple_independently_completable_tasks`, `coverage_or_membership_required`, or `timebox`. `work_size` may be recorded but cannot be the only supported signal.
- Classification uncertainties must be empty before returning a reframe. Otherwise return `blocked` without a milestone handoff.
- The proposed milestone requires a title, outcome, nonempty scope, nonempty completion conditions, an explicit constraints array that preserves every observed source-task constraint, and an explicit open-questions array.
- The deterministic result derives source-task repository, number, URL, title, and body digest from the exact inspected task. Model-supplied provenance is not accepted.
- The source-task disposition remains `{ "status": "decision_required", "decision": null }`; the handoff records that the task is unchanged and never closes, revises, relates, or otherwise mutates it.
- A reframe cannot contain children, dependencies, a parent revision, publication approval, digest, or mutation plan.
- Project Milestone Author must independently resolve whether to create or revise, build a fresh exact plan and digest, obtain separate authorization, and verify the milestone. Project Milestone Planner remains blocked until that step returns an exact existing milestone.

## Child and Coverage Invariants

- A decomposition contains at least two children and remains exactly one level deep.
- Every child has a kebab-case key, one canonical Task Author input, supported source evidence, checkable acceptance criteria, and completion-pull-request delivery evidence. Every global shared constraint must appear in the canonical rendered body of every child and the parent revision.
- `covers` values exactly reference the current parent's acceptance-criterion text. Every parent criterion has exactly one child owner.
- Exact duplicate child acceptance criteria, uncovered parent criteria, multiple owners, and model-declared gaps, overlaps, or duplicate work block publication.
- The parent must not itself have a parent. A reusable child must have no different parent and no sub-issues. The publication path never sends `replace_parent`.
- A same-title, different-body task is a collision, not a reusable child. An exact candidate must match title, body, native type, managed issue fields, and required canonical labels. Missing planned managed comments may be resumed; unmanaged labels and comments are preserved.

## Dependency Invariants

- Dependencies reference proposed child keys only.
- `blocked` names the issue that cannot proceed; `blockedBy` names the prerequisite.
- Every edge requires evidence that the ordering is necessary rather than preferred.
- Self-links, duplicate edges, unknown keys, and directed cycles block publication.
- Existing approved edges are preserved and produce no write. Unmanaged dependencies are never removed.

## Parent Rollup

The parent keeps ownership of the bounded outcome and stays open. Its canonical body is re-authored from the supplied `parentRevision.sections`; existing fallback metadata is retained unchanged; native type, fields, labels, assignees, milestone, state, comments, and unmanaged relationships are not replaced.

The deterministic planner appends one managed `Child task rollup` block. The digest binds stable `{{child:key}}` placeholders because new issue numbers do not exist at preview time. Publication resolves only those placeholders to exact issue links after every child exists. Semantic reinspection strips the managed rollup before reading parent acceptance criteria and constraints, while storage verification compares the complete resolved body.

The parent revision summary is a public managed comment. Child completion does not mark the parent complete, satisfy its criteria automatically, or authorize closure.

## Plan, Digest, and Publication

The preview includes:

- exact target and recommendation evidence;
- every child semantic input, rendered create payload including fallback metadata, native metadata expectations, labels, managed comments, exact create-or-reuse decision, and expected values;
- every sub-issue and blocked-by edge with `add` or `existing` action;
- the parent semantic before/after view, storage before/after template, managed comment, and explicitly preserved surfaces;
- one ordered operation list and `sha256:` digest over the complete plan; and
- publication-safety findings.

Publication requires:

```json
{
  "publication": {
    "safetyReviewed": true,
    "approvedTarget": "OWNER/REPO#NUMBER",
    "approvedDigest": "sha256:..."
  }
}
```

Changing target, task text, metadata, comments, graph, parent revision, or current GitHub state in a way that changes the operation plan requires a fresh plan and digest.

## Operation and Resume Order

1. Create each missing child in request order.
2. Post that child's missing managed comments.
3. Add every missing parent/sub-issue edge.
4. Add every missing blocked-by edge.
5. Resolve child placeholders and update the parent rollup.
6. Post the missing parent revision summary.
7. Re-read and compare all children, fields, comments, parents, child depth, sub-issue edges, dependencies, and parent storage.

Stop after the first failed write. Never close, delete, detach, or otherwise compensate. Report successful writes, the failed operation, and the failed plus later operations as remaining. A fresh replan may recognize already-created exact children, missing comments, and existing relationships, then resume only the missing operations.

## Statuses

- `keep_intact`: complete read-only recommendation with no mutation plan.
- `reframe_as_milestone`: complete read-only Project Milestone Author handoff with the source task unchanged and no mutation plan.
- `blocked`: evidence or semantic/graph validation is incomplete or unsafe.
- `publication_blocked`: public text fails publication safety.
- `approval_required`: complete preview with no matching exact publication approval.
- `approved`: internal pre-write state after the exact approval gate passes.
- `published`: at least one planned mutation succeeded and every managed value verified.
- `aligned`: exact children, comments, relationships, and parent storage already match; verification performs no mutation.
- `failed`: no remote effect is known to have succeeded before failure.
- `partial`: some remote effect succeeded but a later write or exact verification failed.

## Owner Handoffs

For `decompose`, Task Decomposer returns a verified shallow task graph. Project Milestone Planner may request an approved decomposition, consume the verified child references, and later recommend them for milestone membership. The planner must not bypass this skill by inventing children for an oversized task.

For `reframe_as_milestone`, Task Decomposer returns a bounded semantic handoff to Project Milestone Author. The author independently creates or revises the milestone after separate authorization. Only then may Project Milestone Planner begin from the exact milestone. Task Decomposer never creates or selects a milestone, invokes milestone planning, or decides the source task's disposition.
