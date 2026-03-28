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

## When to Use

- Build or update a true package-level Bun CLI entrypoint.
- Shape parser behavior, help output, version-reporting, env defaults, or CLI packaging contract.
- Standardize a Bun CLI around `bin/`, `#!/usr/bin/env bun`, `--help`, `--version`, and explicit option precedence.
- Apply or adapt the bundled Bun CLI starter when the repo needs a reusable CLI baseline.

## When Not to Use

- Do not use this skill for skill-local helper scripts under `skills/**/scripts/`; those are not package-level CLIs.
- Do not use this skill for Bash or PowerShell CLI entrypoints.
- Do not use this skill for general JS runtime work that is not really about the CLI product surface.

## Constraints

- Prefer the smallest change that solves the task.
- Preserve existing style and local patterns unless the task clearly requires a change.
- Avoid unrelated refactors.
- Keep true CLI entrypoints in `bin/` when package metadata is in scope.
- Omit the hashbang and treat the file as an ordinary script when it does not expose normal CLI behavior.

## Change Strategy

- Use [../../references/cli-style-rules.md](../../references/cli-style-rules.md) for help order, streams, colors, and `SCRIPT_VERSION` rules.
- Use [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md) for `bin/`, `utils/`, and hoisting decisions.
- Use [./references/bun-cli-template.md](./references/bun-cli-template.md) and the bundled starter only when the repo actually needs a reusable Bun CLI baseline.

## Workflow

1. Confirm the request is primarily about a true Bun CLI product surface.
2. Load the CLI entrypoint plus only the shared and local canon needed for the touched help, parser, version, or packaging surface.
3. Keep the CLI contract explicit: help, precedence, streams, version, and package entrypoint behavior.
4. Validate the final CLI with the narrowest reliable local checks for the touched surface.

## Bundled Resources

- [./references/bun-cli-template.md](./references/bun-cli-template.md): local notes for the bundled Bun CLI starter
- [./templates/bun-cli.js](./templates/bun-cli.js): reusable starter for true Bun CLI entrypoints
- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI help, color, stream, and version rules
- [../../references/javascript-repo-structure.md](../../references/javascript-repo-structure.md): `bin/`, `utils/`, and JS hoisting rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): Bun-first runtime defaults

## Validation

- Confirm the task stayed on a true Bun CLI surface rather than drifting into shell CLI or generic JS runtime work.
- Confirm the entrypoint uses `#!/usr/bin/env bun`, supports explicit CLI behavior, and is declared in `package.json` when package metadata is in scope.
- Confirm help output, env precedence, repeatable-option behavior, and `SCRIPT_VERSION` shape follow [../../references/cli-style-rules.md](../../references/cli-style-rules.md) when those surfaces changed.
