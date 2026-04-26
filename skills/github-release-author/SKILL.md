---
name: tanaab-github-release-author
description: Tanaab-based GitHub Release drafting workflow for Tanaab and allied repositories.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - release
---

# GitHub Release Author

## Overview

Tanaab-based GitHub Release drafting workflow for Tanaab and allied repositories.

Use this skill to prepare a release from the repository's current changelog contract, choose or verify the next release tag, and create a GitHub Release draft that a human can review and publish.

## When to Use

- Create a GitHub Release draft for a Tanaab or allied repository.
- Turn the current unreleased `CHANGELOG.md` entries into release body text.
- Choose the next `v<semver>` release tag when the user has not supplied one.
- Confirm release preconditions before triggering a `release.published` workflow through human publication.

## When Not to Use

- Do not use this skill for ordinary `CHANGELOG.md` drafting without release creation intent; use `$tanaab-changelog-author`.
- Do not edit release workflows, packaging scripts, or `prepare-release-action` wiring unless the user asks for workflow authoring separately.
- Do not publish a release directly by default; create a draft unless the user explicitly asks to publish immediately.
- Do not bump `package.json` or other stamped version files locally before drafting the release; the release workflow owns that mutation.

## Prerequisites

- Confirm the target repo has `package.json`, `CHANGELOG.md`, and a GitHub remote.
- Confirm the local worktree is clean before checking out `main`; pause if unrelated local changes exist.
- Confirm `gh` is installed and authenticated for the target repository.
- Confirm `.github/workflows/release.yml` is triggered by `release.published` before relying on draft publication as the release gate.
- Check out `main`, pull the latest remote state, and fetch tags before deriving the release range or version.

## Inputs

- Accept an explicit version or tag from the user when supplied; normalize it to a `v<semver>` tag for the release.
- Accept an explicit prerelease/latest override when supplied.
- Otherwise derive the base version from `package.json.version` and the latest matching `v*` tag.
- Use the unreleased `CHANGELOG.md` entries prepared by `$tanaab-changelog-author` as the release notes source.

## Outputs

- A pushed changelog update on `main` when unreleased entries changed during the release prep.
- A GitHub Release draft whose tag and title are identical, such as `v0.2.1`.
- A release body containing only the upcoming release entries, not the full changelog and not the tokenized unreleased heading.
- A clear handoff that publishing the draft is the human approval step that triggers the `release.published` workflow.

## Failure Handling

- Stop on a dirty worktree, failed checkout, failed pull, failed tag fetch, missing `gh` auth, or missing release workflow.
- Stop when `package.json.version` is not semver-valid or conflicts with the latest reachable release tag in a way that makes the next version ambiguous.
- Stop when the changelog has no unreleased entries unless the user explicitly wants an empty or manually supplied release body.
- Stop when `gh release create` fails and report the exact remote error instead of retrying with a different release shape.
- If a draft release is created but later validation is uncertain, surface the draft URL and the remaining manual check instead of publishing.

## Workflow

1. Confirm the task is release-creation-led and target the repo's `main` branch.
2. Check `git status --short`, `git checkout main`, pull latest `main`, fetch tags, and verify `gh auth status`.
3. Inspect `package.json.version`, the latest `v*` tag, `CHANGELOG.md`, and `.github/workflows/release.yml`.
4. Use `$tanaab-changelog-author` to update the unreleased changelog entries when they are incomplete for the upcoming release.
5. If the changelog changed, commit and push that changelog update to `main` before creating the draft release.
6. Choose the release tag: explicit user version wins; otherwise default to patch, use minor for meaningful user or developer additions, and reserve major for explicit or unusually large incompatible changes.
7. Infer prerelease only when the final tag has a semver prerelease suffix such as `v1.0.0-beta.2`; never invent a prerelease suffix automatically.
8. Extract the release body from the current unreleased changelog block, preserving useful `###` subsections and bullets while stripping the tokenized release heading.
9. Create the GitHub Release draft with `gh release create <tag> --title <tag> --draft --notes-file <file>` plus `--latest` for stable releases or `--prerelease --latest=false` for prereleases.
10. Validate that `gh release view <tag>` reports the expected draft, title, prerelease/latest state, and body source.

## Release Workflow

- Draft is the default because publication is the review gate that triggers repos using `release.published`.
- Use tag and title equality exactly: `v0.2.1` tag means `v0.2.1` title.
- Stable releases default to latest; prerelease tags default to prerelease and not latest.
- `prepare-release-action` owns release-time package and manifest version stamping after the draft is published.
- For `prepare-release-action`-backed repos, the release tag should be the semver-valid value consumed by `github.event.release.tag_name`.

## Bundled Resources

- None. Keep the release flow local to this skill until another live skill needs the same contract.

## Validation

- Confirm `main` was current before deriving the release tag and notes.
- Confirm the release workflow uses `release.published` when draft publication is expected to trigger automation.
- Confirm explicit versions override auto bump selection and are normalized to `v<semver>`.
- Confirm auto bump selection covers patch, minor, explicit major, and explicit prerelease cases.
- Confirm package/tag mismatches, dirty worktrees, and missing changelog entries pause before remote release creation.
- Confirm the release body is only the upcoming changelog entries and excludes the tokenized unreleased heading.
- Confirm the GitHub Release is a draft unless immediate publication was explicitly requested.
