---
name: tanaab-javascript-author
description: Tanaab-based JavaScript, TypeScript, and Bun implementation and npm package deployment work. Use when a user wants to modify JS or TS code or standardize npm publication in a Tanaab-managed repo.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - javascript
    - typescript
  openclaw:
    emoji: '🟨'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/javascript-author
---

# JavaScript and TypeScript Author

## Overview

Tanaab-based JavaScript, TypeScript, and Bun implementation and npm package deployment work. Use when a user wants to modify JS or TS code or standardize npm publication in a Tanaab-managed repo.

- Keep the broad JavaScript and TypeScript entrypoint for discovery, including library-shaped modules as well as helper extraction.
- Keep public `bin/` and internal `scripts/` entrypoints thin over surface-specific `lib/` modules and lower-coupling `utils/` units.
- Keep independently testable function-shaped logic in `utils/` when that decomposition is honest, even when the vocabulary remains local to the owning scope.

## When to Use

- Modify JavaScript or TypeScript source, Bun runtime plumbing, or ESM module shape when the task is primarily JS- or TS-led.
- Shape library-facing JavaScript or TypeScript modules where a focused `lib/` class or module wraps reusable utility logic.
- Write, refactor, or extract low-coupling utility functions, especially single-file ESM helpers under `utils/` or another narrow code scope.
- Organize a code-bearing skill, package, app, or plugin beneath its nearest owning scope rather than defaulting files to the repository root.
- Implement workspace package APIs or aggregate-package re-exports when the task is primarily about JavaScript or TypeScript behavior rather than monorepo baseline normalization.
- Update `package.json`, `packageManager`, `engines`, `main`, or `exports` when those changes directly support the owned JS or TS surface.
- Migrate repo-owned JS tooling from Node or npm assumptions toward Bun when the repo actually has meaningful JS surfaces.
- Change JS or TS bundling or artifact generation when the main owned surface still remains general implementation work.
- Add or standardize the default npm package deployment lifecycle for a publishable JavaScript, TypeScript, or Bun package.

## When Not to Use

- Do not use this skill for true package-level CLI product work; reserve that for the narrower CLI surface.
- Do not use this skill for independent GitHub Actions topology or general workflow authoring beyond the canonical JS validation and npm package deployment lifecycles; hand graph-led trigger, permission, job, matrix, or reusable-workflow changes to GitHub Workflow Author.
- Do not use this skill for GitHub Action product-surface work once that narrower skill exists.
- Do not widen this skill into broad testing strategy, operational scenario design, release systems unrelated to npm package publication, or broader operational deployment.
- Do not treat ordinary JavaScript cleanup as permission to migrate to TypeScript. Preserve the scope's current language unless the repo or user selects TypeScript.

## Constraints

- Prefer the smallest change that solves the task.
- Prefer one main exported function, one utility file, and one focused spec when a helper can be expressed that way honestly.
- Do not force `utils/` extraction when the logic is tightly coupled to surface vocabulary, orchestration, or state.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- First identify the nearest owning scope, then place public commands in `bin/`, internal machine- or agent-facing commands in `scripts/`, orchestration in `lib/`, unit-shaped functions in `utils/`, and owned tests in `test/`.
- Default the implementation path toward lower-coupling functions and directly tested `utils/` units.
- For library-shaped code, keep the `lib/` class or module focused on orchestration, state, and surface-specific wrapping while extracting testable function logic into utilities when the split is honest.
- Keep repo-coupled orchestration and surface vocabulary near the owning module instead of forcing them into `utils/`.
- In a workspace repo, treat each package as an owning scope, consume sibling packages through declared dependencies and public exports, and avoid relative imports into another package's private implementation.
- Keep aggregate packages thin: depend on leaf workspaces and re-export their public APIs instead of copying their utility implementations.
- Treat broader package, module, and Bun-runtime edits as support work for the owned JS or TS surface instead of the default authored pattern.
- Apply [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) when repo layout or helper extraction is in scope.
- Apply [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md) when function shape, mutation discipline, or import grouping changes.
- Apply [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) when public contracts, API docs, or inline comments change.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for Bun-first, incremental TypeScript, npm package identity, and publishing defaults instead of re-deciding them locally.

## Workflow

1. Confirm the request is primarily JS- or TS-runtime-led or uses the canonical npm package deployment lifecycle rather than being CLI-, workflow-graph-, or broader release-system-led.
2. Load only the relevant JavaScript or TypeScript files, or the package manifest and release workflow for npm deployment, plus the shared references that directly shape the change.
3. Prefer thin library wrappers and function-shaped extraction when the task allows that decomposition honestly.
4. Keep any required package, module, or artifact edits coherent with that owned JS or TS surface.
5. Validate the changed JS or TS surface with the repo's narrowest reliable checks, including the repo's type-check command when TypeScript changed.

## Documentation

- Use [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) when public contracts, API docs, or inline comments change.
- Prefer JSDoc in JavaScript and contract-focused documentation in TypeScript for exported helpers, public wrappers, side effects, failure behavior, and non-obvious invariants when the code alone does not make the contract clear.
- Keep inline comments sparse and focused on surprising runtime behavior, mutation boundaries, integration assumptions, or failure modes.
- Do not add comments that merely restate names, obvious control flow, or local implementation details.

## Testing

- Prefer focused Mocha tests for extracted utility logic, especially pure or mostly pure helpers and modules.
- Test thin wrappers or classes directly when they own meaningful orchestration, state, or boundary behavior.
- Keep test files narrow and inside the nearest owning scope, such as `feature/test/normalize-tags.spec.ts` for `feature/utils/normalize-tags.ts`.
- Keep the scoped `test/` directory flat by default, including specs, fixtures, fakes, and support code; use descriptive filenames instead of mirrored source-role folders.
- Use a repository-root `test/` directory only for root-owned code or intentionally cross-scope coverage.
- In a workspace repo, keep ordinary tests with their package and reserve root tests for intentional cross-package behavior.
- Use the module-under-test path without file extension as the `describe` value, relative to the repo root or nearest source root.
- Start Mocha test names with `should` so the spec reads as behavior rather than implementation narration.
- Utility-first tests are preferred because they reduce coupling and fixture/setup churn.
- Add `c8` only when coverage reporting or enforcement is explicitly part of the task.
- Do not merge GitHub Action input-helper testing into this skill's default path; keep that with the narrower GitHub Action surface.
- Match assertion strictness to contract strength: keep public, protocol, schema, and safety contracts exact, but avoid making incidental prose, ordering, timing, or third-party formatting contractual.
- Keep complete message-format assertions with the formatter that owns them; callers should assert semantic context or structured failure identity.
- Derive real version expectations from canonical package metadata and use synthetic versions for fixtures.
- Prefer injected clocks and boundaries in unit tests; place genuine filesystem, process, network, or platform timing in explicitly invoked integration checks.
- Apply [the function-test contract durability guidance](./references/javascript-function-tests.md#contract-durability) when choosing assertion strength or testing a runtime boundary.

Minimal generic example:

```js
import assert from 'node:assert/strict';

import normalizeTags from '../utils/normalize-tags.js';

describe('feature/utils/normalize-tags', () => {
  it('should drop empty values and lowercase tags', () => {
    assert.deepEqual(normalizeTags([' Docs ', '', null, 'API']), ['docs', 'api']);
  });
});
```

## Deployment

- Canonical mechanism: for a single publishable JS, TS, or Bun package, use `.github/workflows/release.yml` on `release.published`, prepare the package with `tanaabased/prepare-release-action@v1`, and publish with the npm CLI through npm trusted publishing.
- Configure npm's trusted publisher for the exact GitHub organization, repository, and workflow filename. Use a GitHub-hosted Ubuntu runner, Node 24, npm `>=11.5.1`, and `id-token: write`; keep Bun as the runtime and package manager, but do not substitute `bun publish` for the documented npm OIDC path.
- Grant `contents: write` only because the canonical lifecycle syncs release-time version or changelog mutations. Prefer `${{ github.token }}` for ordinary sync; use a separate repository credential only when branch protection or another repo rule requires it.
- Run lint and tests before preparation. Build after version stamping only when `package.json#files`, `main`, `bin`, or `exports` points at generated output; a docs-site `build` script alone is not evidence that the npm package needs a release build.
- Put formatter writes after command-owned stamping or artifact generation and before `prepare-release-action` syncs those mutations. With `prepare-release-action@v1`, `commands` run before the action's own package and changelog mutations, so also run `format:check` afterward and do not claim the action exposes a post-mutation, pre-sync hook.
- Run an npm publish dry run against the prepared package before live publication. Publish stable releases to `latest` and prereleases to `edge`.
- Keep trusted publication tokenless. If stable releases must also move `edge`, isolate a granular npm token to the separate `npm dist-tag` step; remove that step when the alias is unnecessary.
- Minimal example: [./templates/bun-npm-package-release-workflow.yml](./templates/bun-npm-package-release-workflow.yml)

## GitHub Actions

Use this section as a reference map from the owned testing and deployment lifecycles to their GitHub Actions projections. Keep the lifecycle rules in their owning sections and independent workflow topology with GitHub Workflow Author.

### Pull Request Validation

- For unit tests, apply `## Testing` through the canonical `.github/workflows/pr-unit-tests.yml` path using [the Bun unit-test workflow template](./templates/bun-unit-tests-workflow.yml).
- Keep lint, format, and applicable type-checking in the canonical `.github/workflows/pr-linter.yml` path owned by Repo Standardizer; use [its GitHub Actions guidance](../javascript-repo-standardizer/SKILL.md#github-actions) and [linter workflow template](../javascript-repo-standardizer/templates/bun-pr-linter-workflow.yml).
- For developer-machine code, CLIs, and plugin tooling, prefer the template's Ubuntu plus current macOS runner matrix.
- Omit Windows runners unless the user or repository policy explicitly identifies Windows CI as a maintained surface; when required, use a supported versioned runner label and never `windows-latest`.

### Release Publication

- When `## Deployment` applies, use that lifecycle and its linked npm release workflow template at the canonical `.github/workflows/release.yml` path rather than repeating authentication, build, formatting, or channel rules here.
- Hand independent trigger, permission, job, matrix, reusable-workflow, or gate-placement changes to GitHub Workflow Author.

## Optimization

- **Inspect:** Inventory owning scopes, entrypoints, orchestration libraries, utilities, type boundaries, imports, documentation, tests, CI, and npm package deployment wiring; identify independently testable function logic embedded in entrypoints or larger libraries.
- **Compare:** Reconcile behavior, types, documentation, tests, CI, and package publication; evaluate entrypoint thinness, `lib/` and `utils/` boundaries, duplicated logic, overloaded modules, misplaced code, dead paths, direct-test coverage, flat source-to-test locality, publish artifacts, authentication, and release channels against the full canon.
- **Recommend:** Keep cohesive stateful orchestration in `lib/`; deduplicate or consolidate repeated logic; split overloaded owners; extract honestly separable one-function utilities with narrow specs; move misplaced code; tighten boundaries; and remove proven dead code without forcing decomposition or style churn.
- **Apply:** After explicit authorization, perform the smallest coherent operations, update imports and callers, add or update focused flat tests, preserve the repository's chosen language and behavior, and avoid unrelated refactors.
- **Verify:** Run the narrowest relevant lint, type-check, build, tests, and smoke checks, then re-inspect the changed boundaries for remaining drift.

## Bundled Resources

- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first JavaScript and TypeScript runtime defaults
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for code-bearing surfaces
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): owning scopes plus `bin/`, `lib/`, `scripts/`, `utils/`, `test/`, and hoisting rules
- [../../references/javascript-function-data-flow.md](../../references/javascript-function-data-flow.md): function shape, mutation discipline, and import grouping
- [./references/javascript-function-tests.md](./references/javascript-function-tests.md): local direct-test defaults for helper-shaped JavaScript and TypeScript code
- [./templates/transform-unit.js](./templates/transform-unit.js): starter shape for pure or mostly pure transformation helpers
- [./templates/async-boundary-unit.js](./templates/async-boundary-unit.js): starter shape for narrow boundary-reading helpers
- [./templates/bun-unit-tests-workflow.yml](./templates/bun-unit-tests-workflow.yml): starter `.github/workflows/pr-unit-tests.yml` for the canonical direct-test path
- [./templates/bun-npm-package-release-workflow.yml](./templates/bun-npm-package-release-workflow.yml): starter `release.yml` for trusted npm publication from a Bun-managed package

## Validation

- Confirm the skill still reads as the broad JavaScript and TypeScript entrypoint while funneling implementation toward thin library wrappers and lower-coupling utility functions when the task allows it.
- Confirm public and internal entrypoints are thin, orchestration stays in `lib/`, and independently testable function logic moves to scoped `utils/` without creating a `classes/` bucket.
- Confirm tests remain flat within their owning scope and are hoisted only with their implementation or for intentional cross-scope coverage.
- Confirm workspace packages use declared package boundaries, aggregate packages stay thin, and no package reaches into a sibling's private source paths.
- Confirm ESM and Bun defaults were preserved unless the repo or task explicitly requires another path.
- Confirm public contracts, API docs, and inline comments follow [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) when documentation changed.
- Confirm direct tests prioritize independently testable utility logic and do not absorb GitHub Action input-helper patterns.
- Confirm `GitHub Actions` maps pull-request validation to `Testing`, linting to Repo Standardizer, and release publication to `Deployment` without duplicating their doctrine or absorbing independent workflow-topology ownership.
- Confirm any npm deployment uses the canonical release-published lifecycle, `@tanaab` package identity, npm trusted publishing, conditional package builds, post-stamping format validation, an npm dry run, and the `latest` or `edge` channel contract.
- Confirm npm publication receives no long-lived npm token and that any granular npm credential is isolated to an explicitly retained dist-tag step.
- Run the repo's narrowest relevant lint, type-check, build, test, or smoke checks for the touched JS or TS surface.
- Confirm the change did not widen into CLI product, independent workflow-graph work, non-npm release systems, or broader operational deployment.
