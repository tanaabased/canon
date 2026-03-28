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

## When to Use

- Build or update a Bash or PowerShell CLI entrypoint.
- Shape help output, logging, color usage, argument handling, or shell safety guards.
- Standardize shell wrapper behavior around a maintained CLI surface.
- Tighten shell-facing UX without widening into hosted-script distribution or GitHub Actions workflow YAML.

## When Not to Use

- Do not use this skill for GitHub Actions workflow structure; keep that on the workflow surface.
- Do not use this skill for hosted shell distribution and release-shaped `dist/` surfaces; that is a separate product surface.
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

1. Confirm the task is shell-CLI-led rather than workflow-, hosted-script-, or release-led.
2. Load only the entrypoint, wrapper, and CLI canon needed for the change.
3. Keep the CLI contract explicit: help order, option precedence, output streams, and safety guards.
4. Validate the final script with the narrowest reliable shell checks for the touched surface.

## Bundled Resources

- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI help, color, logging, and `SCRIPT_VERSION` rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shell-as-exception boundary and Bun-wrapper defaults
- [./references/shell-cli-templates.md](./references/shell-cli-templates.md): local notes for the bundled Bash and PowerShell CLI starters
- [./templates/bash-cli.sh](./templates/bash-cli.sh): starter for Bash CLI entrypoints
- [./templates/powershell-cli.ps1](./templates/powershell-cli.ps1): starter for PowerShell CLI entrypoints

## Validation

- Confirm the task stayed on Bash or PowerShell CLI surfaces rather than drifting into workflow YAML or hosted distribution.
- Confirm help output, stream usage, and version-reporting shape follow [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when those surfaces changed.
- Run targeted `shellcheck` or the closest equivalent when the repo maintains shell as a real surface.
- Confirm failures are actionable and destructive or nonsensical targets are rejected early.
