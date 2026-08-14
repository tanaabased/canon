---
name: tanaab-github-issue-form-author
description: Tanaab-based low-friction GitHub issue form generation, lossless evidence extraction, and repository-local alignment for Task, Bug, and Feature intake. Use when a project needs checked-in forms whose submissions can be semantically normalized into the shared task-management contract.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - project-management
  openclaw:
    emoji: '📝'
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/github-issue-form-author'
---

# GitHub Issue Form Author

## Overview

Generate, inspect, and align low-friction GitHub Task, Bug, and Feature intake forms from the shared task-management contract. Extract submitted responses plus their complete original Markdown as a lossless evidence package for Task Author's later semantic normalization. Render deterministic organization and personal-repository variants, plan an exact managed repository diff, and require digest-bound authorization before writing the four owned files.

## When to Use

- Use when a project needs canonical `.github/ISSUE_TEMPLATE` Task, Bug, and Feature forms.
- Use to render organization-native or personal-repository fallback variants.
- Use to inspect or align the four canonical repository-local form files without deleting unknown templates.
- Use to extract submitted form Markdown into a lossless evidence handoff or compare existing forms with the intake contract.

## When Not to Use

- Do not author, revise, or normalize an individual task directly; hand normalized evidence to Task Author.
- Do not create or synchronize issue types, issue fields, or label definitions; use GitHub Issue Schema Author.
- Do not ask a submitter to classify Priority, Work size, Complexity, Impact, scoring diagnostics, labels, dates, or Task score.
- Do not claim that extracted intake evidence is already a canonical task; Task Author owns semantic assessment and rewriting.
- Do not delete unknown issue templates, silently replace custom submitted inputs, or auto-apply canonical labels through form YAML.

## Prerequisites

- Require Bun for the bundled render command and YAML validation.
- Apply [the shared GitHub CLI routing contract](../../references/github-cli-routing.md): invoke bare `gh` through the inherited `PATH`, environment, and current working directory without an absolute executable or subprocess override.
- Treat GitHub issue forms as a public-preview schema and verify current official syntax before publication.
- Determine whether the target is organization-owned or personal; the variants have materially different metadata capabilities.

## Inputs

- Required for rendering: `repositoryMode` equal to `organization` or `personal`.
- Required for repository inspection: an explicit `OWNER/REPO`; infer organization or personal mode from the repository owner.
- Required for mutation: the exact repository, inspected default branch, and SHA-256 plan digest returned by a fresh plan.
- Required for normalization: the matching generated form and its submitted Markdown.
- Organization normalization receives native issue-field values separately because pinned fields do not belong in the issue body.
- Personal forms use their selected Task, Bug, or Feature form as task-kind evidence and ask the same questions as organization forms.
- Shared sources: [`../../references/task-management-contract.md`](../../references/task-management-contract.md) and [`../../references/task-management-schema.json`](../../references/task-management-schema.json).

## Outputs

- Render or align `.github/ISSUE_TEMPLATE/task.yml`, `bug.yml`, `feature.yml`, and `config.yml`.
- Report each managed path as missing, aligned, drifted, or unavailable; list unknown template files as preserved and never propose deletion.
- Preserve compatible title, assignee, project, Markdown-guidance, and chooser contact-link additions. Block custom submitted inputs or unsupported keys whose meaning cannot survive normalization safely.
- Organization forms set the matching top-level `type`; personal forms omit it because user-owned repositories lack organization issue types.
- Both variants use identical evidence questions. Task and Feature have two required responses plus optional context; Bug has three required responses plus optional context.
- Task asks what needs to be done and why, how completion will be observed, and optionally which constraints, inputs, or approvals matter. It warns reporters not to publish secrets.
- Bug asks only for observed behavior, expected behavior, and safe reproduction or investigation evidence. It does not ask the reporter to write a test, open a pull request, or execute risky or machine-mutating steps.
- Forms do not auto-apply labels or expose metadata and scoring controls. Task Author estimates supported values after semantic normalization and chooses native or fallback storage.
- Extraction returns the selected kind, title, observed organization metadata, complete raw Markdown, labeled answered responses, and `normalizationRequired: true`.
- Preserve unknown headings inside their owning response and preserve the complete original Markdown even when content sits outside known responses.

## Failure Handling

- Reject an unsupported repository mode, task kind, duplicate form ID or label, or missing task-kind evidence.
- Stop before mutation when a managed file is unreadable, contains invalid YAML, auto-applies labels, or has incompatible custom submitted inputs.
- Treat a changed blob SHA or default branch as stale-plan evidence; require a new plan and digest rather than retrying with broader writes.
- Stop on the first failed file write, report partial success without rollback, and re-read all four paths for exact verification.
- Stop on duplicate known headings in submitted Markdown rather than misfiling or discarding user evidence.
- Leave unanswered prompts absent from the evidence map; do not turn missing responses into invented canonical values or sentinels.
- Warn that repository-local templates suppress organization-default issue templates and require an explicit alignment review before publication.
- Treat required-field validation as public-repository behavior because GitHub does not enforce it identically for private repositories.

## Workflow

1. Resolve the repository mode and load the shared task-management schema.
2. Render all four desired files without touching the target repository:

   ```bash
   bun skills/github-issue-form-author/scripts/render-issue-forms.js render --repository-mode organization --json
   ```

3. Inspect and plan one explicit repository without writing:

   ```bash
   bun skills/github-issue-form-author/scripts/render-issue-forms.js plan OWNER/REPO --json
   ```

4. Review creates, updates, preserved additions, unmanaged files, blockers, default branch, and digest. Apply only the exact approved plan:

   ```bash
   bun skills/github-issue-form-author/scripts/render-issue-forms.js apply OWNER/REPO \
     --approved-repository OWNER/REPO --approved-branch BRANCH --approved-digest SHA256 --json
   ```

5. Re-read all four files, require an aligned idempotent plan, and report partial writes or SHA conflicts honestly.
6. Validate each YAML document against the current GitHub form schema, unique IDs and labels, supported types, and the no-Task-score/no-duplicate-native-metadata boundary.
7. For submitted Markdown, extract only known generated headings, preserve unknown headings within their owning response, preserve the complete original Markdown, and stop on duplicate known headings.
8. Hand the evidence package to Task Author for semantic normalization. Do not invoke deterministic task rendering until an agent has produced supported canonical sections, assessment provenance, rationales, and focused questions for missing evidence.

## Optimization

- **Inspect:** Read the exact repository form paths, chooser configuration, repository ownership mode, and current issue-type and field capabilities before proposing alignment.
- **Compare:** Diff Task, Bug, Feature, and chooser definitions against generated policy; identify duplicate IDs or labels, metadata or diagnostics pushed onto reporters, lost repository additions, and stale GitHub syntax.
- **Recommend:** Keep compatible repository guidance and contact links; reconcile the approved intake questions and variant behavior; retire only previously managed controls or proven duplicates.
- **Apply:** Require exact repository, default branch, and digest authorization; create or update only the four managed paths, preserve compatible additions, and never delete unknown templates.
- **Verify:** Parse every rendered YAML document, simulate submitted Markdown, and prove complete response and raw-Markdown preservation. Canonical semantic convergence is a Task Author fixture concern after the agent assessment pass.

## Bundled Resources

- `lib/issue-form-author.js`: deterministic form-set orchestration.
- `lib/issue-form-repository-author.js`: inspection, managed planning, authorization, serial writes, and verification.
- `lib/github-issue-form-client.js`: GitHub repository and Contents API boundary.
- `lib/issue-form-normalizer.js`: lossless submitted-Markdown evidence handoff for Task Author.
- `lib/issue-form-contract.js`: GitHub form prompts and variant projections over shared policy.
- `scripts/render-issue-forms.js`: internal render, plan, and digest-authorized apply command.
- `utils/`: YAML serialization, repository-plan construction, authorization, submission rendering, and command parsing.
- `test/`: GitHub form shape, repository alignment, YAML, ambiguity, and CLI coverage.
- `../../test/task-management-equivalence.spec.js`: intentional cross-skill F01 and T01-T06 intake-preservation coverage.

## Validation

- Run `bunx mocha "skills/github-issue-form-author/test/**/*.spec.js" "skills/task-author/test/**/*.spec.js"`.
- Parse every generated `.yml` document with Bun's YAML parser.
- Exercise missing, aligned, drifted, extended, invalid, stale-plan, SHA-conflict, and partial-write repository states through the fake client.
- Run Skill Author validation against this directory.
- Run repository tests, lint, `codex:validate`, and `codex:check`; sync the cache before the installed skill is invoked.
- Confirm F01 and T01-T06 preserve every submitted evidence item, avoid invented classifications, require Task Author semantic normalization, and map the accepted Task prompts into outcome, scope, acceptance, delivery, and authorization evidence without loss.
