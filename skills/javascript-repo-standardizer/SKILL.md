---
name: tanaab-javascript-repo-standardizer
description: Tanaab-based standardization of JavaScript, TypeScript, and Bun repo baselines. Use when a user wants to align repo structure, Bun workspaces, lint and format defaults, type-checking, or baseline scripts in a Tanaab-managed repo.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - javascript
    - typescript
    - monorepo
  openclaw:
    emoji: '📐'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/javascript-repo-standardizer
---

# JavaScript and TypeScript Repo Standardizer

## Overview

Tanaab-based standardization of JavaScript, TypeScript, and Bun repo baselines. Use when a user wants to align repo structure, Bun workspaces, lint and format defaults, type-checking, or baseline scripts in a Tanaab-managed repo.

- Keep this skill normalization-led rather than implementation-led.
- Use it to bring a JS/TS/Bun repo onto the shared baseline for owning scopes, `bin/`, `lib/`, `scripts/`, `utils/`, `test/`, linting, formatting, type-checking when applicable, and related baseline scripts while leaving runtime authorship to the broader implementation skill.

## When to Use

- Align a repo to the shared ESLint and standalone Prettier baseline.
- Normalize JavaScript and TypeScript repo structure around owning scopes plus public `bin/`, internal `scripts/`, orchestration `lib/`, unit-shaped `utils/`, and flat scope-local `test/` surfaces.
- Review test placement with the same ownership and hoisting rules as implementation code, using human or agent judgment rather than a structural validator.
- Normalize baseline scripts such as `lint:eslint`, `format:check`, `format:write`, and `lint`, plus a separate `typecheck` script when owned TypeScript source is present.
- Standardize Bun-first baseline package wiring when that work is part of repo normalization rather than feature implementation.
- Standardize a Bun workspace monorepo around a private coordinator root, package-local ownership, workspace dependencies, and root-filtered commands.
- Add or standardize the TypeScript baseline only when the repo owns TypeScript source, excluding generated output, vendored code, and documentation templates.
- Add or standardize the Vue lint layer only when the repo actually needs it.
- Apply the bundled baseline starter files when the task is specifically about bringing a repo onto the shared JS/TS/Bun baseline.
- Audit required config files, package scripts, development dependencies, Bun metadata, and the lockfile as concrete baseline signals; report every missing signal as drift.
- Add or refresh repo-local `AGENTS.md` lines when the repo wants the JS/TS/Bun baseline to be durable ambient policy.

## When Not to Use

- Do not use this skill for general JS runtime work, helper extraction, or library refactors where implementation behavior is the owned surface.
- Do not use this skill for one-off formatting-only requests that do not change the repo baseline.
- Do not use this skill for ordinary day-to-day code authorship just because repo structure is nearby.
- Do not widen this skill into full repo-template authoring.

## Constraints

- Prefer the smallest change that solves the task.
- Keep the work baseline-led: structure, lint, format, and baseline script normalization.
- Do not treat repo-structure normalization as permission for broad runtime refactors.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Use [./references/lint-format-baseline.md](./references/lint-format-baseline.md) as the local source of truth for the lint and format baseline.
- Use [./references/bun-workspace-baseline.md](./references/bun-workspace-baseline.md) when a repo contains multiple workspace packages or aggregate and leaf package surfaces.
- Use [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) when normalizing owning scopes, role folders, test placement, or hoisting decisions.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) for Bun-first baseline defaults rather than re-deciding the tool stack locally.
- Apply the bundled base files together when standardizing a repo, then add the complete TypeScript or Vue layer only when that layer is needed.

## Workflow

1. Confirm the request is specifically about JS/TS/Bun repo baseline standardization rather than implementation authorship.
2. Load the local lint baseline reference, the workspace baseline when applicable, and the shared repo-structure canon needed for the target repo surface.
3. Keep lint, format, type-check, and repo-structure ownership explicit while standardizing only the layers the repo actually needs.
4. Compare the target against the complete baseline checklist and report missing files, scripts, dependencies, or Bun metadata explicitly.
5. Validate the resulting repo baseline with the narrowest reliable local checks.

## Documentation

- Document durable repo baseline choices only when they affect future maintainers or future agents, such as repo-local `AGENTS.md`, README notes, package scripts, config comments, or template comments.
- Prefer short repo-local policy notes over broad documentation rewrites when standardizing lint, format, script, or folder baselines.
- Keep config comments sparse and limited to non-obvious extension points, generated-file exclusions, or project-specific deviations from the shared baseline.
- Document an explicit version and tag strategy before a workspace repo grows multi-package release automation.
- Do not turn baseline standardization into README authoring, docs-site migration, or general implementation documentation.

## Testing

- Treat direct lint, format, and applicable type-check commands as the canonical validation mechanism for this surface.
- When repo structure changed, inspect owning scopes, role folders, flat source-to-test locality, entrypoints, and baseline files instead of widening into runtime smoke tests.
- For a workspace repo, inspect package manifests, declared workspace dependencies, exports, package contents, and root command delegation without publishing anything.
- Keep the validation path explicit: ESLint for lint rules, Prettier for format checks, `lint` only when it intentionally composes those commands, and `typecheck` as a separate TypeScript command.
- Do not add unrelated smoke or scenario layers unless the task clearly expands beyond repo baseline standardization.

Minimal generic example:

```bash
bun run lint
test -f eslint.config.js
test -f prettier.config.js
```

For a repo with owned TypeScript source, also run `bun run typecheck`.

## GitHub Actions Workflow

- Use a Bun-first GitHub Actions workflow that installs dependencies once and runs the repo's lint and format checks.
- Keep the workflow generic and centered on the repo baseline scripts rather than inventing repo-specific CI topology in the skill.
- Add a separate `bun run typecheck` step when the repo owns TypeScript source.
- Treat this as validation of the repo baseline, not ownership of general workflow authoring.

Minimal generic example:

```yaml
name: Lint

on:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - run: bun install --frozen-lockfile --ignore-scripts
      - run: bun run lint
```

## Optimization

- **Inspect:** Inventory manifests, config files, dev dependencies, scripts, Bun metadata, lockfiles, workspaces, owned TypeScript or Vue surfaces, and scope-local test placement.
- **Compare:** Evaluate the repository against the baseline and its conditional TypeScript, Vue, and workspace layers, reporting each missing or divergent managed surface exactly.
- **Recommend:** Prioritize coherent baseline corrections without turning standardization into a runtime-code refactor or overriding justified framework conventions.
- **Apply:** After explicit authorization, make the smallest complete baseline change while preserving the chosen language, framework, workspace, and documented local exceptions.
- **Verify:** Run the applicable frozen install, lint, format, type-check, tests, build, and package dry-run checks, then report remaining conditional drift.

## Bundled Resources

- [./references/lint-format-baseline.md](./references/lint-format-baseline.md): local baseline rules and expected script shape
- [./references/bun-workspace-baseline.md](./references/bun-workspace-baseline.md): private-root, package-boundary, aggregate-package, and filtered-command guidance for Bun workspaces
- [./references/repo-agents-lines.md](./references/repo-agents-lines.md): optional copyable repo `AGENTS.md` lines for durable JS/TS/Bun baseline policy
- [./templates/eslint.config.js](./templates/eslint.config.js): shared JS/TS/Bun ESLint base
- [./templates/prettier.config.js](./templates/prettier.config.js): shared standalone Prettier config
- [./templates/.prettierignore](./templates/.prettierignore): shared Prettier ignore baseline
- [./templates/tsconfig.json](./templates/tsconfig.json): conditional Bun-compatible TypeScript baseline
- [./templates/snippets/typescript-eslint-layer.js](./templates/snippets/typescript-eslint-layer.js): optional TypeScript layer
- [./templates/snippets/vue-eslint-layer.js](./templates/snippets/vue-eslint-layer.js): optional Vue layer
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): shared owning-scope, `bin/`, `lib/`, `scripts/`, `utils/`, `test/`, and hoisting rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shared linting and formatting defaults

## Validation

- Confirm the task stayed on repo baseline standardization rather than drifting into general JS or TS runtime work or implementation refactors.
- Confirm repo-structure normalization followed [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md), including flat scope-local tests and equal hoisting rules for source and tests, without turning this skill into general code authorship.
- Confirm ESLint and Prettier ownership remain separate.
- Confirm durable baseline documentation stayed limited to repo policy notes, package scripts, config comments, or README notes that directly explain the standardized baseline.
- Confirm the repo exposes the expected lint and format scripts unless an explicit repo-local reason overrides them.
- Confirm `packageManager`, `.bun-version`, and the committed `bun.lock` are present in Bun-managed repositories.
- Confirm all dependencies imported by the selected ESLint and Prettier layers are declared as development dependencies.
- Confirm repositories with owned TypeScript source expose `tsconfig.json`, `typecheck`, the TypeScript ESLint layer, TypeScript-capable test discovery, and the required development dependencies.
- Confirm Bun workspace roots are private, use one lockfile, treat each package as an owning scope, and keep cross-package imports on declared package exports.
- Confirm aggregate packages re-export leaf packages through declared workspace dependencies instead of duplicating or reaching into leaf implementations.
- Confirm package inspection uses pack or publish dry runs and that repo standardization performs no live package publication.
- Confirm direct validation stays on lint, format, and targeted baseline inspection instead of drifting into unrelated smoke or scenario mechanisms.
- Confirm any GitHub Actions workflow example remains a repo-baseline validation path rather than a general workflow-topology pattern.
- Run the narrowest repo-native lint, format, or baseline checks available for the touched surface.
