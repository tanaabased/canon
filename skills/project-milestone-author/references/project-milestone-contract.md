# Project Milestone Contract

Contract version: `tanaab/project-milestone/v1`

## Owned Surface

Project Milestone Author owns one repository-scoped GitHub milestone: its title, complete description, open or closed state, due date, and explicitly selected task membership. It exposes no milestone deletion operation and does not create, rewrite, score, decompose, complete, or prioritize tasks.

## Description

- The model authors the milestone's complete Markdown description from the user's intent and inspected evidence. Prefer clear outcome, scope, and completion-condition headings when they help, but do not require a machine-owned template.
- Omitted description input preserves the current value. An explicit description string is a complete replacement.
- Inspect before replacement. Preserve important existing human or provider content deliberately in the proposed string rather than relying on marker parsing or implicit merging.
- The deterministic plan displays the exact current and desired strings, scans the desired public text, binds it to the digest, and verifies the complete stored value after writing.

## Target and Desired State

- Require an exact `OWNER/REPO`, `OWNER/REPO#MILESTONE_NUMBER`, milestone URL, or repository plus exact title selector. Never infer a repository from the current directory.
- A repository-only target creates a milestone and requires a nonempty title plus complete nonempty description. Create task membership in a subsequent plan after the milestone has a number.
- A milestone selector updates that milestone. Omitted desired fields are preserved; provided title, description, state, and due date are compared against current state and only actual changes become operations.
- Reject unknown desired fields instead of silently treating misspelled or unsupported input as aligned.
- A number is authoritative only after readback. A supplied title must agree with it. Exact title selection must match one open or closed milestone, and creation or title revision must not duplicate another exact title.
- State accepts `open` or `closed`. Due date accepts a real `YYYY-MM-DD` value or explicit `null` to clear, stored at `23:59:59Z`. The model must not infer, advance, clear, or extend a due date without user or applicable policy authority.

## Membership

- Membership accepts only explicit existing task numbers from the milestone repository.
- Reject unknown membership fields. Membership is a separate mutation boundary and cannot share a request, plan, digest, or approval with milestone fields.
- Add and remove lists are disjoint, de-duplicated, and sorted. Pull requests are preserved but cannot be selected as tasks.
- Adding an already assigned task and removing an already absent task are zero-operation results.
- Moving a task from another milestone requires `allowMoveFromOtherMilestones: true` and exposes the prior milestone in the plan.
- Only selected tasks may be patched. Preserve all unselected task and pull-request membership.
- Verify every requested task after writes. Continue independent selected writes after one fails, report partial success, and do not compensate or roll back.

## Authorization and Verification

Every mutation begins with a fresh read-only desired-state plan containing the exact target, before snapshot, ordered provider operations, and expected result. Milestone-field changes and task-membership changes require separate plans and separate approvals. Authorization requires a publication-safety attestation plus that target and the plan's SHA-256 digest. Apply rebuilds the plan immediately before writing, so changed milestone state or selected task membership invalidates prior authorization.

The command treats GitHub responses as provisional. It re-reads the milestone and every selected task, compares every expected value, and returns complete, partial, or failed status with provider context. It never deletes a milestone or rolls back remote state to conceal partial success.
