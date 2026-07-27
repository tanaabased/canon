---
name: tanaab-repository-optimizer
description: Tanaab-based read-only repository optimization planning. Use when a user wants to audit a repository against applicable Tanaab skill optimization facets, classify aligned and drifted surfaces, and produce a staged improvement plan before implementation.
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
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/repository-optimizer'
    requires:
      bins:
        - git
---

# Repository Optimizer

## Overview

Audit a repository against the Optimization facets owned by applicable Tanaab skills, then produce a dependency-ordered improvement plan. The default pass is local, read-only, and complete when every observed surface is classified without modifying the repository.

## When to Use

- Run a repeatable, repository-wide alignment and maintainability audit before an optimization pass.
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
4. Follow each selected skill's Optimization facet read-only, loading only the linked canon and local evidence needed for that surface.
5. Resolve overlap through the skills' existing ownership boundaries. Assign each finding one primary owner and add a companion only when the work genuinely crosses surfaces.
6. Report every inventoried surface as aligned, drifted, or not applicable. Treat unavailable evidence as uncertainty rather than drift or alignment.
7. Produce a dependency-ordered implementation plan with proportional, repo-native validation and reviewable commit boundaries.
8. Stop without modifying files. A later explicit implementation request may invoke the owning skills against the approved plan.

## Checkpoints

- Pause when a target, owner, or policy decision cannot be resolved from checked-in repository evidence.
- Skip GitHub-hosted settings by default. Remote inspection requires the user's explicit request and an explicit or confirmed slug, and remains read-only during the audit.
- Treat later implementation authorization as scoped to the approved local plan. Obtain separate authorization for remote, destructive, or otherwise distinct effects.
- Preserve the initial working-tree state and call out any dirty-tree constraint that limits evidence or implementation sequencing.

## Completion Criteria

- Every tracked local surface is accounted for as live, cold-path, generated, or not applicable.
- Every live surface is reported as aligned, drifted, or not applicable with concrete repository evidence and a clear owning skill.
- The staged plan is ordered by dependency and leverage, includes proportional validation, and does not invent work to fill an output shape.
- Optional remote coverage is clearly labeled and was performed only after explicit request and target confirmation.
- A final working-tree check confirms the audit made no repository changes.

## Bundled Resources

- None. Discover applicable installed skills and follow their linked canon instead of maintaining a parallel router registry or bundled checklist.

## Validation

- Compare `git status --short` before and after the audit; the optimizer must create no tracked or untracked changes.
- Confirm remote GitHub inspection was skipped unless the user explicitly requested it and supplied or confirmed a slug.
- Confirm every selected skill matched an observed surface and exposed `## Optimization`.
- Confirm the report includes aligned and not-applicable results where supported instead of manufacturing drift.
- Confirm the final output is a staged plan and stops before implementation.
