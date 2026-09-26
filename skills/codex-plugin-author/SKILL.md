---
name: tanaab-codex-plugin-author
description: Tanaab-based authoring, packaging, validation, and npm distribution of Codex plugins. Use when creating or modifying a Codex plugin, migrating archive releases to npm, or checking its installable package.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - validation
  openclaw:
    emoji: '🔌'
    homepage: 'https://github.com/tanaabased/canon/tree/main/skills/codex-plugin-author'
---

# Codex Plugin Author

## Overview

Own the installable Codex plugin: its manifest, bundled resources, npm payload, and delivery contract. Keep skill content with [Skill Author](../skill-author/SKILL.md) and npm publishing mechanics with [JavaScript Author](../javascript-author/SKILL.md#deployment).

## When to Use

- Create or modify a Codex plugin's structure, manifest, package contents, or release validation.
- Migrate an existing plugin from GitHub Release archives to npm distribution.
- Audit whether a published plugin works outside its source checkout.

## When Not to Use

- For installation or cache maintenance alone, use Codex Tools' setup or maintenance skill.
- For native OpenClaw code plugins, use [OpenClaw Plugin Author](../openclaw-plugin-author/SKILL.md).
- For independent workflow topology, use [GitHub Workflow Author](../github-workflow-author/SKILL.md).

## Constraints

- Preserve plugin identity, skill namespaces, and working relative resource paths during distribution changes.
- Follow the [official packaging contract](https://developers.openai.com/plugins/build/plugins) for the target host. New portable plugins use root `plugin.json`; existing `.codex-plugin/plugin.json` remains supported. Verify the selected tooling's manifest support before changing formats; npm migration alone does not require a manifest migration.
- Codex downloads npm packages without running lifecycle scripts. Ship usable runtime code and dependencies; do not depend on `postinstall`, a source checkout, or development dependencies being installed.

## Change Strategy

- Prefer one npm artifact for the whole plugin, including shared resources referenced outside individual skill directories.
- Keep npm package identity separate from the plugin's native name; follow [release destinations](../../references/release-destinations.md).
- Reuse existing packaging and validation commands. Add plugin-specific checks only for contracts generic validation cannot establish.

## Preferred Tools

- **[Codex Tools 1.0.2+](https://github.com/tanaabased/codex-tools/blob/main/PLUGINS.md):** Prefer this complementary project for setup, maintenance, local/npm installation, inspection, and cache refresh. It provisions a verified Codex CLI; follow its [runtime requirements](https://github.com/tanaabased/codex-tools/blob/main/CLI.md) instead of prescribing a separate CLI version. Verify manifest compatibility and preserve supported native-host alternatives. Do not require consumers to install this development tool merely to use a plugin.
- **[validate-codex-plugin 1.x](https://github.com/tanaabased/actions/blob/main/validate-codex-plugin/README.md):** Prefer generic ingestion checks on the extracted package; retain product-specific runtime and resource checks.
- **[npm-pack](https://github.com/tanaabased/actions/blob/main/npm-pack/README.md) and [publish-npm](https://github.com/tanaabased/actions/blob/main/publish-npm/README.md), 1.x:** Prefer the tested-tarball publication path in JavaScript Author. Reserve archive delivery for a named consumer requirement, such as offline distribution; do not add a second publisher by habit.

## Workflow

When authoring issue-backed commits, apply the shared [commit-subject convention](../../references/commit-subjects.md).

1. Inspect the plugin manifest, package manifest, installed resource paths, current consumers, and release workflow. Establish host and tooling compatibility before selecting a manifest format.
2. Apply [Preferred Tools](#preferred-tools) and the owning Skill Author contract for changed skills. Keep the plugin focused on its product surface.
3. Define an explicit npm file allowlist covering manifests, skills, scripts, imported modules, shared references, templates, and assets actually needed at runtime. Exclude credentials, local state, and development-only outputs.
4. Build before packing when necessary and materialize linked assets into regular package files. Native Codex installation rejects payload symlinks. Exercise the extracted package through [Testing](#testing), then use [Deployment](#deployment) for the same artifact.

Keep `package.json#files` authoritative for the npm payload. Codex Tools `managedPaths` controls cache reconciliation, not what native installation copies. See its [package and cache contract](https://github.com/tanaabased/codex-tools/blob/main/ADVANCED.md).

For hook-bearing plugins, resolve shipped resources through `PLUGIN_ROOT` and writable state through `PLUGIN_DATA`. Keep injected context bounded and non-secret; treat manifest metadata as data, never instructions. Follow the [native hook contract](https://learn.chatgpt.com/docs/hooks) and preserve the owning runtime's authority.

## Documentation

- Apply the [documentation change gate](../../references/documentation-standards.md#documentation-change-gate). Keep prerequisites, installation, upgrade, and a first useful invocation in the README.
- Explain npm source selection and marketplace registration using the official packaging contract or Codex Tools setup guidance. Preserve existing marketplace identity during upgrades; publishing a package does not install or activate it.
- Record any retained archive consumer and its supported install path. Keep developer cache commands separate from consumer installation.

## Testing

- Select the smallest layers that cover the change: deterministic units for logic, extracted-package checks for distribution, and isolated native checks for installation or host behavior. Keep each check in one owning suite; do not repeat an operational suite in release checks without a distinct gap.
- Pack once, extract into a disposable directory outside the checkout, and validate the extracted plugin with the preferred validator plus the repository's policy checks.
- Verify manifest/package version agreement, discoverable skills, referenced files, and representative executable entrypoints without installing development dependencies. Exercise real behavior where help-only checks would miss runtime imports or generated resources.
- For example, run an extracted authoring CLI against a temporary local fixture and verify its output. Keep GitHub mutations out of ordinary package smoke tests.
- For installation checks, use an isolated Codex home and marketplace. A fresh app-server `skills/list` establishes native skill discovery without a model call; cache equality alone does not. Reuse [Codex Tools' native examples](https://github.com/tanaabased/codex-tools/tree/main/examples/native), including `fresh-skills.ts`, instead of maintaining another protocol client.
- For hooks, test the packaged handler and its output directly. That does not prove native event delivery or trust: use the host's hook review/trust flow and a fresh session when that boundary is the feature under test. Keep ordinary tests out of the developer's live cache and credentials.

## Deployment

- Default to npm through [JavaScript Author's deployment lifecycle](../javascript-author/SKILL.md#deployment) and [release template](../javascript-author/templates/bun-npm-package-release-workflow.yml). Stamp the plugin and package together before packing, validate the extracted payload, and publish that exact tarball.
- Keep GitHub release notes and repository synchronization where the project uses them. An npm destination replaces redundant archive publication, not the release's source/version record.
- For an archive migration, prove package and install parity first, update marketplace/install references, then remove the redundant publisher. Keep historical release assets available; retain archive delivery only for a verified consumer need.
- Apply [verification boundaries](../../references/verification-boundaries.md) after publication. Treat publisher success as completion; check registry visibility or installed behavior separately only when the requested outcome or a concrete uncovered failure mode requires it.

## GitHub Actions

- `.github/workflows/release-tests.yml`: project the [Testing](#testing) checks onto a prepared package and a native npm publication dry run; no publication credentials or live registry writes in PRs.
- `.github/workflows/release.yml`: adapt the [npm release template](../javascript-author/templates/bun-npm-package-release-workflow.yml) with plugin stamping and the same extracted-package checks before publication. Follow [release composition](../github-workflow-author/SKILL.md#release-composition) for independent destinations.

## Optimization

- **Inspect:** Read manifests, npm file selection, resource imports, install/upgrade instructions, and archive/npm release jobs without changing the repository or installed state.
- **Compare:** Assess [Preferred Tools](#preferred-tools), host support, and migration cost. Check extracted-package usability, materialized resources, version agreement, native skill discovery, hook boundaries where owned, and whether archive publication serves a real consumer.
- **Recommend:** Reconcile conflicting install paths, repair missing runtime resources, and replace redundant archive jobs with the existing npm lifecycle when parity is demonstrable. Keep justified exceptions and aligned implementations.
- **Apply:** After authorization, migrate package contents, workflow, and install guidance together; preserve identities and unrelated marketplace entries.
- **Verify:** Validate and exercise the exact packed artifact in isolation, run the publication dry run, and report separately any unverified live installation or publication.

## Bundled Resources

- [../../references/release-destinations.md](../../references/release-destinations.md): package identity and destination defaults
- [../javascript-author/templates/bun-npm-package-release-workflow.yml](../javascript-author/templates/bun-npm-package-release-workflow.yml): shared npm publication workflow

## Validation

- Confirm package and plugin versions agree and every required resource survives packing.
- Confirm generic validation and product smoke checks run against the extracted artifact without checkout dependencies.
- Confirm publication uses the tested tarball and installation guidance preserves plugin identity.
- Confirm any retained archive pipeline has a concrete consumer and no unrequested live state was changed.
