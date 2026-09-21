---
name: tanaab-javascript-cli-author
description: Tanaab-based authoring and standardization of JavaScript or TypeScript CLI product surfaces developed with Bun. Use when a user wants to build or update a package-level CLI entrypoint, CLI parser, help output, version surface, or CLI packaging contract.
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

Tanaab-based authoring and standardization of JavaScript or TypeScript CLI product surfaces developed with Bun. Use when a user wants to build or update a package-level CLI entrypoint, CLI parser, help output, version surface, or CLI packaging contract.

- Keep this skill on a package-level, user-facing JS/TS CLI product surface.
- Let `tanaab-shell-cli-author` own Bash or PowerShell CLI surfaces.

## When to Use

- Build or update a package-level JavaScript or TypeScript CLI entrypoint.
- Shape parser behavior, help output, version-reporting, env defaults, or CLI packaging contract.
- Standardize a CLI around `bin/`, Bun source entrypoints, `--help`, `--version`, and explicit option precedence.
- Apply or adapt the bundled Bun CLI starter when the repo needs a reusable package-level Bun CLI baseline.
- Add or refresh repo-local `AGENTS.md` lines when the repo wants JS/TS CLI product rules as durable ambient policy.

## When Not to Use

- Do not use this skill for internal skill, agent, automation, or maintainer commands under `scripts/`; those are not public CLI product surfaces even when they expose CLI-like arguments and help.
- Do not use this skill for Bash or PowerShell CLI entrypoints.
- Do not use this skill for general JS runtime work that is not really about the package-level CLI product surface.

## Constraints

- Keep true CLI entrypoints in `bin/` when package metadata is in scope.
- Keep JavaScript or TypeScript CLI entrypoints friendly to `bun build` when the built artifact is the real product surface.
- Omit the hashbang and treat the file as an ordinary script when it does not expose normal CLI behavior.

## Change Strategy

- Use [../../references/cli-style-rules.md](../../references/cli-style-rules.md) for help order, dimmed usage placeholders, dimmed displayed defaults, streams, colors, and `SCRIPT_VERSION` rules.
- Use [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) to keep the public `bin/` entrypoint distinct from internal `scripts/`, orchestration `lib/`, unit-shaped `utils/`, and scoped `test/` surfaces.
- Apply [Source and Distribution](../../references/coding-stack-preferences.md#source-and-distribution): retain Bun source shebangs and let the build emit the consumer runtime shebang and target.
- Prefer static imports and avoid source-layout assumptions when the CLI is meant to ship as a `bun build` artifact.
- Preserve the existing source language unless the repo or user selects TypeScript; Bun may execute a `.ts` entrypoint directly, while shipped build artifacts should keep their declared JavaScript output contract.
- Use [./references/bun-cli-template.md](./references/bun-cli-template.md) and the bundled starter only when the repo actually needs a reusable Bun CLI baseline.

## Preferred Tools

- **[Leia 2.x](https://github.com/lando/leia/blob/v2.0.0/README.md):** Prefer for observable CLI scenarios; see [Tanaab's usage policy and optional agent-plugin guidance](../../references/leia-markdown-scenarios.md).
- **Tanaab Actions 1.x — [run-leia](https://github.com/tanaabased/actions/blob/v1.0.1/run-leia/README.md):** Prefer in scenario CI after runtime, dependency, and artifact preparation. It owns temporary state and cleanup, not scenario setup or sandboxing; retain caller behavior that its inputs cannot express.

## Workflow

When authoring issue-backed commits, apply the shared [commit-subject convention](../../references/commit-subjects.md).

1. Confirm the request is primarily about a package-level JS/TS CLI product surface.
2. Load the CLI entrypoint plus only the shared and local canon needed for the touched help, parser, version, or packaging surface.
3. Keep the package-level CLI contract explicit: help, dimmed optional usage placeholders, dimmed displayed defaults, precedence, streams, version, and package entrypoint behavior.
4. Validate the final CLI with the narrowest reliable local checks for the touched surface, including type-checking when its source is TypeScript.

## Documentation

- Apply the [documentation change gate](../../references/documentation-standards.md#documentation-change-gate) before selecting documentation work.
- Treat `--help`, `--version`, displayed defaults, and maintained examples as the CLI's primary user-facing documentation.
- Keep help output aligned with [../../references/cli-style-rules.md](../../references/cli-style-rules.md), including usage order, streams, color, optional placeholders, and displayed defaults.
- Use [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) only for sparse inline comments around non-obvious parser behavior, option precedence, environment handling, build-artifact assumptions, or shell/runtime edge cases.
- Keep README-backed Leia scenarios in `## Testing` unless a repo explicitly treats them as durable user-facing examples.
- Do not duplicate the full CLI contract in prose when help output and examples already expose it clearly.

## Testing

- Prefer Leia-backed example scenarios when the main risk is observable CLI behavior such as help output, exit status, file effects, or release-shaped entrypoint behavior.
- Keep one example flow per `examples/<scenario>/README.md` and assert the user-facing CLI contract rather than internal parser details.
- Apply [Tanaab's Leia usage policy](../../references/leia-markdown-scenarios.md); use the optional `leia-scenarios` skill when available or the upstream documentation linked there.
- Consider adding `examples/AGENTS.md` separately when the suite needs durable examples-local editing rules.
- Treat Leia as the canonical direct-test pattern for true CLI product surfaces rather than layering multiple unrelated local test styles by default.
- When the CLI ships as a built artifact, run Leia against its executable entrypoint under the declared consumer runtime, following [Test Runtimes](../../references/coding-stack-preferences.md#test-runtimes).

Minimal generic example:

```bash
# should print help output
my-cli --help | grep -F 'Usage: my-cli'

# should print a version string
test -n "$(my-cli --version)"
```

## GitHub Actions

- Use the [preferred `run-leia` action](#preferred-tools) after caller-owned preparation, with explicit scenarios, shell, retry, and stdin inputs.
- Apply `## Testing` through the canonical `.github/workflows/pr-examples-tests.yml` path using [the shared Leia PR examples workflow template](../../templates/leia-pr-examples-tests.yml) when the CLI needs CI-backed scenario coverage.
- Keep the workflow centered on preparing the built CLI artifact, placing it on `PATH`, and running one Leia README per matrix entry. Use `setup-bun` for the harness and build; add `setup-node` when the CLI targets Node, per [Test Runtimes](../../references/coding-stack-preferences.md#test-runtimes).
- Keep this as an automation projection of the package-level CLI test contract, not as general workflow-topology ownership.

## Optimization

- **Inspect:** Inventory source and shipped entrypoints, their shebangs and runtime contracts, parser, help, version, environment precedence, build output, packaging metadata, scenarios, and observable CLI tests.
- **Compare:** Compare scenario CI with [Preferred Tools](#preferred-tools), preserving artifact targets, shell, retry, stdin, setup, and cleanup behavior. Reconcile source/build runtime selection, parser behavior, help, version, precedence, package metadata, examples, build output, and tests; identify duplicated option logic, overloaded entrypoints, misplaced internals, stale public claims, and scenario packaging drift.
- **Recommend:** Keep aligned behavior; deduplicate or consolidate command contracts; extract parsers and renderers; split overloaded commands only when their public surfaces are distinct; move internal machinery out of the entrypoint; and tighten or remove stale API without widening into general cleanup.
- **Apply:** After explicit authorization, make the smallest coherent CLI operations and preserve documented command behavior and package boundaries.
- **Verify:** Build the entrypoint, smoke help and version output, validate scenario packaging against the shared Leia contract, run Leia-backed scenarios, and type-check when the repository owns TypeScript.

## Bundled Resources

- [./references/bun-cli-template.md](./references/bun-cli-template.md): local notes for the bundled Bun CLI starter
- [./references/repo-agents-lines.md](./references/repo-agents-lines.md): optional copyable repo `AGENTS.md` lines for durable JS/TS CLI policy
- [./templates/bun-cli.js](./templates/bun-cli.js): reusable JavaScript starter for true Bun CLI entrypoints; preserve its contract when adapting it to TypeScript
- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI help, color, stream, and version rules
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for code-bearing surfaces
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): public `bin/`, internal `scripts/`, `lib/`, `utils/`, scoped `test/`, and hoisting rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun development and consumer runtime contracts
- [../../references/leia-markdown-scenarios.md](../../references/leia-markdown-scenarios.md): shared Leia scenario rules for end-to-end CLI validation
- [../../templates/leia-pr-examples-tests.yml](../../templates/leia-pr-examples-tests.yml): shared Bootbox-style workflow starter for Leia-backed PR examples
- [../../templates/leia-markdown-example-readme.md](../../templates/leia-markdown-example-readme.md): shared starter README for one executable Leia scenario
- [../../templates/leia-examples-agents.md](../../templates/leia-examples-agents.md): shared starter for examples-level Leia editing policy

## Validation

- Confirm the task stayed on a package-level JS/TS CLI surface rather than drifting into shell CLI or generic JS/TS runtime work.
- Confirm source entrypoints use `#!/usr/bin/env bun`, built entrypoints use the declared consumer runtime shebang, and package `bin` resolves to the shipped artifact.
- Confirm any shipped JavaScript or TypeScript CLI remains `bun build`-friendly and does not depend on source-tree-only loading patterns.
- Confirm TypeScript CLI source passes the repo's type-check command before treating a successful Bun build as complete validation.
- Confirm help output, version output, and maintained examples remain the primary documentation surface for user-facing CLI behavior.
- Confirm help output, including dimmed optional usage placeholders and dimmed displayed default annotations, plus env precedence, repeatable-option behavior, and `SCRIPT_VERSION` shape follow [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when those surfaces changed.
- Confirm Leia-backed examples stay focused on observable CLI contract behavior and keep one scenario per README.
- Confirm scenario execution follows Tanaab's Leia usage policy and the installed Leia version's documentation.
- Confirm `GitHub Actions` maps the CLI test lifecycle to the shared Leia workflow template without duplicating the template or drifting into general workflow authoring.
