# Coding Stack Preferences

Use this reference for default runtime, framework, and tooling choices in Tanaab-managed coding repos.

- This is a default stack, not a claim that every repo should force every tool.
- Prefer one consistent stack unless the repository's actual surface or external contract clearly justifies an exception.
- Keep this file focused on stable defaults and exception boundaries, not step-by-step implementation recipes.
- Future live coding skills should cite this file instead of re-copying stack choices into each skill.

## Default Runtime

- Prefer ESM JavaScript on Bun for repositories that have meaningful JavaScript or TypeScript tooling, CLI, docs, frontend, or automation surfaces.
- Prefer Bun as both the runtime and package manager for those repositories.
- Use `node:` built-in modules when Bun provides Node-compatible support.
- Do not introduce Bun into a repository that has no meaningful JavaScript or TypeScript surface just to satisfy stack consistency.

## TypeScript

- Do not default to TypeScript.
- Prefer JavaScript first unless the repository already uses TypeScript, an external contract requires it, or the build and release path is already standardized well enough to justify the extra layer.
- Treat TypeScript migration as an explicit follow-on decision rather than automatic cleanup.

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

- Prefer focused unit tests for pure or mostly pure JavaScript helpers and modules.
- For JS/Bun repos, prefer Mocha plus built-in `node:` assertion and filesystem helpers before reaching for heavier test libraries.
- Add `c8` only when coverage reporting or enforcement is actually needed.
- Prefer a top-level `test/` directory for this style of unit coverage.
- For helper modules such as `utils/x.js`, prefer matching specs such as `test/x.spec.js`.

## Operational Scenario Testing

- Prefer Leia-backed markdown scenarios when the main risk is end-to-end operational behavior, machine mutation, CLI contract, file layout, permissions, or log output.
- Use Leia for shell, bootstrap, hosted-script, or other operational surfaces that are better expressed as executable scenarios than as unit tests.
- Treat machine-mutating Leia suites as CI-first coverage rather than a normal local-default test path.
- When a prepared `dist/` artifact is the real shipped surface, run operational scenario tests against that prepared artifact instead of raw source files.

## Shell and Scripting Exceptions

- Prefer Bash, POSIX shell, or PowerShell only when shell is the actual maintained surface, distribution surface, or the clearer tool for the job.
- Use shell for wrappers, bootstrap flows, hosted scripts, or native shell automation when that surface is primary.
- Do not choose shell for non-shell application logic just to avoid JavaScript.
- When shell wrappers invoke repo-authored JavaScript helpers, prefer Bun-backed entrypoints over calling `node` directly.

## GitHub Actions

- Prefer Bun-first workflow wiring when a repository's runtime surface is JavaScript.
- Replace `actions/setup-node` with `oven-sh/setup-bun` when migrating a workflow to Bun.
- Prefer `bun-version-file: .bun-version` over repeated Bun version literals in workflow jobs.
- For Bun-backed JavaScript actions, prefer composite wrappers that install Bun and invoke a stable built runtime artifact such as `dist/index.js`.
- Keep the action contract in `README.md` when the repository's primary product is a GitHub Action.

## Documentation Surface Defaults

- Prefer a full `README.md` by default when one durable file can realistically carry the repo's user-facing contract.
- Prefer the GitHub Action README shape when the repository's primary product is a GitHub Action.
- Escalate to a VitePress docs-wrapper README only when the repository clearly needs multiple durable guides, deeper reference pages, or multiple user journeys.
- Keep the README as a strong entrypoint even when the repo later grows a docs site.

## Baseline Repo Signals

- Prefer `packageManager` in `package.json` and a committed `bun.lock` for Bun-managed repos.
- Prefer `.bun-version` when the repo uses the shared Bun version-file convention.
- Prefer `.tool-versions` only when the repo already tracks local tool versions there.
- Prefer kebab-case for repo-authored filenames unless the ecosystem requires a fixed conventional name.

## Pairing

- Pair this reference with [javascript-repo-structure.md](./javascript-repo-structure.md) for JS/Bun code layout and hoisting decisions.
- Pair it with [javascript-function-data-flow.md](./javascript-function-data-flow.md) when the task is about JS helper shape, mutation discipline, or import grouping.
- Pair it with [readme-standards.md](./readme-standards.md) when the task is about repository README mode or docs-wrapper decisions.
- Pair it with [front-end-preferences.md](./front-end-preferences.md) when the task is specifically frontend- or VitePress-led.
- Pair it with the relevant surface-specific canon when the repo is frontend-, docs-, workflow-, shell-, or release-led.
