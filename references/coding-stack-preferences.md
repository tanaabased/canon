# Coding Stack Preferences

Use this reference for default runtime, framework, and tooling choices in Tanaab-managed coding repos.

- This is a default stack, not a claim that every repo should force every tool.
- Prefer one consistent stack unless the repository's actual surface or external contract clearly justifies an exception.
- Keep this file focused on stable defaults and exception boundaries, not step-by-step implementation recipes.
- Future live coding skills should cite this file instead of re-copying stack choices into each skill.

## Default Runtime

- Prefer ESM JavaScript or TypeScript on Bun for repositories that have meaningful JS/TS tooling, CLI, docs, frontend, or automation surfaces.
- Prefer Bun as both the runtime and package manager for those repositories.
- Use `node:` built-in modules when Bun provides Node-compatible support.
- Do not introduce Bun into a repository that has no meaningful JavaScript or TypeScript surface just to satisfy stack consistency.

## npm Package Identity

- Use `@tanaab` as the canonical npm scope for every Tanaab-owned package, including libraries, CLIs, workspaces, npm-published GitHub Actions, and npm-distributed Codex or OpenClaw plugins.
- Put that identity in `package.json#name` and use `@tanaab/<package>` consistently in internal dependency declarations, package-manager configuration, publish automation, and package examples.
- Treat `@tanaabased/*` as a noncanonical npm identity. Keep GitHub repositories and their metadata under `github.com/tanaabased`; the GitHub organization name does not define the npm scope.
- Keep platform-native plugin identifiers separate from npm package identity. For example, an npm-distributed plugin may use `@tanaab/openclaw-devguard` in `package.json` while its `openclaw.plugin.json#id` remains `devguard`; Codex plugin manifest names likewise follow the Codex contract.
- Preserve third-party scopes such as `@types`, `@actions`, and `@eslint`; the Tanaab scope rule applies only to Tanaab-owned package identities.
- Treat lockfiles as generated projections of package manifests. Change the owning manifests first, then refresh and validate their lockfiles with the package manager; never treat a lockfile-only identity edit as the source of truth.

## npm Package Publishing

- For a single publishable JS, TS, or Bun package, prefer a `.github/workflows/release.yml` workflow triggered by `release.published`; let JavaScript Author own the surface-local package lifecycle and use GitHub Workflow Author when the workflow graph itself is the primary artifact.
- Prefer npm trusted publishing from a GitHub-hosted runner. Configure the npm trusted publisher for the exact GitHub organization, repository, and workflow filename; install Node 24 plus an npm CLI version at or above `11.5.1`; grant `id-token: write`; and publish with the npm CLI even when Bun remains the repo runtime and package manager.
- Grant `contents: write` only when the release lifecycle syncs version, changelog, or generated artifacts back to the repository. Prefer the workflow's GitHub token for ordinary sync and use a separate credential only when branch protection or another repository rule requires it.
- Publish stable releases to npm's default `latest` tag and prereleases to `edge`. Because npm trusted publishing does not authorize `npm dist-tag`, moving `edge` to a stable version requires a separately scoped granular npm token; isolate that token to the dist-tag step and omit the step when the alias is unnecessary.
- Build only when the npm package ships generated output. Format command-owned release mutations before they are synced, then run format validation and an npm pack or publish dry run against the final prepared package before live publication; surface any release tool that cannot validate its own mutations before sync as a tooling limitation.
- Do not add `--provenance` solely for public-package trusted publishing; npm supplies provenance for that supported path.

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

- Prefer focused unit tests for pure or mostly pure JavaScript or TypeScript helpers and modules.
- For JS/TS/Bun repos, prefer Mocha plus built-in `node:` assertion and filesystem helpers before reaching for heavier test libraries.
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

## Operational Scenario Testing

- Prefer Leia-backed markdown scenarios when the main risk is end-to-end operational behavior, machine mutation, CLI contract, file layout, permissions, or log output.
- Use Leia for shell, bootstrap, or other operational surfaces that are better expressed as executable scenarios than as unit tests.
- Treat machine-mutating Leia suites as CI-first coverage rather than a normal local-default test path.
- When a prepared `dist/` artifact is the real shipped surface, run operational scenario tests against that prepared artifact instead of raw source files.
- For shipped Bun CLIs, prefer a build-first distribution path and treat the built CLI artifact as the Leia validation target when that artifact is the real user-facing surface.

## Shell and Scripting Exceptions

- Prefer Bash, POSIX shell, or PowerShell only when shell is the actual maintained surface, distribution surface, or the clearer tool for the job.
- Use shell for wrappers, bootstrap flows, or native shell automation when that surface is primary.
- Do not choose shell for non-shell application logic just to avoid JavaScript.
- When shell wrappers invoke repo-authored JavaScript or TypeScript helpers, prefer Bun-backed entrypoints over calling `node` directly.

## GitHub Actions

- Prefer Bun-first workflow wiring when a repository's runtime surface is JavaScript or TypeScript.
- Replace `actions/setup-node` with `oven-sh/setup-bun` when migrating a workflow to Bun.
- Retain `actions/setup-node` alongside Bun when npm trusted publishing needs the supported Node and npm CLI path.
- Prefer `bun-version-file: .bun-version` over repeated Bun version literals in workflow jobs.
- Prefer one workflow file per independent pull-request gate when checks differ in command surface, runner or matrix, failure ownership, or required-check identity.
- For JS/TS/Bun repos with both surfaces, use `.github/workflows/pr-linter.yml` for lint, format, type-check, and repo-specific static validation, and `.github/workflows/pr-unit-tests.yml` for unit tests and their operating-system matrix.
- Use `.github/workflows/pr-examples-tests.yml` for Leia-backed CLI scenarios, `.github/workflows/pr-build-checks.yml` for the shared frontend lint-and-build path, and `.github/workflows/release.yml` for a canonical release-published deployment lifecycle.
- Add separate files such as `pr-options-tests.yml` or `pr-sync-tests.yml` when those surfaces need independent runners, permissions, ownership, or status checks.
- Combine gates only when they are operationally inseparable and share the same runner, matrix, ownership, and status identity; do not consolidate independent lint and unit-test gates merely to reduce file count.
- For Bun-backed actions authored in JavaScript or TypeScript, prefer composite wrappers that install Bun and invoke a stable built JavaScript runtime artifact such as `dist/index.js`.
- Keep the action contract in `README.md` when the repository's primary product is a GitHub Action.

## Documentation Surface Defaults

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
