---
name: tanaab-hosted-script-author
description: Tanaab-based authoring and standardization of hosted shell script product surfaces. Use when a user wants to shape a URL-served shell entrypoint, generated dist artifact, hosting contract, release-shaped validation, or hosted quickstart docs.
license: MIT
metadata:
  type: integration
  owner: tanaab
  tags:
    - tanaab
    - integration
    - hosted-scripts
---

# Hosted Script Author

## Overview

Tanaab-based authoring and standardization of hosted shell script product surfaces. Use when a user wants to shape a URL-served shell entrypoint, generated dist artifact, hosting contract, release-shaped validation, or hosted quickstart docs.

## When to Use

- Shape a URL-served shell entrypoint and its generated `dist/` surface.
- Standardize hosting headers, landing-page support files, or cache behavior for a hosted shell product surface.
- Keep hosted quickstart docs, release-shaped validation, and the shipped `dist/` artifact aligned.
- Apply or adapt the hosted-shell smoke workflow starter when the repo needs release-shaped example coverage.

## When Not to Use

- Do not use this skill for ordinary shell CLI work that is not URL-served.
- Do not use this skill for general workflow topology or CI gates once the main owned surface is no longer the hosted script product.
- Do not use this skill for generic README restructuring when the hosted product surface is not in scope.

## Prerequisites

- Confirm the repo really ships a hosted shell entrypoint or is intentionally becoming one.
- Identify the public URL, generated `dist/` entrypoint, hosting surface, and whether quickstart docs or landing-page assets are in scope.

## Inputs

- Identify the source entrypoint, release-shaped `dist/` artifact, hosting config, and smoke-validation path up front.
- Make the hosted surface explicit: raw script URL, landing page, and any metadata or cache behavior users depend on.

## Outputs

- Define the final hosted contract: shipped `dist/` files, public URL shape, headers, and hosted quickstart docs.
- Note any follow-up handoff when the task becomes primarily workflow-topology work or generic shell CLI work.

## Failure Handling

- Do not hide drift between source entrypoints and shipped `dist/` artifacts.
- Surface when the task depends on workflow or release mechanics that belong to another owned surface.

## Workflow

1. Confirm the request is hosted-script-led rather than general shell-CLI- or workflow-led.
2. Load the local hosted-script conventions plus only the shared docs and stack canon that shape the public surface.
3. Keep the source entrypoint, shipped `dist/` artifact, hosting behavior, and quickstart docs aligned as one product surface.
4. Validate against the release-shaped `dist/` surface and surface any unverified hosting behavior explicitly.

## Bundled Resources

- [./references/hosted-script-conventions.md](./references/hosted-script-conventions.md): local hosted-shell distribution, hosting, and release-shaped validation rules
- [../../references/readme-standards.md](../../references/readme-standards.md): README-entrypoint rules for hosted quickstart docs
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): shell-as-surface and Leia-as-operational-test defaults
- [../../references/cli-style-rules.md](../../references/cli-style-rules.md): shared CLI contract when the hosted entrypoint is also a CLI surface
- [../../references/leia-markdown-scenarios.md](../../references/leia-markdown-scenarios.md): shared Leia scenario rules for release-shaped operational coverage
- [../../templates/leia-pr-examples-tests.yml](../../templates/leia-pr-examples-tests.yml): shared starter workflow for Leia-backed example smoke coverage
- [../../templates/leia-markdown-example-readme.md](../../templates/leia-markdown-example-readme.md): shared starter README for one executable Leia scenario

## Validation

- Confirm the task stayed on the hosted shell product surface rather than drifting into generic shell CLI or workflow work.
- Confirm the public surface is the prepared `dist/` artifact rather than a source-tree shortcut.
- Confirm the main README leads with the hosted quickstart when the hosted URL is the primary user path.
- Confirm smoke coverage, when present, exercises the prepared `dist/` surface rather than raw source files.
