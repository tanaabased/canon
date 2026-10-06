# Coding Stack Preferences

Use this reference for default runtime, framework, and tooling choices in Tanaab-managed coding repos.

- This is a default stack, not a claim that every repo should force every tool.
- Prefer one consistent stack unless the repository's actual surface or external contract clearly justifies an exception.
- Keep this file focused on stable defaults and exception boundaries, not step-by-step implementation recipes.
- Future live coding skills should cite this file instead of re-copying stack choices into each skill.

## Project Maturity and Compatibility

- Determine the affected surface's stability and compatibility commitments from repository guidance, supported public contracts, release policy, and explicit user decisions. A version number or prerelease label alone does not establish those commitments or authorize breaking them.
- For an explicitly experimental or unsettled surface, prefer correcting the design and updating its consumers directly. Do not add aliases, facades, fallback paths, or deprecation machinery merely to preserve an abandoned design.
- For a supported contract, preserve compatibility or follow an authorized breaking-change and migration plan. If the commitment is unclear and the change would break consumers, resolve that uncertainty before removing behavior.
- Keep documentation proportionate to the supported contract: describe current use and necessary migration steps, without presenting unsettled implementation details as permanent guarantees or adding speculative compatibility guides.

## Default Runtime

- Prefer ESM JavaScript or TypeScript on Bun for repositories that have meaningful JS/TS tooling, CLI, docs, frontend, or automation surfaces.
- Use Bun for dependency installation, source execution, lint, type-checking, unit tests, the Leia harness, and builds where the tools support it. The development toolchain does not determine the published runtime contract.
- Read runtime versions from project declarations such as `.node-version`, `.bun-version`, `packageManager`, and `engines`; follow [compatibility and link guidance](./documentation-standards.md#compatibility-and-links) for upstream requirements and necessary minimums instead of copying changing versions into prose.
- Use `node:` built-in modules when Bun provides Node-compatible support.
- Do not introduce Bun into a repository that has no meaningful JavaScript or TypeScript surface just to satisfy stack consistency.

### Source and Distribution

- Use `#!/usr/bin/env bun` for executable JS/TS source entrypoints. Ordinary modules and scripts invoked explicitly through Bun need no shebang.
- Build shipped CLI artifacts for their declared consumer runtime, usually Node for npm distribution; Bun remains valid when it is the supported runtime. Set the [Bun build target](https://bun.com/docs/bundler#target) explicitly and have the build emit or replace the artifact's shebang accordingly, preserving executable permissions and leaving source unchanged.
- Keep Node-distributed code and dependencies Node-compatible; changing a shebang or build target does not translate Bun-only APIs. Align package `bin`, `exports`, and `engines` with the shipped artifacts, and generate only the ESM/CommonJS formats the package promises.

## npm Package Identity

- Use `@tanaab` as the canonical npm scope for every Tanaab-owned package, including libraries, CLIs, workspaces, npm-published GitHub Actions, and npm-distributed Codex or OpenClaw plugins.
- Put that identity in `package.json#name` and use `@tanaab/<package>` consistently in internal dependency declarations, package-manager configuration, publish automation, and package examples.
- Treat `@tanaabased/*` as a noncanonical npm identity. Keep GitHub repositories and their metadata under `github.com/tanaabased`; the GitHub organization name does not define the npm scope.
- Keep platform-native plugin identifiers separate from npm package identity. For example, an npm-distributed plugin may use `@tanaab/openclaw-devguard` in `package.json` while its `openclaw.plugin.json#id` remains `devguard`; Codex plugin manifest names likewise follow the Codex contract.
- Preserve third-party scopes such as `@types`, `@actions`, and `@eslint`; the Tanaab scope rule applies only to Tanaab-owned package identities.
- Treat lockfiles as generated projections of package manifests. Change the owning manifests first, then refresh and validate their lockfiles with the package manager; never treat a lockfile-only identity edit as the source of truth.

## npm Package Publishing

- Keep the single-package `release.published` lifecycle with [JavaScript Author](../skills/javascript-author/SKILL.md#deployment), including shared preparation, exact-tarball validation and publication, and independent repository synchronization. Leave multi-package release orchestration explicit.
- Prefer tokenless npm trusted publishing on a supported GitHub-hosted runner. Let the shared publisher select a compatible project Node/npm toolchain and grant `id-token: write` only to its job.
- Keep three signals separate: a SemVer prerelease suffix (for example, `1.0.0-beta.2`) describes version syntax; GitHub reports whether a published release is Latest or a prerelease; npm `latest` and `edge` are distribution tags. npm `latest` is the default install tag, not a stability guarantee.
- On `release.published`, `publish-npm` uses the reported GitHub status, regardless of SemVer syntax:

  | Example                                         | GitHub status          | npm tag                                     |
  | ----------------------------------------------- | ---------------------- | ------------------------------------------- |
  | `v1.0.0-beta.2` deliberately selected as Latest | Regular Latest         | `latest`, optionally synchronized to `edge` |
  | `v1.0.0-beta.2` marked as a GitHub prerelease   | Prerelease, non-Latest | `edge` only                                 |
  | `v1.0.0` published without Latest status        | Regular non-Latest     | `edge` only                                 |

  The same rule applies to a first release: a GitHub prerelease does not establish npm's default-install `latest` tag. Outside release events, the action falls back to SemVer syntax: versions with a prerelease suffix use `edge`, and other versions use `latest`.

- Use the preferred `latest-tag`, `edge-tag`, and `sync-edge-tag` inputs when customizing channels. `publish-npm@v1.0.5` and later support tokenless trusted-publisher dist-tag updates; omit `channel-token` and `registry-token` for npm publication and channel syncing when using those releases. Token-based auth remains valid for registries, runners, or clients that cannot use trusted publishing.
- npm trusted publishing requires a supported GitHub-hosted runner and `id-token: write` on the npm job. For [trusted publishing](https://docs.npmjs.com/trusted-publishers/), enable `npm publish` for publication and `npm dist-tag` for channel syncing. OIDC dist-tag updates require npm `11.21.0+` in the 11.x line or `12.2.0+` in the 12.x line.
- Build only when the package ships generated output. Validate the final prepared artifact and preserve any release tool's stated limitations around mutation and synchronization.

## TypeScript

- Support JavaScript and TypeScript as first-class implementation languages under the same ownership and folder rules.
- Preserve the language already used by an existing scope unless the repository or user selects TypeScript.
- Use TypeScript for new work when the repo already uses it, an external contract requires it, or the user chooses it.
- Treat migration of unrelated JavaScript as an explicit follow-on decision rather than automatic cleanup.
- In mixed-language Bun repos, use `allowJs` to support gradual adoption and keep static type-checking separate from execution or bundling.

## Frontend

- Prefer Vue 3 for front-end component work.
- Prefer VitePress 1 for static sites and documentation sites when a fuller docs surface is warranted.
- For Tanaab-styled static sites, prefer subthemes built on `tanaabased/theme`.
- Keep project-specific presentation changes in the local subtheme layer instead of forking the upstream theme when a subtheme is sufficient.

## Styling

- Prefer SCSS when a stylesheet preprocessor is appropriate.
- Use plain CSS only when the task explicitly requires it or the surrounding toolchain does not support SCSS cleanly.
- Do not choose Less or Stylus by default.

## Linting and Formatting

- Prefer ESLint for code-quality and static-analysis rules.
- Prefer standalone Prettier for formatting.
- Keep linting and formatting ownership separate instead of embedding formatting rules into ESLint by default.
- In ESM-first repos, prefer `eslint.config.js` and `prettier.config.js` over `.mjs` variants unless the surrounding stack requires another shape.

## Testing Defaults

- Apply [verification boundaries](./verification-boundaries.md) when selecting checks; additional post-success verification must cover a consequential gap in the command's contract.
- Tests have two default homes: focused unit tests and Leia integration scenarios. Before adding a harness, probe suite, or test category that fits neither, explain the uncovered requirement and ask the user. Existing surface-specific guidance, such as Vue component testing below, remains applicable.
- Unit tests primarily exercise independently testable functions in `utils/` within the owning scope. Extract cohesive decisions from libraries when that makes the code simpler; retain light, deterministic library tests for state or orchestration that cannot honestly be separated. Do not build fake end-to-end consumers inside unit tests.
- Integration and consumer behavior belong in the owning Leia example: commands, installed imports and declarations, public SDK workflows, process lifecycle, and operational filesystem effects. Extend an existing scenario or add a focused example instead of a parallel consumer runner or smoke suite.
- Keep linting, formatting, type-checking, and established static validators separate from behavioral tests. Packaging and publication commands retain their own validation contracts under [verification boundaries](./verification-boundaries.md); they do not justify a parallel consumer test suite.
- For JS/TS/Bun helper tests, prefer Mocha plus built-in `node:` assertion and filesystem helpers. Vue component tests use [Vue Author's Vitest and Vue Test Utils defaults](../skills/vue-author/SKILL.md#testing); existing pure-helper tests need not migrate.
- Add `c8` only when coverage reporting or enforcement is actually needed.
- Prefer a `test/` directory inside the nearest scope that owns the implementation.
- Keep each scoped `test/` directory flat by default, including its specs, fixtures, fakes, and support code.
- For helper modules such as `feature/utils/x.ts`, prefer matching specs such as `feature/test/x.spec.ts`.
- Use a repository-root `test/` directory only for root-owned code or intentionally cross-scope coverage.
- Use the module-under-test path without file extension as the `describe` value, relative to the repo root or nearest source root.
- Start Mocha test names with `should` so each test reads as an expected behavior.
- For JS/TS/Bun unit-test workflows that validate developer-machine code, CLIs, or plugin tooling, prefer an Ubuntu plus current macOS runner matrix.
- Omit Windows runners unless the user or repository policy explicitly identifies Windows CI as a maintained surface; a PowerShell script, wrapper, or template alone is not sufficient evidence.
- When Windows CI is explicitly required, use a supported versioned runner label selected for that repository and never `windows-latest`.

### Test Runtimes

- Select [runtime setup actions](../skills/github-workflow-author/SKILL.md#preferred-tools) by what each job executes: `setup-bun` for development checks; add `setup-node` for Node consumers or Node-only tooling. A Bun harness testing a Node CLI needs both, using project-declared versions.
- Before adding a runtime installer, inspect the selected actions' setup guarantees. Reuse a compatible runtime they already provide; an npm operation or Node-based action does not by itself require another caller-owned `setup-node` step.
- Make the tool runtime explicit in package scripts, for example `bun ./node_modules/mocha/bin/mocha.js`. `bun run` alone can honor a tool's Node shebang. [Bun's `--bun` override](https://bun.com/docs/runtime/bunfig#run-bun-auto-alias-node-to-bun) also redirects child `node` commands, so keep it and equivalent configuration out of Node compatibility checks.
- Exercise the prepared or packed artifact under its declared runtime: the installed CLI through its executable entrypoint, and public library exports through the promised `import`/`require` paths. A Bun-hosted check may launch real Node subprocesses; its own runtime does not prove the consumer's runtime.
- Keep compatibility checks focused on the package contract and supported runtime boundary. Do not repeat the full development suite across runtimes or add post-publish registry probes without a distinct gap to cover.

## Operational Scenario Testing

- Use Leia-backed markdown scenarios when the main risk is end-to-end operational behavior, machine mutation, CLI contract, file layout, permissions, or log output.
- Use Leia for shell, bootstrap, or other operational surfaces that are better expressed as executable scenarios than as unit tests.
- Use direct command assertions when behavior is deterministic. Use a strict mock when the agent/tool loop matters but model judgment does not; reserve live models for interpretation or provider/native behavior that a mock cannot establish. Keep model selection in the owning runtime or repository configuration.
- Treat machine-mutating Leia suites as CI-first coverage rather than a normal local-default test path.
- Apply [Leia's artifact testing policy](./leia-markdown-scenarios.md#real-product-execution): exercise the candidate tarball or standalone executable through its consumer interface, with no checkout-source fallback. Select the declared consumer runtime through [Test Runtimes](#test-runtimes).

## Shell and Scripting Exceptions

- Prefer Bash, POSIX shell, or PowerShell only when shell is the actual maintained surface, distribution surface, or the clearer tool for the job.
- Use shell for wrappers, bootstrap flows, or native shell automation when that surface is primary.
- Do not choose shell for non-shell application logic just to avoid JavaScript.
- When shell wrappers invoke repo-authored JavaScript or TypeScript helpers, prefer Bun-backed entrypoints over calling `node` directly.

## GitHub Actions

- Prefer Bun-first workflow wiring when a repository's runtime surface is JavaScript or TypeScript.
- Select [Tanaab Actions runtime setup](../skills/github-workflow-author/SKILL.md#preferred-tools) through [Test Runtimes](#test-runtimes), using project declarations and the correct package directory; retain direct upstream actions when required inputs or runners are unsupported.
- Keep dependency installation, package caching, lint, and tests caller-owned. Runtime installers do not replace those steps.
- Prefer one workflow file per independent pull-request gate when checks differ in command surface, runner or matrix, failure ownership, or required-check identity.
- For JS/TS/Bun repos with both surfaces, use `.github/workflows/pr-linter.yml` for lint, format, type-check, and repo-specific static validation, and `.github/workflows/pr-unit-tests.yml` for unit tests and their operating-system matrix.
- Use `.github/workflows/pr-examples-tests.yml` for Leia-backed consumer scenarios, `.github/workflows/pr-component-tests.yml` for Vue component behavior, `.github/workflows/pr-build-checks.yml` for frontend lint and builds, and `.github/workflows/release.yml` for a canonical release-published deployment lifecycle.
- Add separate files such as `pr-options-tests.yml` or `pr-sync-tests.yml` when those surfaces need independent runners, permissions, ownership, or status checks.
- Combine gates only when they are operationally inseparable and share the same runner, matrix, ownership, and status identity; do not consolidate independent lint and unit-test gates merely to reduce file count.
- For Bun-backed actions authored in JavaScript or TypeScript, prefer composite wrappers that install Bun and invoke a stable built JavaScript runtime artifact such as `dist/index.js`.
- Keep the action contract in `README.md` when the repository's primary product is a GitHub Action.

## Documentation Surface Defaults

- Apply [Documentation Standards](./documentation-standards.md) before selecting or expanding any documentation surface; these placement defaults do not require new content.

- Prefer a full `README.md` by default when one durable file can realistically carry the repo's user-facing contract.
- Prefer a companion-guides README when the common path belongs in `README.md` but one or two linear root-level references keep advanced or topical material focused.
- Prefer the GitHub Action README shape when the repository's primary product is a GitHub Action.
- Require an explicit VitePress review when a repository reaches `README.md`, `ADVANCED.md`, and three or more topical guides, or earlier when navigation, search, versioning, or multiple independent journeys are needed.
- Keep the README as a strong entrypoint even when the repo later grows a docs site.

## Baseline Repo Signals

- Prefer `packageManager` in `package.json` and a committed `bun.lock` for Bun-managed repos.
- Prefer `.bun-version` when the repo uses the shared Bun version-file convention.
- Prefer `.tool-versions` only when the repo already tracks local tool versions there.
- Prefer kebab-case for repo-authored filenames unless the ecosystem requires a fixed conventional name.

## Pairing

- Pair this reference with [release-destinations.md](./release-destinations.md) when deciding whether a package is npm-published, registry-delivered, or private in support of another release artifact.
- Pair this reference with [javascript-repo-structure.md](./javascript-repo-structure.md) for JS/TS/Bun code layout and hoisting decisions.
- Pair it with [javascript-function-data-flow.md](./javascript-function-data-flow.md) when the task is about JavaScript or TypeScript helper shape, mutation discipline, type flow, or import grouping.
- Pair it with [readme-standards.md](./readme-standards.md) when the task is about repository README mode or docs-wrapper decisions.
- Pair it with [front-end-preferences.md](./front-end-preferences.md) when the task is specifically frontend- or VitePress-led.
- Pair it with the relevant surface-specific canon when the repo is frontend-, docs-, workflow-, shell-, or release-led.
