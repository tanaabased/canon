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

Generate and normalize canonical GitHub Task, Bug, and Feature issue forms from the shared task-management contract. This first version renders deterministic organization and personal-repository variants and proves their submitted Markdown converges through Task Author without writing files or publishing to GitHub.

## When to Use

- Use when a project needs canonical `.github/ISSUE_TEMPLATE` Task, Bug, and Feature forms.
- Use to render organization-native or personal-repository fallback variants.
- Use to normalize submitted form Markdown into Task Author input or compare existing forms with the canonical contract.

## When Not to Use

- Do not author, revise, or normalize an individual task directly; hand normalized evidence to Task Author.
- Do not create or synchronize issue types, issue fields, or label definitions; use GitHub Issue Schema Author.
- Do not ask a submitter to calculate Task score or mirror organization-native issue fields into the body.
- Do not publish, write, or replace repository files through this first render-only version.

## Prerequisites

- Require Bun for the bundled render command and YAML validation.
- Treat GitHub issue forms as a public-preview schema and verify current official syntax before publication.
- Determine whether the target is organization-owned or personal; the variants have materially different metadata capabilities.

## Inputs

- Required for rendering: `repositoryMode` equal to `organization` or `personal`.
- Required for normalization: the matching generated form and its submitted Markdown.
- Organization normalization receives native issue-field values separately because pinned fields do not belong in the issue body.
- Personal forms expose task kind and supported metadata through stable `… estimate` headings for fallback normalization.
- Shared sources: [`../../references/task-management-contract.md`](../../references/task-management-contract.md) and [`../../references/task-management-schema.json`](../../references/task-management-schema.json).

## Outputs

- Render `.github/ISSUE_TEMPLATE/task.yml`, `bug.yml`, `feature.yml`, and `config.yml` contents without writing them.
- Organization forms set the matching top-level `type` and omit Priority, Work size, Complexity, Impact, Task score, and date fields from submitted Markdown.
- Personal forms omit top-level `type`, expose unavailable canonical metadata for fallback normalization, and never ask for Task score.
- All forms collect canonical body evidence plus urgency, enablement, confidence, and supported classification signals.
- Forms do not auto-apply labels. Task Author verifies definitions and lifecycle eligibility after normalization.
- Normalization returns Task Author input and preserves unknown headings inside a response.

## Failure Handling

- Reject an unsupported repository mode, task kind, duplicate form ID or label, or missing task-kind evidence.
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

3. Validate each YAML document against the current GitHub form schema, unique IDs and labels, supported types, and the no-Task-score/no-duplicate-native-metadata boundary.
4. For submitted Markdown, normalize only known generated headings, preserve unknown headings within their owning response, and stop on duplicate known headings.
5. Pass normalized input to Task Author and compare the resulting canonical body, metadata, labels, and score explanation.
6. Before a future authorized write, inspect the exact target paths and preserve compatible repository-specific additions through an explicit managed diff.

## Optimization

- **Inspect:** Read the exact repository form paths, chooser configuration, repository ownership mode, and current issue-type and field capabilities before proposing alignment.
- **Compare:** Diff Task, Bug, Feature, and chooser definitions against generated policy; identify duplicate IDs or labels, native metadata mirrored into bodies, lost repository additions, and stale GitHub syntax.
- **Recommend:** Keep compatible repository guidance and contact links; reconcile canonical headings and variant behavior; remove only proven duplicate managed controls.
- **Apply:** Unavailable in this render-only version. A future write path must require explicit file-level authorization and preserve unmanaged compatible content.
- **Verify:** Parse every rendered YAML document, simulate submitted Markdown, normalize through Task Author, and require semantic equivalence before publication.

## Bundled Resources

- `lib/issue-form-author.js`: deterministic form-set orchestration.
- `lib/issue-form-normalizer.js`: submitted-Markdown normalization into Task Author input.
- `lib/issue-form-contract.js`: GitHub form prompts and variant projections over shared policy.
- `scripts/render-issue-forms.js`: internal render-only command.
- `utils/`: YAML serialization, submission rendering, and command parsing.
- `test/`: GitHub form shape, YAML, ambiguity, CLI, F01, and T01-T06 equivalence coverage.

## Validation

- Run `bunx mocha "skills/github-issue-form-author/test/**/*.spec.js" "skills/task-author/test/**/*.spec.js"`.
- Parse every generated `.yml` document with Bun's YAML parser.
- Run Skill Author validation against this directory.
- Run repository tests, lint, `codex:validate`, and `codex:check`; sync the cache before the installed skill is invoked.
- Confirm F01 and T01-T06 produce exact Task Author body, effective metadata, labels, score, and fallback semantics.
