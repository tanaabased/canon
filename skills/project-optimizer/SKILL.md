---
name: tanaab-project-optimizer
description: Tanaab-based read-only project optimization assessment. Use when a user wants to audit a project's repository surfaces, prioritize substantial improvements and small concrete cleanup, and plan implementation while making retained decisions and uncertainty explicit.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - optimization
  openclaw:
    emoji: '🧭'
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/project-optimizer'
    requires:
      bins:
        - git
---

# Project Optimizer

## Overview

Audit a project's checked-in and contract-required repository surfaces against the Optimization facets owned by applicable Tanaab skills, apply the shared optimization operations to observed evidence, and report both substantial improvements and small concrete cleanup. The default pass inspects the local repository plus bounded public upstream release metadata, stays read-only, and is complete when every observed or explicitly required surface is classified and actionable findings have a dependency-ordered plan.

## When to Use

- Run a repeatable, project-wide alignment and maintainability audit before an optimization pass.
- Reconcile documentation, code, package, workflow, skill, required-but-absent, and other applicable surfaces through their existing Tanaab owners.
- Distinguish substantial improvements, small concrete cleanup, deliberately retained decisions, and unavailable evidence.
- Turn actionable findings into a proportionate implementation and validation plan before any changes are made, even when only small fixes remain.
- Include GitHub-hosted repository settings only when the user explicitly requests remote coverage and supplies or confirms the repository slug.

## When Not to Use

- Do not use for an ordinary single-surface implementation request that already has a clear owning skill.
- Do not modify files, apply recommendations, or perform destructive or remote actions during the initial optimization pass.
- Do not load every installed skill indiscriminately or manufacture findings for an aligned or not-applicable surface.
- Do not treat approval of the audit as approval of its implementation plan.

## Preconditions

- Resolve the local repository root and read its applicable `AGENTS.md` guidance.
- Require `git` and record the initial tracked and untracked state so existing user changes remain distinguishable from audit activity.
- Confirm the request is for a read-only optimization audit and project-level disposition.
- For optional remote repository coverage, require an explicit request plus a supplied or confirmed `OWNER/REPO` slug before invoking any integration skill.

## Workflow

1. Read repository guidance and its directly applicable shared canon, then inventory tracked local surfaces, including manifests, entrypoints, documentation, automation, tests, templates, generated artifacts, repo-native validation commands, and explicitly required surfaces that are absent.
2. Classify each observed or contract-required area as live, cold-path, generated, missing, or not applicable before recommending changes. Declare an absent surface missing only when applicable checked-in guidance or directly linked canon makes it an expectation; otherwise preserve uncertainty or classify it not applicable.
3. Discover applicable installed Tanaab skills dynamically. Select only skills whose owned surface matches observed evidence or an explicit contract requirement and whose instructions expose `## Optimization`; do not use a fixed registry or select this aggregation skill as a domain owner.
4. When the repository contains multiple live `SKILL.md` files, always select Skill Author and review the skill collection individually and collectively even when no single skill has obvious drift.
5. Use each selected skill's Optimization facet as the routing summary, then apply the skill's full relevant contract, directly linked canon, and the shared optimization operations to the observed surface. Do not limit the audit to the literal five facet bullets or skip high-value checks that the owning skill makes explicit elsewhere.
6. Resolve overlap through the skills' existing ownership boundaries. Assign each finding one primary owner and one primary operation, adding a companion only when the work genuinely crosses surfaces. Consolidate findings about the same source of truth and reuse existing validation evidence for an unchanged snapshot instead of repeating each owner's checks.
7. Report every inventoried surface as aligned, drifted, or not applicable. Treat unavailable evidence as uncertainty rather than drift or alignment, and do not manufacture findings to exercise every operation.
8. Apply Finding Disposition across the complete finding set; do not suppress a concrete correction because its impact or effort is small.
9. Plan every actionable finding in dependency order with proportional, repo-native validation and reviewable commit boundaries. A small-cleanup-only pass still gets a plan; omit implementation stages only when there are no actionable findings.
10. Stop without modifying files. A later explicit implementation request may invoke the owning skills against an approved plan.

### Preferred Tool Adoption

- During step 5, apply the [shared adoption and freshness assessment](../../references/skill-standard.md#preferred-tools) to each relevant Preferred Tools entry. Check both missing preferred tools and newer compatible releases; meeting a minimum does not establish freshness.
- Collect upstream release evidence once per tool project and release line, then share it across selected owners. Record current, update recommended, adoption recommended, retain with reason, or unverified; apply Finding Disposition using concrete benefit, compatibility, and migration cost.
- Read-only public upstream checks are part of this assessment; they do not authorize GitHub-hosted target-repository settings inspection or changes. Honor local-only requests and mark freshness unverified when upstream evidence is unavailable. Use the [refresh prompt](../../prompts/refresh-preferred-tools.md) for broader discovery of new tools.

### Dependency Ordering

- Audit every applicable surface against the same initial repository snapshot before sequencing implementation; audit order must not decide the findings.
- Order findings rather than whole skills. One finding precedes another when it can change the downstream finding's owner, location, name, command, public contract, generated output, or documented truth.
- Prefer these implementation waves when applicable: authority and ownership; target structure and tooling baseline; implementation and tests; public interfaces, generated artifacts, and automation; documentation and changelog; then separately authorized remote state.
- When structure and behavior both drift, decide the final owning scopes and destinations first, refactor directly into them, and use the structural owner for final verification instead of performing two full reorganizations.
- Run independent findings within one wave together, validate each completed wave through its owning skills, and revisit downstream surfaces only when an upstream change affected their inputs.
- During authorized implementation, finish small, directly related corrections within the approved scope when their benefit is clear and existing checks can validate them. Surface broader changes for a scope decision instead of silently expanding the work.
- End the approved implementation with one read-only convergence audit of the initially selected and newly exposed surfaces rather than repeatedly restarting the entire optimizer.

### Finding Disposition

- Report four groups: substantial improvements, small concrete cleanup, deliberately retained decisions, and unverified areas. A group may be empty; never invent findings to fill it.
- Substantial improvements require meaningful design, coordination, migration, or review. Small concrete cleanup has an observed defect or contract mismatch, a clear local correction, and proportionate validation. Size determines priority and sequencing, not whether the finding is reported or planned.
- For each actionable finding, identify the affected location, evidence, correction, primary owner and operation, and validation. Recommend corrections whose benefit justifies their implementation and review cost; do not require a large payoff for a small fix.
- For deliberately retained observations, give a specific reason and a condition for reconsideration. Small size alone is not a reason to defer concrete drift. Preference-only rewrites and speculative abstractions do not become work merely because they are easy.
- Identify missing evidence and what would resolve it under unverified areas. Do not treat uncertainty as alignment or invent a correction before establishing the problem.
- Apply [verification boundaries](../../references/verification-boundaries.md) when recommending validation changes. Remove duplicate post-success checks; propose new checks only for concrete uncovered risks, not to make an aligned surface appear more thoroughly verified.
- Report `optimization recommended` whenever either actionable group is nonempty. Report `converged — no actionable findings` only when the requested audit is complete and neither group has findings; otherwise report `assessment incomplete` with the unresolved evidence gaps. Retained decisions remain visible in every disposition.
- Reuse prior evidence and retained decisions when their inputs are unchanged. Reconsider them when the recorded condition or new evidence warrants it; do not repeatedly rediscover or silently drop known small corrections.

## Checkpoints

- Pause when a target, owner, or policy decision cannot be resolved from checked-in repository evidence.
- Skip GitHub-hosted settings by default. Remote inspection requires the user's explicit request and an explicit or confirmed slug, and remains read-only during the audit.
- Treat later implementation authorization as scoped to the approved local plan. Obtain separate authorization for remote, destructive, or otherwise distinct effects.
- Preserve the initial working-tree state and call out any dirty-tree constraint that limits evidence or implementation sequencing.

## Completion Criteria

- Every tracked local or contract-required surface is accounted for as live, cold-path, generated, missing, or not applicable.
- Every live or contract-required surface is reported as aligned, drifted, missing, or not applicable with concrete repository evidence and a clear owning skill.
- Every selected skill's high-value canonical checks are accounted for, including documentation accuracy, structure, testing, and validation where applicable. Documentation additions or extraction must pass the [documentation change gate](../../references/documentation-standards.md#documentation-change-gate); completeness does not require edits to every inspected surface.
- Repositories with multiple skills receive an individual and portfolio-wide Skill Author review covering contradictions, duplication, consolidation, splitting, extraction, placement, tightening, and obsolete identities.
- Every drift finding names one primary owner and applicable operation; aligned and not-applicable surfaces do not acquire synthetic work.
- The report groups substantial improvements, small concrete cleanup, deliberately retained decisions, and unverified areas, and states the disposition required by Finding Disposition.
- Every actionable finding appears in a proportionate plan, including when only small cleanup remains. The plan is ordered by dependency and leverage and does not invent work to fill an output shape.
- Every planned finding either names its upstream dependencies or is explicitly independent, with source-of-truth changes ordered before downstream projections and one final convergence audit included.
- Retained observations have specific reasons and reconsideration conditions; missing evidence is explicit and small actionable corrections are not dismissed as convergence.
- Optional remote coverage is clearly labeled and was performed only after explicit request and target confirmation.
- A final working-tree check confirms the audit made no repository changes.

## Bundled Resources

- [../../references/optimization-operations.md](../../references/optimization-operations.md): shared evidence-led operation lenses; domain skills remain the source of truth for each surface
- [../../references/project-management-model.md](../../references/project-management-model.md): GitHub-backed project mapping, lifecycle ownership, and required repository task-management projections

## Validation

- Compare `git status --short` before and after the audit; the optimizer must create no tracked or untracked changes.
- Confirm remote GitHub inspection was skipped unless the user explicitly requested it and supplied or confirmed a slug.
- Confirm every selected skill matched an observed surface and exposed `## Optimization`.
- Confirm contract-required but absent surfaces were inventoried when applicable canon establishes the expectation, without treating every conceivable surface as required.
- Confirm every selected facet was followed into the skill's full relevant contract and directly linked canon rather than treated as a standalone generic checklist.
- Confirm repositories with multiple live skills selected Skill Author for both individual and portfolio review.
- Confirm every drift finding has one primary operation and that the audit did not force every operation onto every surface.
- Confirm the report includes aligned and not-applicable results where supported instead of manufacturing drift.
- Confirm relevant preferred tools were checked for adoption and newer compatible releases, with upstream uncertainty explicit and shared lookups deduplicated.
- Confirm all four finding groups are accounted for and the disposition distinguishes actionable work, completed assessment without actionable findings, and incomplete assessment.
- Confirm every actionable finding is planned, including small corrections; retained decisions have reasons and reconsideration conditions, and uncertainty is not presented as alignment.
