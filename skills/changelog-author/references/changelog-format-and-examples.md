# Changelog Format And Examples

Use this reference when drafting or standardizing `CHANGELOG.md` entries.

## Unreleased Heading

When the repo follows the shared `prepare-release-action` contract, the top line must be:

```md
## {{ UNRELEASED_VERSION }} - [{{ UNRELEASED_DATE }}]({{ UNRELEASED_LINK }})
```

Keep that line exact so CI can stamp the unreleased section correctly.

## Entry Rules

- By default, only mutate the upcoming unreleased bullets under the `prepare-release-action` heading.
- Treat older released sections as read-only unless the user explicitly asks to standardize, correct, or rewrite historical release notes.
- If the user does not state the changelog scope or source, derive the unreleased bullets from the commits between `HEAD` and the most recent versioned tag after refreshing tags when possible.
- Use `-` bullets only.
- Keep bullets alphabetized within each version section.
- Start each bullet with a past-tense verb such as `Added`, `Fixed`, `Removed`, or `Updated`.
- Keep bullets as concise as possible. Aim for under 150 visible characters before any trailing issue or PR link markup.
- Split a long change into multiple bullets when that reads more cleanly than one overloaded line.
- Wrap machine-named surfaces such as files, flags, commands, inputs, outputs, and identifiers in backticks.
- Mine commit messages for issue or PR links when the scope comes from commit history.
- When a bullet can be matched confidently to one or more PRs or issues, append all relevant linked references on the same line.

## Example Bullets

These examples are mined from `/Users/pirog/tanaab/prepare-release-action/CHANGELOG.md` and reflect the intended shape.

```md
- Added `PREPARE_RELEASE_VERSION` and the `resolved-version` action output so later steps can reuse the resolved release version.
- Fixed `version=dev` to fall back to `package.json.version` or `v0.0.0-unreleased.<sha>` when no matching tags exist.
- Updated sync test workflows to validate unsigned (`sync-test`) and verified (`sync-test-verified`) branch flows. [#6](https://github.com/tanaabased/prepare-release-action/pull/6)
```

## Notes

- Prefer user-facing outcome language over implementation diary language.
- Preserve the repo's existing section structure unless the task explicitly changes the changelog format.
