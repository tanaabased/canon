---
name: tanaab-javascript-cli-author
description: Tanaab-based authoring and standardization of true Bun CLI product surfaces. Use when a user wants to build or update a package-level Bun CLI entrypoint, CLI parser, help output, version surface, or CLI packaging contract.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - javascript
---

# JavaScript CLI Author

## Overview

Tanaab-based authoring and standardization of true Bun CLI product surfaces. Use when a user wants to build or update a package-level Bun CLI entrypoint, CLI parser, help output, version surface, or CLI packaging contract.

- Keep this skill on a package-level, user-facing Bun CLI product surface.
- Let `tanaab-shell-cli-author` own Bash or PowerShell CLI surfaces.

## When to Use

- Build or update a true package-level Bun CLI entrypoint.
- Shape parser behavior, help output, version-reporting, env defaults, or CLI packaging contract.
- Standardize a Bun CLI around `bin/`, `#!/usr/bin/env bun`, `--help`, `--version`, and explicit option precedence.
- Apply or adapt the bundled Bun CLI starter when the repo needs a reusable package-level Bun CLI baseline.
- Add or refresh repo-local `AGENTS.md` lines when the repo wants Bun CLI product rules as durable ambient policy.

## When Not to Use

- Do not use this skill for skill-local helper scripts under `skills/**/scripts/`; those are not package-level CLIs.
- Do not use this skill for Bash or PowerShell CLI entrypoints.
- Do not use this skill for general JS runtime work that is not really about the package-level CLI product surface.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.
- Keep true CLI entrypoints in `bin/` when package metadata is in scope.
- Keep shipped Bun CLI entrypoints friendly to `bun build` when the built artifact is the real product surface.
- Omit the hashbang and treat the file as an ordinary script when it does not expose normal CLI behavior.

## Change Strategy

- Use [../../references/cli-style-rules.md](../../references/cli-style-rules.md) for help order, dimmed usage placeholders, dimmed displayed defaults, streams, colors, and `SCRIPT_VERSION` rules.
- Use [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) for `bin/`, `utils/`, and hoisting decisions.
- Prefer static imports and avoid source-layout assumptions when the CLI is meant to ship as a `bun build` artifact.
- Use [./references/bun-cli-template.md](./references/bun-cli-template.md) and the bundled starter only when the repo actually needs a reusable Bun CLI baseline.

## Workflow

1. Confirm the request is primarily about a true Bun CLI product surface.
2. Load the CLI entrypoint plus only the shared and local canon needed for the touched help, parser, version, or packaging surface.
3. Keep the package-level CLI contract explicit: help, dimmed optional usage placeholders, dimmed displayed defaults, precedence, streams, version, and package entrypoint behavior.
4. Validate the final CLI with the narrowest reliable local checks for the touched surface.

## Documentation

- Treat `--help`, `--version`, displayed defaults, and maintained examples as the CLI's primary user-facing documentation.
- Keep help output aligned with [../../references/cli-style-rules.md](../../references/cli-style-rules.md), including usage order, streams, color, optional placeholders, and displayed defaults.
- Use [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) only for sparse inline comments around non-obvious parser behavior, option precedence, environment handling, build-artifact assumptions, or shell/runtime edge cases.
- Keep README-backed Leia scenarios in `## Testing` unless a repo explicitly treats them as durable user-facing examples.
- Do not duplicate the full CLI contract in prose when help output and examples already expose it clearly.

## Testing

- Prefer Leia-backed example scenarios when the main risk is observable CLI behavior such as help output, exit status, file effects, or release-shaped entrypoint behavior.
- Keep one example flow per `examples/<scenario>/README.md` and assert the user-facing CLI contract rather than internal parser details.
- Treat Leia as the canonical direct-test pattern for true CLI product surfaces rather than layering multiple unrelated local test styles by default.
- When the CLI ships as a built artifact, run Leia against the built CLI rather than the source entrypoint.

Minimal generic example:

```bash
# should print help output
my-cli --help | grep -F 'Usage: my-cli'

# should print a version string
test -n "$(my-cli --version)"
```

## GitHub Actions Workflow

- Use a Bootbox-style PR examples workflow when the CLI needs CI-backed Leia coverage.
- Keep the workflow centered on preparing the built CLI artifact, placing it on `PATH`, and running one Leia README per matrix entry.
- Treat this as validation of the package-level CLI contract, not as general workflow-topology ownership.

Minimal generic example:

```yaml
name: Example Tests

on:
  pull_request:

jobs:
  examples:
    runs-on: macos-26
    strategy:
      matrix:
        example:
          - example-name
    steps:
      - uses: actions/checkout@v6
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version-file: .bun-version
      - run: bun install --frozen-lockfile --ignore-scripts
      - run: bun run build
      - run: echo "$PWD/dist" >> "$GITHUB_PATH"
      - run: TMPDIR="$PWD/examples/.tmp" ./node_modules/.bin/leia "examples/${{ matrix.example }}/README.md" -c "Destroy tests" --stdin
```

## Bundled Resources

- [./references/bun-cli-template.md](./references/bun-cli-template.md): local notes for the bundled Bun CLI starter
- [./references/repo-agents-lines.md](./references/repo-agents-lines.md): optional copyable repo `AGENTS.md` lines for durable Bun CLI policy
- [./templates/bun-cli.js](./templates/bun-cli.js): reusable starter for true Bun CLI entrypoints
- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI help, color, stream, and version rules
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for code-bearing surfaces
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): `bin/`, `utils/`, and JS hoisting rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first runtime defaults
- [../../references/leia-markdown-scenarios.md](../../references/leia-markdown-scenarios.md): shared Leia scenario rules for end-to-end CLI validation
- [../../templates/leia-pr-examples-tests.yml](../../templates/leia-pr-examples-tests.yml): shared Bootbox-style workflow starter for Leia-backed PR examples
- [../../templates/leia-markdown-example-readme.md](../../templates/leia-markdown-example-readme.md): shared starter README for one executable Leia scenario

## Validation

- Confirm the task stayed on a true Bun CLI surface rather than drifting into shell CLI or generic JS runtime work.
- Confirm the entrypoint uses `#!/usr/bin/env bun`, supports explicit CLI behavior, and is declared in `package.json` when package metadata is in scope.
- Confirm any shipped Bun CLI remains `bun build`-friendly and does not depend on source-tree-only loading patterns.
- Confirm help output, version output, and maintained examples remain the primary documentation surface for user-facing CLI behavior.
- Confirm help output, including dimmed optional usage placeholders and dimmed displayed default annotations, plus env precedence, repeatable-option behavior, and `SCRIPT_VERSION` shape follow [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when those surfaces changed.
- Confirm Leia-backed examples stay focused on observable CLI contract behavior and keep one scenario per README.
- Confirm any GitHub Actions workflow example remains a Leia-backed validation path for the CLI surface rather than drifting into general workflow authoring.
