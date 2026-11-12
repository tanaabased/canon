---
name: tanaab-architecture-review
description: Tanaab-based read-only architecture review grounded in source. Use to explain an implemented repository, subsystem, or user workflow, trace ownership and execution, and recommend a proportionate refactoring plan. Report in chat by default; write Markdown only when requested.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - architecture
  openclaw:
    emoji: '🏗️'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/architecture-review
---

# Architecture Review

## Overview

Explain the architecture implemented in source, identify consequential structural problems, and recommend the smallest worthwhile refactoring plan. Reconstruct responsibilities, execution, state ownership, and failure propagation rather than restating folder names or README claims. Apply the same investigation depth whether the result stays in chat or becomes a requested Markdown report.

## Required Reading

Read and apply each applicable document before dependent work. Reuse complete reads already in context. If required material is unavailable, report the gap and pause only the dependent assessment.

- **Always:** [Optimization Operations](../../references/optimization-operations.md) and [Verification Boundaries](../../references/verification-boundaries.md).
- **Always:** [Skill Standard — Review Criteria](../../references/skill-standard.md#review-criteria), including the Shared Loading Rule. Apply that sequence to every selected owner; report missing applicable criteria as coverage gaps.
- **Before assessing a target:** its applicable `AGENTS.md` and declared architecture or review constraints, including `.github/OPTIMIZATION.md` when present. Treat existing design documents as claims to check against source.
- **Before assessing a language, framework, or runtime boundary:** the relevant owner's general Review Criteria and Architecture entry point, then its applicable required sections and references under the shared loading rule.
- **Before assessing JavaScript or TypeScript organization and dependency boundaries:** [JavaScript Repo Structure](../../references/javascript-repo-structure.md), including its dependency-direction guidance.
- **Before writing a requested report artifact or recommending documentation changes:** [Documentation Standards](../../references/documentation-standards.md).
- **Before composing the assessment:** the compact [report outline](./templates/report.md), adapted to scope and output mode.

## When to Use

- Explain how an existing repository, subsystem, or user workflow actually works across module and integration boundaries.
- Review structural problems and tradeoffs before choosing a refactor.
- Reassess earlier architecture findings against current source and known planned work.

## When Not to Use

- Implement changes, design a new product without an existing implementation, or certify runtime readiness.
- For a deep assessment of test value, reliability, cost, or total coverage, use [Testing Review](../testing-review/SKILL.md). Inspect tests here only as evidence for architectural findings; retain cross-component reasoning and the maintenance-change walkthrough.
- Run a general canon-compliance, dependency-freshness, or release audit. [Project Review](../project-review/SKILL.md) owns that broader assessment; neither skill automatically invokes the other.

## Preconditions

- Resolve the target repository and requested scope. Default to the repository when no narrower target is given; infer named subsystems or user journeys without asking for a directory list.
- Record the reviewed revision and relevant dirty changes, including untracked files. Preserve existing work and distinguish current source from in-flight proposals. If revision or planning evidence is unavailable, state that limitation.
- Review is read-only except explicitly requested report artifacts. It grants no production edits, dependency installation, live operations, issue mutations, commits, pushes, or implementation. Use existing analysis tools; isolate necessary temporary analysis artifacts outside the audited repository.

## Workflow

### Establish Scope and Output

1. Identify important user journeys, constraints, known planned removals, and available issues or earlier findings. Ask only when ambiguity materially changes scope or the report destination; unavailable issue access need not block source analysis.
2. Select output independently of scope. **Chat is the default:** deliver the assessment here and create no report files. **Markdown requires a request:** use the specified or agreed destination, preserving unrelated contents. Do not assume reports belong in the audited repository or invent `docs/architecture/` as a destination. Prefer one report; split current architecture, proposed architecture, and roadmap only when requested or when their size or audiences justify it within the agreed destination. Do not ask about mode on every invocation.
3. Follow dependencies beyond a named directory when needed to explain the selected behavior. Keep that boundary explicit and label relevant out-of-scope findings separately instead of expanding into a general cleanup audit.

### Reconstruct the Implementation

4. Trace actual entry points into major subsystems, data models and state owners, shared utilities, and external integrations. Follow representative success and failure paths, including asynchronous or deferred work, and identify who owns decisions, effects, and recovery. Group components by responsibility, not directory labels. Account for the major journeys in scope under [Review Completeness](../../references/skill-standard.md#review-completeness); one healthy path cannot establish repository-wide alignment.
5. Inspect imports, module boundaries, registration, and dependency direction with available search, language-aware navigation, or static-analysis tools. Trace a realistic maintenance change through a consequential shared owner, even when no refactor has been proposed: identify independently maintained definitions, projections, and consumers that must change together. Verify significant relationships in concrete files and symbols, and compare consequential declared dependency rules with existing enforcement. Do not install a mandatory engine or build a generalized analysis framework; disclose analysis gaps for generated, dynamic, or unavailable code.
6. Use readable Mermaid diagrams when they clarify current architecture or an important execution/data flow. Label meaningful calls, events, state writes, and failure boundaries. Tie diagram components and significant edges to source references; distinguish observed relationships from inference and current architecture from proposals.

### Assess and Recommend

7. Apply the shared loading rule to the observed contracts and their owners before judging structure. Evaluate oversized responsibilities, tight coupling and cycles, semantic duplication, inconsistent abstractions, unnecessary indirection, and dependencies against actual behavior and change costs. Apply the shared [operation lenses](../../references/optimization-operations.md) without manufacturing findings. Separate demonstrated defects, evidenced maintenance costs, and subjective preferences; do not attribute complexity to AI without provenance.
8. Follow suspected duplication, scattered contracts, and failure coupling through definitions, callers, state, and tests before accepting or dismissing them. For each substantive finding, identify the files and symbols, observed evidence, user or maintenance consequence, confidence and uncertainty, smallest defensible recommendation, and a verification method. State what should stay unchanged and why. Apply the evidence limits below before presenting a structural signal as a defect.
9. Explain cohesion, ownership, testability, simplicity, and maintenance tradeoffs where they affect the recommendation. Include a proposed architecture, responsibility map, or current-to-proposed module/directory mapping only when it clarifies a real improvement. Consider a smaller repair, deferral, or no change; do not manufacture a replacement architecture when two local fixes suffice.
10. Check the plan against one representative maintenance change, such as adding a field or removing a capability. First trace that change through current source: where is its authoritative definition, who validates, transforms, persists, or consumes it, and which tests establish completeness? Then walk the same change through the proposed structure. Does it clarify ownership, reduce independently maintained definitions or hidden dependencies, and make verification easier without requiring a human or model to understand unrelated code? Simplify or drop recommendations that add structure without a concrete benefit. Fold this evidence into existing findings and recommendations; do not add a separate score, report section, or duplicate finding. Treat the proposed walkthrough as a source-grounded thought exercise, not implementation or runtime proof; no proposed refactor is required when the current structure is adequate.
11. Prioritize by expected benefit, effort, regression risk, and dependency order. Break substantial changes into independently verifiable steps, identify changes that must land together, and distinguish work that can wait. Map recommendations to known existing issues or planned removals rather than proposing duplicate tickets. For repeat audits, classify previous findings as resolved, still present, changed, or unverified with current evidence.

### Evidence Limits

- File length, high fan-in at a composition root, or an import cycle is a signal to investigate, not proof of a user defect. Distinguish type-only cycles from value-import cycles and establish the consequence before recommending a split.
- Missing static references do not establish dead code: inspect hooks, dynamic registration, generated entrypoints, configuration, and external consumers before recommending removal.
- Textual similarity does not establish duplicated responsibility. Separate native adapters may legitimately differ in lifecycle, permissions, or failure behavior; consolidate only when semantics and ownership match.
- Examine whether optional context, presentation, diagnostics, or one malformed record can stop unrelated authorized work. When an operation selects one resource from a collection, inspect what is loaded and validated before selection; distinguish necessary ownership and uncertain-effect evidence from unrelated payload data. Require a concrete correctness, authorization, or resource-protection reason for coupling them. Recommend removing unnecessary prerequisites while preserving authorization, identity, destination, and duplicate-effect protections. Fold findings into the existing assessment rather than a separate checklist or report section.
- Challenge speculative abstractions and guards by naming the concrete problem they solve and checking the existing owner first.
- Static inspection can explain code paths and support a maintenance finding; it does not prove live runtime behavior, passing CI, or installation readiness. Use [Verification Boundaries](../../references/verification-boundaries.md) to select proportionate evidence and label unrun checks.

### Deliver

12. Use the [report outline](./templates/report.md) as a coverage aid, not a requirement for empty sections or a fixed report size. Include scope/baseline, the implemented architecture, findings and retained decisions, a prioritized plan, and limitations. In chat mode, render useful diagrams inline and leave no report files. In Markdown mode, write only the requested artifact(s), link them, and summarize the consequential findings in chat.

## Checkpoints

- Pause only the dependent work when scope, source access, or a requested report destination cannot be resolved. Continue supported read-only investigation and make uncertainty explicit.
- Stop at the assessment and plan. A recommendation, available tool, or existing issue does not authorize implementation or a remote write.

## Completion Criteria

- The requested scope, revision, relevant dirty state, inspected paths and flows, and missing evidence are clear.
- The architecture and diagrams explain actual responsibilities and execution with source support, including material dependencies beyond the selected directory.
- Findings meet the evidence standard, retained decisions are explicit, and the roadmap names dependencies, coupled changes, verification, and existing planned work. No actionable findings is a valid result.
- Output follows the selected mode, and the audited repository has no new changes except explicitly requested report artifacts. Recheck its state before finishing.

## Bundled Resources

- [Report outline](./templates/report.md): one adaptable structure for chat and requested Markdown output.

## Validation

- Check source references and diagram relationships against the reviewed revision and distinguish inference from observed behavior.
- Check each finding's consequence, confidence, recommendation, and verification; remove unsupported claims and preference-only churn.
- Confirm scope and output mode remained independent, planned work was accounted for, and no implementation or unrequested report files were created.
- For maintenance of this skill, validate discovery, section shape, and resource links with Skill Author. Exercise bounded scoped-chat and explicit-destination Markdown cases; report actual behavioral trials separately from structural checks.
