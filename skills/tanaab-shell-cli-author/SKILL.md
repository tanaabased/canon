---
name: tanaab-shell-cli-author
description: Tanaab-based authoring and standardization of shell CLI surfaces. Use when a user wants to build or update a Bash or PowerShell CLI entrypoint, wrapper, help output, logging, or shell safety behavior.
license: MIT
metadata:
  type: coding
  owner: tanaab
  tags:
    - tanaab
    - coding
    - shell
---

# Shell CLI Author

## Overview

Tanaab-based authoring and standardization of shell CLI surfaces. Use when a user wants to build or update a Bash or PowerShell CLI entrypoint, wrapper, help output, logging, or shell safety behavior.

- Keep this skill on maintained Bash or PowerShell CLI surfaces.
- Let `tanaab-javascript-cli-author` own package-level Bun CLIs.

## When to Use

- Build or update a Bash or PowerShell CLI entrypoint.
- Shape help output, logging, color usage, argument handling, or shell safety guards.
- Standardize shell wrapper behavior around a maintained CLI surface.
- Tighten shell-facing UX without widening into repo-template standardization or GitHub Actions workflow graphs.
- Add or refresh repo-local `AGENTS.md` lines when the repo wants shell CLI policy and Leia-locality rules to be ambient.

## When Not to Use

- Do not use this skill for GitHub Actions workflow structure; keep that on the workflow surface.
- Do not use this skill to define a whole starter-repo shape or release distribution template.
- Do not use this skill for general JavaScript runtime work unless shell remains the primary owned artifact.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.

## Change Strategy

- Use [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when the task touches help output, logging, color, stream behavior, or version-reporting shape.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) only for shell-vs-JS boundary decisions, not as a substitute for CLI contract rules.
- Use [./references/shell-cli-templates.md](./references/shell-cli-templates.md) and the bundled starters when the repo needs a reusable Bash or PowerShell CLI baseline.

## Workflow

1. Confirm the task is shell-CLI-led rather than workflow-, hosted-distribution-, or release-led.
2. Load only the entrypoint, wrapper, and CLI canon needed for the change.
3. Keep the owned shell CLI contract explicit: help order, option precedence, output streams, and safety guards.
4. Validate the final script with the narrowest reliable shell checks for the touched surface.

## Testing

- Prefer Leia-backed example scenarios when the main risk is observable shell CLI behavior such as output, file mutation, permissions, exit status, or wrapper behavior.
- Keep one README scenario per observable shell flow and assert the user-facing contract instead of internal implementation details.
- Treat Leia as the canonical direct-test pattern for maintained shell CLI surfaces, with `shellcheck` and PowerShell parse checks as narrow supporting validators rather than separate testing patterns.

Minimal generic example:

```bash
# should print help output
./dist/my-script.sh --help > .tmp/help.txt

# should mention the supported flag
grep -F -- '--force' .tmp/help.txt
```

## GitHub Actions Workflow

- Use a Bootbox-style PR examples workflow when the shell CLI needs CI-backed Leia coverage.
- Keep the workflow centered on preparing the shipped entrypoint, exposing it on `PATH`, and running one Leia README per matrix entry.
- Treat this as validation of the owned shell CLI surface, not as general workflow-topology ownership.

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

- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI help, color, logging, and `SCRIPT_VERSION` rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shell-as-exception boundary and Bun-wrapper defaults
- [./references/repo-agents-lines.md](./references/repo-agents-lines.md): optional copyable repo `AGENTS.md` lines for durable shell CLI policy
- [./references/shell-cli-templates.md](./references/shell-cli-templates.md): local notes for the bundled Bash and PowerShell CLI starters
- [./templates/bash-cli.sh](./templates/bash-cli.sh): starter for Bash CLI entrypoints
- [./templates/powershell-cli.ps1](./templates/powershell-cli.ps1): starter for PowerShell CLI entrypoints
- [../../references/leia-markdown-scenarios.md](../../references/leia-markdown-scenarios.md): shared Leia scenario rules for end-to-end shell CLI validation
- [../../templates/leia-pr-examples-tests.yml](../../templates/leia-pr-examples-tests.yml): shared Bootbox-style workflow starter for Leia-backed PR examples
- [../../templates/leia-markdown-example-readme.md](../../templates/leia-markdown-example-readme.md): shared starter README for one executable Leia scenario

## Validation

- Confirm the task stayed on Bash or PowerShell CLI surfaces rather than drifting into workflow YAML or hosted repo-template standardization.
- Confirm help output, stream usage, and version-reporting shape follow [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when those surfaces changed.
- Run targeted `shellcheck` or the closest equivalent when the repo maintains shell as a real surface.
- Confirm failures are actionable and destructive or nonsensical targets are rejected early.
- Confirm Leia-backed examples stay focused on observable shell contract behavior and keep one scenario per README.
- Confirm any GitHub Actions workflow example remains a Leia-backed validation path for the shell CLI surface rather than drifting into general workflow authoring.
