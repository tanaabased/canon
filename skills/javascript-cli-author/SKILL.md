---
name: tanaab-javascript-cli-author
description: Tanaab-based authoring and standardization of true JavaScript or TypeScript Bun CLI product surfaces. Use when a user wants to build or update a package-level Bun CLI entrypoint, CLI parser, help output, version surface, or CLI packaging contract.
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
    emoji: '⌨️'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/javascript-cli-author
---

# JavaScript and TypeScript CLI Author

## Overview

Tanaab-based authoring and standardization of true JavaScript or TypeScript Bun CLI product surfaces. Use when a user wants to build or update a package-level Bun CLI entrypoint, CLI parser, help output, version surface, or CLI packaging contract.

- Keep this skill on a package-level, user-facing Bun CLI product surface.
- Let `tanaab-shell-cli-author` own Bash or PowerShell CLI surfaces.

## When to Use

- Build or update a true package-level JavaScript or TypeScript Bun CLI entrypoint.
- Shape parser behavior, help output, version-reporting, env defaults, or CLI packaging contract.
- Standardize a Bun CLI around `bin/`, `#!/usr/bin/env bun`, `--help`, `--version`, and explicit option precedence.
- Apply or adapt the bundled Bun CLI starter when the repo needs a reusable package-level Bun CLI baseline.
- Add or refresh repo-local `AGENTS.md` lines when the repo wants Bun CLI product rules as durable ambient policy.

## When Not to Use

- Do not use this skill for internal skill, agent, automation, or maintainer commands under `scripts/`; those are not public CLI product surfaces even when they expose CLI-like arguments and help.
- Do not use this skill for Bash or PowerShell CLI entrypoints.
- Do not use this skill for general JS runtime work that is not really about the package-level CLI product surface.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.
- Keep true CLI entrypoints in `bin/` when package metadata is in scope.
- Keep shipped JavaScript or TypeScript Bun CLI entrypoints friendly to `bun build` when the built artifact is the real product surface.
- Omit the hashbang and treat the file as an ordinary script when it does not expose normal CLI behavior.

## Change Strategy

- Use [../../references/cli-style-rules.md](../../references/cli-style-rules.md) for help order, dimmed usage placeholders, dimmed displayed defaults, streams, colors, and `SCRIPT_VERSION` rules.
- Use [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) to keep the public `bin/` entrypoint distinct from internal `scripts/`, orchestration `lib/`, unit-shaped `utils/`, and scoped `test/` surfaces.
- Prefer static imports and avoid source-layout assumptions when the CLI is meant to ship as a `bun build` artifact.
- Preserve the existing source language unless the repo or user selects TypeScript; Bun may execute a `.ts` entrypoint directly, while shipped build artifacts should keep their declared JavaScript output contract.
- Use [./references/bun-cli-template.md](./references/bun-cli-template.md) and the bundled starter only when the repo actually needs a reusable Bun CLI baseline.

## Workflow

1. Confirm the request is primarily about a true Bun CLI product surface.
2. Load the CLI entrypoint plus only the shared and local canon needed for the touched help, parser, version, or packaging surface.
3. Keep the package-level CLI contract explicit: help, dimmed optional usage placeholders, dimmed displayed defaults, precedence, streams, version, and package entrypoint behavior.
4. Validate the final CLI with the narrowest reliable local checks for the touched surface, including type-checking when its source is TypeScript.

## Documentation

- Treat `--help`, `--version`, displayed defaults, and maintained examples as the CLI's primary user-facing documentation.
- Keep help output aligned with [../../references/cli-style-rules.md](../../references/cli-style-rules.md), including usage order, streams, color, optional placeholders, and displayed defaults.
- Use [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) only for sparse inline comments around non-obvious parser behavior, option precedence, environment handling, build-artifact assumptions, or shell/runtime edge cases.
- Keep README-backed Leia scenarios in `## Testing` unless a repo explicitly treats them as durable user-facing examples.
- Do not duplicate the full CLI contract in prose when help output and examples already expose it clearly.

## Testing

- Prefer Leia-backed example scenarios when the main risk is observable CLI behavior such as help output, exit status, file effects, or release-shaped entrypoint behavior.
- Keep one example flow per `examples/<scenario>/README.md` and assert the user-facing CLI contract rather than internal parser details.
- When the governing repository package is ESM and Leia writes its generated CommonJS `.js` harness beneath `examples/` through a repo-local `TMPDIR`, require `examples/package.json` with `"type": "commonjs"` using the shared starter. This applies even when the repository owns no example-local JavaScript helpers or fixtures.
- Do not require the examples-level package boundary when Leia's generated harness lives outside the ESM package scope or already inherits a nearer CommonJS boundary.
- Consider adding `examples/AGENTS.md` separately when the suite needs durable examples-local editing rules.
- Treat Leia as the canonical direct-test pattern for true CLI product surfaces rather than layering multiple unrelated local test styles by default.
- When the CLI ships as a built artifact, run Leia against the built CLI rather than the source entrypoint.

Minimal generic example:

```bash
# should print help output
my-cli --help | grep -F 'Usage: my-cli'

# should print a version string
test -n "$(my-cli --version)"
```

## GitHub Actions

- Apply `## Testing` through the canonical `.github/workflows/pr-examples-tests.yml` path using [the shared Leia PR examples workflow template](../../templates/leia-pr-examples-tests.yml) when the CLI needs CI-backed scenario coverage.
- Keep the workflow centered on preparing the built CLI artifact, placing it on `PATH`, and running one Leia README per matrix entry.
- Keep this as an automation projection of the package-level CLI test contract, not as general workflow-topology ownership.

## Optimization

- **Inspect:** Inventory the package entrypoint, parser, help, version, environment precedence, build output, packaging metadata, root package type, Leia `TMPDIR`, examples-level package boundary, scenarios, and observable CLI tests.
- **Compare:** Reconcile parser behavior, help, version, precedence, package metadata, examples, build output, and tests; identify duplicated option logic, overloaded entrypoints, misplaced internals, stale public claims, and an ESM package scope that captures Leia-generated CommonJS harnesses without a nearer CommonJS boundary.
- **Recommend:** Keep aligned behavior; require the shared `examples/package.json` boundary when a repo-local examples `TMPDIR` puts Leia's harness beneath an ESM root; avoid adding it when the harness is outside that scope; deduplicate or consolidate command contracts; extract parsers and renderers; split overloaded commands only when their public surfaces are distinct; move internal machinery out of the entrypoint; and tighten or remove stale API without widening into general cleanup.
- **Apply:** After explicit authorization, make the smallest coherent CLI operations and preserve documented command behavior and package boundaries.
- **Verify:** Build the entrypoint, smoke help and version output, confirm the conditional Leia package boundary, run Leia-backed scenarios, and type-check when the repository owns TypeScript.

## Bundled Resources

- [./references/bun-cli-template.md](./references/bun-cli-template.md): local notes for the bundled Bun CLI starter
- [./references/repo-agents-lines.md](./references/repo-agents-lines.md): optional copyable repo `AGENTS.md` lines for durable Bun CLI policy
- [./templates/bun-cli.js](./templates/bun-cli.js): reusable JavaScript starter for true Bun CLI entrypoints; preserve its contract when adapting it to TypeScript
- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI help, color, stream, and version rules
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for code-bearing surfaces
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): public `bin/`, internal `scripts/`, `lib/`, `utils/`, scoped `test/`, and hoisting rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first runtime defaults
- [../../references/leia-markdown-scenarios.md](../../references/leia-markdown-scenarios.md): shared Leia scenario rules for end-to-end CLI validation
- [../../templates/leia-pr-examples-tests.yml](../../templates/leia-pr-examples-tests.yml): shared Bootbox-style workflow starter for Leia-backed PR examples
- [../../templates/leia-markdown-example-readme.md](../../templates/leia-markdown-example-readme.md): shared starter README for one executable Leia scenario
- [../../templates/leia-examples-package.json](../../templates/leia-examples-package.json): shared `examples/package.json` boundary for repository-authored helpers and Leia-generated CommonJS harnesses beneath an ESM package scope
- [../../templates/leia-examples-agents.md](../../templates/leia-examples-agents.md): shared starter for examples-level Leia editing policy

## Validation

- Confirm the task stayed on a true Bun CLI surface rather than drifting into shell CLI or generic JS/TS runtime work.
- Confirm the entrypoint uses `#!/usr/bin/env bun`, supports explicit CLI behavior, and is declared in `package.json` when package metadata is in scope.
- Confirm any shipped JavaScript or TypeScript Bun CLI remains `bun build`-friendly and does not depend on source-tree-only loading patterns.
- Confirm TypeScript CLI source passes the repo's type-check command before treating a successful Bun build as complete validation.
- Confirm help output, version output, and maintained examples remain the primary documentation surface for user-facing CLI behavior.
- Confirm help output, including dimmed optional usage placeholders and dimmed displayed default annotations, plus env precedence, repeatable-option behavior, and `SCRIPT_VERSION` shape follow [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when those surfaces changed.
- Confirm Leia-backed examples stay focused on observable CLI contract behavior and keep one scenario per README.
- Confirm an ESM suite that writes Leia's generated CommonJS harness beneath `examples/` through a repo-local `TMPDIR` commits `examples/package.json` with `"type": "commonjs"`, even when it has no repository-authored JavaScript helpers.
- Confirm the examples-level boundary is not required when the generated harness lives outside the ESM package scope or already inherits a nearer CommonJS boundary; treat `examples/AGENTS.md` as a separate conditional choice.
- Confirm `GitHub Actions` maps the CLI test lifecycle to the shared Leia workflow template without duplicating the template or drifting into general workflow authoring.
