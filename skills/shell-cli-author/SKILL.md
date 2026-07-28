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
  openclaw:
    emoji: '🐚'
    homepage: https://github.com/tanaabased/canon/tree/main/skills/shell-cli-author
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

- Use [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when the task touches help output, dimmed usage placeholders, dimmed displayed defaults, logging, color, stream behavior, or version-reporting shape.
- Use [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md) only for shell-vs-JS boundary decisions, not as a substitute for CLI contract rules.
- Use [./references/shell-cli-templates.md](./references/shell-cli-templates.md) and the bundled starters when the repo needs a reusable Bash or PowerShell CLI baseline.

## Workflow

1. Confirm the task is shell-CLI-led rather than workflow-, hosted-distribution-, or release-led.
2. Load only the entrypoint, wrapper, and CLI canon needed for the change.
3. Keep the owned shell CLI contract explicit: help order, dimmed optional usage placeholders, dimmed displayed defaults, option precedence, output streams, and safety guards.
4. Validate the final script with the narrowest reliable shell checks for the touched surface.

## Documentation

- Treat help output, version output, logging text, and error text as the maintained shell CLI's user-facing documentation.
- Keep help output aligned with [../../references/cli-style-rules.md](../../references/cli-style-rules.md), including usage order, stream behavior, color, and displayed defaults.
- Use [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md) only for sparse inline comments around shell safety, quoting, platform differences, destructive operations, environment assumptions, and other non-obvious shell edge cases.
- Keep README-backed Leia scenarios in `## Testing` unless a repo explicitly treats them as durable user-facing examples.
- Keep comments sparse; do not narrate ordinary shell syntax or duplicate help output in the source.

## Testing

- Prefer Leia-backed example scenarios when the main risk is observable shell CLI behavior such as output, file mutation, permissions, exit status, or wrapper behavior.
- Keep one README scenario per observable shell flow and assert the user-facing contract instead of internal implementation details.
- When standardizing a Leia-backed `examples/` suite, consider adding `examples/package.json` for CommonJS helper boundaries and `examples/AGENTS.md` for durable examples-local editing rules.
- Treat Leia as the canonical direct-test pattern for maintained shell CLI surfaces, with `shellcheck` and PowerShell parse checks as narrow supporting validators rather than separate testing patterns.

Minimal generic example:

```bash
# should print help output
./dist/my-script.sh --help | grep -F 'Usage: my-script.sh'

# should print a version string
test -n "$(./dist/my-script.sh --version)"
```

## GitHub Actions

- Apply `## Testing` through the canonical `.github/workflows/pr-examples-tests.yml` path using [the shared Leia PR examples workflow template](../../templates/leia-pr-examples-tests.yml) when the shell CLI needs CI-backed scenario coverage.
- Keep the workflow centered on preparing the shipped entrypoint, exposing it on `PATH`, and running one Leia README per matrix entry.
- Do not infer Windows CI support from a PowerShell entrypoint, wrapper, or template. Add a Windows runner only when the user or repository policy explicitly requests it, and then use a supported versioned label rather than `windows-latest`.
- Keep this as an automation projection of the shell CLI test contract, not as general workflow-topology ownership.

## Optimization

- **Inspect:** Inventory Bash or PowerShell entrypoints, wrappers, help, version, logging, streams, precedence rules, safety guards, and Leia scenarios.
- **Compare:** Reconcile implementation, wrappers, help, version, stream behavior, safety claims, and Leia scenarios; identify duplicated branches, overloaded entrypoints, misplaced internals, and stale paths against CLI and platform rules.
- **Recommend:** Keep aligned platform behavior; deduplicate or consolidate repeated branches; split materially different platform paths; extract testable shell units; move internal machinery behind wrappers; tighten safety guards; and remove stale paths without style-only rewrites.
- **Apply:** After explicit authorization, make the smallest coherent shell-owned operations while preserving quoting, platform support, wrappers, and public behavior.
- **Verify:** Run available static or parse checks, smoke help and version output, and execute the relevant Leia scenarios.

## Bundled Resources

- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI help, color, logging, and `SCRIPT_VERSION` rules
- [../../references/inline-code-and-api-docs.md](../../references/inline-code-and-api-docs.md): sparse inline-comment and public-contract doc guidance for code-bearing surfaces
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shell-as-exception boundary and Bun-wrapper defaults
- [./references/repo-agents-lines.md](./references/repo-agents-lines.md): optional copyable repo `AGENTS.md` lines for durable shell CLI policy
- [./references/shell-cli-templates.md](./references/shell-cli-templates.md): local notes for the bundled Bash and PowerShell CLI starters
- [./templates/bash-cli.sh](./templates/bash-cli.sh): starter for Bash CLI entrypoints
- [./templates/powershell-cli.ps1](./templates/powershell-cli.ps1): starter for PowerShell CLI entrypoints
- [../../references/leia-markdown-scenarios.md](../../references/leia-markdown-scenarios.md): shared Leia scenario rules for end-to-end shell CLI validation
- [../../templates/leia-pr-examples-tests.yml](../../templates/leia-pr-examples-tests.yml): shared Bootbox-style workflow starter for Leia-backed PR examples
- [../../templates/leia-markdown-example-readme.md](../../templates/leia-markdown-example-readme.md): shared starter README for one executable Leia scenario
- [../../templates/leia-examples-package.json](../../templates/leia-examples-package.json): shared `examples/package.json` starter for CommonJS example-local helpers
- [../../templates/leia-examples-agents.md](../../templates/leia-examples-agents.md): shared starter for examples-level Leia editing policy

## Validation

- Confirm the task stayed on Bash or PowerShell CLI surfaces rather than drifting into workflow YAML or hosted repo-template standardization.
- Confirm help output, version output, logging text, and error text remain the primary documentation surface for user-facing shell behavior.
- Confirm help output, including dimmed optional usage placeholders and dimmed displayed default annotations, plus stream usage and version-reporting shape follow [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when those surfaces changed.
- Run targeted `shellcheck` or the closest equivalent when the repo maintains shell as a real surface.
- Confirm failures are actionable and destructive or nonsensical targets are rejected early.
- Confirm Leia-backed examples stay focused on observable shell contract behavior and keep one scenario per README.
- Confirm examples-level CommonJS and `AGENTS.md` guidance is present when the suite needs example-local helpers or durable examples-local editing rules.
- Confirm `GitHub Actions` maps the shell CLI test lifecycle to the shared Leia workflow template without duplicating the template or drifting into general workflow authoring.
- Confirm PowerShell coverage remains portable or opportunistic unless Windows CI was explicitly requested; if requested, confirm the workflow uses a versioned Windows runner label rather than `windows-latest`.
