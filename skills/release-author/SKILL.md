---
name: tanaab-release-author
description: Tanaab-based release drafting and readiness workflow implemented through GitHub Releases. Use when a user wants to prepare a changelog-backed release draft, verify the next tag, or review release readiness.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - release
  openclaw:
    emoji: '🚀'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/release-author
    requires:
      bins:
        - git
        - gh
---

# Release Author

## Overview

Tanaab-based release drafting and readiness workflow implemented through GitHub Releases for Tanaab and allied projects.

Use this skill to assess release readiness without changes, or to prepare a release from the repository's current changelog contract, choose the next release tag, and create a GitHub Release draft that a human can review and publish.

## Required Reading

Read each applicable document in full, or the explicitly named section, before dependent work. Reuse complete reads already in context. If required material is unavailable, report the gap and pause only the dependent work.

- **Always:** [Github Cli Routing](../../references/github-cli-routing.md) and [Verification Boundaries](../../references/verification-boundaries.md).
- **Before assessing or preparing release text:** [Documentation Standards](../../references/documentation-standards.md) and [Changelog Format and Examples](../changelog-author/references/changelog-format-and-examples.md).
- **Before selecting npm channels:** [Coding Stack — npm Package Publishing](../../references/coding-stack-preferences.md#npm-package-publishing).
- **Before authoring issue-backed commits:** [Commit Subjects](../../references/commit-subjects.md).

## When to Use

- Review release readiness or verify a proposed next tag without editing files or creating a release.
- Create a GitHub Release draft for a Tanaab or allied repository.
- Turn the current unreleased `CHANGELOG.md` entries into release body text.
- Choose the next `v<semver>` release tag when the user has not supplied one.
- Confirm release preconditions before triggering a `release.published` workflow through human publication.

## When Not to Use

- Do not use this skill for ordinary `CHANGELOG.md` drafting without release creation intent; use `$tanaab-changelog-author`.
- Do not edit release workflows, packaging scripts, or `prepare-release-action` wiring unless the user asks for workflow authoring separately.
- Do not invent a multi-package versioning or publication strategy while drafting a release; require that repository contract to exist first.
- Do not publish a release directly by default; create a draft unless the user explicitly asks to publish immediately.
- Do not bump `package.json` or other stamped version files locally before drafting the release; the release workflow owns that mutation.

## Prerequisites

- Confirm the target repo has `package.json`, `CHANGELOG.md`, and a GitHub remote.
- For release preparation, confirm the local worktree is clean before checking out the release target branch; pause if unrelated local changes exist.
- Confirm `gh` is installed and authenticated for the target repository.
- Apply [the shared GitHub CLI routing contract](../../references/github-cli-routing.md): invoke bare `gh` through the inherited `PATH`, environment, and current working directory without an absolute executable or subprocess override.
- Confirm `.github/workflows/release.yml` is triggered by `release.published` before relying on draft publication as the release gate.
- Inspect root workspaces and their manifests. When more than one publishable workspace exists, identify the repo's fixed-version or independent-version and tag strategy before deriving a release.
- Resolve the GitHub default branch and use it as the release target unless the user explicitly specifies another branch.
- For release preparation, check out the release target branch, pull its latest remote state, and fetch tags before deriving the release range or version. Readiness review uses read-only evidence under [Readiness Review](#readiness-review).

## Inputs

- Accept an explicit version or tag from the user when supplied; normalize it to a `v<semver>` tag for the release.
- Accept an explicit release target branch when supplied; otherwise use the GitHub default branch.
- Accept an explicit GitHub status choice independently of the SemVer tag: prerelease, regular Latest, or regular non-Latest. GitHub prereleases cannot be Latest.
- In a single-package repo, otherwise derive the base version from `package.json.version` and the latest matching `v*` tag.
- In a workspace repo, derive package versions and tags only from its explicit release contract; never treat a private coordinator root's version as the publishable package version.
- Use the unreleased `CHANGELOG.md` entries prepared by `$tanaab-changelog-author` as the release notes source.

## Outputs

Readiness review returns a readiness assessment, proposed or verified next tag when supported, blockers, and evidence gaps without making changes. Release preparation returns:

- A pushed changelog update on the release target branch when unreleased entries changed during the release prep.
- A GitHub Release draft whose tag and title are identical, such as `v0.2.1`.
- A release body containing only the upcoming release entries, not the full changelog and not the tokenized unreleased heading.
- A clear handoff that publishing the draft is the human approval step that triggers the `release.published` workflow.

## Failure Handling

During readiness review, report these conditions as blockers or evidence gaps without repairing them. During release preparation, stop before the dependent action.

- Stop on a dirty worktree, failed checkout, failed pull, failed tag fetch, missing `gh` auth, or missing release workflow.
- Stop when `package.json.version` is not semver-valid or conflicts with the latest reachable release tag in a way that makes the next version ambiguous.
- Stop when multiple publishable workspaces exist but their package selection, fixed-versus-independent versioning, or tag naming is unclear.
- Stop when the release workflow only stamps a single root package but the requested release requires multiple independently publishable workspaces.
- Stop when the changelog has no unreleased entries unless the user explicitly wants an empty or manually supplied release body.
- Stop when the proposed release tag already exists remotely; do not silently reuse or move it.
- Stop when `gh release create` fails and report the exact remote error instead of retrying with a different release shape.
- If a draft release is created but later validation is uncertain, surface the draft URL and the remaining manual check instead of publishing.

## Workflow

Resolve intent before acting: readiness questions and next-tag verification follow Readiness Review; an explicit request to prepare or create a release enters Release Preparation.

### Readiness Review

1. Resolve the repository and requested target branch, using the GitHub default branch when none is supplied. Record the inspected revision and working-tree state without switching branches, pulling, or fetching.
2. Inspect that target's package and workspace versions, versioned tags, changelog, release workflow, and available validation evidence through existing Git refs and read-only GitHub queries. Compare unreleased entries with changes since the latest versioned tag. Keep uncommitted content distinct from the release target; report unavailable or stale evidence instead of treating the current checkout as proof of remote readiness.
3. Assess the applicable release prerequisites and requested next tag using the version and GitHub-status rules below. Report ready, blocked, or uncertain, with concrete blockers, missing evidence, and any proposed corrections. Do not present readiness as successful publication.
4. Stop without editing files, updating Git refs, committing, pushing, or creating or publishing a release. Release preparation requires an explicit request.

### Release Preparation

1. Resolve the target with `gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'` unless the user explicitly supplied another branch.
2. Check `git status --short`, check out and pull the latest target branch, fetch tags, and verify `gh auth status`.
3. Inspect the root package, any workspace manifests, relevant package versions, matching tags, `CHANGELOG.md`, and `.github/workflows/release.yml`.
4. Use `$tanaab-changelog-author` to update the unreleased changelog entries when they are incomplete for the upcoming release.
5. If the changelog changed, commit and push that changelog update to the target branch before creating the draft release, applying the shared [commit-subject convention](../../references/commit-subjects.md) for issue-backed commits.
6. Choose the release tag: explicit user version wins; otherwise default to patch, use minor for meaningful user or developer additions, and reserve major for explicit or unusually large incompatible changes.
7. Confirm the proposed tag does not already exist on the remote before creating the release.
8. Select GitHub status independently of the tag. Honor an explicit status choice; otherwise default a SemVer prerelease tag such as `v1.0.0-beta.2` to GitHub prerelease and any other tag to regular Latest. Never invent a prerelease suffix automatically, and reject a request to make a GitHub prerelease Latest.
9. Extract the release body from the current unreleased changelog block, preserving useful `###` subsections and bullets while stripping the tokenized release heading.
10. Create the GitHub Release draft with `gh release create <tag> --target <target-branch> --title <tag> --draft --notes-file <file>`. Add `--prerelease --latest=false` for a GitHub prerelease, `--latest` for regular Latest, or `--latest=false` for regular non-Latest, regardless of SemVer syntax.
11. Read back the draft's target branch, draft flag, title, prerelease flag, and body source with `gh release view <tag> --json targetCommitish,isDraft,name,isPrerelease,body`. A draft cannot report `isLatest: true`; record the selected Latest intent for the publication handoff. After publication, verify the resulting GitHub `isLatest` and `isPrerelease` fields through the release node in GraphQL (the `gh release view` JSON fields do not include `isLatest`). If publication is left to a human, make this a handoff check rather than claiming it was already verified.

## Release Workflow

- For release preparation, draft is the default because publication is the review gate that triggers repos using `release.published`.
- Use tag and title equality exactly: `v0.2.1` tag means `v0.2.1` title.
- SemVer tags supply only the default GitHub status: ordinary tags default to regular Latest, and prerelease-suffixed tags default to GitHub prerelease and non-Latest. An explicit GitHub status choice overrides that default; no first-release exception applies. See [npm publishing signals](../../references/coding-stack-preferences.md#npm-package-publishing) for how published GitHub status selects npm tags.
- `prepare-release-action` owns release-time package and manifest version stamping after the draft is published.
- For `prepare-release-action`-backed repos, the release tag should be the semver-valid value consumed by `github.event.release.tag_name`.
- Do not assume that the single-package `prepare-release-action` contract covers multiple publishable workspaces; require explicit repo-local release wiring before using it for that shape.

## Bundled Resources

- None. Keep the release flow local to this skill until another live skill needs the same contract.

## Validation

- For readiness review, confirm the assessment identifies its target revision, distinguishes stale or missing evidence, and leaves local and remote state unchanged. The remaining checks apply to release preparation.
- Apply [verification boundaries](../../references/verification-boundaries.md). Retain the draft readback to confirm the publication gate and release target; successful downstream publishers do not need additional registry or installation probes by default.
- Confirm the selected target branch was current before deriving the release tag and notes.
- Confirm the release workflow uses `release.published` when draft publication is expected to trigger automation.
- Confirm explicit versions override auto bump selection and are normalized to `v<semver>`.
- Confirm auto bump selection covers patch, minor, explicit major, and explicit prerelease cases.
- Confirm package/tag mismatches, dirty worktrees, existing remote tags, and missing changelog entries pause before remote release creation.
- Confirm workspace repos do not derive a release from a private coordinator root or proceed without an explicit package-version and tag contract.
- Confirm the release body is only the upcoming changelog entries and excludes the tokenized unreleased heading.
- Confirm the GitHub Release is a draft unless immediate publication was explicitly requested.
- Confirm the release's `targetCommitish` matches the selected target branch.
- Confirm explicit GitHub status choices override SemVer defaults, draft readback checks only fields a draft can report, and the publication handoff calls for a published-status readback.
