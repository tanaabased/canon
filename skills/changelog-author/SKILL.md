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
  openclaw:
    emoji: '🗒️'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/changelog-author
---

# Changelog Author

## Overview

Tanaab-based `CHANGELOG.md` authoring and maintenance. Use when a user wants to draft or update changelog entries, preserve the repo's changelog structure, or keep the unreleased heading aligned with the shared changelog contract.

## Required Reading

Read each applicable document in full, or the explicitly named section, before dependent work. Reuse complete reads already in context. If required material is unavailable, report the gap and pause only the dependent work.

- **Always:** [Changelog Format and Examples](./references/changelog-format-and-examples.md) and [Documentation Standards](../../references/documentation-standards.md).
- **Before optimizing this surface:** [Optimization Operations](../../references/optimization-operations.md).
- **Before authoring issue-backed commits:** [Commit Subjects](../../references/commit-subjects.md).

## When to Use

- Draft or update `CHANGELOG.md`.
- Preserve the repo's changelog structure and section ordering.
- Keep the leading unreleased heading aligned with the shared `prepare-release-action` contract when that format is in use.
- Summarize changes concisely in changelog-ready user-facing language with consistent bullet shape, ordering, and issue or PR links when available.

## When Not to Use

- Do not use this skill for release notes outside `CHANGELOG.md`.
- Do not use this skill for release readiness review, release workflow mechanics, or deployment wiring.
- Do not use this skill for release metadata decisions, tagging, publishing, or pushing releases.
- Use `$tanaab-release-author` for release readiness, version selection, GitHub Release drafts, tagging, publishing, or release body extraction.
- Do not use this skill for raw implementation work that does not directly affect the changelog surface.

## Preconditions

- Confirm the intended changelog and its existing format.
- Resolve the requested evidence range. Without a narrower user scope, refresh tags when possible and use the commits since the latest versioned tag; report unavailable or stale tag evidence.
- Preserve released sections unless historical editing is explicitly requested.

## Workflow

When authoring issue-backed commits, apply the shared [commit-subject convention](../../references/commit-subjects.md).

1. Confirm the work is changelog-led and complete Required Reading.
2. Inspect the existing changelog and gather commit, issue, and pull-request evidence for the selected range.
3. Select material user or developer outcomes, excluding changes already covered by released entries.
4. Edit the unreleased section using [Changelog Format and Examples](./references/changelog-format-and-examples.md) for the heading, bullet shape, ordering, machine names, and source links. Preserve released history.
5. Validate the entries against their evidence and stop without drafting or publishing a release.

## Checkpoints

- Pause when the needed change evidence is missing or the repo's changelog contract is unclear.
- Pause when the default tag-based scope cannot be derived cleanly and make the missing or stale tag state explicit.
- Pause before mutating older released sections unless the user explicitly asked for historical standardization or correction.
- Hand release workflows, release notes outside `CHANGELOG.md`, and release-readiness questions back to the owning surface instead of absorbing them here.

## Completion Criteria

- The unreleased block covers the supported material outcomes in the selected range and follows the format reference.
- Released history remains intact, and any missing source evidence is explicit.

## Optimization

- **Inspect:** Inventory the changelog, its leading unreleased block, the relevant tag or commit evidence, and the preserved release history.
- **Compare:** Reconcile the unreleased heading and bullets with tag or commit evidence, then identify contradictions, duplicate or fragmented entries, weak ordering, missing links, omitted component identities, unformatted machine names or versions, and low-signal content against the changelog canon.
- **Recommend:** Keep evidence-backed entries; correct contradictions; deduplicate or consolidate related bullets; split overloaded bullets; move entries into justified subsections; and tighten or remove low-signal wording without manufacturing changes.
- **Apply:** After explicit authorization, make those operations in the unreleased block only unless historical repair is separately requested; never rewrite released history by default.
- **Verify:** Recheck heading shape, concise alphabetized bullets, deduplication, links, and the evidence boundary used for every entry.

## Bundled Resources

- [./references/changelog-format-and-examples.md](./references/changelog-format-and-examples.md): exact `prepare-release-action` unreleased heading line plus canonical bullet-shape examples mined from `prepare-release-action`

## Validation

- Compare each new entry with its source evidence and existing released entries.
- Check the edited block against [Changelog Format and Examples](./references/changelog-format-and-examples.md), including the exact unreleased heading.
- Confirm the diff preserves released history and contains no release-state mutation.
