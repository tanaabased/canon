---
name: tanaab-github-issue-form-author
description: Tanaab-based GitHub issue form generation, normalization, and repository-local alignment for canonical Task, Bug, and Feature intake. Use when a project needs checked-in GitHub issue forms that converge with the shared task-management contract.
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

Generate, inspect, align, and normalize canonical GitHub Task, Bug, and Feature issue forms from the shared task-management contract. Render deterministic organization and personal-repository variants, plan an exact managed repository diff, require digest-bound authorization before writing the four owned files, and prove submitted Markdown converges through Task Author.

## When to Use

- Use when a project needs canonical `.github/ISSUE_TEMPLATE` Task, Bug, and Feature forms.
- Use to render organization-native or personal-repository fallback variants.
- Use to inspect or align the four canonical repository-local form files without deleting unknown templates.
- Use to normalize submitted form Markdown into Task Author input or compare existing forms with the canonical contract.

## When Not to Use

- Do not author, revise, or normalize an individual task directly; hand normalized evidence to Task Author.
- Do not create or synchronize issue types, issue fields, or label definitions; use GitHub Issue Schema Author.
- Do not ask a submitter to calculate Task score or mirror organization-native issue fields into the body.
- Do not delete unknown issue templates, silently replace custom submitted inputs, or auto-apply canonical labels through form YAML.

## Prerequisites

- Require Bun for the bundled render command and YAML validation.
- Treat GitHub issue forms as a public-preview schema and verify current official syntax before publication.
- Determine whether the target is organization-owned or personal; the variants have materially different metadata capabilities.

## Inputs

- Required for rendering: `repositoryMode` equal to `organization` or `personal`.
- Required for repository inspection: an explicit `OWNER/REPO`; infer organization or personal mode from the repository owner.
- Required for mutation: the exact repository, inspected default branch, and SHA-256 plan digest returned by a fresh plan.
- Required for normalization: the matching generated form and its submitted Markdown.
- Organization normalization receives native issue-field values separately because pinned fields do not belong in the issue body.
- Personal forms expose task kind and supported metadata through stable `… estimate` headings for fallback normalization.
- Shared sources: [`../../references/task-management-contract.md`](../../references/task-management-contract.md) and [`../../references/task-management-schema.json`](../../references/task-management-schema.json).

## Outputs

- Render or align `.github/ISSUE_TEMPLATE/task.yml`, `bug.yml`, `feature.yml`, and `config.yml`.
- Report each managed path as missing, aligned, drifted, or unavailable; list unknown template files as preserved and never propose deletion.
- Preserve compatible title, assignee, project, Markdown-guidance, and chooser contact-link additions. Block custom submitted inputs or unsupported keys whose meaning cannot survive normalization safely.
- Organization forms set the matching top-level `type` and omit Priority, Work size, Complexity, Impact, Task score, and date fields from submitted Markdown.
- Personal forms omit top-level `type`, expose unavailable canonical metadata for fallback normalization, and never ask for Task score.
- All forms collect canonical body evidence plus urgency, enablement, confidence, and supported classification signals.
- Forms do not auto-apply labels. Task Author verifies definitions and lifecycle eligibility after normalization.
- Normalization returns Task Author input and preserves unknown headings inside a response.

## Failure Handling

- Reject an unsupported repository mode, task kind, duplicate form ID or label, or missing task-kind evidence.
- Stop before mutation when a managed file is unreadable, contains invalid YAML, auto-applies labels, or has incompatible custom submitted inputs.
- Treat a changed blob SHA or default branch as stale-plan evidence; require a new plan and digest rather than retrying with broader writes.
- Stop on the first failed file write, report partial success without rollback, and re-read all four paths for exact verification.
- Stop on duplicate known headings in submitted Markdown rather than misfiling or discarding user evidence.
- Leave unanswered estimates unset; do not turn missing responses into minimum values or sentinels.
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
7. For submitted Markdown, normalize only known generated headings, preserve unknown headings within their owning response, and stop on duplicate known headings.
8. Pass normalized input to Task Author and compare the resulting canonical body, metadata, labels, and score explanation.

## Optimization

- **Inspect:** Read the exact repository form paths, chooser configuration, repository ownership mode, and current issue-type and field capabilities before proposing alignment.
- **Compare:** Diff Task, Bug, Feature, and chooser definitions against generated policy; identify duplicate IDs or labels, native metadata mirrored into bodies, lost repository additions, and stale GitHub syntax.
- **Recommend:** Keep compatible repository guidance and contact links; reconcile canonical headings and variant behavior; remove only proven duplicate managed controls.
- **Apply:** Require exact repository, default branch, and digest authorization; create or update only the four managed paths, preserve compatible additions, and never delete unknown templates.
- **Verify:** Parse every rendered YAML document, simulate submitted Markdown, normalize through Task Author, and require semantic equivalence before publication.

## Bundled Resources

- `lib/issue-form-author.js`: deterministic form-set orchestration.
- `lib/issue-form-repository-author.js`: inspection, managed planning, authorization, serial writes, and verification.
- `lib/github-issue-form-client.js`: GitHub repository and Contents API boundary.
- `lib/issue-form-normalizer.js`: submitted-Markdown normalization into Task Author input.
- `lib/issue-form-contract.js`: GitHub form prompts and variant projections over shared policy.
- `scripts/render-issue-forms.js`: internal render, plan, and digest-authorized apply command.
- `utils/`: YAML serialization, repository-plan construction, authorization, submission rendering, and command parsing.
- `test/`: GitHub form shape, repository alignment, YAML, ambiguity, CLI, F01, and T01-T06 equivalence coverage.

## Validation

- Run `bunx mocha "skills/github-issue-form-author/test/**/*.spec.js" "skills/task-author/test/**/*.spec.js"`.
- Parse every generated `.yml` document with Bun's YAML parser.
- Exercise missing, aligned, drifted, extended, invalid, stale-plan, SHA-conflict, and partial-write repository states through the fake client.
- Run Skill Author validation against this directory.
- Run repository tests, lint, `codex:validate`, and `codex:check`; sync the cache before the installed skill is invoked.
- Confirm F01 and T01-T06 produce exact Task Author body, effective metadata, labels, score, and fallback semantics.
