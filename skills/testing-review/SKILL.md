---
name: tanaab-testing-review
description: Tanaab-based read-only review of test value, coverage, reliability, and cost. Use to assess a suite or selected tests, including installed Leia journeys, reconcile gaps and duplication across contracts and execution boundaries, and propose a focused improvement plan. Report in chat unless Markdown is requested.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - testing
  openclaw:
    emoji: '🧪'
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/testing-review'
---

# Testing Review

## Overview

Assess whether the requested tests protect intended product behavior with reliable, proportionate evidence. Own comparison across test groups, surfaces, and layers; keep surface-specific value criteria with the authoring owners. Report in chat by default. A direct Testing Review does not require Project Review or automatically start Architecture Review.

## Required Reading

Read applicable documents before dependent assessment. Reuse complete reads already in context; report missing criteria and pause only the affected judgment.

- **Always:** [Verification Boundaries](../../references/verification-boundaries.md), including assertion strength, and [Testing Defaults](../../references/coding-stack-preferences.md#testing-defaults).
- **Always:** [Skill Standard — Review Criteria](../../references/skill-standard.md#review-criteria), including the Shared Loading Rule. Apply that sequence to every selected owner; report missing applicable criteria as coverage gaps.
- **Before assessing a target:** applicable repository guidance, the agreed product contract and latest authorized decisions, and available earlier findings. Tests and implementation are evidence to check against that contract, not permission to redefine it.
- **Before judging a test group:** the relevant owner's general Review Criteria and Testing entry point, then its applicable required sections and references under the shared loading rule. Select by the contract exercised: a TypeScript packaging assertion needs packaging criteria, and a mixed spec may have several owners. Read only the applicable criteria; do not execute authoring workflows.
- **Before assessing Leia journeys:** [Leia Markdown Scenarios](../../references/leia-markdown-scenarios.md) and the available upstream `leia-scenarios` skill's applicable review guidance, or its documentation linked by that reference. Canon owns usage policy; Leia owns syntax and harness behavior. Report genuinely missing upstream criteria rather than inventing competing policy.
- **Before writing a requested Markdown report:** [Documentation Standards](../../references/documentation-standards.md).

## When to Use

- Review a suite or selected test groups for value, coverage gaps, duplication, reliability, execution boundaries, and cost.
- Compare strict units, components, static checks, and installed journeys across owners without assuming one layer replaces all others.
- Reassess new and existing tests, including fast passing suites, against the admission and retention gate and current product requirements.

## When Not to Use

- Implement test repairs, redefine product behavior, or run an operational testing pilot.
- Perform a general project review, tooling-baseline normalization, or product architecture redesign. Report directly relevant evidence and leave independent work with its owner.

## Preconditions

- Resolve the target and requested coverage; default to its test suite only when no narrower scope is given. Record revision, dirty/untracked state, inspected groups, exclusions, and missing evidence.
- Review is read-only except requested report artifacts at a specified or agreed destination. Do not edit tests, install dependencies, create issues, commit, or publish findings without authorization.
- Reuse available results and timings. A review request does not itself authorize expensive, live, credential-backed, or machine-mutating runs; follow existing task authorization and repository execution restrictions. Keep necessary temporary analysis outside the audited repository.

## Workflow

1. Inventory requested test groups, their intended behaviors, asserted outcomes, fixtures, setup/cleanup, commands, execution boundaries, and available timing or failure evidence. Inspect adjacent product code and configuration only as needed to understand those contracts. Distinguish measured cost and observed flakiness from estimates or static concerns. Assess local feedback time separately from hosted execution, runner cost, and start delay; affordable CI does not establish an acceptable local edit–test loop.
2. Apply the shared loading rule to select and read each applicable owner's general Review Criteria, Testing entry point, and required sections and references before judging value. For example, JavaScript Author governs decision and subsystem tests, CLI authors govern command contracts, plugin authors govern native integration and plugin payloads, and Workflow Author governs workflow configuration. These are examples, not an exhaustive routing table; filename, language, or runner does not select ownership. Shared [verification guidance](../../references/verification-boundaries.md) applies across them.
3. Assess coherent groups rather than producing a permanent per-test registry. Account for the major contracts and execution boundaries under [Review Completeness](../../references/skill-standard.md#review-completeness); timing summaries or a few inspected assertions cannot establish suite-wide value or coverage. Apply the shared admission and retention gate: name a plausible consequential wrong decision or effect, explain how the assertion rejects it, and assess worthwhile evidence, expectation independence, and fixture/maintenance cost at the smallest faithful boundary. Actively seek passing low-value tests, oversized or coupled fixtures, mock replay, incidental freezes, and permutations without distinct meaningful failures. Use owner criteria to identify concrete removal, consolidation, or rewrite candidates; uniqueness and fast execution do not establish value. Do not require mutation tooling, per-test paperwork, or numeric quality targets.
4. Reconcile coverage across owners and layers. Identify missing user journeys and duplicate evidence, retaining distinct integration, packaging, platform, and protection guarantees. Include applicable Leia journeys using their owning policy: compare repeated setup and flows, deterministic versus model-backed evidence, actual product integration, and justified runtime/OS coverage. Do not assume passing units prove installation or that an installed test makes focused negative cases redundant. Separately assess whether developers can select relevant component coverage without unrelated expensive work, following [Validation Selection](../../references/verification-boundaries.md#validation-selection). Inspect affected-consumer selection, required preparation, empty selections, and retained full-suite gates; distinguish test-value improvements from invocation or repository-policy improvements.
5. Recommend keep, rewrite, consolidate, move to a cheaper boundary, remove, or add. For each consequential finding, cite source and result evidence, the governing contract and owner, consequence, confidence, expected benefit/cost, and focused verification. A removal must explain retained worthwhile coverage, an obsolete requirement, or why deliberately leaving low-consequence detail untested costs less than maintaining its protection. Do not require replacement or relocation for every unique test. Preserve meaningful critical authorization, identity, destination, resource, and duplicate/uncertain-effect coverage; resolve disputed product restrictions against the agreed contract.
6. Sequence the smallest worthwhile plan, including any replacements needed to preserve critical protection before removal, existing issues, and unresolved contract questions. Reconcile earlier findings as resolved, still present, changed, or unverified. Consolidate overlapping findings; no changes warranted is a valid outcome. Do not invoke another broad review to complete this one.
7. Begin with scope/baseline and the shared [inspection inventory](../../references/skill-standard.md#inspection-inventory), then deliver consequential findings and retained coverage, a prioritized plan, and evidence limits in chat. Write one Markdown report only when requested at the specified or agreed destination; do not invent a repository report directory. Recheck that the audited files are unchanged except requested artifacts.

## Checkpoints

- Missing or conflicting product requirements pause only dependent recommendations; tests cannot settle the dispute merely by existing or passing.
- Static inspection is not live proof. Report unrun checks and unavailable timing or runner evidence without manufacturing a failure or an execution prerequisite.
- Recommendations and authoring references grant no implementation or publication authority. Preserve existing execution permissions without adding a new approval gate.

## Completion Criteria

- Scope, baseline, inspected groups, execution evidence, and gaps are explicit.
- Applicable owner criteria were read by contract, including all distinct boundaries in mixed specs.
- Passing tests and fixture maintenance burden were assessed alongside overlap and missing journeys. Recommendations name concrete removals, consolidations, or rewrites where justified, including deliberate noncoverage of low-consequence detail; critical protections retain meaningful coverage.
- Local feedback cost and hosted cost are distinguished; selection recommendations preserve required coverage and identify the owning command or repository policy to change.
- Findings form a proportionate plan or explain why no changes are warranted; output mode and read-only boundaries were honored.

## Bundled Resources

- [Verification Boundaries](../../references/verification-boundaries.md): shared evidence and assertion-value principles.
- [Leia Markdown Scenarios](../../references/leia-markdown-scenarios.md): installed-journey usage policy and upstream ownership.

## Validation

- Check finding-to-contract attribution, the admission and retention gate, independent expectations, and evidence limits. Explain meaningful retained protection or deliberate noncoverage rather than counting tests or demanding a coverage percentage.
- Confirm no arbitrary deletion quota, scoring system, mandatory metadata, or universal mutation-testing rollout was introduced.
- When maintaining this skill, validate discovery and resources through Skill Author and exercise a bounded mixed-contract review including Leia. Distinguish manual review trials, automated structural checks, actual test executions, and unverified model behavior.
