---
name: tanaab-readme-author
description: Tanaab-based authoring and standardization of repository README surfaces. Use when a user wants to structure or rewrite a repo README, choose between full README, GitHub Action README, or docs-wrapper mode, or keep README content aligned with the primary user entrypoint.
license: MIT
metadata:
  type: generic
  owner: tanaab
  tags:
    - tanaab
    - generic
    - documentation
---

# README Author

## Overview

Tanaab-based authoring and standardization of repository README surfaces. Use when a user wants to structure or rewrite a repo README, choose between full README, GitHub Action README, or docs-wrapper mode, or keep README content aligned with the primary user entrypoint.

## When to Use

- Structure or rewrite a repository `README.md`.
- Choose between full README, GitHub Action README, or docs-wrapper mode.
- Keep a repo README aligned with the repo's primary user entrypoint and actual product surface.
- Tighten README sections, examples, and ordering without changing the underlying implementation surface.

## When Not to Use

- Do not use this skill for VitePress page implementation, theme work, or frontend styling once the docs-site surface is already chosen.
- Do not use this skill for release-note or changelog-only work.
- Do not use this skill for inline code comments, API extraction tooling, or docs deployment mechanics.

## Workflow

1. Confirm the request is README-led rather than frontend, release, or CI-led.
2. Load [`../../references/readme-standards.md`](../../references/readme-standards.md) and use it to choose the README mode intentionally.
3. When drafting from scratch or standardizing a weak README, use the local template that matches the chosen mode instead of inventing section shape ad hoc.
4. Keep the README focused on the repo's real entrypoint, quickstart, and highest-value user paths.
5. Validate that the final README matches one coherent mode instead of mixing full, action, and docs-wrapper shapes.

## Bundled Resources

- [../../references/readme-standards.md](../../references/readme-standards.md): README mode selection, section expectations, and docs-wrapper escalation rules
- [../../references/coding-stack-preferences.md](../../references/coding-stack-preferences.md): default VitePress escalation rule when a fuller docs surface is justified
- [./templates/README.md](./templates/README.md): local index for the README starter templates owned by this skill
- [./templates/readme-full/README.md](./templates/readme-full/README.md): starter for repositories that keep durable user-facing docs in one README
- [./templates/readme-github-action/README.md](./templates/readme-github-action/README.md): starter for GitHub Action repositories whose README must carry the action contract
- [./templates/readme-docs-wrapper/README.md](./templates/readme-docs-wrapper/README.md): starter for repositories that keep a strong README entrypoint but move durable docs into VitePress

## Validation

- Confirm the final README clearly fits one mode: full README, GitHub Action README, or docs wrapper.
- Confirm the quickstart and primary usage path appear before deeper reference material.
- Confirm the README stays a repository entrypoint rather than a generic link farm or unstructured manual.
