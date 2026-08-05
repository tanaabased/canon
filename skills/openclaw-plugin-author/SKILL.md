---
name: tanaab-openclaw-plugin-author
description: Tanaab-based authoring, validation, packaging, and deployment of OpenClaw code plugins. Use when a user wants to create, modify, standardize, test, package, or publish an OpenClaw plugin.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - openclaw
  openclaw:
    emoji: '🦞'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/openclaw-plugin-author
---

# OpenClaw Plugin Author

## Overview

Tanaab-based authoring, validation, packaging, and deployment of OpenClaw code plugins. Use when a user wants to create, modify, standardize, test, package, or publish an OpenClaw plugin.

- Keep this skill on native OpenClaw code-plugin surfaces: the plugin manifest, package metadata, SDK entry and registration, runtime behavior, package proof, and publication.
- Compose shared JavaScript and repository canon at the lifecycle that owns it instead of restating that doctrine here.
- Treat the npm package name, OpenClaw plugin id, ClawHub owner/listing, and source repository as related but distinct identities.
- Keep npm and ClawHub as independently operable publication pipelines while aligning their release source, version, build, package contents, and compatibility metadata.

## When to Use

- Create or update a native OpenClaw code plugin that ships `openclaw.plugin.json` and executable plugin runtime code.
- Shape `package.json#openclaw`, source and installed runtime entries, compatibility metadata, or plugin SDK imports.
- Implement or change plugin registration for tools, hooks, services, providers, channels, Gateway methods, setup surfaces, or plugin-owned OpenClaw commands.
- Add plugin-focused documentation, direct tests, package validation, or install-shaped proof.
- Prepare or standardize the canonical npm and ClawHub publication lifecycle for one OpenClaw plugin package.
- Audit an existing OpenClaw code-plugin repository for contract, runtime, package, test, documentation, or delivery drift.

## When Not to Use

- Do not use this skill for generic JavaScript or TypeScript work when no OpenClaw plugin contract is central; use [JavaScript Author](../javascript-author/SKILL.md).
- Do not use it for general lint, format, Bun, TypeScript, workspace, package-identity, or folder-baseline normalization; use [JavaScript Repo Standardizer](../javascript-repo-standardizer/SKILL.md).
- Do not treat an OpenClaw-registered subcommand as a standalone `package.json#bin` product; use [JavaScript CLI Author](../javascript-cli-author/SKILL.md) only when a true package-level CLI is the primary surface.
- Do not use it for independent GitHub Actions trigger, permission, job, matrix, gate, or reusable-workflow design; use [GitHub Workflow Author](../github-workflow-author/SKILL.md).
- Do not use it for README-versus-docs-site decisions, GitHub Release drafting, host preparation, Gateway administration, or routine installed-plugin operations.
- Do not apply the native manifest contract to Codex-, Claude-, or Cursor-compatible bundle-only plugins unless they also own a native OpenClaw code-plugin surface.

## Constraints

- Prefer the smallest change that solves the plugin-owned task and preserve established local patterns when they satisfy the current platform contract.
- Inspect the installed OpenClaw SDK types, supported `openclaw/plugin-sdk/*` entrypoints, and current official plugin documentation before adding an SDK abstraction or copying a bundled-plugin import.
- Keep static discovery and configuration metadata in `openclaw.plugin.json`; keep npm metadata, dependencies, install gates, and source/runtime entries in `package.json`; keep runtime registration in plugin code.
- Every native plugin must ship a valid root `openclaw.plugin.json`, including a strict `configSchema` even when the plugin owns no configuration.
- Keep manifest id, runtime entry id, declared capabilities, compatibility metadata, package files, and source/runtime entry pairs coherent.
- Prefer narrow public SDK subpaths and injected runtime contexts over private OpenClaw internals or process-global behavior.
- Treat repository checks as distinct from plugin installation, Gateway startup, model invocation, and other machine-mutating operational validation; run the latter only when explicitly requested.
- Keep credentials out of tracked files, logs, examples, and durable skill prose, and re-check time-sensitive registry authentication before changing release wiring.

## Change Strategy

- Apply [JavaScript Author](../javascript-author/SKILL.md) for JS/TS implementation and npm package behavior, [JavaScript repo structure](../../references/javascript-repo-structure.md) for owning scopes and role folders, and [coding stack preferences](../../references/coding-stack-preferences.md) for Bun, TypeScript, and npm defaults.
- Apply [JavaScript function data flow](../../references/javascript-function-data-flow.md) when plugin logic can honestly be separated from SDK registration or runtime state.
- Inspect project-local plugin patterns and current OpenClaw guidance before using a fallback structure; do not turn DevGuard-specific supervision, policy, or scenario design into a universal plugin baseline.
- Keep the root manifest and declared package entries platform-correct, registration thin, stateful orchestration in `lib/`, independently testable logic in `utils/`, internal development tasks in `scripts/`, and flat owned tests in `test/`.
- Put each non-trivial plugin-owned OpenClaw subcommand in a focused `cli/<command>.js` or `cli/<command>.ts` module. Keep host registration and shared command orchestration in `lib/`; these commands extend the OpenClaw CLI and are not package-level `bin/` entrypoints.

### Identity and Manifest

- Use [`openclaw.plugin.json`](https://docs.openclaw.ai/plugins/manifest) for metadata OpenClaw must inspect before loading code, including identity, strict config validation, static capability contracts, activation hints, and UI metadata.
- Use `package.json#openclaw` for source/runtime entries, compatibility, build provenance, install gating, and other package-owned metadata.
- Keep the runtime entry id equal to `openclaw.plugin.json#id`; do not normalize a platform id merely because the npm package uses a scoped name.
- When the manifest declares capability contracts or a version, keep those declarations synchronized with runtime registration and the owning release version.

### Registration and Runtime

- Select the narrowest current entry helper and SDK subpaths that fit the plugin capability, following the official [plugin entrypoint contract](https://docs.openclaw.ai/plugins/sdk-entrypoints).
- Keep heavy SDKs, long-lived services, CLI registration, and other runtime-only work out of setup-safe or static manifest surfaces.
- Keep source entries usable for source-checkout development and installed runtime entries pointed at built JavaScript when the package ships generated output; preserve the required positional pairing between source and runtime entries.
- Route diagnostics through the closest host-injected `PluginLogger`, such as `api.logger` or a CLI or service context logger. Do not construct a private OpenClaw subsystem logger or use `console.*` for routine plugin diagnostics; a plugin-local adapter must delegate to the injected logger and preserve its levels and routing.
- Derive the diagnostic namespace from the resolved `api.id`, removing one leading `openclaw-` because the platform context is already implied; for example, `openclaw-devguard` becomes `devguard`. Do not derive it from the npm package name, display name, or CLI command. When the current host logger does not visibly attribute records by plugin, prefix message text exactly once as `[<plugin-namespace>] ...`; when the host already exposes that attribution, do not repeat it. Centralize this choice in one adapter so host logger changes do not require call-site rewrites.
- Put optional stable lowercase component or operation context inside that namespace, such as `[devguard] watcher: ...`. Keep diagnostics free of ANSI styling, credentials, primary CLI output, and machine-readable command results.

### Plugin-Owned Commands

- Register commands beneath one plugin-owned command namespace through the current public OpenClaw CLI API and its discovery metadata. Let OpenClaw own top-level parsing, help, and version behavior unless the plugin command has a distinct documented contract.
- Keep command registration thin over the `cli/` modules. Parse host arguments and options at that boundary, then pass typed values and injected dependencies into the owning command implementation.
- Follow [shared CLI style rules](../../references/cli-style-rules.md) for human summaries, streams, machine-readable output, color, and errors. Use the public OpenClaw runtime output surface for primary output and the `PluginLogger` injected into the CLI registrar for diagnostics. Prefer those API surfaces directly; add a small plugin-local adapter only to apply shared styling to primary output or add diagnostic context, redaction, or test injection without changing stream, log-level, or machine-output semantics.
- Keep JSON and JSONL modes free of human decoration and ANSI styling, derive them from the same command result as human output, and preserve child or command exit status across every output mode.

## Workflow

1. Confirm the request is native OpenClaw-code-plugin-led rather than bundle-, generic-JavaScript-, baseline-, workflow-, or host-operations-led.
2. Classify the active surface as identity/manifest, SDK entry and registration, runtime behavior, configuration, plugin-owned commands, package proof, or deployment.
3. Load only the relevant shared canon, local plugin files, installed SDK types, and current official OpenClaw references for that surface.
4. Reconcile the manifest, package metadata, runtime entry, documentation, tests, and built artifact before adding another representation.
5. Make the smallest coherent plugin-owned change and run the narrowest repo-native lint, format, type-check, unit-test, build, and plugin-contract checks that apply.
6. When package contents or delivery changed, create and inspect each pipeline's npm-pack artifact, then run that registry's dry run against the artifact its pipeline produced.
7. Run installed-package, Gateway, model, or agent scenarios only when task scope explicitly requires operational proof.

## Documentation

- Apply [README standards](../../references/readme-standards.md) and [README Author](../readme-author/SKILL.md) when the repository entry surface changes; keep first use short and move development, dogfooding, or proof-heavy flows into focused companion docs.
- Document the supported explicit install sources, such as `npm:` and `clawhub:`, with the npm package identity while using the platform plugin id for enable, inspect, configuration, and plugin-owned command examples.
- State compatibility requirements, activation or configuration needs, one short first verification, and any meaningful permissions, side effects, trust assumptions, or safety limits.
- Apply [inline code and API documentation](../../references/inline-code-and-api-docs.md) to exported plugin contracts and surprising SDK lifecycle or failure behavior without narrating obvious registration code.
- Keep linked-source development and installed-package proof distinct so source-checkout success is not presented as proof of the published dependency and runtime shape.

## Testing

- Apply [JavaScript Author's direct-test contract](../javascript-author/SKILL.md#testing) as the canonical mechanism: focused Mocha tests for plugin logic, utilities, registration adapters, configuration, and SDK boundaries.
- Prefer injected or faked SDK contexts for direct tests and assert manifest/runtime agreement, registered contract identity, and error behavior where those are stable public contracts.
- For a plugin-local logger adapter, fake the host logger and assert one call at the original level, one plugin-id-derived namespace without a leading `openclaw-` when host attribution is absent, no repeated namespace when attribution is present, and no direct console fallback.
- For plugin-owned commands, fake the narrow host command interface and inject output, logger, and style dependencies. Assert the command namespace, subcommands, descriptions, options, human and no-color summaries, machine-output purity, diagnostic separation, and exit behavior that the plugin owns.
- Keep build and plugin metadata checks in the validation path rather than inventing another direct-test framework.
- Use [Leia Markdown scenarios](../../references/leia-markdown-scenarios.md) only when the owned behavior crosses a real OpenClaw command, installation, Gateway, agent, hook, restart, or other lifecycle boundary.
- When a fresh unattended CI scenario must exercise an OpenClaw tool call, synchronize no-approval exec policy inside the scenario setup with `openclaw exec-policy preset yolo`. Restrict this to isolated ephemeral state; CI or a missing TTY does not itself bypass approvals, and routine local validation must not apply the preset to a developer's normal profile.
- Keep unit tests and Leia scenarios in separate commands and CI checks; do not require machine-mutating Leia or live OpenClaw flows for routine local validation.

## Deployment

- Use [release destinations](../../references/release-destinations.md) for the shared product-surface routing while keeping this section authoritative for native OpenClaw plugin packaging and publication.
- Apply [JavaScript Author's npm deployment lifecycle](../javascript-author/SKILL.md#deployment) for release preparation, build ordering, npm trusted publishing, dry runs, and stable or prerelease channels instead of duplicating that doctrine here.
- Treat publication as one plugin-package contract with two independently operable destinations. npm and ClawHub may prepare, build, and pack in separate pipelines; require both to derive from the same release source and version and to validate the same manifest, built runtime entries, package-file contract, and compatibility metadata.
- Keep `package.json#openclaw.compat.pluginApi` and `package.json#openclaw.build.openclawVersion` explicit for external ClawHub code plugins; do not use the package version as a compatibility fallback.
- When `openclaw.plugin.json` declares a version, stamp it from the same release version as `package.json`, format after generated changes, and validate the prepared state before packing.
- Pack with lifecycle scripts disabled, inspect required and excluded files, and prove runtime dependencies and built entries from the artifact rather than from the source checkout alone.
- Run current ClawHub package validation plus npm and `clawhub package publish --dry-run` checks before live delivery; confirm resolved owner, family, source attribution, compatibility, and tags.
- Publish from trusted automation, keep npm and ClawHub credentials scoped to their own steps, and re-check current ClawHub trusted-publisher support rather than assuming prior registry state.
- Hand independent release-event, job, permission, reusable-workflow, or gate-topology changes to [GitHub Workflow Author](../github-workflow-author/SKILL.md).

## GitHub Actions

Use this section as a reference map from the owned testing and deployment lifecycles to stable workflow paths. Keep lifecycle doctrine in its owning section and route independent graph design to GitHub Workflow Author.

### Pull Request Validation

- Apply `## Testing` through `.github/workflows/pr-unit-tests.yml` using [JavaScript Author's unit-test workflow template](../javascript-author/templates/bun-unit-tests-workflow.yml).
- Apply the repo baseline through `.github/workflows/pr-linter.yml` using [Repo Standardizer's linter workflow template](../javascript-repo-standardizer/templates/bun-pr-linter-workflow.yml).
- Use `.github/workflows/pr-examples-tests.yml` with the [shared Leia workflow template](../../templates/leia-pr-examples-tests.yml) only when the plugin owns justified installed or runtime scenarios.

### Release Package Validation

- Use `.github/workflows/release-tests.yml` for synthetic version preparation, prepared-state format checks, package build and inspection, ClawHub validation, and npm plus ClawHub publish dry runs.
- Keep publication disabled in pull-request validation. Each registry simulation may pack independently, but it must validate and dry-run the exact tarball produced by its own path against the shared plugin-package contract.
- Add a reusable workflow template only after another plugin proves the same Tanaab lifecycle, inputs, authentication, and failure boundaries.

### Release Publication

- Apply `## Deployment` through `.github/workflows/release.yml`, starting from [JavaScript Author's npm release template](../javascript-author/templates/bun-npm-package-release-workflow.yml) and adding a separate ClawHub pipeline that preserves the shared release and package contract.
- Inspect the current official ClawHub reusable workflow when choosing publication topology, but let GitHub Workflow Author own whether a repository uses that workflow or a repo-local job and how it is pinned.

## Optimization

Use the shared operation lenses—**keep**, **reconcile**, **deduplicate**, **consolidate/merge**, **split**, **extract**, **move**, **tighten**, and **remove**—only where they fit this plugin surface; do not manufacture changes to satisfy the list.

- **Inspect:** Inventory plugin and package identities, manifest/config contracts, SDK imports, source/runtime entries, registration, plugin-owned commands, runtime modules, documentation, direct tests, operational scenarios, package contents, CI, and npm/ClawHub delivery.
- **Compare:** Reconcile manifest, package, runtime, command tree, human and machine output, docs, tests, built output, and registry metadata; identify unsupported SDK paths, duplicated registration, overloaded entrypoints, command-placement or output drift, stale compatibility, missing artifact proof, and divergent publication artifacts.
- **Recommend:** Keep aligned platform behavior; deduplicate or consolidate repeated contracts; split overloaded runtime owners; extract testable logic; move misplaced command modules, static metadata, or package metadata; tighten compatibility and package boundaries; and remove proven stale paths while routing generic baseline work to its owner.
- **Apply:** After explicit authorization, make the smallest coherent plugin-owned changes without opportunistic framework migration, live installation, Gateway mutation, or publication.
- **Verify:** Run the applicable repo checks, direct command and runtime tests, build, plugin validation, artifact inspection, and registry dry runs, then re-inspect command, identity, and artifact agreement.

## Bundled Resources

- [JavaScript Author](../javascript-author/SKILL.md): JS/TS implementation, direct tests, and npm deployment lifecycle
- [JavaScript Repo Standardizer](../javascript-repo-standardizer/SKILL.md): Bun, TypeScript, lint, format, package identity, and repository baseline
- [GitHub Workflow Author](../github-workflow-author/SKILL.md): independent workflow graph, permission, job, matrix, and reusable-workflow ownership
- [README Author](../readme-author/SKILL.md): repository entry-surface selection and authoring
- [Release destinations](../../references/release-destinations.md): shared product-surface-to-release-destination routing
- [JavaScript repo structure](../../references/javascript-repo-structure.md): owning scopes, role directories, test placement, and hoisting
- [Coding stack preferences](../../references/coding-stack-preferences.md): Bun-first runtime and npm identity defaults
- [JavaScript function data flow](../../references/javascript-function-data-flow.md): function shape and mutation boundaries
- [Inline code and API documentation](../../references/inline-code-and-api-docs.md): public-contract and comment guidance
- [Leia Markdown scenarios](../../references/leia-markdown-scenarios.md): conditional end-to-end scenario contract

## Validation

- Confirm the task remained on a native OpenClaw code-plugin surface and did not absorb bundle-plugin, generic JavaScript, repo-baseline, workflow-topology, or host-operations ownership.
- Confirm npm package name, OpenClaw plugin id, ClawHub owner/listing, and source repository identity remain intentionally distinct and correctly used.
- Confirm `openclaw.plugin.json`, `package.json#openclaw`, runtime entry identity, compatibility fields, source/runtime entries, declared capabilities, documentation, and built output agree.
- Confirm current supported SDK entrypoints and narrow public subpaths were preferred over private or copied bundled-plugin internals.
- Confirm plugin diagnostics use the closest host-injected `PluginLogger`, preserve host routing and levels, and use the plugin-id-derived namespace without a leading `openclaw-` exactly once when host attribution is absent without leaking credentials, primary output, or machine-readable results.
- Confirm every non-trivial plugin-owned OpenClaw subcommand has a focused `cli/` module, registration remains thin, primary and diagnostic output use the correct host surfaces, machine modes remain undecorated, and exit behavior is preserved.
- Confirm Mocha remains the canonical direct-test mechanism and Leia appears only for justified installed or runtime scenarios with a separate check identity.
- Confirm documentation distinguishes source-checkout development from npm-pack, npm, and ClawHub install proof and states meaningful permissions or safety limits.
- Confirm each registry pipeline's npm-pack artifact contains its runtime dependencies, manifest, built entries, and public docs while excluding development-only or private material.
- Confirm the npm and ClawHub pipelines use aligned release inputs and package contracts, each dry-runs the artifact it produced, and no live installation, Gateway mutation, credential exposure, or publication occurred without authorization.
- Confirm `GitHub Actions` maps each lifecycle to a stable `.github/workflows/*.yml` path without duplicating doctrine or embedding complete workflow YAML.
- Run the narrowest applicable lint, format, type-check, unit tests, build, plugin checks, package inspection, and registry dry runs for the touched plugin surface.
