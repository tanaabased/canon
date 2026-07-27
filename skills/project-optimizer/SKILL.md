---
name: tanaab-project-optimizer
description: Tanaab-based read-only project optimization planning. Use when a user wants to audit a project's checked-in repository surfaces against applicable Tanaab skill optimization facets and produce a staged improvement plan before implementation.
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

Audit a project's checked-in repository surfaces against the Optimization facets owned by applicable Tanaab skills, apply the shared optimization operations to observed evidence, then produce a dependency-ordered improvement plan. The default pass is local, read-only, and complete when every observed surface is classified without modifying the project.

## When to Use

- Run a repeatable, project-wide alignment and maintainability audit before an optimization pass.
- Reconcile documentation, code, package, workflow, skill, and other observed surfaces through their existing Tanaab owners.
- Turn evidence-backed findings into a staged implementation and validation plan before any changes are made.
- Include GitHub-hosted repository settings only when the user explicitly requests remote coverage and supplies or confirms the repository slug.

## When Not to Use

- Do not use for an ordinary single-surface implementation request that already has a clear owning skill.
- Do not modify files, apply recommendations, or perform destructive or remote actions during the initial optimization pass.
- Do not load every installed skill indiscriminately or manufacture findings for an aligned or not-applicable surface.
- Do not treat approval of the audit as approval of its implementation plan.

## Preconditions

- Resolve the local repository root and read its applicable `AGENTS.md` guidance.
- Require `git` and record the initial tracked and untracked state so existing user changes remain distinguishable from audit activity.
- Confirm the request is for a read-only optimization audit and staged plan.
- For optional remote repository coverage, require an explicit request plus a supplied or confirmed `OWNER/REPO` slug before invoking any integration skill.

## Workflow

1. Read repository guidance and inventory tracked local surfaces, including manifests, entrypoints, documentation, automation, tests, templates, generated artifacts, and repo-native validation commands.
2. Classify each observed area as live, cold-path, generated, or not applicable before recommending changes.
3. Discover applicable installed Tanaab skills dynamically. Select only skills whose owned surface matches observed evidence and whose instructions expose `## Optimization`; do not use a fixed registry or select this aggregation skill as a domain owner.
4. When the repository contains multiple live `SKILL.md` files, always select Skill Author and review the skill collection individually and collectively even when no single skill has obvious drift.
5. Use each selected skill's Optimization facet as the routing summary, then apply the skill's full relevant contract, directly linked canon, and the shared optimization operations to the observed surface. Do not limit the audit to the literal five facet bullets or skip high-value checks that the owning skill makes explicit elsewhere.
6. Resolve overlap through the skills' existing ownership boundaries. Assign each finding one primary owner and one primary operation, adding a companion only when the work genuinely crosses surfaces.
7. Report every inventoried surface as aligned, drifted, or not applicable. Treat unavailable evidence as uncertainty rather than drift or alignment, and do not manufacture findings to exercise every operation.
8. Produce a dependency-ordered implementation plan with proportional, repo-native validation and reviewable commit boundaries.
9. Stop without modifying files. A later explicit implementation request may invoke the owning skills against the approved plan.

### Dependency Ordering

- Audit every applicable surface against the same initial repository snapshot before sequencing implementation; audit order must not decide the findings.
- Order findings rather than whole skills. One finding precedes another when it can change the downstream finding's owner, location, name, command, public contract, generated output, or documented truth.
- Prefer these implementation waves when applicable: authority and ownership; target structure and tooling baseline; implementation and tests; public interfaces, generated artifacts, and automation; documentation and changelog; then separately authorized remote state.
- When structure and behavior both drift, decide the final owning scopes and destinations first, refactor directly into them, and use the structural owner for final verification instead of performing two full reorganizations.
- Run independent findings within one wave together, validate each completed wave through its owning skills, and revisit downstream surfaces only when an upstream change affected their inputs.
- End the approved implementation with one read-only convergence audit of the initially selected and newly exposed surfaces rather than repeatedly restarting the entire optimizer.

## Checkpoints

- Pause when a target, owner, or policy decision cannot be resolved from checked-in repository evidence.
- Skip GitHub-hosted settings by default. Remote inspection requires the user's explicit request and an explicit or confirmed slug, and remains read-only during the audit.
- Treat later implementation authorization as scoped to the approved local plan. Obtain separate authorization for remote, destructive, or otherwise distinct effects.
- Preserve the initial working-tree state and call out any dirty-tree constraint that limits evidence or implementation sequencing.

## Completion Criteria

- Every tracked local surface is accounted for as live, cold-path, generated, or not applicable.
- Every live surface is reported as aligned, drifted, or not applicable with concrete repository evidence and a clear owning skill.
- Every selected skill's high-value canonical checks are accounted for, including concrete documentation synchronization, structure, extraction, testing, and validation expectations when those surfaces are present.
- Repositories with multiple skills receive an individual and portfolio-wide Skill Author review covering contradictions, duplication, consolidation, splitting, extraction, placement, tightening, and obsolete identities.
- Every drift finding names one primary owner and applicable operation; aligned and not-applicable surfaces do not acquire synthetic work.
- The staged plan is ordered by dependency and leverage, includes proportional validation, and does not invent work to fill an output shape.
- Every planned finding either names its upstream dependencies or is explicitly independent, with source-of-truth changes ordered before downstream projections and one final convergence audit included.
- Optional remote coverage is clearly labeled and was performed only after explicit request and target confirmation.
- A final working-tree check confirms the audit made no repository changes.

## Bundled Resources

- [../../references/optimization-operations.md](../../references/optimization-operations.md): shared evidence-led operation lenses; domain skills remain the source of truth for each surface

## Validation

- Compare `git status --short` before and after the audit; the optimizer must create no tracked or untracked changes.
- Confirm remote GitHub inspection was skipped unless the user explicitly requested it and supplied or confirmed a slug.
- Confirm every selected skill matched an observed surface and exposed `## Optimization`.
- Confirm every selected facet was followed into the skill's full relevant contract and directly linked canon rather than treated as a standalone generic checklist.
- Confirm repositories with multiple live skills selected Skill Author for both individual and portfolio review.
- Confirm every drift finding has one primary operation and that the audit did not force every operation onto every surface.
- Confirm the report includes aligned and not-applicable results where supported instead of manufacturing drift.
- Confirm the final output is a staged plan and stops before implementation.
