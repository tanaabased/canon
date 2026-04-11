---
name: tanaab-changelog-author
description: Tanaab-based CHANGELOG authoring and maintenance. Use when a user wants to draft or update `CHANGELOG.md`, preserve its structure, or keep the unreleased heading aligned with the shared changelog contract.
license: MIT
metadata:
  type: workflow
  owner: tanaab
  tags:
    - tanaab
    - workflow
    - changelog
---

# Changelog Author

## Overview

Tanaab-based `CHANGELOG.md` authoring and maintenance. Use when a user wants to draft or update changelog entries, preserve the repo's changelog structure, or keep the unreleased heading aligned with the shared changelog contract.

## When to Use

- Draft or update `CHANGELOG.md`.
- Preserve the repo's changelog structure and section ordering.
- Keep the leading unreleased heading aligned with the shared `prepare-release-action` contract when that format is in use.
- Summarize changes concisely in changelog-ready user-facing language with consistent bullet shape, ordering, and issue or PR links when available.

## When Not to Use

- Do not use this skill for release notes outside `CHANGELOG.md`.
- Do not use this skill for release readiness review, release workflow mechanics, or deployment wiring.
- Do not use this skill for release metadata decisions, tagging, publishing, or pushing releases.
- Do not use this skill for raw implementation work that does not directly affect the changelog surface.

## Preconditions

- Confirm that `CHANGELOG.md` is the intended owned surface.
- Confirm the changelog format already in use and whether the repo follows the shared `prepare-release-action` contract.
- Load [./references/changelog-format-and-examples.md](./references/changelog-format-and-examples.md) when the exact unreleased heading line or canonical bullet shape matters.
- Gather the narrowest change evidence needed to write or update the relevant changelog entries.
- If the user does not explicitly state the changelog scope or source, treat the default source as the commits from `HEAD` back to the most recent versioned tag.
- In that default case, ensure the local repo has the latest tags before deriving the commit range when the environment allows it; if tag refresh is blocked or intentionally skipped, make that limitation explicit and use the local tag state you actually have.
- When the repo follows `prepare-release-action`, keep the top line in the standard unreleased heading shape: an H2 marker, the unreleased version token, a hyphen separator, and the unreleased date token rendered as a markdown link whose target is the unreleased link token.
- Unless the user explicitly asks for historical cleanup, treat older released sections as read-only and scope mutations to the upcoming unreleased bullets only.

## Workflow

1. Confirm the task is changelog-led rather than release-workflow- or implementation-led.
2. Inspect the existing changelog format and gather the narrowest change evidence needed for the update.
3. If the user did not specify the changelog scope or source, derive the default evidence set from the commit range between `HEAD` and the most recent versioned tag after refreshing tags when possible.
4. Mine commit subjects, bodies, and any available merge or squash text for issue and PR references that can be attached to the resulting changelog bullets.
5. When editing `CHANGELOG.md`, preserve or create the leading `prepare-release-action` unreleased heading in that standard tokenized linked-heading shape.
6. Unless the user explicitly asks to revise historical release notes, limit edits to the unreleased bullet list that sits under that leading `prepare-release-action` heading.
7. Within each touched version section, use `-` bullets only, start each entry with a past-tense verb such as `Added`, `Fixed`, `Removed`, or `Updated`, and sort the entries alphabetically by the full bullet text.
8. Keep each bullet as concise as possible. Aim for under 150 visible characters before any trailing issue or PR link markup, and split longer changes into multiple bullets when that reads more cleanly.
9. Wrap machine-named surfaces such as commands, inputs, outputs, files, flags, and identifiers in backticks when they appear in a bullet.
10. When a bullet can be matched confidently to one or more PRs or issues, suffix it with all relevant linked references on the same line.
11. Stop once `CHANGELOG.md` is structurally correct, complete for the requested scope, and aligned with the current changelog contract.

## Checkpoints

- Pause when the needed change evidence is missing or the repo's changelog contract is unclear.
- Pause when the default tag-based scope cannot be derived cleanly and make the missing or stale tag state explicit.
- Pause before mutating older released sections unless the user explicitly asked for historical standardization or correction.
- Hand release workflows, release notes outside `CHANGELOG.md`, and release-readiness questions back to the owning surface instead of absorbing them here.

## Completion Criteria

- Keep `CHANGELOG.md` complete for the requested scope and aligned with the repo's existing structure.
- Keep the leading unreleased heading aligned with `prepare-release-action` when that contract is in scope.
- Keep older released sections untouched by default and mutate them only on explicit user request.
- Keep version-section bullets alphabetical, `-`-prefixed, past-tense, concise, and consistently backticked where machine names appear.
- When the user did not provide a narrower source, derive the unreleased bullets from the commits between `HEAD` and the latest versioned tag available after tag refresh.
- Add trailing PR or issue links on the same line when the mapping is known from commit or changelog evidence, including multiple links when one bullet is supported by more than one PR or issue.
- Make any missing change evidence or unresolved changelog ambiguity explicit before closing.

## Bundled Resources

- [./references/changelog-format-and-examples.md](./references/changelog-format-and-examples.md): exact `prepare-release-action` unreleased heading line plus canonical bullet-shape examples mined from `prepare-release-action`

## Validation

- Confirm the task stayed on the `CHANGELOG.md` surface only.
- Confirm `CHANGELOG.md` keeps the leading `prepare-release-action` unreleased heading in that standard tokenized linked-heading shape when that contract is in scope.
- Confirm older released sections were left untouched unless the user explicitly asked for historical changelog cleanup or standardization.
- Confirm that an unspecified scope defaulted to the commits between `HEAD` and the latest versioned tag available to the agent, and that any inability to refresh tags was made explicit.
- Confirm each version section uses `-` bullets only and that the bullets are sorted alphabetically.
- Confirm each bullet starts with a past-tense verb and stays concise, aiming for under 150 visible characters before any trailing issue or PR link markup.
- Confirm machine-named surfaces are backticked where appropriate.
- Confirm issue or PR links are appended on the same line when a trustworthy mapping exists in the change evidence, including multiple links when warranted.
- Confirm entries are concise, user-facing, and free of release-workflow or readiness drift.
- Confirm no tagging, publishing, or push behavior was absorbed into the changelog task.
